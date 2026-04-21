const fs = require("fs");
const path = require("path");

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function copyMissing(src, dst, result) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    mkdirp(dst);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const e of entries) {
      copyMissing(path.join(src, e.name), path.join(dst, e.name), result);
    }
    return;
  }

  mkdirp(path.dirname(dst));
  if (exists(dst)) {
    if (result) result.skipped.push(dst);
    return;
  }
  fs.copyFileSync(src, dst);
  if (result) result.created.push(dst);
}

function readText(p, maxChars = 20000) {
  if (!exists(p)) return null;
  const s = fs.readFileSync(p, "utf8");
  if (s.length > maxChars) return `${s.slice(0, maxChars)}\n\n...(truncated)...\n`;
  return s;
}

function writeText(p, s) {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, s, "utf8");
}

module.exports = {
  copyMissing,
  exists,
  mkdirp,
  readText,
  toPosix,
  writeText,
};
