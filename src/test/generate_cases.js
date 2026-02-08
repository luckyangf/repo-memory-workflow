const path = require("path");

const { deriveReleaseIdFromResourcePath, findVersionDirFromResourcePath } = require("./path_utils");
const { parseActiveTaskPaths, extractAcceptanceBullets } = require("./task_parser");
const { exists, mkdirp, readText, writeJson, writeText, listFiles } = require("./fs_utils");

function nowIso() {
  return new Date().toISOString();
}

function toCsvValue(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function renderCasesMarkdown(resourcePath, releaseId, cases) {
  const header = [
    "# 测试用例（生成稿）",
    "",
    "## 绑定的权威需求版本（MUST）",
    "",
    `- Resource version path: \`${resourcePath}\``,
    `- Release id: \`${releaseId}\``,
    `- Generated at: \`${nowIso()}\``,
    "",
    "## 用例表（请人工审核后再执行）",
    "",
    "| ID | 标题 | 类型 | 前置条件 | 步骤 | 期望结果 | 优先级 | 覆盖来源 | 状态 |",
    "|---|---|---|---|---|---|---|---|---|",
  ].join("\n");

  const rows = cases.map((c) => {
    const cols = [
      c.id,
      c.title,
      c.type,
      c.preconditions,
      c.steps,
      c.expected,
      c.priority,
      c.source,
      c.status,
    ];
    return `| ${cols.map((x) => String(x ?? "").replace(/\|/g, "\\|")).join(" | ")} |`;
  });

  return header + "\n" + rows.join("\n") + "\n";
}

function generate(projectRoot, resourceArg) {
  const aiDir = path.join(projectRoot, ".ai");
  const testsDir = path.join(aiDir, "tests");
  if (!exists(aiDir)) throw new Error("未找到 .ai/，请先运行：repo-memory-workflow init");
  if (!exists(testsDir)) throw new Error("未找到 .ai/tests/，请先运行：repo-memory-workflow test init");
  if (!resourceArg) throw new Error("缺少 --resource 参数（必须绑定明确的 resource 版本路径）");

  const resourceAbs = path.isAbsolute(resourceArg) ? resourceArg : path.join(projectRoot, resourceArg);
  if (!exists(resourceAbs)) throw new Error(`resource 文件不存在：${resourceAbs}`);

  const releaseId = deriveReleaseIdFromResourcePath(resourceAbs, projectRoot);
  const versionDir = findVersionDirFromResourcePath(resourceAbs, projectRoot);

  const releaseDir = path.join(testsDir, "releases", releaseId);
  mkdirp(releaseDir);

  // Read task board + active tasks (best-effort)
  const taskMd = readText(path.join(aiDir, "TASK.md"), 20000) || "";
  const activeTasks = parseActiveTaskPaths(taskMd, projectRoot).filter(exists).slice(0, 5);

  const acceptance = [];
  for (const taskPath of activeTasks) {
    const md = readText(taskPath, 40000) || "";
    const bullets = extractAcceptanceBullets(md);
    for (const b of bullets) acceptance.push({ taskPath, bullet: b });
  }

  // Read resource version directory markdown files (best-effort)
  const resourceFiles = listFiles(versionDir)
    .filter((p) => p.endsWith(".md"))
    .sort();

  const sources = [];
  sources.push({ kind: "resource_entry", path: path.relative(projectRoot, resourceAbs) });
  for (const p of resourceFiles.slice(0, 20)) {
    sources.push({ kind: "resource_file", path: path.relative(projectRoot, p) });
  }
  for (const p of activeTasks) {
    sources.push({ kind: "task", path: path.relative(projectRoot, p) });
  }

  // Build cases from acceptance bullets (or fallback)
  const cases = [];
  let i = 1;
  for (const item of acceptance) {
    const id = `TC-${String(i).padStart(3, "0")}`;
    i += 1;
    cases.push({
      id,
      title: item.bullet,
      type: "functional",
      preconditions: "",
      steps: "",
      expected: "",
      priority: "P1",
      source: `task:${path.relative(projectRoot, item.taskPath)}`,
      status: "draft",
    });
  }

  if (cases.length === 0) {
    cases.push({
      id: "TC-001",
      title: "（占位）请根据 resource + 任务卡验收条款补齐用例",
      type: "functional",
      preconditions: "",
      steps: "",
      expected: "",
      priority: "P0",
      source: `resource:${path.relative(projectRoot, resourceAbs)}`,
      status: "draft",
    });
  }

  const meta = {
    release_id: releaseId,
    generated_at: nowIso(),
    resource_version_path: path.relative(projectRoot, resourceAbs).replace(/\\/g, "/"),
    resource_version_dir: path.relative(projectRoot, versionDir).replace(/\\/g, "/"),
    inputs: sources,
    notes: "用例为生成稿，请 QA/Dev 人工审核后再执行。",
  };

  // Write artifacts
  writeJson(path.join(releaseDir, "meta.json"), meta);
  writeJson(path.join(releaseDir, "cases.json"), { meta, cases });

  const csvHeader = [
    "id",
    "title",
    "type",
    "preconditions",
    "steps",
    "expected",
    "priority",
    "source",
    "status",
  ].join(",");
  const csvRows = cases.map((c) =>
    [
      c.id,
      c.title,
      c.type,
      c.preconditions,
      c.steps,
      c.expected,
      c.priority,
      c.source,
      c.status,
    ]
      .map(toCsvValue)
      .join(",")
  );
  writeText(path.join(releaseDir, "cases.csv"), csvHeader + "\n" + csvRows.join("\n") + "\n");

  writeText(path.join(releaseDir, "cases.md"), renderCasesMarkdown(path.relative(projectRoot, resourceAbs).replace(/\\/g, "/"), releaseId, cases));

  const reportPath = path.join(releaseDir, "report.md");
  if (!exists(reportPath)) {
    const reportMd = [
      "# 测试报告（源文件）",
      "",
      "## 绑定的权威需求版本（MUST）",
      "",
      `- Resource version path: \`${path.relative(projectRoot, resourceAbs).replace(/\\/g, "/")}\``,
      `- Release id: \`${releaseId}\``,
      "",
      "## 摘要",
      "",
      "- 总用例数：_TODO_",
      "- 通过：_TODO_ / 失败：_TODO_ / 阻塞：_TODO_ / 跳过：_TODO_",
      "",
      "## 环境",
      "",
      "- base_url: _TODO_",
      "",
      "## 结果明细",
      "",
      "- 本报告会在 `repo-memory-workflow test run` 后自动更新一段“Latest run summary”。",
      "",
      "## 备注",
      "",
      "- _TODO_",
      "",
    ].join("\n");
    writeText(reportPath, reportMd);
  }

  return { releaseId, releaseDir };
}

module.exports = { generate };

