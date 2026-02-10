# repo-memory-workflow

**Git 即 AI 记忆。** 用 `.ai/` 目录做编辑器无关、平台无关的项目上下文，告别对话上下文爆满、接手乱麻、进度失忆。

---

这是一个**开源**工作流模板，专门解决 AI 辅助开发里的几类痛点：

- **跨 AI 编辑器** — 不绑定 Cursor、TRAE、ChatGPT、VSCode 任一产品。`.ai/` 里是纯 Markdown，任意能读文件的 AI 都能用。
- **多人协同 / 同事接手** — 任务、决策、日志都写在 `.ai/` 里，随 Git 提交。同事 `pull` 后生成上下文包就能续写。
- **对话上下文爆满** — 更新任务卡、生成 `CONTEXT_PACK.md`，切到新 chat 贴进去，就能接着干。
- **半路进项目** — 代码写了一半但没文档？Task 000 会扫描项目、补齐日志与任务，再拆分剩余工作继续推进。

**一套 `.ai/` 结构 + 一条 `init` 命令 + 编辑器规则配置**，让 AI 辅助开发可追溯、可交接、可恢复。

---

## 核心能力

| 能力 | 说明 |
|------|------|
| **拆需求** | Planning 模式拆成 3~10 个任务卡，写入 `.ai/TASK.md` |
| **继续开发** | 对话满了 / 切窗口 → 生成 `CONTEXT_PACK.md`，新 chat 续写 |
| **半路接手** | Task 000 扫描代码、补齐日志/决策，拆出剩余任务 |
| **版本化测试** | 绑定权威需求快照 → 生成测试用例 / 执行 / 导出 Excel·Word |

- **Git-native**：`.ai/` 跟着 repo 走，版本可控、可协作
- **Editor-agnostic**：Cursor、TRAE、VSCode Codex、ChatGPT、任意 AI 都能用
- **一条命令**：`repo-memory-workflow init` 在任意项目根目录初始化

---

## 一、安装

```bash
npm i -g repo-memory-workflow
```

macOS 若遇 `EACCES`：`sudo npm i -g repo-memory-workflow`

---

## 二、配置（两步搞定）

### Step 1：初始化 `.ai/`

在目标项目根目录执行：

```bash
repo-memory-workflow init
```

会生成：

```text
.ai/
  START.md          # 工作流总览
  TASK.md           # 任务看板
  CONTEXT.md        # 项目上下文（技术栈、约定等）
  DECISIONS.md      # 重要决策
  LOG.md            # 进度日志
  TASKING_GUIDE.md  # 任务拆分指南
  RESOURCE_GUIDE.md # 资源/权威输入指南
  QUICK_PROMPTS.md  # 快捷 prompt 模板（无规则/Skill 时用）
  make_context.py   # 上下文包生成器
  resources/        # 权威资源索引与快照
  tasks/            # 任务卡
  tests/            # 测试资产
```

> 可选：`repo-memory-workflow test init` 补齐 `.ai/tests/`（旧项目升级用）

### Step 2：配置编辑器规则

配好后，AI 在**每次对话中自动加载**工作流规则，你只需说短指令即可，**不再需要粘贴长 prompt**。

根据你使用的编辑器，选择对应方式（任选一个即可）：

#### Cursor

**方式 A：Cursor Rule（推荐，最简单）**

打开 Cursor 设置 → **Rules, Skills, Subagents** → **Rules** → 点 **+ New** → 粘贴 `integrations/cursor/repo-memory-workflow/rule.md` 的内容 → 设为 **Always** 生效。

或用命令行：

```bash
mkdir -p .cursor/rules
cp $(npm root -g)/repo-memory-workflow/integrations/cursor/repo-memory-workflow/rule.md .cursor/rules/repo-memory-workflow.md
```

**方式 B：Cursor Skill**

```bash
# 项目级
mkdir -p .cursor/skills
cp -r $(npm root -g)/repo-memory-workflow/integrations/cursor/repo-memory-workflow .cursor/skills/

# 或个人级（所有项目生效）
mkdir -p ~/.cursor/skills
cp -r $(npm root -g)/repo-memory-workflow/integrations/cursor/repo-memory-workflow ~/.cursor/skills/
```

#### TRAE

打开 TRAE 设置 → **规则和技能** → **项目规则** → 点「创建 project_rules.md」→ 粘贴 `integrations/trae/repo-memory-workflow/project_rules.md` 的内容。

或用命令行：

```bash
mkdir -p .trae/rules
cp $(npm root -g)/repo-memory-workflow/integrations/trae/repo-memory-workflow/project_rules.md .trae/rules/project_rules.md
```

