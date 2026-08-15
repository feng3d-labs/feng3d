# 纯数据驱动响应式框架改造计划

> 状态：执行计划。目标架构见 [FRAMEWORK_DESIGN.md](./FRAMEWORK_DESIGN.md)。
> 每阶段独立可验收、可提交；阶段间允许并行推进，但阶段 0 必须最先完成。

## 现状与目标差距总览

| 维度 | 现状 | 目标 | 差距 |
|------|------|------|------|
| 单 JSON 应用 | 场景/组件/材质已纯数据 | 含资源声明的完整 JSON | 纹理等异步资源需先 await（`ScriptTest.ts:55`）；缺查询 API |
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

## 阶段 1：收窄每帧失效（G2 核心）

移除全局 `frameVersion` 失效，改为变更驱动 + 白名单例外（设计文档 4.1）。

**任务**

- [ ] `View.ts`：`update()` 中 `++frameVersion` 移除；`canvaSize` 同步保留（真实变更源）。
- [ ] canvas 交换链纹理获取改为每帧失效白名单：`canvasTextureComputed` 依赖一个每帧更新的纹理版本源（或由 submit 阶段直接获取当前帧纹理，不进计算图）。
- [ ] 时间源白名单：引入 `u_time` 类数据源（每帧 `+dt`），仅时间相关的 computed（动画材质等）依赖它。
- [ ] **Billboard / HoldSize computed 化**（前置依赖，否则停止每帧重算后矩阵不更新）：
  - 变为矩阵链节点：`local2world → billboardMatrix(computed，读 bindingResources.cameraUniforms) → renderObject`
  - 删除二者在 beforeRender 中对 `renderObject.bindingResources.transform` 的变异写
- [ ] 验证阴影路径：`ShadowRenderer` 的 transform 绑定在变更驱动下的正确性（矩阵不变时阴影 Pass 是否仍正确产出）。

**验收**：静态场景下 benchmark 的"每帧响应式求值次数"≈ 0（仅白名单节点）；动画场景仅动画链路求值；全量 e2e 基线通过。

**风险**：停止每帧重算会暴露所有隐式依赖每帧执行的地方。逐个用例排查（BillboardTest/HoldSize 相关 e2e 重点观察），发现一个 computed 化一个。

---

## 阶段 2：资源声明化（G1 补全）

**任务**

- [ ] 纹理数据化：`{ __type__: 'Texture', url }` 声明式引用；`materialLogic` 内解析，`isLoaded` 已有加载状态链路直接复用。
- [ ] `createTextureFromUrl` 降级为解析器内部实现，示例不再手动 await（`ScriptTest.ts` / `Basic_Shading.ts` 改写为声明式）。
- [ ] 序列化适配：`serialization` 包对声明式资源引用的往返测试（保存 → 加载 → 等价）。
- [ ] 宿主锚点约定落地：canvas 等非序列化叶子以 id 引用，补一个最小示例。

**验收**：`ScriptTest` 等价示例不再包含任何 `await` 资源代码；JSON 文件可直接驱动渲染。

---

## 阶段 3：beforeRender 退役（G3 终态）

**前置**：必须先完成阶段 1（变更驱动就位），并先定位一个历史遗留问题——曾尝试 `Object3DLogic` 暴露 `transformUniforms` getter 替代 beforeRender 写入，数据完全相同却导致 `Basic_Shading` 阴影渲染差异（getter 新建 wrapper vs 字面量 wrapper，根因疑似 `WGPUBufferBinding` effect 建立时机与 wrapper 创建位置的耦合，未定位完毕，改动已回退）。

**任务**

- [ ] 定位上述 wrapper 时机问题：给 `WGPUBufferBinding` 补 effect 建立时序的单元测试，明确 wrapper 必须满足的稳定性契约。
- [ ] `Object3DLogic` 持有**稳定 binding 实例**（构造时创建一次，getter 返回同一引用，仅更新 `.value`），供 `Renderable` / `ShadowRenderer` 消费——与 `material_uniforms` 已验证的稳定引用模式对齐。
- [ ] `Renderable.baseBeforeRender` 拆解：geometry vertices/indices/draw、material pipeline/uniforms、transform 各自成为 computed 节点，`renderObject` computed 直接消费。
- [ ] `ComponentLogic.beforeRender` 协议删除（先标记 deprecated 一个版本）。
- [ ] `WGPUBufferBinding` 的 GPU 上传从"写入时 push writeBuffers"改为"submit 前 pull 差异上传"（设计文档 4.3）。

**验收**：`beforeRender` 在 engine 核心路径零调用；静态场景下相同数据不触发重复上传（benchmark 每帧 buffer 写入次数 ≈ 0）；全量 e2e 基线通过。

**风险**：本阶段触及曾出问题的区域，每个子步骤独立提交 + 跑 `Basic_Shading` 阴影用例；wrapper 契约测试先行。

---

## 阶段 4：XLogic 类化收敛

**任务**

- [ ] 制定 class 模板：`protected constructor` + `#private` + `extends` 表达 is-a、组合表达 has-a（设计文档第 5 章的示例即为模板）。
- [ ] 新增 Logic 一律 class（写进 AGENTS.md 第 3 章执行细则）。
- [ ] 存量按"被触碰时转换"原则迁移，优先级：`Object3DLogic`（defineProperties 叠加最重、手动 super 最多）→ `RenderableLogic` → 其余。
- [ ] `logic.ts` 的 `new factory(data)` 调用对 class 无需改动，补一个两种形态并存的类型测试。

**验收**：`Object3D` / `Renderable` 两个核心 Logic 完成 class 化；`instanceof` 在调试器与 devtools 中可用；全量测试通过。

**风险**：低——分发协议不变，纯内部结构调整；严守"一个 commit 一件事"。

---

## 阶段 5：查询 API 与工具链

**任务**

- [ ] `getByPath(view, 'root/children[name=Cube]')` 查询 API（替代 `Container3DTest.ts:30` 的字面量捕获技巧），含路径语法测试。
- [ ] devtools 基础版：reactivity 包暴露计算图快照（节点、依赖边、上次求值 tick、失效计数），console 输出文本拓扑起步，不急做 UI。
- [ ] 编辑器预研：基于查询 API + objectview 的属性面板原型（可后置）。

**验收**：示例改用查询 API 获取可变引用；能打印任意 computed 节点的失效次数（阶段 1 的验证将直接受益）。

---

## 风险总表

| 风险 | 来源 | 缓解 |
|------|------|------|
| 响应式隐形控制流难调试 | `WGPUBufferBinding` effect 时机问题（阶段 3 前置） | 契约测试先行；阶段 5 devtools 失效计数 |
| 停止每帧重算暴露隐式依赖 | 阶段 1 | 逐用例 e2e 验证；Benchmark 对比 |
| 响应式写入纪律扩散 | 示例自身违反 8.4 | 阶段 0 先修示例；eslint 规则持续收紧 |
| 大场景 computed 级联开销 | `local2world` 沿 parent 链 O(深度) | 阶段 0 benchmark 三档规模提前量化，必要时引入矩阵链缓存策略 |
| 功能回归 | 每阶段都动渲染链 | 每子步骤独立提交 + 全量 e2e（现有 17 个基线用例） |

## 明确不做的

- 不一次性重写存量 Logic 为 class（机会主义迁移）。
- 不移除 `Script.update` / `ticker` 命令式入口（它们是变更源头，见设计文档 4.3）。
- 不在本计划内做后处理管线、UI 系统等新功能（G3 验收中的"新模块"仅为验证扩展性）。
