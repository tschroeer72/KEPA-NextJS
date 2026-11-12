const { execSync } = require("child_process");

module.exports = async () => {
  const child = globalThis.__KEPA_NEXT_SERVER__;
  if (!child || child.killed || child.exitCode !== null) return;
  if (process.platform === "win32") {
    try {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" });
    } catch {
      /* bereits beendet */
    }
  } else {
    child.kill("SIGTERM");
  }
};
