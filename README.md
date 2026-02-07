# repo-memory-workflow

**Git 即 AI 记忆。** 用 `.ai/` 目录做编辑器无关、平台无关的项目上下文，告别对话上下文爆满、接手乱麻、进度失忆。

---

这是一个**开源**工作流模板，专门解决 AI 辅助开发里的几类痛点：

- **跨 AI 编辑器** — 不绑定 Cursor、ChatGPT、VSCode 任一产品。`.ai/` 里是纯 Markdown，任意能读文件的 AI 都能用。今天用 Cursor，明天换 ChatGPT，后天换别的，项目上下文都在。
- **多人协同 / 同事接手** — 任务、决策、日志都写在 `.ai/` 里，随 Git 提交。同事 `pull` 后运行 `make_context.py` 生成上下文包，贴进新 chat 就能续写，无需口头交接、不丢进度。
- **跨同一 AI 编辑器窗口** — 在 Cursor 里对话太长、上下文爆满时，不用从头讲。更新任务卡、生成 `CONTEXT_PACK.md`，切到新 chat 贴进去，就能接着干。
- **半路进项目** — 代码写了一半但没文档？Task 000 会扫描项目、补齐日志与任务，再拆分剩余工作继续推进。

**一套 `.ai/` 结构 + 一条 `init` 命令 + 一个 `make_context.py`**，让 AI 辅助开发可追溯、可交接、可恢复。

---

## 核心能力

- **新需求** — 需求不清、任务散乱 → Planning 模式拆成 3~10 个任务卡，写入 `.ai/TASK.md`
- **继续开发** — 对话上下文满了、切窗口失忆 → `make_context.py` 生成 `CONTEXT_PACK.md`，贴进新 chat 即可续写
- **半路接手** — 项目做了一半、没文档、不知道从哪续 → Task 000 扫描代码、补齐日志/决策，拆出剩余任务

- **Git-native**：`.ai/` 跟着 repo 走，版本可控、可协作
- **Editor-agnostic**：Cursor、VSCode、ChatGPT、任意能读文件的 AI 都能用
- **一条命令**：`repo-memory-workflow init` 在任意项目根目录初始化模板

---

## 安装

**npm 全局安装（推荐）：**

```bash
npm i -g repo-memory-workflow
```

macOS 若遇 `EACCES` 权限问题：

```bash
sudo npm i -g repo-memory-workflow
```

**本地开发安装：**

```bash
git clone <this-repo>
cd repo-memory-workflow
npm link
```

---

## 快速开始

### 1. 初始化

在目标项目根目录执行：

```bash
repo-memory-workflow init
```

会生成：

```text
.ai/
  START.md          # 工作流总览（必读）
  TASK.md           # 任务看板
  CONTEXT.md        # 项目上下文
  DECISIONS.md      # 重要决策
  LOG.md            # 进度日志
  TASKING_GUIDE.md  # 任务拆分指南
  QUICK_PROMPTS.md  # 快捷 prompt 模板（无 Skill 时用）
  make_context.py   # 上下文包生成器
  tasks/            # 任务卡
```

### 2. 编辑器集成（可选）

安装 Skill 或使用快捷 Prompt 后，可直接说「拆一下」「继续」等短指令，无需每次粘贴长 prompt。

#### Cursor Skill

**重要：** Skill 不会随 `init` 自动生成，需要**手动复制**一次。复制后重启 Cursor 或新开 chat 即可生效。

**安装：** 在已 `init` 的项目根目录或本机执行：

```bash
# 项目级（仅当前项目）
mkdir -p .cursor/skills
cp -r $(npm root -g)/repo-memory-workflow/integrations/cursor/repo-memory-workflow .cursor/skills/

# 或个人级（所有项目生效）
mkdir -p ~/.cursor/skills
cp -r $(npm root -g)/repo-memory-workflow/integrations/cursor/repo-memory-workflow ~/.cursor/skills/
```

若本地开发（`git clone` + `npm link`），`<path>` 替换为本仓库路径。

**使用：** 在 Cursor 中打开 AI 对话，直接说「拆一下」+ 需求、「继续」、「生成上下文包」即可，无需粘贴长 prompt。

#### VSCode + Codex Skill

**重要：** 同样需手动复制，执行后**重启 Codex** 生效。

