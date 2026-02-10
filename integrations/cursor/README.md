# Cursor 集成（可选）

使用 Cursor 时，安装 Rule 或 Skill 后可直接说「拆一下」「继续」「生成上下文包」，无需每次粘贴长 prompt。

两种方式**任选其一**即可，效果相同：

## 方式 A：Cursor Rule（推荐，更简单）

在 Cursor 设置 → Rules, Skills, Subagents → Rules 中点 **+ New**，将 `integrations/cursor/repo-memory-workflow/rule.md` 的内容粘贴进去，设为 **Always** 生效即可。

或者用命令行：

```bash
# 在已运行 repo-memory-workflow init 的项目根目录执行
mkdir -p .cursor/rules
cp <path-to-repo-memory-workflow>/integrations/cursor/repo-memory-workflow/rule.md .cursor/rules/repo-memory-workflow.md
```

## 方式 B：Cursor Skill

**项目级**（仅当前项目生效）：

```bash
mkdir -p .cursor/skills
cp -r <path-to-repo-memory-workflow>/integrations/cursor/repo-memory-workflow .cursor/skills/
```

**个人级**（所有项目生效）：

```bash
mkdir -p ~/.cursor/skills
cp -r <path-to-repo-memory-workflow>/integrations/cursor/repo-memory-workflow ~/.cursor/skills/
```

`<path-to-repo-memory-workflow>` 替换为本仓库路径；若已通过 `npm i -g repo-memory-workflow` 安装，可用 `$(npm root -g)/repo-memory-workflow` 或 `node_modules/repo-memory-workflow`（项目内安装时）。