#### VSCode + Codex

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -r $(npm root -g)/repo-memory-workflow/integrations/codex/repo-memory-workflow "${CODEX_HOME:-$HOME/.codex}/skills/"
```

重启 Codex 生效。

#### 其他编辑器（Copilot Chat、ChatGPT 等）

打开 `.ai/QUICK_PROMPTS.md`，复制对应场景的 prompt 粘贴给 AI 即可。

---

## 三、日常使用

**配好编辑器规则后，你只需说短指令，AI 会自动读取 `.ai/` 文件并遵循工作流。**

| 你说 | AI 会做什么 |
|------|------------|
| **「拆一下」** + 需求描述 | 读取 CONTEXT + TASKING_GUIDE，拆成 3~10 个任务卡，更新 TASK.md。不写代码。 |
| **「继续」** | 读取 CONTEXT + TASK + 当前任务卡，执行 Next actions。每步更新日志。 |
| **「生成上下文包」** | 运行 `python3 .ai/make_context.py`，生成 CONTEXT_PACK.md 用于新 chat 续写。 |
| **「补档」** | 扫描项目现状，补齐日志和任务卡，拆出剩余工作。不写代码。 |
| **「生成测试用例」** | 绑定 resource 版本，生成可审核的测试用例。 |
| **「跑测试」** | 执行配置的 smoke/命令，写入执行记录和报告。 |
| **「导出测试报告」** | 导出 Excel/Word 到 `.ai/tests/exports/`。 |

---

## 四、完整示例：给博客加评论功能

下面用一个具体案例，演示从配置到完成的完整流程。

> **需求**：给博客加评论功能——用户发评论、看列表、管理员审核。技术栈 Node + React。

### 1. 配置（只做一次）

```bash
# 安装工具
npm i -g repo-memory-workflow

# 在博客项目根目录初始化
cd my-blog
repo-memory-workflow init

# 配置编辑器规则（以 Cursor Rule 为例）
mkdir -p .cursor/rules
cp $(npm root -g)/repo-memory-workflow/integrations/cursor/repo-memory-workflow/rule.md .cursor/rules/repo-memory-workflow.md
```

### 2. 填写项目背景

编辑 `.ai/CONTEXT.md`，写几行关键信息：

```text
## 技术栈
- 后端：Node.js + Express + PostgreSQL
- 前端：React + Vite
- 部署：Docker + Nginx
```

### 3. 拆需求（Planning）

在 Cursor / TRAE 对话里说：

> **拆一下**，给博客加评论功能：用户发评论、看评论列表，管理员可审核。

AI 会自动读取 `.ai/CONTEXT.md` 和 `.ai/TASKING_GUIDE.md`，然后：
- 创建 `001_add_comment_api.md`、`002_comment_ui.md` 等任务卡
- 更新 `.ai/TASK.md` 的 Active 列表
- **不写代码**

### 4. 开始开发（Implementation）

对 AI 说：

> **继续**

AI 会自动读取任务板，找到第一个 Active 任务，执行 Next actions，每步更新任务卡和日志。

### 5. 任务完成 → 下一个

一个任务做完后，AI 会把它移到 Done，下一个任务进 Active。你继续说「继续」即可。

### 6. 对话满了 → 切窗口

对 AI 说：

> **生成上下文包**

在新 chat 里说「继续」，AI 读取 `CONTEXT_PACK.md` 自动接上进度。

---

## 五、更多场景

### 场景一：全新需求，从零开始

**适用**：接到一个新需求，打算用 AI 一起做。

**步骤：**

1. `repo-memory-workflow init`
2. 编辑 `.ai/CONTEXT.md` 填项目背景
3. 对 AI 说「拆一下」+ 需求描述 → AI 拆任务卡（不写代码）
4. 对 AI 说「继续」→ AI 执行第一个任务
5. 每完成一个任务，AI 自动切到下一个，你继续说「继续」

> **未配编辑器规则时**，Step 3 需要手动粘贴 prompt（见 `.ai/QUICK_PROMPTS.md`）；**配好规则后**直接说短指令即可。

---

### 场景二：需求做了一半，才开始用这套流程（补档）

**适用**：代码已写了一部分，但没有 `.ai/` 流程，想补档后继续。

**步骤：**

1. `repo-memory-workflow init`
2. 运行 `python3 .ai/make_context.py` 生成上下文包
3. 对 AI 说「补档」→ AI 扫描项目、补齐日志、拆出剩余任务（不写代码）
4. 补档完成后，对 AI 说「继续」开始开发

---

### 场景三：对话/窗口满了，换编辑器或开新窗口

**适用**：对话太长 / 换编辑器 / 开新 chat。

**步骤：**

1. 在原 chat 里对 AI 说「生成上下文包」
2. AI 更新任务卡和日志，运行 `python3 .ai/make_context.py` 生成 `CONTEXT_PACK.md`
3. 在新 chat 里说「继续」→ AI 自动读取上下文包，接上进度

---

### 场景四：大功能 / 三方对接

**适用**：对接三方支付、登录、短信等大功能，外部文档很长、易变。

**核心做法**：把权威文档落盘到 `.ai/resources/`，任务卡只引用路径。

1. 把外部资料按版本存到 `.ai/resources/vendor_docs/<key>/versions/<version>/`
2. 在 `.ai/resources/_index.md` 登记条目
3. 对 AI 说「拆一下」+ 需求 → AI 自动引用 resource 路径创建任务

---

### 场景五：需求变更 / 规则升级

**适用**：需求反复改，担心 AI 用了旧规则实现。

**核心做法**：每次变更生成新版本资源快照 + `change_summary.md`。

1. 新建版本目录 + 变更摘要
2. 更新 `_index.md`（新版本 active，旧版本 frozen）
3. 对 AI 说：基于变更摘要更新任务（先更新任务，不写代码）

---

### 场景六：版本化测试

**适用**：按版本迭代，需要可审核的测试用例和报告。

```bash
# 生成测试用例
repo-memory-workflow test cases --resource ".ai/resources/prd/foo/versions/v1/01_overview.md"