**安装：**

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -r $(npm root -g)/repo-memory-workflow/integrations/codex/repo-memory-workflow "${CODEX_HOME:-$HOME/.codex}/skills/"
```

**使用：** 重启 Codex 后，在 VSCode 的 Codex 对话里说「拆一下」「继续」「生成上下文包」即可。

#### 其他编辑器（Copilot Chat、ChatGPT 等）

**使用：** `init` 后项目内会生成 `.ai/QUICK_PROMPTS.md`。需要时打开该文件，复制对应场景的 prompt（拆需求、继续执行、切窗口、Retrofit），粘贴给 AI 即可。

**短指令与操作对照：**

- **拆需求** — 对 AI 说「拆一下」+ 你的需求描述
- **继续执行任务** — 对 AI 说「继续」
- **切窗口前生成上下文包** — 对 AI 说「生成上下文包」或「对话快满了，帮我生成上下文包」

### 3. 三种场景详解

下面三种场景都有完整步骤和案例，照着做即可。

---

## 场景一：全新需求，从零开始

**适用**：接到一个新需求，项目已有或新建，打算用 AI 一起做。

**案例**：给博客项目加「评论功能」——支持发评论、展示列表、简单的审核。

**步骤：**

**Step 1** 在项目根目录初始化（若尚未执行）：

```bash
repo-memory-workflow init
```

**Step 2** 编辑 `.ai/CONTEXT.md`，填项目背景（技术栈、目录结构、关键约定）。若项目简单，可只写几行。

**Step 3** 进入 Planning 模式，让 AI 拆需求（**先不写代码**）。在 Cursor / ChatGPT 里对 AI 说：

```text
请先读取 .ai/CONTEXT.md 和 .ai/TASKING_GUIDE.md。
把下面这个需求拆成 3~10 个任务卡，放到 .ai/tasks/ 下，并更新 .ai/TASK.md。
暂时不要实现代码。

