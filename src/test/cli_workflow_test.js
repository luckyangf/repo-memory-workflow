const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { init } = require("../commands/init");
const { pack } = require("../commands/pack");
const { run, selectLoopCommand } = require("../commands/run");

const packageRoot = path.resolve(__dirname, "..", "..");

function tmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "rmw-cli-"));
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function exists(p) {
  return fs.existsSync(p);
}

function testInitCreatesRelayFilesWithoutOverwriting() {
  const root = tmpProject();
  fs.mkdirSync(path.join(root, ".ai"), { recursive: true });
  fs.writeFileSync(path.join(root, ".ai", "LOG.md"), "# LOG\n\ncustom log\n", "utf8");

  const result = init(root, packageRoot);

  assert.ok(exists(path.join(root, "AGENTS.md")), "AGENTS.md should be created");
  assert.ok(exists(path.join(root, "run_loop_for_mac.sh")), "run_loop_for_mac.sh should be created");
  assert.ok(exists(path.join(root, "run_loop_for_win.ps1")), "run_loop_for_win.ps1 should be created");
  assert.ok(exists(path.join(root, "run_loop.sh")), "run_loop.sh should be created");
  assert.ok(exists(path.join(root, "run_loop.ps1")), "run_loop.ps1 should be created");
  assert.ok(exists(path.join(root, ".ai", "TASK.md")), ".ai/TASK.md should be created");
  assert.ok(exists(path.join(root, ".ai", "STATE.md")), ".ai/STATE.md should be created");
  assert.ok(exists(path.join(root, ".ai", "NEXT.md")), ".ai/NEXT.md should be created");
  assert.ok(exists(path.join(root, ".ai", "PROMPT_START.md")), ".ai/PROMPT_START.md should be created");
  assert.match(read(path.join(root, "run_loop_for_mac.sh")), /codex exec/, "run_loop_for_mac.sh should call codex exec");
  assert.match(read(path.join(root, "run_loop_for_win.ps1")), /codex exec/, "run_loop_for_win.ps1 should call codex exec");
  assert.match(read(path.join(root, ".gitignore")), /\.ai\/CONTEXT_PACK\.md/, ".gitignore should ignore context pack");
  assert.strictEqual(read(path.join(root, ".ai", "LOG.md")), "# LOG\n\ncustom log\n", "init must not overwrite existing files");
  assert.ok(result.created.length > 0, "init should report created files");
  assert.ok(result.skipped.some((p) => p.endsWith(".ai/LOG.md")), "init should report skipped existing files");
}

function testRelayScriptsUseRobustCodexExec() {
  const root = tmpProject();
  init(root, packageRoot);

  const win = read(path.join(root, "run_loop_for_win.ps1"));
  assert.match(win, /Set-Location -LiteralPath \$ProjectRoot/, "Windows job should run from project root");
  assert.match(win, /--cd/, "Windows relay should pass --cd to codex exec");
  assert.match(win, /--skip-git-repo-check/, "Windows relay should support non-Git smoke tests");
  assert.match(win, /--full-auto/, "Windows relay should request workspace-write automation");
  assert.match(win, /round_\$\{round\}_run\.cmd/, "Windows relay should write a reproducible cmd runner per round");
  assert.match(win, /Start-Process/, "Windows relay should start codex through a process with timeout control");
  assert.match(win, /taskkill/, "Windows relay should kill the process tree on timeout");
  assert.match(win, /type .* \| .* exec/, "Windows relay should feed the prompt through cmd stdin");
  assert.doesNotMatch(win, /exec \$RoundPrompt/, "Windows relay must not pass multiline prompt as a raw argument");
  assert.doesNotMatch(win, /Start-Job/, "Windows relay should not use PowerShell background jobs");

  const mac = read(path.join(root, "run_loop_for_mac.sh"));
  assert.match(mac, /--cd "\$PROJECT_ROOT"/, "macOS relay should pass --cd to codex exec");
  assert.match(mac, /--skip-git-repo-check/, "macOS relay should support non-Git smoke tests");
  assert.match(mac, /--full-auto/, "macOS relay should request workspace-write automation");
  assert.match(mac, /exec -/, "macOS relay should read the prompt from stdin");
}

