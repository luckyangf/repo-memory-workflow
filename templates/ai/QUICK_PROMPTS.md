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
