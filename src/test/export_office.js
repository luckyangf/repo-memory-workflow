const fs = require("fs");
const path = require("path");

const { deriveReleaseIdFromResourcePath } = require("./path_utils");
const { exists, mkdirp, readText } = require("./fs_utils");

function safeRequire(name) {
  try {
    // eslint-disable-next-line global-require
    return require(name);
  } catch {
    return null;
  }
}

function parseMarkdownToDocxParagraphs(reportMd, docx) {
  const { Paragraph, HeadingLevel, TextRun } = docx;
  const paras = [];
  const lines = reportMd.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      paras.push(new Paragraph({ children: [new TextRun("")] }));
      continue;
    }
    const h1 = line.match(/^#\s+(.*)$/);
    if (h1) {
      paras.push(new Paragraph({ text: h1[1], heading: HeadingLevel.HEADING_1 }));
      continue;
    }
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      paras.push(new Paragraph({ text: h2[1], heading: HeadingLevel.HEADING_2 }));
      continue;
    }
    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) {
      paras.push(new Paragraph({ text: h3[1], heading: HeadingLevel.HEADING_3 }));
      continue;
    }
    const bullet = line.match(/^-+\s+(.*)$/);
    if (bullet) {
      paras.push(new Paragraph({ text: bullet[1], bullet: { level: 0 } }));
      continue;
    }
    // Tables/code blocks are kept as plain text for now
    paras.push(new Paragraph({ children: [new TextRun(line)] }));
  }
  return paras;
}

async function exportOffice(projectRoot, resourceArg) {
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

  const exportsDir = path.join(testsDir, "exports", releaseId);
  mkdirp(exportsDir);

  // ---- XLSX (cases) ----
  const exceljs = safeRequire("exceljs");
  if (!exceljs) throw new Error("缺少依赖：exceljs（请重新安装本包依赖或升级版本后再试）");

  const casesJsonPath = path.join(releaseDir, "cases.json");
  if (!exists(casesJsonPath)) throw new Error("缺少 cases.json，请先运行 test cases");
  const casesObj = JSON.parse(fs.readFileSync(casesJsonPath, "utf8"));
  const cases = Array.isArray(casesObj.cases) ? casesObj.cases : [];

  const wb = new exceljs.Workbook();
  const ws = wb.addWorksheet("Cases");
  ws.columns = [
    { header: "ID", key: "id", width: 12 },
    { header: "标题", key: "title", width: 50 },
    { header: "类型", key: "type", width: 14 },
    { header: "前置条件", key: "preconditions", width: 30 },
    { header: "步骤", key: "steps", width: 50 },
    { header: "期望结果", key: "expected", width: 40 },
    { header: "优先级", key: "priority", width: 10 },
    { header: "覆盖来源", key: "source", width: 30 },
    { header: "状态", key: "status", width: 12 },
  ];
  for (const c of cases) ws.addRow(c);

  const xlsxPath = path.join(exportsDir, "cases.xlsx");
  await wb.xlsx.writeFile(xlsxPath);

  // ---- DOCX (report) ----
  const docx = safeRequire("docx");
  if (!docx) throw new Error("缺少依赖：docx（请重新安装本包依赖或升级版本后再试）");

  const reportMd = readText(path.join(releaseDir, "report.md"), 500000) || "";
  const { Document, Packer } = docx;
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: parseMarkdownToDocxParagraphs(reportMd, docx),
      },
    ],
  });
  const buf = await Packer.toBuffer(doc);
  const docxPath = path.join(exportsDir, "report.docx");
  fs.writeFileSync(docxPath, buf);

  return { releaseId, exportsDir, xlsxPath, docxPath };
}

module.exports = { exportOffice };

