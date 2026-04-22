#!/usr/bin/env node
/* eslint-disable no-console */
const path = require("path");

const { init } = require("../src/commands/init");
const { pack } = require("../src/commands/pack");
const { run } = require("../src/commands/run");
const { handleTest } = require("../src/commands/test");

function help() {
  console.log(`
repo-memory-workflow

Usage:
  repo-memory-workflow init   # create or repair .ai/ relay workflow files
  repo-memory-workflow pack   # generate .ai/CONTEXT_PACK.md
  repo-memory-workflow run    # run run_loop.ps1 on Windows or ./run_loop.sh elsewhere
  repo-memory-workflow test   # testing workflow (init/cases/run/export)

Run commands from the target project root. Typical flow:
  cd <your-project-directory>
  repo-memory-workflow init
  # ask AI to split the requirement into .ai/TASK.md and .ai/NEXT.md
  repo-memory-workflow run --max-rounds 10 --timeout 1800
`);
}

function main() {
  const args = process.argv.slice(2);
  const sub = args[0];
  const projectRoot = process.cwd();
  const packageRoot = path.join(__dirname, "..");

  if (!sub || sub === "-h" || sub === "--help" || sub === "help") {
    return help();
  }

  if (sub === "init") {
    try {
      const r = init(projectRoot, packageRoot);
      console.log(`✅ Created ${r.created.length} file(s), skipped ${r.skipped.length}, updated ${r.updated.length}`);
      console.log("Next: ask AI to split your requirement into .ai/TASK.md and write one concrete action to .ai/NEXT.md");
      console.log("Then: repo-memory-workflow run --max-rounds 10 --timeout 1800");
      return;
    } catch (e) {
      console.error("❌ init failed:");
      console.error(e && e.stack ? e.stack : String(e));
      process.exit(1);
    }
  }

  if (sub === "pack") {
    try {
      const r = pack(projectRoot);
      console.log(`✅ Wrote ${path.relative(projectRoot, r.outputPath)}`);
      return;
    } catch (e) {
      console.error("❌ pack failed:");
      console.error(e && e.stack ? e.stack : String(e));
      process.exit(1);
    }
  }

  if (sub === "run") {
    return Promise.resolve().then(() => run(projectRoot, args.slice(1))).then((r) => {
      if (r.error) {
        console.error(r.error && r.error.stack ? r.error.stack : String(r.error));
      }
      process.exit(r.exitCode || 0);
    }).catch((e) => {
      console.error("❌ run failed:");
      console.error(e && e.stack ? e.stack : String(e));
      process.exit(1);
    });
  }

  if (sub === "test") {
    return handleTest(args.slice(1), projectRoot, packageRoot).catch((e) => {
      console.error("❌ test command failed:");
      console.error(e && e.stack ? e.stack : String(e));
      process.exit(1);
    });
  }

  console.error(`Unknown command: ${sub}`);
  help();
  process.exit(1);
}

main();