# 执行测试
repo-memory-workflow test run --resource ".ai/resources/prd/foo/versions/v1/01_overview.md"

# 导出 Excel/Word
repo-memory-workflow test export --resource ".ai/resources/prd/foo/versions/v1/01_overview.md"
```

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

An **open-source** workflow template for AI-assisted development:

- **Cross-AI editor** — Not locked to Cursor, TRAE, ChatGPT, or VSCode. `.ai/` is plain Markdown; any AI that can read files can use it.
- **Team handoff** — Tasks, decisions, and logs live in `.ai/`, committed with Git. Teammates pull, generate a context pack, and continue.
- **Chat overflow** — Update task card, generate `CONTEXT_PACK.md`, paste into new chat, keep going.
- **Join mid-project** — Task 000 scans the repo, backfills logs/tasks, splits remaining work.

**One `.ai/` structure + one `init` command + editor rules config** — traceable, handoff-ready, recoverable.

---

### Capabilities

| Capability | Description |
|-----------|------------|
| **Split requirement** | Planning mode: 3~10 task cards → `.ai/TASK.md` |
| **Continue work** | Chat full → `CONTEXT_PACK.md` → paste in new chat |
| **Join mid-project** | Task 000: scan repo, backfill, split remaining tasks |
| **Versioned testing** | Bind resource snapshot → generate cases / run / export Excel·Word |

- **Git-native** — `.ai/` lives in repo, versioned, shareable
- **Editor-agnostic** — Cursor, TRAE, VSCode Codex, ChatGPT, any AI
- **One command** — `repo-memory-workflow init`

---

### 1. Install

```bash
npm i -g repo-memory-workflow
```

macOS permission issues: `sudo npm i -g repo-memory-workflow`

---

### 2. Configure (two steps)

#### Step 1: Initialize `.ai/`

In your project root:

```bash
repo-memory-workflow init
```

Creates `.ai/` with `START.md`, `TASK.md`, `CONTEXT.md`, `DECISIONS.md`, `LOG.md`, `TASKING_GUIDE.md`, `RESOURCE_GUIDE.md`, `make_context.py`, `resources/`, `tasks/`, `tests/`.

> Optional: `repo-memory-workflow test init` to add `.ai/tests/` for older projects.

#### Step 2: Configure editor rules

After configuration, AI **automatically loads** the workflow rules in every conversation. You only need short commands — **no more pasting long prompts**.

Pick your editor:

**Cursor**

*Option A: Cursor Rule (recommended, simplest)* — Open Cursor Settings → **Rules, Skills, Subagents** → **Rules** → click **+ New** → paste the content of `integrations/cursor/repo-memory-workflow/rule.md` → set to **Always**.

Or via CLI:

```bash
mkdir -p .cursor/rules
cp $(npm root -g)/repo-memory-workflow/integrations/cursor/repo-memory-workflow/rule.md .cursor/rules/repo-memory-workflow.md
```

*Option B: Cursor Skill* —

```bash
mkdir -p .cursor/skills  # or ~/.cursor/skills for global
cp -r $(npm root -g)/repo-memory-workflow/integrations/cursor/repo-memory-workflow .cursor/skills/
```

**TRAE**

Open TRAE Settings → **Rules & Skills** → **Project Rules** → create `project_rules.md` → paste the content of `integrations/trae/repo-memory-workflow/project_rules.md`.

Or via CLI:

```bash
mkdir -p .trae/rules
cp $(npm root -g)/repo-memory-workflow/integrations/trae/repo-memory-workflow/project_rules.md .trae/rules/project_rules.md
```

**VSCode + Codex**

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -r $(npm root -g)/repo-memory-workflow/integrations/codex/repo-memory-workflow "${CODEX_HOME:-$HOME/.codex}/skills/"
```

