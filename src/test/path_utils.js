const path = require("path");

function isSubpath(child, parent) {
  const rel = path.relative(parent, child);
  return !!rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

function slugify(s) {
  return String(s)
    .trim()
    .replace(/\\/g, "/")
    .replace(/[^a-zA-Z0-9._/-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function deriveReleaseIdFromResourcePath(resourceAbsPath, projectRoot) {
  // Expected: <root>/.ai/resources/<type>/<key>/versions/<version>/...
  const aiDir = path.join(projectRoot, ".ai");
  const resourcesDir = path.join(aiDir, "resources");

  const normalized = resourceAbsPath;
  if (!isSubpath(normalized, resourcesDir)) {
    return slugify(path.relative(projectRoot, normalized));
  }

  const rel = path.relative(resourcesDir, normalized).replace(/\\/g, "/");
  const parts = rel.split("/").filter(Boolean);

  // parts: [type, key, "versions", version, ...]
  const versionsIdx = parts.indexOf("versions");
  if (versionsIdx >= 2 && parts.length > versionsIdx + 1) {
    const type = parts[0];
    const key = parts[1];
    const version = parts[versionsIdx + 1];
    return slugify(`${type}_${key}__${version}`);
  }

  return slugify(rel);
}

function findVersionDirFromResourcePath(resourceAbsPath, projectRoot) {
  // If resource path is inside /versions/<version>/..., return that version directory.
  const rel = path
    .relative(path.join(projectRoot, ".ai", "resources"), resourceAbsPath)
    .replace(/\\/g, "/");
  const parts = rel.split("/").filter(Boolean);
  const versionsIdx = parts.indexOf("versions");
  if (versionsIdx >= 0 && parts.length > versionsIdx + 1) {
    const upto = parts.slice(0, versionsIdx + 2); // include version segment
    return path.join(projectRoot, ".ai", "resources", ...upto);
  }
  return path.dirname(resourceAbsPath);
}

module.exports = {
  slugify,
  deriveReleaseIdFromResourcePath,
  findVersionDirFromResourcePath,
};

