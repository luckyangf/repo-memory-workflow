#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import subprocess
from datetime import datetime
from pathlib import Path

# This script is expected to live inside the `.ai/` directory.
AI_DIR = Path(__file__).resolve().parent
ROOT = AI_DIR.parent
TASK_FILE = AI_DIR / "TASK.md"
CONTEXT_FILE = AI_DIR / "CONTEXT.md"
DECISIONS_FILE = AI_DIR / "DECISIONS.md"
OUTPUT_FILE = AI_DIR / "CONTEXT_PACK.md"
RESOURCE_GUIDE_FILE = AI_DIR / "RESOURCE_GUIDE.md"
RESOURCES_INDEX_FILE = AI_DIR / "resources" / "_index.md"
TESTS_DIR = AI_DIR / "tests"
TEST_CONFIG_FILE = TESTS_DIR / "test_config.yaml"
TEST_PLAN_FILE = TESTS_DIR / "TEST_PLAN.md"
TEST_CASES_FILE = TESTS_DIR / "TEST_CASES.md"
TESTS_GUIDE_FILE = TESTS_DIR / "TESTING_GUIDE.md"
TESTS_README_FILE = TESTS_DIR / "README.md"
TEST_RELEASES_DIR = TESTS_DIR / "releases"
TEST_RUNS_DIR = TESTS_DIR / "runs"


def run(cmd):
    try:
        return subprocess.check_output(
            cmd, cwd=str(ROOT), stderr=subprocess.STDOUT, text=True
        ).strip()
    except Exception as e:
        return f"(command failed: {' '.join(cmd)}; {e})"


def read_text(p: Path, max_chars=20000):
    if not p:
        return "(missing path)"
    if not p.exists():
        return f"(missing: {p})"
    s = p.read_text(encoding="utf-8", errors="ignore")
    if len(s) > max_chars:
        return s[:max_chars] + "\n\n...(truncated)...\n"
    return s


def newest_dir(p: Path):
    try:
        if not p.exists():
            return None
        dirs = [x for x in p.iterdir() if x.is_dir()]
        if not dirs:
            return None
        dirs.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        return dirs[0]
    except Exception:
        return None


def newest_file(p: Path, glob_pattern: str):
    try:
        if not p.exists():
            return None
        files = list(p.glob(glob_pattern))
        files = [x for x in files if x.is_file()]
        if not files:
            return None
        files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        return files[0]
    except Exception:
        return None


# -----------------------------
# Active task parsing
# -----------------------------

def parse_active_task_path_legacy(task_md: str):
    """
    Legacy format:
    - Path: .ai/tasks/xxx.md
    """
    m = re.search(
        r"^-+\s*Path:\s*(\.ai\/tasks\/[^\s]+)\s*$",
        task_md,
        flags=re.MULTILINE,
    )
    if m:
        return ROOT / m.group(1)
    return None


def parse_task_board_active_paths(task_md: str):
    """
    New format:
    ## Task board
    - Active:
      - .ai/tasks/011_xxx.md
      - .ai/tasks/012_yyy.md
    - Queued:
      - ...
    """
    lines = task_md.splitlines()
    active_paths = []
    in_active = False

    for raw in lines:
        line = raw.strip()

        # enter Active block
        if re.match(r"^-+\s*Active:\s*$", line):
            in_active = True
            continue

        # leave Active block
        if in_active and re.match(r"^-+\s*(Queued|Blocked|Done):\s*$", line):
            in_active = False
            continue

        if not in_active:
            continue

        # match: "- .ai/tasks/xxx.md"
        m = re.match(r"^-+\s*(\.ai\/tasks\/\S+\.md)\s*$", line)
        if not m:
            # match: ".ai/tasks/xxx.md"
            m = re.match(r"^(\.ai\/tasks\/\S+\.md)\s*$", line)

        if m:
            active_paths.append(ROOT / m.group(1))

    # Deduplicate while preserving order
    uniq = []
    seen = set()
    for p in active_paths:
        s = str(p)
        if s not in seen:
            seen.add(s)
            uniq.append(p)

    return uniq


def parse_active_tasks(task_md: str):
    """
    Unified:
    - Prefer Task board Active list if present
    - Else fallback to legacy "- Path:" style
    """
    active_list = parse_task_board_active_paths(task_md)
    if active_list:
        return active_list

    legacy = parse_active_task_path_legacy(task_md)
    return [legacy] if legacy else []


# -----------------------------
# Main
# -----------------------------

