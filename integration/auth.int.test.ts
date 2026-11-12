import { api, adminCookie, filmeCookie, loginCookie, signToken, tokenCookieFrom, BASE_URL } from "./helpers/http";
import { prisma, resetDb, seedBasis, sha256, TEST_LOGIN } from "./helpers/db";
import { INT } from "./env.cjs";

let mitglieder: Awaited<ReturnType<typeof seedBasis>>["mitglieder"];

beforeAll(async () => {
  await resetDb();
  ({ mitglieder } = await seedBasis());
});

describe("Zugriffsschutz (proxy.ts)", () => {
  it.each(["/", "/login", "/impressum", "/kontakt", "/aktuelles", "/termine"])(
    "öffentliche Seite %s ist ohne Login erreichbar",
    async (path) => {
      const res = await api(path);
      expect(res.status).toBe(200);
    }
  );

  it.each(["/verwaltung/mitglieder", "/verwaltung/eingabe", "/verwaltung/ausgabe", "/verwaltung/profil"])(
    "geschützte Seite %s leitet ohne Cookie auf /login um",
    async (path) => {
      const res = await api(path);
      expect([307, 308]).toContain(res.status);
      const location = new URL(res.headers.get("location")!, BASE_URL);
      expect(location.pathname).toBe("/login");
      expect(location.searchParams.get("redirectTo")).toBe(path);
    }
  );

  it.each(["/api/vorlagen/mitgliederliste", "/api/ausgabe/meisterschaft?id=1", "/api/verwaltung/benutzerzugriff"])(
    "geschützte API %s liefert ohne Cookie 401 JSON",
    async (path) => {
      const res = await api(path);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Authentifizierung erforderlich" });
    }
  );

  it("Pfad-Präfix-Umgehung (/loginx) gilt nicht als öffentlich", async () => {
    const res = await api("/loginx");
    expect([307, 308]).toContain(res.status);
  });

  it("ungültiger Token wird abgelehnt (API 401, Seite Redirect)", async () => {
    const apiRes = await api("/api/vorlagen/mitgliederliste", { cookie: "token=kaputt" });
    expect(apiRes.status).toBe(401);
    const page = await api("/verwaltung/mitglieder", { cookie: "token=kaputt" });
    expect([307, 308]).toContain(page.status);
  });

  it("Token mit falschem Secret wird abgelehnt", async () => {
    const cookie = signToken({ userId: 1, login: "x" }, { secret: "falsch" });
    expect((await api("/api/vorlagen/mitgliederliste", { cookie })).status).toBe(401);
  });

  it("abgelaufener Token wird abgelehnt", async () => {
    const cookie = signToken({ userId: 1, login: "x" }, { expiresIn: -10 });
    expect((await api("/api/vorlagen/mitgliederliste", { cookie })).status).toBe(401);
  });

  it("geschützte Seite ist mit gültigem Token erreichbar", async () => {
    const res = await api("/verwaltung/mitglieder", { cookie: await adminCookie() });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/login", () => {
  it.each<[unknown, string]>([
    [{}, "leerer Body"],
    [{ benutzer: "", passwort: "x" }, "leerer Benutzer"],
    [{ benutzer: "x", passwort: "" }, "leeres Passwort"],
    [{ benutzer: 1, passwort: "x" }, "Benutzer kein String"],
    [{ benutzer: { not: null }, passwort: "x" }, "Objekt statt String"],
  ])("%j ergibt 400 (%s)", async (body) => {
    const res = await api("/api/login", { body });
    expect(res.status).toBe(400);
  });

  it("ungültiges JSON ergibt 400", async () => {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{kaputt",
    });
    expect(res.status).toBe(400);
  });

  it("falsches Passwort ergibt 401 ohne Cookie", async () => {
    const res = await api("/api/login", { body: { benutzer: TEST_LOGIN.user, passwort: "falsch" } });
    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie()).toHaveLength(0);
  });

  it("Admin-Login setzt httpOnly-Cookie mit Admin-Rechten", async () => {
    const res = await api("/api/login", { body: { benutzer: INT.admin.user, passwort: INT.admin.password } });
    expect(res.status).toBe(200);
    const setCookie = res.headers.getSetCookie().find((c) => c.startsWith("token="))!;
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Strict/i);
    expect(await res.json()).toMatchObject({ userId: 0, isAdmin: true });
  });

  it("FILME-Login liefert isFilmeUser", async () => {
    const res = await api("/api/login", { body: { benutzer: INT.filme.user, passwort: INT.filme.password } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ userId: -1, isAdmin: false, isFilmeUser: true });
  });

  it("Mitglieder-Login aus der Datenbank funktioniert", async () => {
    const res = await api("/api/login", { body: { benutzer: TEST_LOGIN.user, passwort: TEST_LOGIN.password } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      userId: mitglieder[0].ID,
      vorname: "Hans",
      nachname: "Meier",
      isAdmin: false,
    });
  });
});

describe("/api/auth/verify und /api/logout", () => {
  it("verify ohne Cookie → 401", async () => {
    expect((await api("/api/auth/verify")).status).toBe(401);
  });

  it("verify mit gültigem Cookie liefert Benutzerdaten", async () => {
    const res = await api("/api/auth/verify", { cookie: await loginCookie(TEST_LOGIN.user, TEST_LOGIN.password) });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ username: TEST_LOGIN.user, isAdmin: false, isFilmeUser: false });
  });

  it("verify mit FILME-Cookie meldet isFilmeUser", async () => {
    const res = await api("/api/auth/verify", { cookie: await filmeCookie() });
    expect(await res.json()).toMatchObject({ isFilmeUser: true });
  });

  it("logout löscht das Cookie", async () => {
    const res = await api("/api/logout", { method: "POST", cookie: await adminCookie() });
    expect(res.status).toBe(200);
    const set = res.headers.getSetCookie().find((c) => c.startsWith("token="))!;
    expect(set).toMatch(/Max-Age=-\d+|Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  });
});

