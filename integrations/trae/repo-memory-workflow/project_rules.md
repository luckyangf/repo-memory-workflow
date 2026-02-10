# Repo Memory Workflow（项目规则）

当项目根目录包含 `.ai/CONTEXT.md` 和 `.ai/TASK.md` 时，严格遵循以下工作流。

## 编码前必做

1. 读取 `.ai/CONTEXT.md`
2. 如果存在，读取 `.ai/resources/_index.md` 和 `.ai/RESOURCE_GUIDE.md`
3. 读取 `.ai/TASK.md`
4. 读取 Primary active task 文件（TASK.md 中 Active 列表的第一个）

## 执行规则

- **只执行** Primary active task 中的 "Next actions"
- 如果不清楚，写入任务卡的 "Open questions"——**绝不猜测**
- 每完成一个有意义的步骤，必须更新：
  - 当前任务卡：Current state + Next actions
  - `.ai/LOG.md`：追加（不覆盖）
  - `.ai/DECISIONS.md`：仅在架构/数据库/API 变更时更新
- 保持 diff 最小化，增量提交

## 资源规则（必须遵守）

- 默认：仅使用 `.ai/resources/_index.md` 中 **status=active** 的条目，通过其 **latest** 指针访问
- 仅在 bugfix/审计/迁移 时读取 `frozen/deprecated` 资源（并说明原因）

## 用户意图 → 操作

| 用户说 | 执行动作 |
|--------|----------|
| 拆需求 / 拆一下 / 规划 / split requirement | 读取 `.ai/CONTEXT.md` + `.ai/TASKING_GUIDE.md`，拆成 3~10 个任务卡放到 `.ai/tasks/`，更新 `.ai/TASK.md`。**不写代码。** |
| 继续 / next / continue | 读取 CONTEXT + TASK + Primary active task，只执行 Next actions |
| 切窗口 / 对话满了 / 生成上下文包 / context pack | 提醒：更新任务卡，追加 LOG，运行 `python3 .ai/make_context.py`，在新 chat 粘贴 `.ai/CONTEXT_PACK.md` |
| 补档 / retrofit | 把 Task 000 设为 Active，运行 `make_context.py`，执行 retrofit 流程（见 START.md） |
| 生成测试用例 / test cases | 读取 `.ai/tests/TESTING_GUIDE.md`（如存在）+ 绑定的 resource 版本路径，生成/更新 `.ai/tests/releases/<release_id>/cases.md` + `cases.csv`。**不改业务代码。** |
| 跑测试 / run tests | 读取 `.ai/tests/test_config.yaml`，执行 smoke/命令，写入 `.ai/tests/runs/<timestamp>_<release_id>/run.md` + `run.json`，更新 release `report.md` |
| 导出报告 / export report | 导出 `.ai/tests/releases/<release_id>/cases.csv` → xlsx 和 `report.md` → docx（写入 `.ai/tests/exports/<release_id>/`） |

## 快捷指令

- **"拆一下"** → Planning 模式：拆需求为任务，不写代码
- **"继续"** → Implementation 模式：执行 Primary active task 的 Next actions
- **"生成上下文包"** → 运行 `python3 .ai/make_context.py`
- **"生成测试用例"** → 绑定 resource 版本路径，在 `.ai/tests/releases/` 下生成用例
- **"跑测试"** → 执行已配置的 smoke/命令，写入执行记录
- **"导出测试报告"** → 导出 xlsx/docx 到 `.ai/tests/exports/`