function testCodexSkillStartsWithChineseGuide() {
  const skill = read(path.join(packageRoot, "integrations", "codex", "repo-memory-workflow", "SKILL.md"));

  assert.match(skill, /必须先和用户说明的流程/, "Codex skill should expose the Chinese guided flow prominently");
  assert.match(skill, /第 0 步：确认目标项目目录/, "Codex skill should start by confirming project directory");
  assert.match(skill, /第 1 步：确认 CLI 是否安装/, "Codex skill should confirm CLI installation");
  assert.match(skill, /第 2 步：询问用户是否安装\/启用 https:\/\/github\.com\/obra\/superpowers/, "Codex skill should ask about Superpowers");
  assert.match(skill, /第 5 步：先跑一个小 round 或 smoke test/, "Codex skill should require a smoke test before long loops");
  assert.match(skill, /Round 1 starting/, "Codex skill should trigger on common Windows stuck-loop symptoms");
}

function testPackIncludesRelayMemory() {
  const root = tmpProject();
  init(root, packageRoot);

  const result = pack(root);
  const content = read(result.outputPath);

  assert.match(content, /## AGENTS\.md/, "pack should include AGENTS.md");
  assert.match(content, /## \.ai\/STATE\.md/, "pack should include STATE.md");
  assert.match(content, /## \.ai\/NEXT\.md/, "pack should include NEXT.md");
  assert.match(content, /## \.ai\/PROMPT_START\.md/, "pack should include PROMPT_START.md");
  assert.match(content, /## \.ai\/LOG\.md/, "pack should include LOG.md");
}

function testRunSelectsPlatformLoop() {
  const root = tmpProject();
  init(root, packageRoot);

  const oldPowershellBin = process.env.RMW_POWERSHELL_BIN;
  delete process.env.RMW_POWERSHELL_BIN;
  try {
    const windowsLoop = selectLoopCommand(root, "win32");
    assert.match(windowsLoop.command, /powershell(?:\.exe)?$/, "Windows should run PowerShell");
    assert.ok(windowsLoop.args.includes(path.join(root, "run_loop_for_win.ps1")), "Windows should use run_loop_for_win.ps1");
  } finally {
    if (oldPowershellBin === undefined) {
      delete process.env.RMW_POWERSHELL_BIN;
    } else {
      process.env.RMW_POWERSHELL_BIN = oldPowershellBin;
    }
  }

  const unixLoop = selectLoopCommand(root, "darwin");
  assert.strictEqual(unixLoop.command, path.join(root, "run_loop_for_mac.sh"), "Unix should use run_loop_for_mac.sh");
  assert.deepStrictEqual(unixLoop.args, [], "Unix should invoke run_loop_for_mac.sh directly");
}

async function testRunMissingLoopExplainsProjectDirectoryWorkflow() {
  const root = tmpProject();
  let error = null;

  try {
    await run(root, []);
  } catch (e) {
    error = e;
  }

  assert.ok(error, "run should fail when loop files are missing");
  assert.match(error.message, /current directory is not an initialized repo-memory-workflow project/i);
  assert.match(error.message, /cd <your-project-directory>/i);
  assert.match(error.message, /repo-memory-workflow init/i);
  assert.match(error.message, /split the requirement/i);
  assert.match(error.message, /repo-memory-workflow run/i);
}

async function testRunInvokesRunLoopWithArgs() {
  const root = tmpProject();
  init(root, packageRoot);

  const loopPath = path.join(root, "run_loop_for_mac.sh");
  fs.writeFileSync(
    loopPath,
    "#!/usr/bin/env bash\nprintf '%s\\n' \"$@\" > .ai/run_args.txt\n",
    "utf8"
  );
  fs.chmodSync(loopPath, 0o755);

  const result = await run(root, ["--max-rounds", "2", "--timeout", "9"]);

  assert.strictEqual(result.exitCode, 0, "run_loop_for_mac.sh should exit successfully");
  assert.strictEqual(read(path.join(root, ".ai", "run_args.txt")), "--max-rounds\n2\n--timeout\n9\n");
}

async function main() {
  testInitCreatesRelayFilesWithoutOverwriting();
  testRelayScriptsUseRobustCodexExec();
  testCodexSkillStartsWithChineseGuide();
  testRunSelectsPlatformLoop();
  await testRunMissingLoopExplainsProjectDirectoryWorkflow();
  testPackIncludesRelayMemory();
  await testRunInvokesRunLoopWithArgs();
  console.log("cli_workflow_test: ok");
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
