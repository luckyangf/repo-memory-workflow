# Codex Skill（VSCode / Codex 可选）

在 VSCode 中使用 Codex 时，安装此 Skill 后可直接说「拆一下」「继续」「生成上下文包」，无需每次粘贴长 prompt。

## 安装

```bash
# 复制到 Codex skills 目录（默认 ~/.codex/skills）
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -r <path-to-repo-memory-workflow>/integrations/codex/repo-memory-workflow "${CODEX_HOME:-$HOME/.codex}/skills/"
```

安装后**重启 Codex** 使 Skill 生效。

`<path-to-repo-memory-workflow>` 替换为本仓库路径；若已通过 `npm i -g repo-memory-workflow` 安装，可用 `$(npm root -g)/repo-memory-workflow`。
