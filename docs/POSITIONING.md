# Feng3D 定位与竞争优势

> 状态：战略层文档（2026-09）。本文回答「为谁做、凭什么赢、不做什么」；
> 技术规划与实施路径见 [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md)，目标架构权威见
> [FRAMEWORK_DESIGN.md](../FRAMEWORK_DESIGN.md)。
>
> 全部论断基于实测与官方来源核实：feng3d 自身实测（类型检查 / 622 单测 / lint / 178 e2e 基线 /
> benchmark）、three.js 0.185 本地源码、PlayCanvas 2.23-beta 与 Babylon.js 9.28 官方文档、
> Babylon Lite 架构规范（50 篇）。凡「实测」均为本次验证结果，非文档转述。

---

## 1. 定位声明

> **Feng3D 是「数据即应用」的 WebGPU 渲染内核：为那些"场景需要被程序生成、保存、加载、
> 再由人或 AI 微调"的应用，提供零浪费的渲染底座。**

三句话的差异化叙事（对内统一口径、对外表述）：

> **唯一能让 AI 直接生成、让工具直接消费、让浏览器几乎不耗 CPU 的 WebGPU 引擎。**

| 分句 | 对应能力 | 支撑证据 |
|---|---|---|
| 让 AI 直接生成 | 数据即应用（战场 A） | 单 JSON 即运行时内存结构；`__type__` 注册表；`Validate.ts` 字段校验 |
| 让工具直接消费 | 数据即应用 + 可观测纪律（战场 A/C） | objectview 自动 Inspector；`getByPath`/`findByName`；`computedGraphStats` |
| 让浏览器几乎不耗 CPU | 零浪费渲染（战场 B） | 实测静态场景 computed 求值 **0/帧**、提交 **0/秒** |

**定位的另一半是不服务谁**（见 §5）——只写前半句的定位等于没有定位。

---

## 2. 目标场景（从需求侧倒推，而非从技术清单出发）

### 2.1 场景 1（最有前景）：AI 生成 3D 场景

**用户画像**：用 LLM 生成场景草稿 → 程序化校验 → 人工/工具微调 → 存盘归档 → 反复迭代的团队；
以及需要"自然语言 → 可编辑场景"的产品。

**为什么这是结构性适配**：

| | AI 生成代码（three.js / Babylon.js / Babylon Lite） | AI 生成数据（Feng3D） |
|---|---|---|
| 生成物 | `new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({color})); mesh.position.set(...); scene.add(mesh)` | `{ __type__: 'Object3D', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry' } }] }` |
| AI 必须掌握 | API 细节、参数顺序、单位约定、对象生命周期 | **只需知道 `__type__` 名字** |
| 事前校验 | 难（要执行才知道对错） | ✅ schema 校验 + `Validate.ts` 字段类型校验 |
| diff / 版本管理 | 差（代码结构易变） | ✅ JSON 天然可 diff |
| 存盘往返 | three.js `ObjectLoader` 是白名单 `switch`，**自定义类不可无损往返**（源码核实） | ✅ 架构保证（含 `$ref` 共享引用、Prefab） |
| 非程序员微调 | ❌ | ✅ objectview 自动生成属性面板 |

**核心论点**：AI 生成**数据**的可靠性远高于生成**代码**——数据可校验、可迭代、可回滚、可存盘。
而四家中只有 feng3d 把数据作为唯一事实来源：**JSON 字面量就是运行时内存结构**，
没有"代码构建对象图"（three.js / Babylon.js）或"JSON → 实例化 ECS"（PlayCanvas）的中间步骤。

**注意方向差异**：three.js 已在做 AI 友好化（仓库内含 `llms.txt`），但其方向是
"让 AI 更好地**写 three.js 代码**"；feng3d 的方向是"**让 AI 不必写代码**"。这是层次差异，不是同赛道追赶。

**该场景待补能力**：错误可观测性（AI 需要明确报错而非静默降级）· glTF 完整 · 编辑器收回。

### 2.2 场景 2：长期运行的静态大场景

**用户画像**：数字孪生 · 监控大屏 · BIM/GIS · 展厅导览 · 需要多实例嵌入页面的可视化。

