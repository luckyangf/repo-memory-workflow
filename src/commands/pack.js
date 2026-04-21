const { execFileSync } = require("child_process");
const path = require("path");

const { exists, readText, toPosix, writeText } = require("../utils/files");

function runGit(root, args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    return `(command failed: git ${args.join(" ")}; ${msg})`;
  }
}

function parseActiveTaskPaths(taskMd, projectRoot) {
  const lines = taskMd.split(/\r?\n/);
  const active = [];
  let inActive = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (/^-+\s*Active:\s*$/.test(line)) {
      inActive = true;
      continue;
    }
    if (inActive && /^-+\s*(Queued|Blocked|Done):\s*$/.test(line)) {
      inActive = false;
      continue;
    }
    if (!inActive) continue;

    let m = line.match(/^-+\s*(\.ai\/tasks\/\S+\.md)\s*$/);
    if (!m) m = line.match(/^(\.ai\/tasks\/\S+\.md)\s*$/);
    if (m) active.push(path.join(projectRoot, m[1]));
  }

  return [...new Set(active)];
}

function section(title, body) {
  return `## ${title}\n\n${body || "(empty)"}\n\n`;
}

function readProjectFile(root, relPath, maxChars) {
  return readText(path.join(root, relPath), maxChars) || `(missing: ${relPath})`;
}

function pack(projectRoot) {
  const aiDir = path.join(projectRoot, ".ai");
  if (!exists(aiDir)) throw new Error("Missing .ai/. Run: repo-memory-workflow init");

  const now = new Date().toISOString();
  const taskMd = readProjectFile(projectRoot, ".ai/TASK.md", 20000);
  const activeTasks = parseActiveTaskPaths(taskMd, projectRoot);

  const parts = [];
  parts.push(`# CONTEXT PACK\n\nGenerated: ${now}\n\n`);
  parts.push("## How to use\n\n");
  parts.push("- This file is a compact handoff snapshot for a fresh AI session.\n");
  parts.push("- Do not rely on previous chat history.\n");
  parts.push("- Follow `.ai/NEXT.md` first, then update checkpoint files before ending.\n\n");

  parts.push("## Repo Info\n\n");
  parts.push(`- Branch: ${runGit(projectRoot, ["rev-parse", "--abbrev-ref", "HEAD"])}\n`);
  parts.push(`- Git status: ${runGit(projectRoot, ["status", "--short"]) || "(clean)"}\n\n`);
  parts.push("### git diff --stat\n\n```text\n");
  parts.push(runGit(projectRoot, ["diff", "--stat"]) || "(no diff)");
  parts.push("\n```\n\n");
  parts.push("### recent commits\n\n```text\n");
  parts.push(runGit(projectRoot, ["log", "-5", "--oneline"]) || "(no commits)");
  parts.push("\n```\n\n");

  parts.push(section("AGENTS.md", readProjectFile(projectRoot, "AGENTS.md", 20000)));
  parts.push(section(".ai/PROMPT_START.md", readProjectFile(projectRoot, ".ai/PROMPT_START.md", 20000)));
  parts.push(section(".ai/TASK.md", taskMd));
  parts.push(section(".ai/STATE.md", readProjectFile(projectRoot, ".ai/STATE.md", 20000)));
  parts.push(section(".ai/NEXT.md", readProjectFile(projectRoot, ".ai/NEXT.md", 12000)));
  parts.push(section(".ai/DECISIONS.md", readProjectFile(projectRoot, ".ai/DECISIONS.md", 20000)));
  parts.push(section(".ai/LOG.md", readProjectFile(projectRoot, ".ai/LOG.md", 30000)));
  parts.push(section(".ai/CONTEXT.md", readProjectFile(projectRoot, ".ai/CONTEXT.md", 12000)));

  parts.push("## Active Task Cards\n\n");
  if (activeTasks.length === 0) {
    parts.push("- (none found in `.ai/TASK.md` Active list)\n\n");
  } else {
    for (const p of activeTasks) {
      const rel = toPosix(path.relative(projectRoot, p));
      parts.push(`### ${rel}\n\n`);
      parts.push(`${readText(p, 16000) || `(missing: ${rel})`}\n\n`);
    }
  }

  parts.push(section(".ai/resources/_index.md", readProjectFile(projectRoot, ".ai/resources/_index.md", 12000)));
  parts.push(section(".ai/tests/test_config.yaml", readProjectFile(projectRoot, ".ai/tests/test_config.yaml", 8000)));

  const outputPath = path.join(aiDir, "CONTEXT_PACK.md");
  writeText(outputPath, parts.join(""));
  return { outputPath };
}

module.exports = { pack };
