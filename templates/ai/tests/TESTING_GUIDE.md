# TESTING GUIDE（按版本迭代）

本指南用于把测试从“口头/截图/群消息”变成**可版本化、可交接、可追溯**的 `.ai/` 资产。

## 0. 黄金规则（MUST）

1) **一次测试必须绑定到一个明确的 resource 版本路径**  
   - 例如：`.ai/resources/prd/foo/versions/2026-02-08_v2/01_overview.md`
2) **先生成用例，再审核**：用例是资产；执行只是对资产的验证。
3) **报告以 Markdown 为源**：Word/Excel 是派生物（可导出给管理层/QA 平台）。

## 1) 开发中：生成用例 → 人工审核（对应你说的 Step 1）

### 推荐流程

- 开发先用 `.ai/resources/**` + `.ai/TASK.md` 拆分大需求与步骤
- 测试执行：
  1. 指定本次测试绑定的 resource 版本路径
  2. 生成用例骨架（包含覆盖映射）
  3. 人工审核、补充边界条件与数据准备

### 命令

```bash
repo-memory-workflow test init
repo-memory-workflow test cases --resource "<resource_version_path>"
```

生成后，你会得到：
- `.ai/tests/releases/<release_id>/cases.csv`（便于审核/导入）
- `.ai/tests/releases/<release_id>/report.md`（报告源文件骨架）
- `.ai/tests/TEST_CASES.md`/`.ai/tests/TEST_PLAN.md`（全局模板，可按需引用或不用）

## 2) 开发完成：执行用例 → 生成报告（对应你说的 Step 2）

### 推荐流程

1. 确保环境可跑（本地/测试环境）
2. 根据 `.ai/tests/test_config.yaml` 配置 smoke/健康检查/你们已有测试命令
3. 运行并落盘每次执行记录（run.json/run.md）
4. 汇总生成测试报告（report.md）并可导出 docx/xlsx

### 命令

```bash
repo-memory-workflow test run --resource "<resource_version_path>"
repo-memory-workflow test export --resource "<resource_version_path>"
```

## 3) Cursor + MCP 场景（可选）

当你在 Cursor 里同时连了前端/后端/DB 的 MCP：  
你可以让 AI 执行检查与取证，但**必须**把步骤与证据写入：

- `.ai/tests/runs/<timestamp>_<release_id>/run.md`

并在报告里引用证据路径/关键输出（不要只留口头结论）。

