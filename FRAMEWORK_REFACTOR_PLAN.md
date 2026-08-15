# 纯数据驱动响应式框架改造计划

> 状态：执行计划。目标架构见 [FRAMEWORK_DESIGN.md](./FRAMEWORK_DESIGN.md)。
> 每阶段独立可验收、可提交；阶段间允许并行推进，但阶段 0 必须最先完成。

## 现状与目标差距总览

| 维度 | 现状 | 目标 | 差距 |
|------|------|------|------|
| 单 JSON 应用 | 场景/组件/材质已纯数据 | 含资源声明的完整 JSON | 纹理等异步资源需先 await（`ScriptTest.ts:55`）；缺查询 API |
| 单 JSON 完整性 | prefabId 字段零实现；无共享引用表达 | Prefab defs + `$ref`（设计 3.6/3.7） | 千级相似对象无法声明；同一材质只能复制多份 |
| 计算模型 | 渲染链已端到端 computed | 变更驱动失效、跨帧零冗余 | `View.ts` 的 `frameVersion` 每帧全局失效整条链 |
| 模块独立 | beforeRender 已去 scene/camera；renderer 已 computed 化 | computed DAG、数据只向下流 | Billboard/HoldSize 在管线内变异 transform uniform；beforeRender 仍是命令式兼容层 |
| XLogic 形态 | 工厂函数 + defineProperties/Object.assign 混用 | class + protected constructor | 风格未收敛（与 AGENTS 第 3 章不一致） |

---

## 阶段 0：基准与护栏（必须最先完成）

没有数字就无法验收"最小计算"。先把标尺立起来，再动架构。

**任务**

- [ ] 新增 benchmark 示例：静态场景（无动画、无交互、200/1000/5000 Object3D 三档），每秒输出：
  - 平均/最大帧时间（复用 `Basic_Shading.ts` 的帧时间监控模式）
  - 每帧响应式求值次数（reactivity 包加调试计数钩子，仅调试构建启用）
  - GC/内存增长（复用 `getGPUDeviceStats` 采样）
- [ ] 修复示例违反规范 8.4 的问题：`Container3DTest.ts:59` 的 `reactive(cubeRotation).y += ...` 改为"从原始对象读、向代理写"；示例是模式的门面，必须先自洽。
- [ ] （可选，低成本）给 eslint-plugin-feng3d 增加 `computed 内禁写 reactive` 规则的可行性调研。

**验收**：三档规模静态场景的基准数据入库（随 benchmark 示例保存输出样本）；示例通过 lint 且无 8.4 违规。

---

## 阶段 1：收窄每帧失效（G2 核心）✅ 已完成

移除全局 `frameVersion` 失效，改为变更驱动 + 白名单例外（设计文档 4.1）。
前置：场景集合（拾取缓存/光源/SkyBox）先 computed 化（`17027f78`），建立真实响应式依赖。

**任务**

- [x] `View.ts`：`update()` 中 `++frameVersion` 移除；`canvaSize` 同步保留（真实变更源）。（`799b0244`）
- [x] **画布纹理移出响应式图**：确认已处于目标形态——`WGPUCanvasTexture` 经 `preSubmit` 版本号在提交执行时解析当前帧纹理，位于 webgpu 层内部，不污染数据图；数据图帧无关。
- [x] **按需呈现**（设计文档 4.2）：reactivity 全局变更计数（`getMutationCount`/`markMutation`，仅计入有消费者的数据变更）；`noMutationCount` 守卫提交期间的引擎自身写入；View.submit 打版本戳，`webgpu.submit` 版本相同跳过编码与提交。（`22647dc9`）
- [x] BenchmarkTest 增加"每秒实际提交次数"输出与 `?animate=1` 动画对照。
- [→ 阶段 6] 时间源白名单：暂无消费者（无消费者的 `_Time` uniform 已随 `799b0244` 移除，Date.now 非响应式源），待声明式动画落地时引入 `{ t }` 数据源，避免引入即破坏按需呈现（每帧写 t 会使全局变更计数失效跳过）。
- [→ 阶段 3] **Billboard / HoldSize computed 化**：实测无需作为前置——forward computed 依赖 cameraUniforms，相机变化即失效重跑 beforeRender（二者的矩阵更新语义保持正确，BillboardTest e2e 通过）；其 computed 化与 beforeRender 退役一并处理。
- [x] 验证阴影路径：`Basic_Shading`/`DebugShadowMap` 相关 e2e 通过；阴影 Pass 的 transform/light 依赖均经 logic getter（computed）读取，变更驱动正确级联。

