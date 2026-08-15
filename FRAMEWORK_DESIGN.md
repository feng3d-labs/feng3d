# Feng3D 纯数据驱动响应式框架设计

> 状态：设计文档（目标架构）。现状与目标之间的差距及落地步骤见 [FRAMEWORK_REFACTOR_PLAN.md](./FRAMEWORK_REFACTOR_PLAN.md)。

## 1. 设计目标

### G1 数据即应用（Pure Data-Driven）

整个应用使用**一个 JSON** 完整描述。JSON 是应用的唯一事实来源（Single Source of Truth）：

- **可序列化往返**：`保存 → 加载 → 渲染结果等价`。任何无法进入 JSON 的状态都是设计缺陷（或有明确的宿主锚点声明，见 3.3）。
- **最小声明**：字段可省略，由 Logic 工厂补默认值（规范 11.5），JSON 只表达"与默认值的差异"。
- **行为注册化**：凡是要"动"的东西，都以 `__type__` 注册对应的 XLogic。JSON 描述"是什么"，XLogic 决定"怎么动"。
- **验收标准**：一个中等复杂度示例（含动画、材质、阴影）可以仅凭 JSON 文件 + 已注册的 `__type__` 集合完整还原运行。

### G2 最小计算（Lazy & Minimal Computation）

所有派生流程统一使用 computed 构建：

- **无修改零运算**：数据没有变化时，跨帧不产生任何派生重算（渲染管线仅执行"重新提交"所需的最低限度工作）。
- **有修改最小运算**：失效沿依赖图精确传播，仅在最终被消费时（pull）求值，且只求值受影响的节点。
- **副作用有边界**：computed 内部不产生副作用；GPU 上传等副作用只存在于显式的 submit 阶段。
- **验收标准**：静态场景（无任何数据修改、无动画）的每帧 CPU 开销应接近常数且显著低于含动画场景；用 benchmark 数字量化（见计划文档阶段 0）。

### G3 模块独立 + 计算图（Independent Modules, Computed Graph）

所有模块通过 computed 链连接成一张派生图（实践中是 DAG，不强求树形）：

- **模块间只通过数据连接**：模块不持有环境上下文（scene/camera 参数已从 beforeRender 移除，此为既定方向），输入是数据，输出是派生数据。
- **数据只向下流**：任何模块不得改写其他模块的输出。需要"修饰"上游数据时（如公告牌矩阵），以独立 computed 节点接入，而不是变异共享输出。
- **渲染即派生**：整个渲染流程是一条计算链，最终产出一个 `Submit` 交给 WebGPU 执行：

```
JSON 数据（响应式源）
  └─ Object3D computeds（matrix → local2world → boundingBox …）
       └─ Renderable.renderObject（computed）
            └─ Renderer computeds（Forward / Shadow / Outline / Wireframe，按 (scene, camera) 缓存）
                 └─ canvasRenderPass（computed）
                      └─ submitComputed（computed）
                           └─ webgpu.submit(viewLogic.submit)   ← 每帧唯一的拉取点
```

- **验收标准**：新增一个渲染模块（如后处理 Pass）不需要修改任何现有模块，只需注册一个消费 RenderObject 的新 computed 节点并接入 pass 序列。

## 2. 核心概念

### 2.1 纯数据（Data）

- 接口仅声明 `readonly` 字段 + `__type__` 字面量，不含方法（规范 11.1）。
- 抽象基接口不声明 `__type__`，不直接构造；只构造具体子接口（规范 11.4）。
- 数据修改只能经响应式代理进行（规范 8.4：从原始对象读当前值、向代理写新值）。

### 2.2 逻辑（XLogic）

每个数据接口一一对应一个 Logic，提供全部行为：

- **创建协议**：只能通过 `logic(data)` 获取，WeakMap 按 raw 对象缓存，重复调用零开销。
- **注册协议**：`registerLogic(__type__, XxxLogic)` + `declare module '@feng3d/reactivity'` 扩展 `LogicMap` 获得精确类型。
- **形态**：统一为 **class + protected constructor**（详见第 5 章）。
- **对外只读**：字段一律 readonly getter / computed，不暴露 setter 与可写字段（规范 11.2）。
- **桥接方式**：computed 内部 `reactive(data).field` 读取，数据变化自动失效（规范 11.3）。

### 2.3 响应式计算管线（Computed Pipeline）

- 响应式对象只存在于函数/闭包内，以 `r_` 前缀标记，不导出、不传参（规范 8）。
- computed 是唯一的派生机制；effect 只允许存在于与外部系统（GPU/DOM）交互的边界层。
- 拉取式求值：帧循环只读 `submit` 这一个根，整张图按需展开。

## 3. 单 JSON 应用模型

### 3.1 应用结构

应用 JSON 的根是 `View`：持有宿主锚点（canvas）与场景根 `Object3D`。场景树、组件、几何体、材质、uniform 全部为嵌套字面量（参照 `examples/src/base/Container3DTest.ts`）。

### 3.2 异步资源声明化（目标形态）

资源不作为解析后的对象进入 JSON，而以**声明式引用**存在，由对应 Logic 惰性解析：

```ts
// 现状：必须先 await，JSON 依赖加载时序
s_diffuse: await createTextureFromUrl('/m.png')
// 目标：纯声明，materialLogic 内部解析与追踪加载状态
s_diffuse: { __type__: 'Texture', url: '/m.png' }
```

