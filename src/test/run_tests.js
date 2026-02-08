const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const { deriveReleaseIdFromResourcePath } = require("./path_utils");
const { exists, mkdirp, readText, writeJson, writeText } = require("./fs_utils");

function nowStamp() {
  // 2026-02-08T12-34-56Z
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function safeRequireYaml() {
  try {
    // eslint-disable-next-line global-require
    return require("yaml");
  } catch {
    return null;
  }
}

function withTimeoutFetch(url, options, timeoutMs) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(new Error("timeout")), timeoutMs);
  return fetch(url, { ...options, signal: ac.signal })
    .finally(() => clearTimeout(t));
}

async function runHttpChecks(cfgHttp) {
  const baseUrl = (cfgHttp && cfgHttp.base_url) ? String(cfgHttp.base_url) : null;
  const reqs = (cfgHttp && Array.isArray(cfgHttp.requests)) ? cfgHttp.requests : [];
  const results = [];
  if (!baseUrl || reqs.length === 0) return { base_url: baseUrl, results };

  for (const r of reqs) {
    const name = r.name || r.path || "request";
    const method = (r.method || "GET").toUpperCase();
    const fullUrl = baseUrl.replace(/\/+$/, "") + String(r.path || "/");
    const expectStatus = r.expect_status || 200;
    const timeoutMs = r.timeout_ms || 5000;
    const startedAt = new Date().toISOString();

    try {
      const resp = await withTimeoutFetch(fullUrl, { method }, timeoutMs);
      const ok = resp.status === expectStatus;
      results.push({
        name,
        method,
        url: fullUrl,
        started_at: startedAt,
        status: resp.status,
        expect_status: expectStatus,
        ok,
      });
    } catch (e) {
      results.push({
        name,
        method,
        url: fullUrl,
        started_at: startedAt,
        status: null,
        expect_status: expectStatus,
        ok: false,
        error: String(e && e.message ? e.message : e),
      });
    }
  }
  return { base_url: baseUrl, results };
}

function runCommand({ name, cwd, cmd, optional }) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const child = spawn(cmd, {
      cwd: cwd || process.cwd(),
      shell: true,
      env: process.env,
    });

    let out = "";
    let err = "";
    const limit = 20000;

    child.stdout.on("data", (d) => {
      if (out.length < limit) out += d.toString("utf8");
    });
    child.stderr.on("data", (d) => {
      if (err.length < limit) err += d.toString("utf8");
    });

    child.on("close", (code) => {
      resolve({
        name: name || cmd,
        cwd: cwd || ".",
        cmd,
        optional: !!optional,
        started_at: startedAt,
        exit_code: code,
        ok: code === 0 || !!optional,
        stdout: out,
        stderr: err,
      });
    });
  });
}

function upsertLatestRunSection(reportMd, sectionMd) {
  const start = "<!-- RMW_LATEST_RUN_START -->";
  const end = "<!-- RMW_LATEST_RUN_END -->";
  if (reportMd.includes(start) && reportMd.includes(end)) {
    return reportMd.replace(new RegExp(`${start}[\\s\\S]*?${end}`, "m"), `${start}\n\n${sectionMd}\n\n${end}`);
  }
  return reportMd.trimEnd() + "\n\n" + start + "\n\n" + sectionMd + "\n\n" + end + "\n";
}

function summarize(runJson) {
  const httpOk = runJson.http && runJson.http.results ? runJson.http.results.filter((r) => r.ok).length : 0;
  const httpTotal = runJson.http && runJson.http.results ? runJson.http.results.length : 0;
  const cmdOk = runJson.commands ? runJson.commands.filter((r) => r.ok).length : 0;
  const cmdTotal = runJson.commands ? runJson.commands.length : 0;
  const allOk = (httpOk === httpTotal) && (cmdOk === cmdTotal);
  return { http_ok: httpOk, http_total: httpTotal, cmd_ok: cmdOk, cmd_total: cmdTotal, all_ok: allOk };
}

