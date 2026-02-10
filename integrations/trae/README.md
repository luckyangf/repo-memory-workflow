# TRAE 项目规则（可选）

使用 TRAE 时，安装此项目规则后可直接说「拆一下」「继续」「生成上下文包」，无需每次粘贴长 prompt。

## 安装

**方式一：项目级**（仅当前项目生效，推荐）

```bash
# 在已运行 repo-memory-workflow init 的项目根目录执行
mkdir -p .trae/rules
cp <path-to-repo-memory-workflow>/integrations/trae/repo-memory-workflow/project_rules.md .trae/rules/project_rules.md
```

**方式二：手动粘贴**

1. 在 TRAE 设置中打开「规则和技能」
2. 点击「项目规则」下的「创建 project_rules.md」
3. 将 `integrations/trae/repo-memory-workflow/project_rules.md` 的内容粘贴进去
4. 保存

`<path-to-repo-memory-workflow>` 替换为本仓库路径；若已通过 `npm i -g repo-memory-workflow` 安装，可用 `$(npm root -g)/repo-memory-workflow`。

## 验证

安装后在 TRAE 中新开对话，对项目说「继续」或「拆一下 + 需求描述」，TRAE 会自动读取 `.ai/` 下的文件并遵循工作流，无需手动粘贴 prompt。

## 说明

- TRAE 的「项目规则」等效于 Cursor 的 Skill，在当前项目的所有对话中自动生效
- 如果你同时使用 TRAE 的 Builder 模式，项目规则同样会被读取
- 规则文件不会随 `repo-memory-workflow init` 自动生成，需手动复制一次
