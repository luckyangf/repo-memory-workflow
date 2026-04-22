const { spawn } = require("child_process");
const path = require("path");

const { exists } = require("../utils/files");

function missingLoopMessage(projectRoot) {
  return [
    "The current directory is not an initialized repo-memory-workflow project for this platform, or it is missing the platform loop script.",
    "",
    `Current directory: ${projectRoot}`,
    "",
    "Run this from the target project root, not from your user home or the repo-memory-workflow package directory:",
    "",
    "  cd <your-project-directory>",
    "  repo-memory-workflow init",
    "",
    "Then ask AI to split the requirement into .ai/TASK.md first. After .ai/NEXT.md contains one concrete next action, run:",
    "",
    "  repo-memory-workflow run --max-rounds 100 --timeout 3600",
  ].join("\n");
}

function selectLoopCommand(projectRoot, platform = process.platform) {
  const shellLoop = path.join(projectRoot, "run_loop_for_mac.sh");
  const legacyShellLoop = path.join(projectRoot, "run_loop.sh");
  const psLoop = path.join(projectRoot, "run_loop_for_win.ps1");
  const legacyPsLoop = path.join(projectRoot, "run_loop.ps1");

  if (platform === "win32") {
    const selectedPsLoop = exists(psLoop) ? psLoop : legacyPsLoop;
    if (!exists(selectedPsLoop)) throw new Error(missingLoopMessage(projectRoot));
    return {
      command: process.env.RMW_POWERSHELL_BIN || "powershell.exe",
      args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", selectedPsLoop],
    };
  }

  const selectedShellLoop = exists(shellLoop) ? shellLoop : legacyShellLoop;
  if (!exists(selectedShellLoop)) throw new Error(missingLoopMessage(projectRoot));
  return { command: selectedShellLoop, args: [] };
}

function run(projectRoot, args) {
  const loop = selectLoopCommand(projectRoot);

  return new Promise((resolve) => {
    const child = spawn(loop.command, [...loop.args, ...args], {
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

module.exports = { run, selectLoopCommand };