async function run(projectRoot, resourceArg) {
  const aiDir = path.join(projectRoot, ".ai");
  const testsDir = path.join(aiDir, "tests");
  if (!exists(aiDir)) throw new Error("未找到 .ai/，请先运行：repo-memory-workflow init");
  if (!exists(testsDir)) throw new Error("未找到 .ai/tests/，请先运行：repo-memory-workflow test init");
  if (!resourceArg) throw new Error("缺少 --resource 参数（必须绑定明确的 resource 版本路径）");

  const resourceAbs = path.isAbsolute(resourceArg) ? resourceArg : path.join(projectRoot, resourceArg);
  if (!exists(resourceAbs)) throw new Error(`resource 文件不存在：${resourceAbs}`);

  const releaseId = deriveReleaseIdFromResourcePath(resourceAbs, projectRoot);
  const releaseDir = path.join(testsDir, "releases", releaseId);
  if (!exists(releaseDir)) {
    throw new Error(`未找到 release 目录：${path.relative(projectRoot, releaseDir)}。请先运行：repo-memory-workflow test cases --resource "<path>"`);
  }

  const yaml = safeRequireYaml();
  const cfgPath = path.join(testsDir, "test_config.yaml");
  let cfg = {};
  if (exists(cfgPath)) {
    const raw = fs.readFileSync(cfgPath, "utf8");
    if (!yaml) throw new Error("缺少依赖：yaml（请重新安装本包依赖或升级版本后再试）");
    cfg = yaml.parse(raw) || {};
  }

  const runId = `${nowStamp()}_${releaseId}`;
  const runDir = path.join(testsDir, "runs", runId);
  mkdirp(path.join(runDir, "artifacts"));

  const http = await runHttpChecks(cfg.http || {});

  const commands = [];
  const cfgCmds = Array.isArray(cfg.commands) ? cfg.commands : [];
  for (const c of cfgCmds) {
    if (!c || !c.cmd) continue;
    // Resolve cwd relative to project root by default
    const cwd = c.cwd ? path.join(projectRoot, String(c.cwd)) : projectRoot;
    // eslint-disable-next-line no-await-in-loop
    const r = await runCommand({ name: c.name, cwd, cmd: String(c.cmd), optional: !!c.optional });
    commands.push(r);
  }

  const runJson = {
    run_id: runId,
    started_at: new Date().toISOString(),
    resource_version_path: path.relative(projectRoot, resourceAbs).replace(/\\/g, "/"),
    release_id: releaseId,
    http,
    commands,
  };

  writeJson(path.join(runDir, "run.json"), runJson);

  const sum = summarize(runJson);
  const runMd = [
    `# 测试运行记录: ${runId}`,
    "",
    "## 绑定的权威需求版本（MUST）",
    "",
    `- Resource version path: \`${runJson.resource_version_path}\``,
    `- Release id: \`${releaseId}\``,
    "",
    "## 摘要",
    "",
    `- HTTP checks: ${sum.http_ok}/${sum.http_total}`,
    `- Commands: ${sum.cmd_ok}/${sum.cmd_total}`,
    `- Overall: ${sum.all_ok ? "PASS" : "FAIL"}`,
    "",
    "## HTTP checks",
    "",
    "| name | method | url | expect | status | ok |",
    "|---|---|---|---:|---:|---|",
    ...((http.results || []).map((r) =>
      `| ${r.name} | ${r.method} | ${r.url} | ${r.expect_status} | ${r.status ?? ""} | ${r.ok ? "yes" : "no"} |`
    )),
    "",
    "## Commands",
    "",
    "| name | cwd | exit | ok |",
    "|---|---|---:|---|",
    ...commands.map((r) => `| ${r.name} | ${r.cwd} | ${r.exit_code} | ${r.ok ? "yes" : "no"} |`),
    "",
    "## Notes",
    "",
    "- 如需 MCP 取证（DB 查询、截图、接口调用），请把步骤与证据路径补充到本文件或 artifacts/ 下。",
    "",
  ].join("\n");
  writeText(path.join(runDir, "run.md"), runMd);

  // Update release report.md with latest run summary
  const reportPath = path.join(releaseDir, "report.md");
  const curReport = readText(reportPath, 200000) || "# 测试报告（源文件）\n";
  const latestSection = [
    "## Latest run summary",
    "",
    `- Run id: \`${runId}\``,
    `- Run path: \`${path.relative(projectRoot, path.join(runDir, "run.md")).replace(/\\\\/g, "/")}\``,
    `- HTTP checks: ${sum.http_ok}/${sum.http_total}`,
    `- Commands: ${sum.cmd_ok}/${sum.cmd_total}`,
    `- Overall: **${sum.all_ok ? "PASS" : "FAIL"}**`,
  ].join("\n");
  writeText(reportPath, upsertLatestRunSection(curReport, latestSection));

  return { releaseId, runId, runDir };
}

module.exports = { run };