### 3.3 宿主锚点（Host Anchors）

DOM 句柄等无法序列化的叶子（canvas 等）正式承认为"锚点"概念：运行时注入、序列化时以引用（如元素 id）替代。锚点列表是封闭集合，不作为常规扩展手段。

### 3.4 可变引用查询

提供正式的查询 API 获取"待修改的数据节点"，替代在字面量内捕获变量的技巧：

```ts
const cube = getByPath(view, 'root/children[name=Cube]');
reactive(cube).position = { x: 1, y: 0, z: 0 };
```

### 3.5 序列化边界

- 可序列化：全部纯数据 + 声明式资源引用 + 锚点引用。
- 不序列化：Logic 实例（由数据重建）、computed 缓存、GPU 资源。

## 4. 响应式计算模型细则

### 4.1 失效粒度：变更驱动为主，帧驱动为白名单例外

- **默认**：所有派生节点按数据依赖失效。脚本 update、用户交互修改数据后，相关 computed 自动重算，无关节点不动。
- **白名单例外**（真正每帧都变的数据源，允许每帧失效下游）：
  - canvas 交换链纹理（每帧获取新纹理）
  - 时间源（`u_time` 等动画 uniform）
- **禁止**：类似当前 `frameVersion` 的全局每帧失效开关——它让"静态场景零运算"不可能成立。存量迁移见计划文档阶段 1。

### 4.2 拉取式求值规则

- computed 一旦求值即缓存，同一次读取链路内不重复计算。
- 帧循环唯一职责：读 `viewLogic.submit`（触发整图按需求值）并提交。

### 4.3 副作用边界

- computed 内禁止：写 reactive 状态、触发 effect、分配 GPU 资源。
- GPU 上传：数据 → GPUBuffer 的同步发生在 submit 阶段，由 WebGPU 边界层在提交前统一 pull 差异上传（替代现在的写入时 push `writeBuffers`）。
- 命令式逃生舱：`Script.update` / `ticker` 保留——它们是响应式源（修改数据），不是派生节点，职责是"产生变化"而非"响应变化"。

## 5. XLogic 规范（class 形态）

```ts
export interface Rotate        // 纯数据接口（不变）
{
    readonly __type__: 'Rotate';
    readonly speed?: number;
}

export class RotateLogic extends ScriptLogic
{
    protected constructor(data: Rotate)
    {
        super(data);           // 继承链：ScriptLogic → BehaviourLogic → Component3DLogic
    }

    update(interval: number): void { /* 行为 */ }
}
registerLogic('Rotate', RotateLogic);
```

- **protected constructor**：强制 `logic(data)` 单一入口（`logic.ts` 已用 `new factory(data)` 统一调用，class 天然兼容）。
- **继承表达 is-a**：`ContainerLogic → EntityLogic → Object3DLogic` 等层级用 `extends` 显式表达，替代在共享对象上 `Object.defineProperties` 叠加 + 手动捕获基类方法模拟 super 的做法。
- **组合表达 has-a**：跨类型复用行为（如 Renderable 组合 Behaviour）仍优先组合，持有基类实例字段。
- **私有状态用 `#field`**，不依赖闭包。
- **方法在原型上共享**：千级对象场景下避免每实例闭包的内存开销。
- 迁移策略：新 Logic 一律 class；存量工厂函数在被触碰时转换，不做一次性重写（见计划文档阶段 4）。

## 6. 渲染管线模块契约

- **Renderer 接口**：`draw(scene, camera, time) → Computed<RenderObject[] | RenderPass[]>`，内部按 `(scene, camera)` 缓存（`ForwardRenderer` 等已是此形态）。
- **beforeRender 是过渡形态，终态消亡**：transform / material / geometry 的数据注入最终各自成为被 `renderObject` computed 消费的 computed 节点，beforeRender 分发协议整体移除。
- **变异型组件 computed 化**：Billboard / HoldSize 这类"修饰模型矩阵"的组件成为矩阵链上的独立节点：

```
local2world (computed) → billboardMatrix (computed，读 cameraUniforms) → renderObject
```

而非在管线执行期间改写 `renderObject.bindingResources.transform`。

- **pass 顺序**是隐式序（阴影在前、主 Pass 在后），在 `submitComputed` 中以显式序列表达，属于少数允许命令式编排的位置。

## 7. 工具链与生态

- **eslint-plugin-feng3d**：响应式纪律的强制层（`r_` 前缀 / 禁导出 / 禁传参），后续可增加"computed 内禁写 reactive"规则。
- **devtools（目标）**：计算图可视化（节点 = computed，边 = 依赖），显示各节点上次求值时间与失效次数——这是调试"隐形控制流"问题的关键工具。
- **编辑器（目标）**：属性面板直接编辑应用 JSON；查询 API（3.4）为编辑器提供受控修改入口。
- **benchmark（验收基建）**：静态场景帧成本、失效传播开销、GC 频率作为架构决策的量化依据。

## 8. 非目标（明确不做）

- 不追求完全 FRP：输入、脚本、ticker 等命令式入口保留，它们是数据变化的源头。
- 不追求计算图严格为树：scene/camera 喂多个 renderer、renderObject 进多个 Pass 是必要的 DAG。
- 不做响应式系统的持久化订阅（保存/加载走序列化，不走变更流）。
- 不为 Unity/Godot 兼容性设计组件命名与结构。