| 需求特征 | 三家的结构性问题 | Feng3D |
|---|---|---|
| 场景大（千~万对象） | 每帧 O(n) 遍历 + 排序 | computed 缓存，无变化零重算 |
| 变化少 | 每帧仍全量提交（含 Lite 的 `frameGraph.execute()`） | **0 提交/秒**，画布保持最后呈现帧 |
| 7×24 运行 / CPU 预算敏感 | 持续 CPU 空转 → 发热、耗电、多实例不可行 | 每帧仅版本号比对 |
| 大坐标（GIS / 地球尺度） | — | **能力缺口**：需补 Floating Origin + F64 矩阵 |

**这是已实测能力，不是希望**：5000 对象静态场景 220ms/帧 → vsync 附近；
computed 求值 16→0/帧；实际提交 4.5/s→0（见 [BENCHMARK_BASELINE.md](../BENCHMARK_BASELINE.md)）。

### 2.3 场景 3：需要「存盘即等价」的工具链

**用户画像**：配置化/参数化生成场景 · 场景模板与变体 · 用户可编辑的成品 · 场景资产需版本控制。

只有 feng3d 能做到「保存 → 加载 → 渲染等价」是**架构保证**而非尽力而为。
`$ref` 共享引用与 Prefab 已在构造侧与保存侧打通（`RefTest`/`PrefabTest` 为验收示例）。

---

## 3. 竞争优势的四层分类（决定资源往哪投）

| 层级 | 项 | 别人能否追上 | 建议投入 |
|---|---|---|---|
| **护城河型**（架构根因决定，改造成本极高） | **JSON 即运行时内存结构**（无构建步骤、无中间态） | three.js 需重写（1000+ 贡献者与生态依赖命令式 API）；PlayCanvas 需绕开 Editor 工程格式；Babylon Lite 是命令式函数构建序列（`addToScene(scene, await loadGltf(...))`） | **重投**——唯一别人补不上的 |
| **结构性**（对方有包袱） | **零提交**（Lite 每帧 frame graph + submit；Babylon.js 无通用脏标记；three.js 每帧全树遍历 + 排序）· 响应式 computed 全链路惰性 | 需改渲染循环骨架 | **重投 + 守住**（回归即阻塞） |
| **可追赶型**（别人数周可补） | 错误可观测性 · 零模块级副作用 · tree-shaking · 包体门禁 · 严格类型 | 能 | **尽快补齐，但不作为卖点** |
| **暂时型** | 现有的零散 API 便利差异 | 随时被追平 | 不投入 |

**推论**：资源集中在**护城河型 + 结构性**两类；"可追赶型"补齐的目的是**不成为短板**，而不是当卖点。

---

## 4. 唯一可能形成「组合护城河」的方向

单项优势会被追平，**组合优势不会**。feng3d 手里有三样东西，三家无法同时具备：

```
        JSON 即应用（战场 A）
               │
        ┌──────┴──────┐
        ▼             ▼
   编辑器/Inspector   AI 生成与修改
   （objectview 现成） （数据可校验、可迭代）
        │             │
        └──────┬──────┘
               ▼
   可观测 + 可强制的架构（战场 C）
   computedGraphStats / 自研 linter / 门禁
```

| 引擎 | 缺失环节 |
|---|---|
| three.js | 无数据流（命令式对象图）→ 编辑器须依赖第三方 |
| PlayCanvas | 有编辑器，但引擎与 Editor 分仓，数据须经 Editor 工程格式 |
| Babylon.js | 有 Inspector/NME/NRGE，但对象图是命令式的，**自定义类序列化不可往返** |
| Babylon Lite | 纯数据 ✅，但**官方明确无编辑器**，且每帧渲染 |

**结论**：`数据即应用 × 编辑器 × AI 生成/修改` 这个三角是 feng3d 唯一能形成不可替代性的方向。
所需资产大部分已存在（JSON 数据模型、objectview、TSL、editor 代码），缺的是工程加固
（错误可观测性、门禁、编辑器收回）——**这是价值重估，不是从零新建**。

---

## 5. 非目标（定位的另一半）