def main():
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    task_md = read_text(TASK_FILE)

    active_task_paths = parse_active_tasks(task_md)
    primary_active_task = active_task_paths[0] if active_task_paths else None

    primary_active_task_md = (
        read_text(primary_active_task, max_chars=20000)
        if primary_active_task
        else "(No active task found in .ai/TASK.md)"
    )

    git_status = run(["git", "status", "--porcelain"])
    git_branch = run(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    git_diff_stat = run(["git", "diff", "--stat"])
    recent_commits = run(["git", "log", "-5", "--oneline"])

    content = []
    content.append(f"# CONTEXT PACK\n\nGenerated: {now}\n\n")

    content.append("## How to use\n")
    content.append("- In a NEW editor window/chat, ask the AI to read this file first.\n")
    content.append("- Then follow the Next actions in the Primary active task.\n")
    content.append("- After changes, AI must update .ai/TASK.md and relevant task card.\n\n")

    content.append("## Repo info\n")
    content.append(f"- Branch: {git_branch}\n\n")

    content.append("## Git status (porcelain)\n```text\n" + (git_status or "(clean)") + "\n```\n\n")
    content.append("## Git diff --stat\n```text\n" + (git_diff_stat or "(no diff)") + "\n```\n\n")
    content.append("## Recent commits\n```text\n" + (recent_commits or "(no commits)") + "\n```\n\n")

    content.append("## .ai/CONTEXT.md\n")
    content.append(read_text(CONTEXT_FILE, max_chars=12000) + "\n\n")

    content.append("## .ai/TASK.md\n")
    content.append(task_md + "\n\n")

    # Active tasks list
    content.append("## Active tasks\n")
    if active_task_paths:
        for p in active_task_paths:
            content.append(f"- {p.relative_to(ROOT)}\n")
    else:
        content.append("- (none)\n")
    content.append("\n")

    # Primary active task
    content.append("## Primary active task (first in Active list)\n")
    content.append(f"- Path: {primary_active_task.relative_to(ROOT) if primary_active_task else '(none)'}\n\n")
    content.append(primary_active_task_md + "\n\n")

    # Other active tasks
    if len(active_task_paths) > 1:
        content.append("## Other active tasks (truncated)\n")
        for p in active_task_paths[1:]:
            content.append(f"### {p.relative_to(ROOT)}\n")
            content.append(read_text(p, max_chars=8000) + "\n\n")

    content.append("## .ai/DECISIONS.md (latest)\n")
    content.append(read_text(DECISIONS_FILE, max_chars=12000) + "\n\n")

    # Resources (index only)
    content.append("## .ai/RESOURCE_GUIDE.md\n")
    content.append(read_text(RESOURCE_GUIDE_FILE, max_chars=12000) + "\n\n")

    content.append("## .ai/resources/_index.md\n")
    content.append(read_text(RESOURCES_INDEX_FILE, max_chars=12000) + "\n\n")

    # Tests (optional)
    content.append("## .ai/tests (testing assets)\n")
    if TESTS_DIR.exists():
        content.append(f"- Exists: {TESTS_DIR.relative_to(ROOT)}\n\n")
        content.append("### .ai/tests/README.md\n")
        content.append(read_text(TESTS_README_FILE, max_chars=8000) + "\n\n")
        content.append("### .ai/tests/TESTING_GUIDE.md\n")
        content.append(read_text(TESTS_GUIDE_FILE, max_chars=8000) + "\n\n")
        content.append("### .ai/tests/test_config.yaml\n")
        content.append("```yaml\n" + (read_text(TEST_CONFIG_FILE, max_chars=8000) or "(missing)") + "\n```\n\n")
        content.append("### .ai/tests/TEST_PLAN.md\n")
        content.append(read_text(TEST_PLAN_FILE, max_chars=8000) + "\n\n")
        content.append("### .ai/tests/TEST_CASES.md\n")
        content.append(read_text(TEST_CASES_FILE, max_chars=12000) + "\n\n")

        latest_run_dir = newest_dir(TEST_RUNS_DIR)
        if latest_run_dir:
            content.append("### Latest test run (run.md)\n")
            content.append(f"- Path: {latest_run_dir.relative_to(ROOT)}\n\n")
            content.append(read_text(latest_run_dir / "run.md", max_chars=12000) + "\n\n")
        else:
            content.append("### Latest test run\n- (none)\n\n")

        latest_report = newest_file(TEST_RELEASES_DIR, "**/report.md")
        if latest_report:
            content.append("### Latest release report.md\n")
            content.append(f"- Path: {latest_report.relative_to(ROOT)}\n\n")
            content.append(read_text(latest_report, max_chars=12000) + "\n\n")
        else:
            content.append("### Latest release report.md\n- (none)\n\n")
    else:
        content.append("- (missing) You can initialize via: repo-memory-workflow test init\n\n")

    OUTPUT_FILE.write_text("".join(content), encoding="utf-8")
    print(f"✅ Wrote: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