【需求】给博客加评论功能：用户可发评论、看评论列表，管理员可审核。技术栈：Node + React。
```

AI 会创建如 `001_add_comment_api.md`、`002_comment_ui.md` 等任务卡，并更新 `.ai/TASK.md` 的 Active 列表。

**Step 4** 进入 Implementation 模式，开始执行第一个任务。对 AI 说：

```text
请读取 .ai/CONTEXT.md、.ai/TASK.md，以及 Primary active task（任务板里 Active 第一个）。
只执行该任务里的 Next actions。
每完成一步，更新任务卡和 .ai/LOG.md。
```

**Step 5** 每完成一个任务：把该任务从 Active 挪到 Done，把下一个任务挪进 Active，重复 Step 4。

---

## 场景二：需求做了一半，才开始用这套流程

**适用**：代码已经写了一部分，但没走 `.ai/` 流程，没有任务卡、没有 LOG，想「补档」后继续。

**案例**：评论功能——后端 API 和数据库已经写好，前端还没做，之前没用过 `.ai/`。

**步骤：**

**Step 1** 在项目根目录初始化：

```bash
repo-memory-workflow init
```

**Step 2** 编辑 `.ai/TASK.md`，把 Task 000 设为唯一的 Active 任务。模板默认已是如此；若不是，把 `000_retrofit_existing_work.md` 放入 Active，其它清空。

**Step 3** 生成上下文包：

```bash
python3 .ai/make_context.py
```

会生成 `.ai/CONTEXT_PACK.md`，包含当前 Git 状态、diff、CONTEXT、TASK 等。

**Step 4** 让 AI 执行 Task 000（**只做补档，不写新代码**）。对 AI 说：

```text
进入 retrofit 模式。
请读取 .ai/CONTEXT_PACK.md。
只执行 Task 000：
1. 快速扫描项目，总结当前已完成什么（5~10 条）
2. 把总结追加到 .ai/LOG.md
3. 把剩余工作拆成 3~10 个任务卡，放到 .ai/tasks/
4. 更新 .ai/TASK.md（Active / Queued / Done）
暂时不要实现剩余任务。
```

**Step 5** Task 000 完成后，把它移到 Done，把第一个「剩余任务」设为 Active，按场景一 Step 4 的方式继续开发。

---

## 场景三：对话/窗口满了，换编辑器或开新窗口

**适用**：在 Cursor 里做了很久，对话太长；或要换到 ChatGPT、VSCode；或本编辑器里新开一个 chat 窗口。

**案例**：在 Cursor 里开发评论功能，对话已经很长，想开一个新的 chat 继续。

**步骤：**

**切窗口之前（在原 chat 里完成）：**

**Step 1** 更新当前任务卡：把「Current state」写成已完成的内容，把「Next actions」改成剩余步骤（≤7 条）。

**Step 2** 在 `.ai/LOG.md` 末尾追加一条，写：做了什么、改了哪些文件、下一步是什么。

**Step 3** 生成上下文包：

```bash
python3 .ai/make_context.py
```

会生成 `.ai/CONTEXT_PACK.md`，包含 Git 状态、diff、最近提交、CONTEXT、TASK、当前任务内容。

**在新窗口 / 新编辑器里：**

**Step 4** 打开或复制 `.ai/CONTEXT_PACK.md` 的内容。若新环境能直接读文件，就让 AI 读；否则把内容粘贴进 prompt。

**Step 5** 对 AI 说：

```text
请先读取 .ai/CONTEXT_PACK.md（或下方粘贴的内容）。
从 Primary active task 的 Next actions 第 1 步继续执行。
每完成一步，更新任务卡和 .ai/LOG.md。
```

之后按任务卡的 Next actions 继续开发即可，无需重讲背景。

---

## 设计原则

- **不猜**：缺上下文就写到 Open questions，不凭空编
- **必记**：每步完成后更新任务卡 + 追加 `LOG.md`，必要时更新 `DECISIONS.md`
- **小步迭代**：改动尽量小、可追溯

---

## License

MIT

---

## English

**Git as AI memory.** Use a `.ai/` folder as your editor-agnostic, platform-agnostic project context. No more chat overflow, handoff chaos, or lost progress.

---

This is an **open-source** workflow template that addresses common pain points in AI-assisted development:

- **Cross-AI editor** — Not locked to Cursor, ChatGPT, or VSCode. `.ai/` is plain Markdown; any AI that can read files can use it. Use Cursor today, switch to ChatGPT tomorrow, try another tool later—project context stays the same.
- **Multi-user / team handoff** — Tasks, decisions, and logs live in `.ai/`, committed with Git. A teammate pulls, runs `make_context.py` to generate a context pack, pastes it into a new chat, and continues—no verbal handoff, no lost progress.
- **Cross-window in the same editor** — When chat context is full in Cursor, you don't start over. Update the task card, generate `CONTEXT_PACK.md`, switch to a new chat, paste it in, and keep going.
- **Join mid-project** — Code is half done with no docs? Task 000 scans the repo, backfills logs and tasks, then splits remaining work so you can continue.

**One `.ai/` structure + one `init` command + one `make_context.py`**—makes AI-assisted development traceable, handoff-ready, and recoverable.

### Capabilities

- **New requirement** — Vague scope, scattered tasks → Planning mode: split into 3~10 task cards, write to `.ai/TASK.md`
- **Continue work** — Chat context full, lose memory on new window → `make_context.py` → `CONTEXT_PACK.md` → paste into new chat
- **Join mid-project** — Half-done code, no docs → Task 000: scan repo, backfill LOG/DECISIONS, split remaining tasks

- **Git-native** — `.ai/` lives in repo, versioned, shareable
- **Editor-agnostic** — Cursor, VSCode, ChatGPT, any AI that reads files
- **One command** — `repo-memory-workflow init` to bootstrap any project

### Install

**npm global install (recommended):**

```bash
npm i -g repo-memory-workflow
```

If you see `EACCES` permission errors on macOS:

```bash
sudo npm i -g repo-memory-workflow
```

**Local dev install:**

```bash
git clone <this-repo>
cd repo-memory-workflow
npm link
```

### Quick Start

**1. Initialize** — In your project root:

```bash
repo-memory-workflow init
```

This creates `.ai/` with `START.md`, `TASK.md`, `CONTEXT.md`, `DECISIONS.md`, `LOG.md`, `TASKING_GUIDE.md`, `make_context.py`, and `tasks/`.

**2. Editor integrations (optional)** — Install a Skill for short commands.

**Cursor Skill — Install** (Skill does NOT auto-install with init; copy manually once, then restart Cursor):

```bash
mkdir -p .cursor/skills  # or ~/.cursor/skills for global
cp -r $(npm root -g)/repo-memory-workflow/integrations/cursor/repo-memory-workflow .cursor/skills/
```

**Usage:** In Cursor chat, say "拆一下" + requirement, "继续", or "生成上下文包".

**VSCode + Codex Skill — Install** (copy manually, then restart Codex):

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -r $(npm root -g)/repo-memory-workflow/integrations/codex/repo-memory-workflow "${CODEX_HOME:-$HOME/.codex}/skills/"
```

**Usage:** In Codex chat, say "拆一下", "继续", or "生成上下文包".

