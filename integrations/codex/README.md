# Codex Skill（VSCode / Codex 可选）

在 VSCode 中使用 Codex 时，安装此 Skill 后可直接说「初始化这个项目」「拆一下」「继续」「自动续跑」「生成上下文包」，无需每次粘贴长 prompt。

## 安装

```bash
# 复制到 Codex skills 目录（默认 ~/.codex/skills）
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -r <path-to-repo-memory-workflow>/integrations/codex/repo-memory-workflow "${CODEX_HOME:-$HOME/.codex}/skills/"
```

安装后**重启 Codex** 使 Skill 生效。

`<path-to-repo-memory-workflow>` 替换为本仓库路径；若已通过 `npm i -g repo-memory-workflow` 安装，可用 `$(npm root -g)/repo-memory-workflow`。

## 推荐对话顺序

1. 让 Codex 确认目标项目目录，不要在用户根目录或 `repo-memory-workflow` 工具源码目录里初始化。
2. 在目标项目目录执行 `repo-memory-workflow init`。
3. 对 Codex 说「拆一下」，把需求拆进 `.ai/TASK.md`、`.ai/tasks/` 和 `.ai/NEXT.md`，这一步不写代码。
4. `.ai/NEXT.md` 有明确下一步后，再说「继续」单步执行，或说「自动续跑」运行：

```bash
repo-memory-workflow run --max-rounds 100 --timeout 3600
```

Windows PowerShell 也使用同一条 `repo-memory-workflow run` 命令；CLI 会自动调用项目里的 `run_loop.ps1`。
