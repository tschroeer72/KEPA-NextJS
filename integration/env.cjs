// Gemeinsame Konfiguration für die Integrationstests (Setup-Prozess + Test-Worker).
const crypto = require("crypto");

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

const INT = {
  port: process.env.INTEGRATION_PORT || "3100",
  databaseUrl:
    process.env.INTEGRATION_DATABASE_URL ||
    "mysql://root:root@127.0.0.1:3307/kepa_test",
  jwtSecret: "integration-test-secret",
  admin: { user: "int-admin", password: "int-admin-pw" },
  filme: { user: "int-filme", password: "int-filme-pw" },
};

// Umgebungsvariablen, mit denen sowohl der Next-Server als auch die Tests laufen
function buildEnv() {
  return {
    DATABASE_URL: INT.databaseUrl,
    JWT_SECRET: INT.jwtSecret,
    ADMIN_USERNAME: INT.admin.user,
    ADMIN_PASSWORD: sha256(INT.admin.password),
    FILME_USERNAME: INT.filme.user,
    FILME_PASSWORD: sha256(INT.filme.password),
    // SMTP zeigt bewusst auf einen geschlossenen Port -> Fehlerpfad der Mail-Routen testbar
    EMAIL_HOST: "127.0.0.1",
    EMAIL_PORT: "1",
    EMAIL_USER: "x",
    EMAIL_PASS: "x",
    EMAIL_SENDER: "kepa@example.com",
    EMAIL_HOST_ERROR: "127.0.0.1",
    EMAIL_PORT_ERROR: "1",
    EMAIL_USER_ERROR: "x",
    EMAIL_PASS_ERROR: "x",
    EMAIL_SENDER_ERROR: "kepa-fehler@example.com",
    NEXT_TELEMETRY_DISABLED: "1",
  };
}

module.exports = { INT, buildEnv, sha256 };
