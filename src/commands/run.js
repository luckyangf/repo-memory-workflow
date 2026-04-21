const { spawn } = require("child_process");
const path = require("path");

const { exists } = require("../utils/files");

function run(projectRoot, args) {
  const loopPath = path.join(projectRoot, "run_loop.sh");
  if (!exists(loopPath)) {
    throw new Error("Missing run_loop.sh. Run: repo-memory-workflow init");
  }

  return new Promise((resolve) => {
    const child = spawn(loopPath, args, {
      cwd: projectRoot,
      env: process.env,
      stdio: "inherit",
    });

    child.on("close", (code, signal) => {
      resolve({ exitCode: code, signal });
    });
    child.on("error", (error) => {
      resolve({ exitCode: 1, error });
    });
  });
}

module.exports = { run };
