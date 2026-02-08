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

function readText(p, maxChars = 20000) {
  if (!exists(p)) return null;
  const s = fs.readFileSync(p, "utf8");
  if (s.length > maxChars) return s.slice(0, maxChars) + "\n\n...(truncated)...\n";
  return s;
}

function writeText(p, s) {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, s, "utf8");
}

function writeJson(p, obj) {
  writeText(p, JSON.stringify(obj, null, 2) + "\n");
}

function listFiles(dir) {
  if (!exists(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => path.join(dir, e.name));
}

function newestDirChild(dir) {
  if (!exists(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => path.join(dir, e.name));
  if (dirs.length === 0) return null;
  dirs.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return dirs[0];
}

module.exports = {
  exists,
  mkdirp,
  readText,
  writeText,
  writeJson,
  listFiles,
  newestDirChild,
};