| 不做 | 理由 |
|---|---|
| 实时游戏引擎（物理 / 寻路 / 音频混音 / 动画状态机 / 后处理全家桶） | 每帧都在变，"零提交"无意义；且是 Babylon.js 的护城河 |
| 通用 3D 库（"什么都能做"） | three.js 有 47 个加载器 + 442 addons + 595 示例，数量竞争无胜算 |
| 企业级全家桶与向后兼容承诺 | Babylon.js 在此有 10 年积累；feng3d 的资产恰是**没有兼容包袱** |
| 云编辑器与托管服务 | PlayCanvas 的商业形态，非技术问题 |
| 可视化节点着色器编辑器 | 着色器走 TSL 代码化路线（与 three.js 一致），而非 Babylon NME |

---

## 6. 发展优先级（按「优势 × 成本」）

| # | 方向 | 优势类型 | 成本 | 理由 |
|---|---|---|---|---|
| 1 | **错误可观测性（Coded Errors 式）+ P0 止血** | 可追赶 | 低 | AI 协作的前提；静默失效会让 AI 越改越错 |
| 2 | **收回 TSL** | 可追赶 | 中低 | v0.2.0、320 单测全绿；消除最大架构欠账（双份着色器） |
| 3 | **编辑器收回（objectview + editor）** | **护城河** | 中 | 唯一能形成组合护城河的一环；Lite 明确没有 |
| 4 | 门禁体系（像素 / 包体 / 覆盖率 / 依赖方向） | 可追赶 | 低 | 让 1–3 项不退化 |
| 5 | glTF 完整 + Resource Pool + Floating Origin | 结构性 | 中 | 场景 1/2 的实际交付能力 |
| 6 | 计算图 devtools + AI 可读架构文档 | **护城河** | 中 | 战场 C，直接服务场景 1 |
| 7 | CSM / VAT / GPU Picking | 可追赶 | 高 | **客户明确要求前不做** |

---

## 7. 定位风险与判据

**最大风险是扩散**：若开始补物理、导航、后处理全家桶，就会变成"什么都有一点"，
这是 1 人资源下唯一必输的打法。

**固化判据**（与 [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) §1.4.5 一致）：

> **每个新特性必须回答「服务 §2 的哪个场景」，答不出就不做。**
> **不因为竞争对手有就补，只因为服务目标场景才补。**

**次要风险**：
- 纯 WebGPU 的浏览器覆盖 —— 作为定位特征明确声明，而非待修缺陷
- AI 生成 3D 市场本身仍在早期 —— 但该定位**不依赖市场成熟**：场景 2/3 已可自证价值

---

## 附录：本文引用的实测与核实来源

| 论断 | 来源 |
|---|---|
| 静态场景 0 求值 / 0 提交；5000 对象 220ms → vsync | [BENCHMARK_BASELINE.md](../BENCHMARK_BASELINE.md) + 本次复测 |
| three.js `ObjectLoader` 白名单 `switch`、自定义类不可往返 | `references/three.js/src/loaders/ObjectLoader.js:844-1117`（本地 0.185.0 源码） |
| three.js 每帧全树遍历 + 排序 | `references/three.js/src/core/Object3D.js:1176-1210`、`src/renderers/WebGLRenderer.js:1689,249` |
| PlayCanvas 需 Editor 工程格式 | PlayCanvas 官方 Assets / parsers 文档 |
| Babylon.js 无通用脏标记，靠手动 `freeze*()` | Babylon.js 官方 optimize_your_scene 文档 |
| Babylon Lite 每帧执行 frame graph + submit，官方无编辑器 | Babylon Lite `docs/lite/architecture/00-overview.md`（渲染循环与文件清单）、`00-welcome.md`（TLD;DR 表） |
| Coded Errors 设计 | Babylon Lite `49-error-handling.md` |
| 当前 feng3d 的错误处理现状（`console.error` + `process.env.NODE_ENV` 判断） | `packages/reactivity/src/logic.ts:123`、`packages/feng3d/src/core/View.ts:365` |
| TSL 状态（v0.2.0 / 320 单测） | `gitee.com/feng3d/tsl` 提交 `c5612c0a` 与 `package.json` |
| 仓库演化（23 包联邦 → 单仓） | 主仓 `bb19b24f` → `f80a182a` / `1b84f090` → `18ef3a29` |
