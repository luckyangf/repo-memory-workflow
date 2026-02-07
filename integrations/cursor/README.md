# Cursor Skill（可选）

使用 Cursor 时，安装此 Skill 后可直接说「拆一下」「继续」「生成上下文包」，无需每次粘贴长 prompt。

## 安装

**方式一：项目级**（仅当前项目生效）

```bash
# 在已运行 repo-memory-workflow init 的项目根目录执行
mkdir -p .cursor/skills
cp -r <path-to-repo-memory-workflow>/integrations/cursor/repo-memory-workflow .cursor/skills/
```

**方式二：个人级**（所有项目生效）

```bash
mkdir -p ~/.cursor/skills
cp -r <path-to-repo-memory-workflow>/integrations/cursor/repo-memory-workflow ~/.cursor/skills/
```

`<path-to-repo-memory-workflow>` 替换为本仓库路径；若已通过 `npm i -g repo-memory-workflow` 安装，可用 `$(npm root -g)/repo-memory-workflow` 或 `node_modules/repo-memory-workflow`（项目内安装时）。
