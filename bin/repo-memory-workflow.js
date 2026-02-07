#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dst) {
  mkdirp(dst);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function appendGitignore(root) {
  const gi = path.join(root, ".gitignore");
  const marker = "# repo-memory-workflow generated";
  const rules = [marker, ".ai/CONTEXT_PACK.md", ""].join("\n");

  if (!exists(gi)) {
    fs.writeFileSync(gi, rules, "utf8");
    return;
  }
  const cur = fs.readFileSync(gi, "utf8");
  if (cur.includes(marker) || cur.includes(".ai/CONTEXT_PACK.md")) return;
  fs.appendFileSync(gi, "\n" + rules, "utf8");
}

function help() {
  console.log(`
repo-memory-workflow

Usage:
  repo-memory-workflow init   # create .ai/ workflow templates in current project root
`);
}

function init(root) {
  const templatesRoot = path.join(__dirname, "..", "templates", "ai");
  const aiDir = path.join(root, ".ai");

  if (!exists(templatesRoot)) {
    console.error("❌ Missing templates/ai in this package.");
    process.exit(1);
  }

  if (exists(aiDir)) {
    console.log("⚠️  .ai/ already exists. Skipping creation.");
  } else {
    copyDir(templatesRoot, aiDir);
    console.log("✅ Created .ai/ templates");
  }

  appendGitignore(root);
  console.log("✅ Updated .gitignore (ignore .ai/CONTEXT_PACK.md)");
  console.log("Next: open .ai/START.md");
}

function main() {
  const args = process.argv.slice(2);
  const sub = args[0];

  if (!sub || sub === "-h" || sub === "--help" || sub === "help") {
    return help();
  }

  if (sub === "init") {
    return init(process.cwd());
  }

  console.error(`Unknown command: ${sub}`);
  help();
  process.exit(1);
}

main();