Restart Codex to activate.

**Other editors** (Copilot Chat, ChatGPT, etc.)

Open `.ai/QUICK_PROMPTS.md` and copy the prompt for your scenario.

---

### 3. Daily usage

**After configuring editor rules, just say short commands. AI automatically reads `.ai/` files and follows the workflow.**

| You say | AI does |
|---------|---------|
| **"拆一下"** + requirement | Read CONTEXT + TASKING_GUIDE, split into 3~10 task cards, update TASK.md. No code. |
| **"继续"** / "continue" | Read CONTEXT + TASK + active task card, execute Next actions. Update logs after each step. |
| **"生成上下文包"** / "context pack" | Run `python3 .ai/make_context.py`, generate CONTEXT_PACK.md for new chat. |
| **"补档"** / "retrofit" | Scan project, backfill logs and tasks, split remaining work. No code. |
| **"生成测试用例"** / "test cases" | Bind resource version, generate reviewable test cases. |
| **"跑测试"** / "run tests" | Run configured smoke/commands, write run records and report. |
| **"导出测试报告"** / "export report" | Export Excel/Word to `.ai/tests/exports/`. |

---

### 4. Full example: add comment feature to a blog

> **Requirement:** Add comments to a blog — users post comments, view list, admin moderates. Tech: Node + React.

#### Setup (once)

```bash
npm i -g repo-memory-workflow
cd my-blog
repo-memory-workflow init

# Configure editor rules (Cursor Rule example)
mkdir -p .cursor/rules
cp $(npm root -g)/repo-memory-workflow/integrations/cursor/repo-memory-workflow/rule.md .cursor/rules/repo-memory-workflow.md
```

Edit `.ai/CONTEXT.md` with your tech stack:

```text
## Tech stack
- Backend: Node.js + Express + PostgreSQL
- Frontend: React + Vite
- Deploy: Docker + Nginx
```

#### Split requirement (Planning)

In Cursor / TRAE chat, say:

> **拆一下**, add comment feature: users post comments, view list, admin can moderate.

AI automatically reads `.ai/CONTEXT.md` + `.ai/TASKING_GUIDE.md`, creates task cards like `001_add_comment_api.md`, `002_comment_ui.md`, updates `.ai/TASK.md`. **No code yet.**

#### Develop (Implementation)

Say:

> **继续** (or "continue")

AI reads the task board, finds the first Active task, executes Next actions, updates the task card and logs after each step.

#### Task done → next

When a task is complete, AI moves it to Done, activates the next one. Just keep saying "继续".

#### Chat full → switch window

Say:

> **生成上下文包** (or "context pack")

In the new chat, say "继续" — AI reads `CONTEXT_PACK.md` and picks up where you left off.

---

### 5. More scenarios

#### Scenario 1: New requirement from scratch

1. `repo-memory-workflow init`
2. Edit `.ai/CONTEXT.md` with project background
3. Say "拆一下" + requirement → AI creates task cards (no code)
4. Say "继续" → AI executes first task
5. Repeat "继续" for each subsequent task

> Without editor rules, Step 3 requires pasting a long prompt from `.ai/QUICK_PROMPTS.md`. With rules configured, just say short commands.

#### Scenario 2: Join mid-project (retrofit)

1. `repo-memory-workflow init`
2. Run `python3 .ai/make_context.py`
3. Say "补档" → AI scans project, backfills logs, splits remaining tasks (no code)
4. Say "继续" to start development

#### Scenario 3: Chat full, switch window/editor

1. Say "生成上下文包" in current chat
2. AI updates task card + logs, generates `CONTEXT_PACK.md`
3. In new chat, say "继续" → AI resumes from where you left off

#### Scenario 4: Large integrations / 3rd-party docs

Store authoritative docs under `.ai/resources/` with versioned snapshots. Task cards reference resource paths instead of pasting large text. Say "拆一下" + requirement — AI auto-references active resources.

#### Scenario 5: Requirement changes

Create a new version snapshot + `change_summary.md`. Update `_index.md` (new = active, old = frozen). Ask AI to update tasks based on changes first, then code.

#### Scenario 6: Versioned testing

```bash
# Generate test cases
repo-memory-workflow test cases --resource ".ai/resources/prd/foo/versions/v1/01_overview.md"

# Run tests
repo-memory-workflow test run --resource ".ai/resources/prd/foo/versions/v1/01_overview.md"

# Export Excel/Word
repo-memory-workflow test export --resource ".ai/resources/prd/foo/versions/v1/01_overview.md"
```

---

### Design principles

- **Do not guess** — If context is missing, write to Open questions, don't invent
- **Always log** — After each step, update task card + append `LOG.md`, and `DECISIONS.md` when needed
- **Small increments** — Keep changes minimal and traceable
