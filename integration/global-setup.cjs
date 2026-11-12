// Bereitet die Integrationstests vor:
//  1. Sicherheits-Check der Test-DB (Name muss "test" enthalten, sonst wird NICHTS angefasst)
//  2. Schema per `prisma db push` auf die (Wegwerf-)Test-DB anwenden; Daten leert jede Testdatei selbst
//  3. Produktions-Server (`next start`) auf dem Integrationsport starten
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { INT, buildEnv } = require("./env.cjs");

const root = path.resolve(__dirname, "..");

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status > 0) return;
    } catch {
      /* Server noch nicht bereit */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Next-Server unter ${url} nach ${timeoutMs}ms nicht erreichbar`);
}

module.exports = async () => {
  const dbName = new URL(INT.databaseUrl).pathname.replace(/^\//, "");
  if (!/test/i.test(dbName)) {
    throw new Error(
      `Abbruch: Integrationstests setzen die DB "${dbName}" zurück. Der Datenbankname muss "test" enthalten (INTEGRATION_DATABASE_URL).`
    );
  }

  const env = { ...process.env, ...buildEnv() };
  Object.assign(process.env, buildEnv());
  process.env.INTEGRATION_BASE_URL = `http://127.0.0.1:${INT.port}`;

  console.log(`\n[integration] Schema aufbauen in "${dbName}" ...`);
  execSync("npx prisma db push --accept-data-loss", {
    cwd: root,
    env,
    stdio: "inherit",
  });

  if (!fs.existsSync(path.join(root, ".next", "BUILD_ID"))) {
    throw new Error("Kein Produktions-Build gefunden. Bitte zuerst `npm run build` ausführen.");
  }

  console.log(`[integration] Starte next start auf Port ${INT.port} ...`);
  const child = spawn(
    process.execPath,
    [path.join(root, "node_modules", "next", "dist", "bin", "next"), "start", "-p", INT.port],
    { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] }
  );
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  child.on("exit", (code) => {
    if (code) console.error(`[integration] next start beendet (Code ${code})\n${log}`);
  });
  globalThis.__KEPA_NEXT_SERVER__ = child;

  try {
    await waitForServer(`${process.env.INTEGRATION_BASE_URL}/login`, 60000);
  } catch (e) {
    child.kill();
    throw new Error(`${e.message}\n${log}`);
  }
};