**验收**（实测见 [BENCHMARK_BASELINE.md](./BENCHMARK_BASELINE.md) 阶段 1 复测）：静态场景三档（200/1000/5000）全部达成 **computed 求值 0/帧 + 实际提交 0/秒**，帧时间回到 vsync 上限（5000 档从基线 220ms/帧）；动画对照求值 25/帧、提交 ≈ 帧数（失效范围精确到动画链路）；vitest 572 过、e2e 17 用例全过。

**风险记录**：变更计数仅计入"有消费者"的属性变更（响应式通知机制使然）——无消费者的数据不影响输出，语义正确；VideoTexture 等非响应式内容源须调用 `markMutation()`（尚未有此类用例，阶段 2/7 涉及时处理）。

---

## 阶段 2：资源声明化（G1 补全）✅ 主体完成（f3913a7f）

实现模式以设计文档 3.2 为准：**响应式缓存 + 异步写入**（computed 读缓存、加载器 Promise resolve 时写缓存触发失效），不是把 computed 变异步。

**任务**

- [ ] 资源缓存基建：Logic 内响应式 `Map<url, { status, texture? }>` 缓存 + 幂等 `requestLoad`（pending 去重）；利用 reactivity 已有的 Map/Set 集合响应化。
- [ ] 纹理数据化：`{ __type__: 'Texture', url }` 声明式引用；`textureOf(decl)` computed 按 3.2.1 模式实现，`loading` 返回 1x1 占位纹理（渐进换装）；`isLoaded` 已有链路复用于 `error` 状态暴露。
- [ ] `createTextureFromUrl` 降级为加载器内部实现，示例不再手动 await（`ScriptTest.ts` / `Basic_Shading.ts` 改写为声明式）。
- [ ] 错误与重试语义：失败写 `error` 条目 + 保持占位符；重试仅由数据变更（改 url / retry 字段）触发，框架层不自动重试。
- [ ] 序列化适配：`serialization` 包对声明式资源引用的往返测试（保存 → 加载 → 等价）。
- [ ] 宿主锚点约定落地：canvas 等非序列化叶子以 id 引用，补一个最小示例。
- [ ] （前置）资源回收契约初版：占位符换装 / url 变更产生的旧 GPU 资源的回收路径验证（`getGPUDeviceStats` 采样 created/freed/count，确认 count 不随换装次数增长）——完整生命周期契约另行专项设计。

**验收**：`ScriptTest` 等价示例不再包含任何 `await` 资源代码；JSON 文件可直接驱动渲染；纹理换装过程中 `getGPUDeviceStats` 的 texture/buffer 存活计数稳定。

---

## 阶段 3：beforeRender 退役（G3 终态）🔶 部分完成

**前置**：必须先完成阶段 1（变更驱动就位），并先定位一个历史遗留问题——曾尝试 `Object3DLogic` 暴露 `transformUniforms` getter 替代 beforeRender 写入，数据完全相同却导致 `Basic_Shading` 阴影渲染差异（getter 新建 wrapper vs 字面量 wrapper，根因疑似 `WGPUBufferBinding` effect 建立时机与 wrapper 创建位置的耦合，未定位完毕，改动已回退）。

**任务**