describe("POST /api/auth/change-password", () => {
  const login = "karl-login";
  const oldPw = "altes-pw";
  let cookie: string;

  beforeAll(async () => {
    await prisma.tblMitglieder.update({
      where: { ID: mitglieder[1].ID },
      data: { Login: login, Password: sha256(oldPw) },
    });
    cookie = await loginCookie(login, oldPw);
  });

  it("ohne Cookie → 401", async () => {
    expect((await api("/api/auth/change-password", { body: {} })).status).toBe(401);
  });

  it("Admin darf hier nicht ändern → 403", async () => {
    const res = await api("/api/auth/change-password", {
      cookie: await adminCookie(),
      body: { altesPasswort: "a", neuesPasswort: "b" },
    });
    expect(res.status).toBe(403);
  });

  it("fehlende Felder → 400", async () => {
    expect((await api("/api/auth/change-password", { cookie, body: { altesPasswort: "x" } })).status).toBe(400);
  });

  it("neues = altes Passwort → 400", async () => {
    const res = await api("/api/auth/change-password", { cookie, body: { altesPasswort: "x", neuesPasswort: "x" } });
    expect(res.status).toBe(400);
  });

  it("falsches altes Passwort → 400, Hash bleibt unverändert", async () => {
    const res = await api("/api/auth/change-password", {
      cookie,
      body: { altesPasswort: "nope", neuesPasswort: "neu" },
    });
    expect(res.status).toBe(400);
    const m = await prisma.tblMitglieder.findUnique({ where: { ID: mitglieder[1].ID } });
    expect(m?.Password).toBe(sha256(oldPw));
  });

  it("erfolgreiche Änderung: neues Passwort loggt ein, altes nicht mehr", async () => {
    const res = await api("/api/auth/change-password", {
      cookie,
      body: { altesPasswort: oldPw, neuesPasswort: "neues-pw" },
    });
    expect(res.status).toBe(200);

    const alt = await api("/api/login", { body: { benutzer: login, passwort: oldPw } });
    expect(alt.status).toBe(401);
    const neu = await api("/api/login", { body: { benutzer: login, passwort: "neues-pw" } });
    expect(neu.status).toBe(200);
    expect(tokenCookieFrom(neu)).toMatch(/^token=/);
  });
});

describe("/api/verwaltung/benutzerzugriff", () => {
  it("Nicht-Admin → 403", async () => {
    const cookie = await loginCookie(TEST_LOGIN.user, TEST_LOGIN.password);
    expect((await api("/api/verwaltung/benutzerzugriff", { cookie })).status).toBe(403);
    const post = await api("/api/verwaltung/benutzerzugriff", { cookie, body: { id: 1, action: "deaktivieren" } });
    expect(post.status).toBe(403);
  });

  it("GET liefert alle Mitglieder, Passwörter maskiert", async () => {
    const res = await api("/api/verwaltung/benutzerzugriff", { cookie: await adminCookie() });
    expect(res.status).toBe(200);
    const list = (await res.json()) as { Login: string | null; Password: string }[];
    expect(list).toHaveLength(4);
    const hans = list.find((m) => m.Login === TEST_LOGIN.user)!;
    expect(hans.Password).toBe("********");
    expect(JSON.stringify(list)).not.toContain(sha256(TEST_LOGIN.password));
  });

  it("Validierung: ID fehlt / ungültige Aktion / Login fehlt → 400", async () => {
    const cookie = await adminCookie();
    const id = mitglieder[2].ID;
    expect((await api("/api/verwaltung/benutzerzugriff", { cookie, body: { action: "speichern" } })).status).toBe(400);
    expect((await api("/api/verwaltung/benutzerzugriff", { cookie, body: { id, action: "xyz" } })).status).toBe(400);
    expect((await api("/api/verwaltung/benutzerzugriff", { cookie, body: { id, action: "speichern" } })).status).toBe(400);
  });

  it("speichern vergibt Zugang, deaktivieren entzieht ihn wieder", async () => {
    const cookie = await adminCookie();
    const id = mitglieder[2].ID;

    const save = await api("/api/verwaltung/benutzerzugriff", {
      cookie,
      body: { id, action: "speichern", login: "otto", passwort: "otto-pw" },
    });
    expect(save.status).toBe(200);
    expect((await api("/api/login", { body: { benutzer: "otto", passwort: "otto-pw" } })).status).toBe(200);

    // Login ändern; die Passwort-Maske lässt das Passwort unangetastet
    await api("/api/verwaltung/benutzerzugriff", {
      cookie,
      body: { id, action: "speichern", login: "otto2", passwort: "********" },
    });
    expect((await api("/api/login", { body: { benutzer: "otto2", passwort: "otto-pw" } })).status).toBe(200);

    const off = await api("/api/verwaltung/benutzerzugriff", { cookie, body: { id, action: "deaktivieren" } });
    expect(off.status).toBe(200);
    expect((await api("/api/login", { body: { benutzer: "otto2", passwort: "otto-pw" } })).status).toBe(401);
  });
});
