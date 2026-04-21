const fs = require("fs");
const path = require("path");

const { copyMissing, exists, mkdirp, toPosix } = require("../utils/files");

function rel(root, p) {
  return toPosix(path.relative(root, p));
}

function appendGitignore(root) {
  const gi = path.join(root, ".gitignore");
  const marker = "# repo-memory-workflow generated";
  const rules = [
    marker,
    ".ai/CONTEXT_PACK.md",
    ".ai/run_logs/",
    "",
  ].join("\n");
  if (!exists(gi)) {
    fs.writeFileSync(gi, rules, "utf8");
    return true;
  }
  const cur = fs.readFileSync(gi, "utf8");
  if (cur.includes(marker) || cur.includes(".ai/CONTEXT_PACK.md")) return false;
  fs.appendFileSync(gi, `${cur.endsWith("\n") ? "" : "\n"}\n${rules}`, "utf8");
  return true;
}

function chmodExecutableIfExists(p) {
  if (!exists(p)) return;
  const mode = fs.statSync(p).mode;
  fs.chmodSync(p, mode | 0o755);
}

function init(projectRoot, packageRoot) {
  const templatesAi = path.join(packageRoot, "templates", "ai");
  const templatesRoot = path.join(packageRoot, "templates", "root");
  const aiDir = path.join(projectRoot, ".ai");
  const result = { created: [], skipped: [], updated: [] };

  if (!exists(templatesAi)) throw new Error("Missing templates/ai in this package.");
  if (!exists(templatesRoot)) throw new Error("Missing templates/root in this package.");

  mkdirp(aiDir);
  copyMissing(templatesAi, aiDir, result);
  copyMissing(templatesRoot, projectRoot, result);

  const runLoop = path.join(projectRoot, "run_loop.sh");
  chmodExecutableIfExists(runLoop);

  if (appendGitignore(projectRoot)) result.updated.push(path.join(projectRoot, ".gitignore"));

  return {
    created: result.created.map((p) => rel(projectRoot, p)),
    skipped: result.skipped.map((p) => rel(projectRoot, p)),
    updated: result.updated.map((p) => rel(projectRoot, p)),
  };
}

module.exports = { init };