- [ ] **effect 使用点盘点**（设计文档 4.4 的落地基线）：全仓库梳理 `effect()` 调用，逐个标注三类——必须保留（引擎→外部系统的边界同步，如 DOM/日志）/ 过渡（标注 `@过渡 effect` 与对应迁移任务，如 `WGPUBufferBinding` 的 writeBuffers push）/ 违规（改写为 computed 或直接数据写入）。
- [ ] 定位上述 wrapper 时机问题：给 `WGPUBufferBinding` 补 effect 建立时序的单元测试，明确 wrapper 必须满足的稳定性契约。
- [ ] `Object3DLogic` 持有**稳定 binding 实例**（构造时创建一次，getter 返回同一引用，仅更新 `.value`），供 `Renderable` / `ShadowRenderer` 消费——与 `material_uniforms` 已验证的稳定引用模式对齐。
- [ ] `Renderable.baseBeforeRender` 拆解：geometry vertices/indices/draw、material pipeline/uniforms、transform 各自成为 computed 节点，`renderObject` computed 直接消费。
- [ ] `ComponentLogic.beforeRender` 协议删除（先标记 deprecated 一个版本）。
- [ ] `WGPUBufferBinding` 的 GPU 上传从"写入时 push writeBuffers"改为"submit 前 pull 差异上传"（设计文档 4.3）。
- [ ] GPU 资源引用计数（设计文档 7.2）：WGPU 缓存层增加 retain/release，refcount 归零显式 `destroy()` 并移除缓存条目；以 `getGPUDeviceStats` 断言 `created == freed + 存活` 恒成立。

**验收**：`beforeRender` 在 engine 核心路径零调用；静态场景下相同数据不触发重复上传（benchmark 每帧 buffer 写入次数 ≈ 0）；effect 盘点清单入库且违规项清零；全量 e2e 基线通过。

**风险**：本阶段触及曾出问题的区域，每个子步骤独立提交 + 跑 `Basic_Shading` 阴影用例；wrapper 契约测试先行。

---

## 阶段 4：XLogic 类化收敛 🔶 基石完成（9653c66d：ComponentLogicBase class 化 + AGENTS 模板；Object3D/Renderable 转换与 3d 重构合并进行）

**任务**

- [ ] 制定 class 模板：`protected constructor` + `#private` + `extends` 表达 is-a、组合表达 has-a（设计文档第 5 章的示例即为模板）。
- [ ] 新增 Logic 一律 class（写进 AGENTS.md 第 3 章执行细则）。
- [ ] 存量按"被触碰时转换"原则迁移，优先级：`Object3DLogic`（defineProperties 叠加最重、手动 super 最多）→ `RenderableLogic` → 其余。
- [ ] `logic.ts` 的 `new factory(data)` 调用对 class 无需改动，补一个两种形态并存的类型测试。

**验收**：`Object3D` / `Renderable` 两个核心 Logic 完成 class 化；`instanceof` 在调试器与 devtools 中可用；全量测试通过。

**风险**：低——分发协议不变，纯内部结构调整；严守"一个 commit 一件事"。

---

## 阶段 5：查询 API 与工具链 ✅ 主体完成（getByPath/findByName 804681af；computedGraphStats 2bcf3ead）

**任务**

- [ ] 查询 API（设计文档 3.4）：`getByPath` 索引路径版 + `findByName` 树内按名查找（替代 `Container3DTest.ts:30` 的字面量捕获技巧），含测试；谓词语法后置到编辑器需求明确。
- [ ] devtools 基础版：reactivity 包暴露计算图快照（节点、依赖边、上次求值 tick、失效计数），console 输出文本拓扑起步，不急做 UI。
- [ ] 编辑器预研：基于查询 API + objectview 的属性面板原型（可后置）。

**验收**：示例改用查询 API 获取可变引用；能打印任意 computed 节点的失效次数（阶段 1 的验证将直接受益）。

---

## 阶段 6：G1 完整性 🔶 主体完成（Prefab 2c91d2a0、$ref b5aec891+abcde6d9、错误处理双模式 67292a87；声明式动画待做）

**任务**