**Other editors** (Copilot Chat, ChatGPT): Copy prompts from `.ai/QUICK_PROMPTS.md`.

**3. Three scenarios** — See below for step-by-step walkthroughs with examples.

---

### Scenario 1: New requirement, from scratch

**When to use:** You have a new requirement, project exists or is new, and you want AI to help.

**Example:** Add a "comment feature" to a blog—post comments, list comments, simple moderation.

**Steps:**

**Step 1** Initialize in project root (if not done yet):

```bash
repo-memory-workflow init
```

**Step 2** Edit `.ai/CONTEXT.md` with project background (tech stack, folder structure, key conventions). A few lines are fine for simple projects.

**Step 3** Planning mode—ask AI to split the requirement (**no code yet**). In Cursor / ChatGPT, say:

```text
Please read .ai/CONTEXT.md and .ai/TASKING_GUIDE.md first.
Split the following requirement into 3~10 task cards under .ai/tasks/, and update .ai/TASK.md.
Do NOT implement code yet.

[Requirement] Add comment feature to the blog: users can post comments, view comment list, admin can moderate. Tech stack: Node + React.
```

AI will create task cards like `001_add_comment_api.md`, `002_comment_ui.md`, and update `.ai/TASK.md` Active list.

**Step 4** Implementation mode—execute the first task. Say:

```text
Please read .ai/CONTEXT.md, .ai/TASK.md, and the Primary active task (first in Active on the task board).
Execute ONLY the Next actions in that task.
After each step, update the task card and .ai/LOG.md.
```

**Step 5** When a task is done: move it from Active to Done, move the next task into Active, repeat Step 4.

---

### Scenario 2: Work is half done, start using this workflow now

**When to use:** Code is already partially written, but you never used `.ai/`—no task cards, no LOG. You want to backfill and continue.

**Example:** Comment feature—backend API and DB are done, frontend is not. Never used `.ai/` before.

**Steps:**

**Step 1** Initialize in project root:

```bash
repo-memory-workflow init
```

**Step 2** Edit `.ai/TASK.md` so Task 000 is the only Active task. The template default already does this; if not, put `000_retrofit_existing_work.md` in Active and clear the rest.

**Step 3** Generate context pack:

```bash
python3 .ai/make_context.py
```

This produces `.ai/CONTEXT_PACK.md` with current Git status, diff, CONTEXT, TASK, etc.

**Step 4** Ask AI to run Task 000 (**backfill only, no new code**). Say:

```text
Enter retrofit mode.
Please read .ai/CONTEXT_PACK.md.
Execute ONLY Task 000:
1. Quick scan of the repo, summarize what's already done (5~10 bullets)
2. Append the summary to .ai/LOG.md
3. Split remaining work into 3~10 task cards under .ai/tasks/
4. Update .ai/TASK.md (Active / Queued / Done)
Do NOT implement remaining tasks yet.
```

**Step 5** When Task 000 is done, move it to Done, set the first "remaining task" as Active, and continue as in Scenario 1 Step 4.

---

### Scenario 3: Chat/window full, switch editor or open new window

**When to use:** You've been working in Cursor for a long time, chat is too long; or you want to switch to ChatGPT, VSCode; or open a new chat window in the same editor.

**Example:** Developing comment feature in Cursor, chat is very long, want to open a new chat to continue.

**Steps:**

**Before switching (in the original chat):**

**Step 1** Update the current task card: write "Current state" with what's done, set "Next actions" to remaining steps (≤7 items).

**Step 2** Append one entry to `.ai/LOG.md`: what was done, which files changed, what's next.

**Step 3** Generate context pack:

```bash
python3 .ai/make_context.py
```

This produces `.ai/CONTEXT_PACK.md` with Git status, diff, recent commits, CONTEXT, TASK, current task content.

**In the new window / new editor:**

**Step 4** Open or copy the contents of `.ai/CONTEXT_PACK.md`. If the new environment can read files directly, let AI read it; otherwise paste the content into the prompt.

**Step 5** Say:

```text
Please read .ai/CONTEXT_PACK.md (or the content pasted below) first.
Continue from the first step of Primary active task's Next actions.
After each step, update the task card and .ai/LOG.md.
```

Then continue development following the task card's Next actions—no need to re-explain context.

---

### Design principles

- **Do not guess** — If context is missing, write to Open questions, don't invent
- **Always log** — After each step, update the task card + append `LOG.md`, and `DECISIONS.md` when needed
- **Small increments** — Keep changes minimal and traceable
