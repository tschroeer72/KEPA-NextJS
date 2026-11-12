import jwt from "jsonwebtoken";
import { INT } from "../env.cjs";

export const BASE_URL = process.env.INTEGRATION_BASE_URL!;

type Opts = {
  method?: string;
  body?: unknown;
  cookie?: string;
  headers?: Record<string, string>;
};

/** fetch gegen den echten Server; Redirects werden NICHT verfolgt. */
export async function api(path: string, { method, body, cookie, headers }: Opts = {}) {
  return fetch(BASE_URL + path, {
    method: method ?? (body !== undefined ? "POST" : "GET"),
    redirect: "manual",
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function tokenCookieFrom(res: Response): string {
  const raw = res.headers.getSetCookie().find((c) => c.startsWith("token="));
  if (!raw) throw new Error("Kein token-Cookie in der Antwort");
  return raw.split(";")[0];
}

/** Meldet über /api/login an und liefert den Cookie-Header ("token=..."). */
export async function loginCookie(user: string, password: string): Promise<string> {
  const res = await api("/api/login", { body: { benutzer: user, passwort: password } });
  if (res.status !== 200) throw new Error(`Login fehlgeschlagen (${res.status})`);
  return tokenCookieFrom(res);
}

export const adminCookie = () => loginCookie(INT.admin.user, INT.admin.password);
export const filmeCookie = () => loginCookie(INT.filme.user, INT.filme.password);

/** Selbst signiertes Token, z. B. für abgelaufen/falsches Secret. */
export function signToken(payload: object, opts: { secret?: string; expiresIn?: number } = {}) {
  return "token=" + jwt.sign(payload, opts.secret ?? INT.jwtSecret, { expiresIn: opts.expiresIn ?? 3600 });
}

export async function expectPdf(res: Response) {
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toContain("application/pdf");
  const buf = Buffer.from(await res.arrayBuffer());
  expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  expect(buf.length).toBeGreaterThan(500);
}
