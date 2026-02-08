const fs = require("fs");
const path = require("path");

const { exists, mkdirp } = require("./fs_utils");

function copyMissing(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    mkdirp(dst);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const e of entries) {
      const s = path.join(src, e.name);
      const d = path.join(dst, e.name);
      copyMissing(s, d);
    }
    return;
  }
  // file
  if (exists(dst)) return;
  mkdirp(path.dirname(dst));
  fs.copyFileSync(src, dst);
}

function init(projectRoot, templatesRoot) {
  const aiDir = path.join(projectRoot, ".ai");
  if (!exists(aiDir)) throw new Error("未找到 .ai/，请先运行：repo-memory-workflow init");

  const srcTests = path.join(templatesRoot, "tests");
  const dstTests = path.join(aiDir, "tests");
  if (!exists(srcTests)) throw new Error("本包缺少 templates/ai/tests（安装可能不完整）");

  copyMissing(srcTests, dstTests);
  return { testsDir: dstTests };
}

module.exports = { init };

