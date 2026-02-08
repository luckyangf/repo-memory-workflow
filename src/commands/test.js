const path = require("path");

const { init: initTests } = require("../test/init_tests");
const { generate: generateCases } = require("../test/generate_cases");
const { run: runTests } = require("../test/run_tests");
const { exportOffice } = require("../test/export_office");

function parseArgs(argv) {
  // argv: ["init"] or ["cases","--resource","..."]
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--resource") {
      out.resource = argv[i + 1];
      i += 1;
      continue;
    }
    if (a === "-h" || a === "--help") {
      out.help = true;
      continue;
    }
    out._.push(a);
  }
  return out;
}

function help() {
  // eslint-disable-next-line no-console
  console.log(`
repo-memory-workflow test

Usage:
  repo-memory-workflow test init
  repo-memory-workflow test cases --resource "<.ai/resources/.../versions/<ver>/...>"
  repo-memory-workflow test run   --resource "<.ai/resources/.../versions/<ver>/...>"
  repo-memory-workflow test export --resource "<.ai/resources/.../versions/<ver>/...>"

Notes:
  - MUST bind an explicit resource version path (avoid ambiguous latest).
  - Outputs go under .ai/tests/releases/, .ai/tests/runs/, .ai/tests/exports/
`);
}

async function handleTest(argv, projectRoot, packageRoot) {
  const args = parseArgs(argv);
  const sub = args._[0];
  const templatesRoot = path.join(packageRoot, "templates", "ai");

  if (!sub || args.help) {
    help();
    return;
  }

  if (sub === "init") {
    const r = initTests(projectRoot, templatesRoot);
    // eslint-disable-next-line no-console
    console.log(`✅ Ensured: ${path.relative(projectRoot, r.testsDir)}`);
    return;
  }

  if (sub === "cases") {
    const r = generateCases(projectRoot, args.resource);
    // eslint-disable-next-line no-console
    console.log(`✅ Generated cases: ${path.relative(projectRoot, r.releaseDir)}`);
    return;
  }

  if (sub === "run") {
    const r = await runTests(projectRoot, args.resource);
    // eslint-disable-next-line no-console
    console.log(`✅ Wrote run: ${path.relative(projectRoot, r.runDir)}`);
    return;
  }

  if (sub === "export") {
    const r = await exportOffice(projectRoot, args.resource);
    // eslint-disable-next-line no-console
    console.log(`✅ Exported Office: ${path.relative(projectRoot, r.exportsDir)}`);
    return;
  }

  // eslint-disable-next-line no-console
  console.error(`Unknown test subcommand: ${sub}`);
  help();
  process.exitCode = 1;
}

module.exports = { handleTest };

