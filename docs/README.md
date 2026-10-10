# 文档中心

> 状态：**现行**。全仓文档的**唯一导航与清单**——根 [README](../README.md) 只保留入口指针，不重复列。

## 一、目录按「生命周期」组织，不按「读者」

读者是**任务的属性**，不是文档的属性：本文档同一份 [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) 就横跨三类读者
（决策者看 §1 战略、理解者看 §2 分层、执行者看 §3.1 规范表）。而**生命周期决定一致性机制**——谁能腐、
谁需要门禁、谁能归档——所以按它分：

| 位置 | 性质 | 一致性靠什么 |
|---|---|---|
| `docs/`（顶层） | **现行**：定位 / 架构 / 规范 / 流程 | 人工维护；可机械核对的断言配门禁 |
| [`docs/migrations/`](./migrations/) | **过程**：迁移方案的执行记录，完成即归档 | 标注现状；完成后移入 `archive/` |
| [`docs/adr/`](./adr/) | **决策**：只增不改 | 天然稳定（决策不随代码变） |
| [`docs/archive/`](./archive/) | **废弃**：不再作为执行依据 | — |
| `packages/*/docs/`、`packages/*/README.md` | **包专属**：就近维护 | 同规则，按包自管 |

## 二、我是谁 → 读哪几份

### 我要评估「要不要用它 / 往哪走」

- [POSITIONING.md](./POSITIONING.md) — 为谁做、凭什么赢、**不做什么**（§5 是"不服务谁"，只读前半句等于没有定位）
- [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) §1 — 三个必须赢的战场 + 三个主动放弃的
- [POSITIONING.md](./POSITIONING.md) §6 — 已排序的发展优先级
- [FRAMEWORK_DESIGN.md](../FRAMEWORK_DESIGN.md) — 目标架构（**注意它写的是目标态**，每章带现状标签）
- [PHYSICS_ENGINE_SELECTION.md](./PHYSICS_ENGINE_SELECTION.md) — 物理引擎选型的论据
- [BENCHMARK_BASELINE.md](../BENCHMARK_BASELINE.md) — 静态场景性能基线（三档规模）

### 我要读懂系统怎么运作

- [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) §2.1 — 分层蓝图与依赖方向铁律
- [FRAMEWORK_DESIGN.md](../FRAMEWORK_DESIGN.md) — 纯数据驱动 + 响应式管线怎么运作
- [CODE_TAXONOMY.md](./CODE_TAXONOMY.md) — 三类模块的划分口径（纯函数层 / 逻辑层 / 数据→UI 层）
- [../packages/editor/docs/ARCHITECTURE.md](../packages/editor/docs/ARCHITECTURE.md) — 编辑器分层、插件三端与决策 D1–D16
- [../packages/editor/docs/PLUGINS.md](../packages/editor/docs/PLUGINS.md) — 插件清单与插槽
- [../packages/editor/docs/PLUGIN_TRIPLE_HALF.md](../packages/editor/docs/PLUGIN_TRIPLE_HALF.md) — 插件的三端形态与 cordis 硬约束
- [SKINNING.md](./SKINNING.md) — 蒙皮

### 我要改代码 / 跑门禁

- [../AGENTS.md](../AGENTS.md) — **开发规范的唯一权威**（改任何代码前先看它）
- [../packages/editor/AGENTS.md](../packages/editor/AGENTS.md) — 编辑器子包规范（含"改完跑哪个脚本"速查表）
- [docs/EDITOR_GATES.md](../packages/editor/docs/EDITOR_GATES.md) — 编辑器 39 条门禁/自检脚本全表
- [CI.md](./CI.md) — CI 门禁清单、每条的判据与已知缺口、发布流程
- [CODE_REVIEW.md](./CODE_REVIEW.md) — 两轴审查标准 + 坏味道基线（补 §15 元规则留下的主观判断区）
- [ISSUE_PRIORITY.md](./ISSUE_PRIORITY.md) — issue 定级的四档判据与流程
- [EDITOR_AI_BRIDGE.md](./EDITOR_AI_BRIDGE.md) — 编辑器 AI 桥接协议、方法表、AI 工作流建议
- [../packages/editor/docs/NODE_HOST.md](../packages/editor/docs/NODE_HOST.md) — 宿主进程通道
- [../packages/editor/docs/OBJECT_VIEW_CONFIG.md](../packages/editor/docs/OBJECT_VIEW_CONFIG.md) — 属性面板控件配置
- [EFFECT_INVENTORY.md](../EFFECT_INVENTORY.md) — effect 使用点盘点（**由 `check-effect-inventory.mjs` 校验**，标为 `[G]`）

### 我要了解某次迁移怎么做完的

见 [`docs/migrations/`](./migrations/)——这些是**执行记录**，完成后归档，不作为现行依据。

