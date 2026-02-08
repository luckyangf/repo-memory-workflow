# 测试资产（版本化，可交接）

本目录用于把一次版本迭代的测试工作**落盘**到 `.ai/`：测试计划、测试用例、执行记录、测试报告。

## 核心约定（MUST）

1) **一次测试必须绑定到一个明确的“权威需求版本”**（resource version path）
   - 例如：`.ai/resources/prd/foo/versions/2026-02-08_v2/01_overview.md`
   - 禁止只写 “latest”，否则后续 latest 变化会导致报告不可追溯。

2) **用例是源文件**（建议 Markdown + CSV），Office 文件是派生物（可忽略进 Git）。

3) **每次执行必须留证据**：至少包含执行时间、环境、结果、关键输出/截图路径（如有）。

## 目录结构

```text
.ai/tests/
  test_config.yaml          # 执行配置（baseUrl、命令、检查项）
  TEST_PLAN.md              # 测试计划（范围/风险/环境/数据）
  TEST_CASES.md             # 测试用例（人工审核后成为版本资产）
  releases/                 # 按 resource 版本归档（推荐）
    <release_id>/           # 由 resource 路径派生的稳定 ID
      meta.json             # 本 release 绑定的 resource 路径与生成信息
      cases.csv             # 可导入 Excel（可 diff）
      report.md             # 可审计源（可导出 docx）
  runs/                     # 每次运行的原始结果与证据
    <timestamp>_<release_id>/
      run.json
      run.md
      artifacts/            # 可选：截图/日志/附件（可按需纳入 Git）
  exports/                  # 派生物（xlsx/docx），建议 gitignore
```

## 常用命令（由 repo-memory-workflow 提供）

```bash
# 初始化 tests 模板（在目标项目根目录执行）
repo-memory-workflow test init

# 基于某个 resource 版本生成用例骨架（同时生成 cases.csv）
repo-memory-workflow test cases --resource ".ai/resources/prd/foo/versions/2026-02-08_v2/01_overview.md"

# 运行 smoke/健康检查/外部命令并生成报告源文件（report.md）
repo-memory-workflow test run --resource ".ai/resources/prd/foo/versions/2026-02-08_v2/01_overview.md"

# 导出 Excel/Word（写入 .ai/tests/exports/）
repo-memory-workflow test export --resource ".ai/resources/prd/foo/versions/2026-02-08_v2/01_overview.md"
```

