const path = require("path");

function parseActiveTaskPaths(taskMd, projectRoot) {
  // Matches the "Task board" format used in templates/ai/TASK.md
  const lines = taskMd.split(/\r?\n/);
  const active = [];
  let inActive = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (/^-+\s*Active:\s*$/.test(line)) {
      inActive = true;
      continue;
    }
    if (inActive && /^-+\s*(Queued|Blocked|Done):\s*$/.test(line)) {
      inActive = false;
      continue;
    }
    if (!inActive) continue;

    let m = line.match(/^-+\s*(\.ai\/tasks\/\S+\.md)\s*$/);
    if (!m) m = line.match(/^(\.ai\/tasks\/\S+\.md)\s*$/);
    if (m) {
      active.push(path.join(projectRoot, m[1]));
    }
  }

  // de-dup preserve order
  const seen = new Set();
  const uniq = [];
  for (const p of active) {
    if (!p) continue;
    const k = String(p);
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(p);
  }
  return uniq;
}

function extractAcceptanceBullets(taskCardMd) {
  // Very lightweight section extraction: find "## Acceptance criteria" and collect "- " bullets until next "## "
  const lines = taskCardMd.split(/\r?\n/);
  let inAcc = false;
  const bullets = [];
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^##\s+Acceptance criteria\b/i.test(line)) {
      inAcc = true;
      continue;
    }
    if (inAcc && /^##\s+/.test(line)) {
      break;
    }
    if (!inAcc) continue;
    const m = line.trim().match(/^-+\s+(.*)$/);
    if (m && m[1] && !/^_?TODO_?$/i.test(m[1].trim())) {
      bullets.push(m[1].trim());
    }
  }
  return bullets;
}

module.exports = {
  parseActiveTaskPaths,
  extractAcceptanceBullets,
};

