# 快捷 Prompt 模板

编辑器无 Skill 支持时（如 VSCode + Copilot Chat、ChatGPT 等），可从下方复制对应 prompt 粘贴给 AI。

## 拆需求（Planning）

```text
请先读取 .ai/CONTEXT.md 和 .ai/TASKING_GUIDE.md。
把下面这个需求拆成 3~10 个任务卡，放到 .ai/tasks/ 下，并更新 .ai/TASK.md。
暂时不要实现代码。

【需求】<在此粘贴你的需求描述>
```

## 继续执行（Implementation）

```text
请读取 .ai/CONTEXT.md、.ai/TASK.md，以及 Primary active task（任务板里 Active 第一个）。
只执行该任务里的 Next actions。
每完成一步，更新任务卡和 .ai/LOG.md。
```

## 切窗口 / 新 chat 前（生成上下文包）

先更新当前任务卡的 Current state 和 Next actions，追加一条到 `.ai/LOG.md`，然后运行：

```bash
python3 .ai/make_context.py
```

在新 chat 中粘贴 `.ai/CONTEXT_PACK.md` 内容，并说：

```text
请先读取下方粘贴的 CONTEXT_PACK 内容。
从 Primary active task 的 Next actions 第 1 步继续执行。
每完成一步，更新任务卡和 .ai/LOG.md。
```

## Retrofit（补档）

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

执行前需先运行 `python3 .ai/make_context.py` 生成 CONTEXT_PACK。

## 需求变更 → 生成新版本资源快照（PRD/规则）

```text
请先读取 .ai/CONTEXT.md、.ai/resources/_index.md、.ai/RESOURCE_GUIDE.md（如果存在）。

把下面这段变更当作权威输入（禁止脑补）。
请在 .ai/resources/prd/<doc_key>/versions/<new_version>/ 下生成分片（按标题切分，至少包含：00_meta.yaml、01_overview.md、change_summary.md、open_questions.md）。
并生成 <based_on> → <new_version> 的 change_summary.md（新增/删除/变更点 + 影响范围 + 迁移建议）。
然后更新 .ai/resources/_index.md 的 latest/status，最后更新 .ai/TASK.md 及受影响任务卡（先更新验收/Next actions，不要直接写代码）。

[CHANGE_REQUEST]
doc_key: <doc_key>
based_on: <old_version>
new_version: <new_version>
authoritative_input: chat

CHANGES:
- <新增/修改/删除的一条变更>

OPEN_QUESTIONS:
- <如有不确定，列出并给 2-3 个选项>
[/CHANGE_REQUEST]
```

## 导入外部资料 → 落盘到 .ai/resources/（三方文档/字段表/规则表）

```text
请先读取 .ai/CONTEXT.md 与 .ai/resources/_index.md（如果存在）。

我会提供一份外部资料（URL 或粘贴内容/附件内容）。
请将其整理为“权威资源分片”落盘到 .ai/resources/vendor_docs/<key>/versions/<version>/。
要求：
1) 先尽量保真抽取（不要用总结替代原文要点）
2) 再给出工程化解读（易错点、边界条件、验签/幂等/错误码等）
3) 更新 .ai/resources/_index.md 增加/更新条目（status、latest）

[RESOURCE_IMPORT]
key: <key>
version: <version>
source: <url 或 粘贴内容/说明附件>
must_split:
- api_endpoints
- webhooks
- signing
- idempotency
- error_codes
[/RESOURCE_IMPORT]
```

## 生成测试用例（基于 resource 版本 + 任务 + 代码）

> 目标：先生成用例，再人工审核。一次测试必须绑定明确的 resource 版本路径（禁止只写 latest）。

```text
请先读取：
- .ai/CONTEXT.md
- .ai/resources/_index.md（如存在）
- .ai/RESOURCE_GUIDE.md（如存在）
- .ai/TASK.md（以及 Active 的任务卡）
- .ai/tests/TESTING_GUIDE.md（如存在）

我会提供本次测试绑定的 resource version path（例如 .ai/resources/prd/foo/versions/2026-02-08_v2/01_overview.md）。
请结合该 resource 版本内容、Active 任务卡的 Acceptance criteria、以及当前代码实现（前端/后端/数据库相关逻辑），生成一份测试用例清单：

要求：
1) 用例要可执行、可复现（必要时拆分）
2) 覆盖：主流程 + 边界条件 + 错误码/异常 + 权限/状态机（如果 resource 提到）
3) 每条用例都要标注覆盖来源（resource/task/code 路径或关键词）
4) 先把用例写入 .ai/tests/releases/<release_id>/cases.md（或更新 .ai/tests/TEST_CASES.md），并生成/更新 cases.csv
5) 仅生成用例与计划，不要直接修改业务代码

[RESOURCE_VERSION_PATH]
<在此填入 resource version path>
[/RESOURCE_VERSION_PATH]
```

## 运行测试并出报告（runner + 取证落盘）

```text
请先读取：
- .ai/tests/TESTING_GUIDE.md
- .ai/tests/test_config.yaml
- 本次 release 的 .ai/tests/releases/<release_id>/cases.md 与 report.md（如存在）

按以下规则执行并落盘：
1) 运行 health/smoke + 你们已有测试命令（参考 test_config.yaml）
2) 记录每一步的输入/输出/结论；需要 DB/接口/截图等证据时把证据路径写入 run.md
3) 把结果写入 .ai/tests/runs/<timestamp>_<release_id>/run.md 与 run.json
4) 更新 .ai/tests/releases/<release_id>/report.md 的 Latest run summary

注意：不要猜测没跑过的结果；失败要写清楚复现步骤与日志要点。
```

## 导出 Excel/Word（交付物）

```text
请将以下文件导出为交付物：
- .ai/tests/releases/<release_id>/cases.csv → cases.xlsx
- .ai/tests/releases/<release_id>/report.md → report.docx

导出文件写入 .ai/tests/exports/<release_id>/ 下（派生物可不进 Git）。
```
