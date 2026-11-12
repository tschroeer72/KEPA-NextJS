/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import jsonwebtoken from 'jsonwebtoken';
import { proxy, config } from '../proxy';

// jose ist ein reines ESM-Paket und wird von der Jest-Konfiguration (transformIgnorePatterns) nicht
// transformiert. Daher wird jwtVerify durch eine HS256-Pruefung auf Basis von jsonwebtoken ersetzt;
// die Tokens selbst sind echte, mit JWT_SECRET signierte JWTs (wie sie /api/login ausstellt).
jest.mock('jose', () => {
    const jwt = require('jsonwebtoken');
    return {
        jwtVerify: async (token: string, secret: Uint8Array) => ({
            payload: jwt.verify(token, Buffer.from(secret), { algorithms: ['HS256'] }),
        }),
    };
});

const SECRET = 'proxy-test-secret';

async function sign(payload: Record<string, unknown>, opts: { secret?: string; exp?: number } = {}) {
    const body = opts.exp !== undefined ? { ...payload, exp: opts.exp } : payload;
    return jsonwebtoken.sign(body, opts.secret ?? SECRET, {
        algorithm: 'HS256',
        ...(opts.exp === undefined ? { expiresIn: '1h' } : {}),
    });
}

function req(path: string, token?: string) {
    return new NextRequest(`http://localhost${path}`, {
        headers: token ? { cookie: `token=${token}` } : undefined,
    });
}

/**
 * Simuliert eine korrigierte publicRoutes-Pruefung: startsWith('/') liefert nur fuer exakt "/" true.
 * So lassen sich die Gate-Zweige (401 / Redirect / gueltiger Token) pruefen, die mit dem aktuellen
 * Quellcode nie erreicht werden (siehe Block "aktuelles Verhalten").
 */
function gated(path: string, token?: string) {
    const r = req(path, token);
    const pathname: any = new String(path);
    pathname.startsWith = (prefix: string) => (prefix === '/' ? path === '/' : path.startsWith(prefix));
    const nextUrl = r.nextUrl;
    return {
        nextUrl: { pathname },
        cookies: r.cookies,
        url: nextUrl.href,
    } as unknown as NextRequest;
}

const isPassThrough = (res: Response) => res.headers.get('x-middleware-next') === '1';

describe('proxy.ts', () => {
    const originalSecret = process.env.JWT_SECRET;

    beforeEach(() => {
        process.env.JWT_SECRET = SECRET;
    });

    afterAll(() => {
        process.env.JWT_SECRET = originalSecret;
    });

    describe("oeffentliche Routen", () => {
        it.each(["/", "/login", "/impressum", "/kontakt", "/aktuelles", "/termine", "/api/login", "/api/logout", "/api/auth/verify"])(
            "%s laeuft ohne Token durch",
            async (path) => {
                const res = await proxy(req(path));
                expect(isPassThrough(res)).toBe(true);
            },
        );

        it("Unterpfade oeffentlicher Routen laufen durch", async () => {
            expect(isPassThrough(await proxy(req("/termine/2024")))).toBe(true);
            expect(isPassThrough(await proxy(req("/login?redirectTo=%2Fverwaltung")))).toBe(true);
        });

        it("aehnlich beginnende Pfade sind NICHT oeffentlich", async () => {
            expect((await proxy(req("/loginx"))).status).toBe(307);
            expect((await proxy(req("/terminebearbeiten"))).status).toBe(307);
        });
    });

    describe("geschuetzte Routen", () => {
        it.each(["/verwaltung", "/verwaltung/benutzerzugriff", "/irgendwas"])("Seite %s ohne Token -> Redirect auf /login", async (path) => {
            const res = await proxy(req(path));
            expect(res.status).toBe(307);
            const loc = new URL(res.headers.get("location")!);
            expect(loc.pathname).toBe("/login");
            expect(loc.searchParams.get("redirectTo")).toBe(path);
        });

        it.each(["/api/verwaltung/benutzerzugriff", "/api/mitglieder/statistik-pdf", "/api/email/send"])("API %s ohne Token -> 401 JSON", async (path) => {
            const res = await proxy(req(path));
            expect(res.status).toBe(401);
            expect(await res.json()).toEqual({ error: "Authentifizierung erforderlich" });
        });

        it("Seite mit ungueltigem Token -> Redirect", async () => {
            const res = await proxy(req("/verwaltung", "kein.jwt.token"));
            expect(res.status).toBe(307);
            expect(new URL(res.headers.get("location")!).searchParams.get("redirectTo")).toBe("/verwaltung");
        });

        it("API mit ungueltigem Token -> 401 JSON", async () => {
            const res = await proxy(req("/api/x", "kein.jwt.token"));
            expect(res.status).toBe(401);
            expect(await res.json()).toEqual({ error: "Ungültiger oder abgelaufener Token" });
        });

        it("Token mit falschem Secret wird abgelehnt", async () => {
            const token = await sign({ userId: 1, login: "a" }, { secret: "anderes-secret" });
            expect((await proxy(req("/api/x", token))).status).toBe(401);
        });

        it("abgelaufener Token wird abgelehnt", async () => {
            const token = await sign({ userId: 1, login: "a" }, { exp: Math.floor(Date.now() / 1000) - 60 });
            expect((await proxy(req("/verwaltung", token))).status).toBe(307);
        });

        it("gueltiger Login-Token laeuft durch und setzt x-user-Header aus userId/login", async () => {
            const token = await sign({ userId: 42, login: "max", vorname: "Max", nachname: "M" });
            const res = await proxy(req("/verwaltung", token));
            expect(isPassThrough(res)).toBe(true);
            expect(res.headers.get("x-user-id")).toBe("42");
            expect(res.headers.get("x-user-email")).toBe("max");
        });

        it("Admin-Token (userId 0) wird korrekt durchgereicht", async () => {
            const token = await sign({ userId: 0, login: "admin", isAdmin: true });
            const res = await proxy(req("/api/statistik/pdf", token));
            expect(isPassThrough(res)).toBe(true);
            expect(res.headers.get("x-user-id")).toBe("0");
        });

        it("fehlendes JWT_SECRET fuehrt zu abgelehntem Token", async () => {
            const token = await sign({ userId: 1, login: "a" });
            delete process.env.JWT_SECRET;
            expect((await proxy(req("/api/x", token))).status).toBe(401);
        });
    });

    describe("matcher", () => {
        it("schliesst _next-Pfade und Dateien mit Endung aus", () => {
            const re = new RegExp("^" + config.matcher[0] + "$");
            expect(re.test("/verwaltung")).toBe(true);
            expect(re.test("/api/login")).toBe(true);
            expect(re.test("/_next/static/x.js")).toBe(false);
            expect(re.test("/icons/a.png")).toBe(false);
            expect(re.test("/manifest.webmanifest")).toBe(false);
        });
    });
});