## 三、为什么有些文档不在 `docs/`

**位置本身就是功能**，移走会破坏东西（逐条实测过）：

| 文件 | 必须留在原地的理由 |
|---|---|
| `README.md` | GitHub 仓库入口约定；也是全仓文档索引的源头 |
| `AGENTS.md`（根 + `packages/editor/`） | **工具自动加载约定**——根 `AGENTS.md` 第 3 行写着"DSH 会自动加载本文件作为项目指令"。移走 = 规范不再自动生效 |
| `EFFECT_INVENTORY.md` | **是门禁的输入**：`scripts/check-effect-inventory.mjs:37` 硬编码读它，且文件内有生成标记块（`<!-- EFFECT_INVENTORY:START/END -->`） |
| `FRAMEWORK_DESIGN.md` | 被 20+ 处引用（含 `scripts/check-doc-status-labels.mjs:18` 的硬编码路径），移动成本 > 收益 |
| `packages/*/README.md` | npm 发布随包；GitHub 浏览包目录时展示 |
| `packages/*/docs/` | 包专属，就近维护（改这个包的人在包内工作） |

**所以"集中"是逻辑上的**：清单与导航集中在本文件；物理位置按**就近**与**功能**原则。

## 四、全仓共享文档清单

> 包专属文档（`packages/*/README.md`、`packages/*/docs/*.md`）**不在此逐个列**——
> 它们随包的增删而变（写了就会腐），且**就近可发现**：进包目录即见。

| 文档 | 读者 | 内容 |
|---|---|---|
| [../README.md](../README.md) | 决策者 | 项目入口：核心特性、架构图、包职责表、快速开始 |
| [../AGENTS.md](../AGENTS.md) | 执行者 | **开发规范唯一权威**：17 章，含 R1–R13 架构执行规范 |
| [../FRAMEWORK_DESIGN.md](../FRAMEWORK_DESIGN.md) | 理解者 | 目标架构设计（**每章带现状标签**，勿当作已完成） |
| [POSITIONING.md](./POSITIONING.md) | 决策者 | 定位、目标场景、竞争优势、非目标 |
| [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) | 全部 | 分层蓝图；**§3.1 是 R1–R13 现状的唯一权威** |
| [CI.md](./CI.md) | 执行者 | CI 门禁、覆盖率、发布、已知缺口 |
| [CODE_REVIEW.md](./CODE_REVIEW.md) | 执行者 | 两轴审查 + 坏味道基线（主观判断区） |
| [CODE_TAXONOMY.md](./CODE_TAXONOMY.md) | 理解者/执行者 | 三类模块划分口径 + R13 清单 |
| [ISSUE_PRIORITY.md](./ISSUE_PRIORITY.md) | 执行者 | issue 四档判据、定级流程、维护规则 |
| [EDITOR_AI_BRIDGE.md](./EDITOR_AI_BRIDGE.md) | 执行者 | 桥接协议、方法表、§13 AI 工作流建议 |
| [SKINNING.md](./SKINNING.md) | 理解者 | 蒙皮 |
| [PHYSICS_ENGINE_SELECTION.md](./PHYSICS_ENGINE_SELECTION.md) | 决策者 | 物理引擎选型 |
| [../BENCHMARK_BASELINE.md](../BENCHMARK_BASELINE.md) | 决策者 | 性能基线 |
| [../EFFECT_INVENTORY.md](../EFFECT_INVENTORY.md) | 执行者 | effect 盘点（**半生成**，见 §三） |
| [../packages/editor/AGENTS.md](../packages/editor/AGENTS.md) | 执行者 | 编辑器子包规范 |
| [../packages/editor/docs/](../packages/editor/docs/) | 理解者/执行者 | 编辑器专属：架构、插件、宿主、门禁全表 |

## 五、新增文档时

1. **先判断它属于哪一层**（见 §一）——现行 / 过程 / 决策 / 废弃，决定它放哪、以及一致性靠什么；
2. **头部写状态行**：`> 状态：**现行**。…`（本仓惯例，已有先例：本文档、POSITIONING、ISSUE_PRIORITY）；
3. **登记进 §四**（如果它是全仓共享文档）；
4. **说得出它的一致性机制**：能生成就别手写；能机检就配门禁；会过期的细节只写指针。
   ——说不出机制的，按根 `AGENTS.md` §15 只算建议，不算规范。

## 依据

- 文档分层与一致性机制：根 [AGENTS.md](../AGENTS.md) §15 元规则（每条规范必须有机器执行者）+ §15.1（主观判断区）
- 文档链接与 workflow 行号引用由门禁守：`scripts/check-docs-links.mjs`、`scripts/check-doc-workflow-refs.mjs`