- [ ] Prefab 内联 defs（设计文档 3.6）：`defs.prefabs` 模板区 + 实例 `prefabId` / `overrides` 深度合并；构造时实例化（模板不进运行时响应式追踪），`clone()` 同语义。
- [ ] `$ref` 共享引用（设计文档 3.7）：构造时 path 解析为同一 raw 对象；序列化器反向检测共享对象提升到 defs，保存 → 加载 → 引用关系等价。
- [ ] 错误处理双模式（设计文档 8 章）：computed 异常在 submit 拉取点统一捕获（dev 抛出并附数据路径 / prod 降级保持上次有效值 + 错误计数）；数据校验（未注册 `__type__`、字段类型不匹配、路径不存在）在 Logic 工厂默认值填充处落地。
- [ ] 声明式动画（设计文档 4.5 终态）：PropertyClip 作为数据、`(clip, t) → 插值` computed 实现；落地后移除命令式 `Animation.ts` 的过渡标注。

**验收**：千级相似对象示例以 Prefab 声明且 JSON 体积恒定；两处 `$ref` 同一材质经代理修改一处、两处渲染同时变化；错误注入示例在 dev/prod 下表现符合设计文档 8.2 表格；动画 seek（改时间字段）即时生效。

---

## 阶段 7：RenderBundle 自动命令编码缓存（设计文档 6.5）

阶段 1 让 computed 链归零后，剩余规模成本在命令编码（`webgpu.submit` 逐条编码 N 个 draw）。本阶段在 webgpu 包内实现 RenderBundle 自动化，把每帧 CPU 从 O(draw) 降到 O(pass)。

**任务**

- [ ] 命令编码路径梳理：`WGPURenderPass` 编码 renderObjects 的路径抽出可指纹化的编码单元。
- [ ] bundle 指纹与缓存：指纹 = renderObjects 身份序列 + pipeline/binding 包装身份；指纹不变直接 `executeBundles` 重放；bundle 缓存实现为 computed（与 G2 同构）。
- [ ] uniform 前提验证：确认相机/动画更新只走 buffer 内容写入（不换 bind group、不重编码）——以 BenchmarkTest 移动相机验证 bundle 不失效。
- [ ] 排序敏感对象（透明混合）排除在 bundle 外，保持逐帧编码。
- [ ] 重录开销护栏：指纹变化时的重录成本 ≈ 原逐帧编码成本（不劣化断言）。

**验收**：静态视点下 5000 档帧时间从基线 ~220ms 降至接近 200 档水平（命令编码不再随规模线性增长）；相机匀速移动时帧时间不劣于基线；全量 e2e 基线通过。

**风险**：RenderBundle 对动态偏移/状态覆盖的支持边界需实测；相机移动导致剔除结果变化触发重录（v1 接受，空间分块 bundle 为后续演进）。

---

## 风险总表

| 风险 | 来源 | 缓解 |
|------|------|------|
| 响应式隐形控制流难调试 | `WGPUBufferBinding` effect 时机问题（阶段 3 前置） | 契约测试先行；阶段 5 devtools 失效计数 |
| 停止每帧重算暴露隐式依赖 | 阶段 1 | 逐用例 e2e 验证；Benchmark 对比 |
| 响应式写入纪律扩散 | 示例自身违反 8.4 | 阶段 0 先修示例；eslint 规则持续收紧 |
| 大场景 computed 级联开销 | `local2world` 沿 parent 链 O(深度) | 阶段 0 benchmark 三档规模提前量化，必要时引入矩阵链缓存策略 |
| 功能回归 | 每阶段都动渲染链 | 每子步骤独立提交 + 全量 e2e（现有 17 个基线用例） |

## 遗留清单（本轮记录）

- 全仓存量 lint 99 errors（npm run lint）：Camera.ts 抽象 getter-return（4）、各 spec 三斜线引用等——存量问题，建议随阶段 3d/4 重构一并清理。
- 主/阴影 Pass 共享 transform value 的 WGPUBufferBinding 渲染差异（见 a17f5851）——阶段 3e pull 化重写时解决。
- 阶段 3d/e（beforeRender 退役、GPU 引用计数 + writeBuffers pull 化）、阶段 6 声明式动画、阶段 7 RenderBundle：已设计待实现。

## 明确不做的

- 不一次性重写存量 Logic 为 class（机会主义迁移）。
- 不移除 `Script.update` / `ticker` 命令式入口（它们是变更源头，见设计文档 4.3）。
- 不在本计划内做后处理管线、UI 系统等新功能（G3 验收中的"新模块"仅为验证扩展性）。
