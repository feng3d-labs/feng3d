# Feng3D 纯数据驱动响应式框架设计

> 状态：设计文档（目标架构）。现状与目标之间的差距及落地步骤见 [FRAMEWORK_REFACTOR_PLAN.md](./FRAMEWORK_REFACTOR_PLAN.md)。

## 1. 设计目标

### G1 数据即应用（Pure Data-Driven）

整个应用使用**一个 JSON** 完整描述。JSON 是应用的唯一事实来源（Single Source of Truth）：

- **可序列化往返**：`保存 → 加载 → 渲染结果等价`。任何无法进入 JSON 的状态都是设计缺陷（或有明确的宿主锚点声明，见 3.3）。
- **最小声明**：字段可省略，由 Logic 工厂补默认值（规范 11.5），JSON 只表达"与默认值的差异"。
- **行为注册化**：凡是要"动"的东西，都以 `__type__` 注册对应的 XLogic。JSON 描述"是什么"，XLogic 决定"怎么动"。
- **验收标准**：一个中等复杂度示例（含动画、材质、阴影）可以仅凭 JSON 文件 + 已注册的 `__type__` 集合完整还原运行；数据无变化时引擎不产生任何渲染提交。

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
- computed 是唯一的派生机制。**惰性优先**：默认禁止 effect（立即响应式），仅允许按 4.4 的白名单使用。
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

#### 3.2.1 实现模式：响应式缓存 + 异步写入

computed 必须保持同步（渲染链是同步拉取的，不能 `await`）。异步的正确解法是：**computed 读响应式缓存，加载器在 Promise resolve 时写入缓存**——异步完成与"用户改了 position"在响应式系统眼中完全等价，都是变更源，失效沿依赖图自然传播，无需任何手动通知。

```
声明（数据）：s_diffuse: { __type__: 'Texture', url: '/m.png' }
     ↓ 读
textureOf(decl) —— computed：查响应式缓存，命中返回纹理，未命中返回占位符
     ↓ 依赖
material 绑定 → renderObject → renderPass → submit
     ↑ 失效传播（加载完成时反向触发）
加载器（Promise）—— resolve 时写入缓存
```

```ts
// 资源 Logic 内部
const textureCache = new Map<string, Texture>();      // 响应式缓存（reactivity 支持 Map/Set 响应化）

const textureOf = computed(() =>
{
    const decl = reactive(material).s_diffuse;        // 声明是数据，url 变化自动失效
    const entry = reactive(textureCache).get(decl.url);
    if (entry) return entry;                          // 已加载（或已失败）
    requestLoad(decl.url);                            // 触发加载（幂等，见 4.3 白名单例外）
    return PLACEHOLDER_TEXTURE;                       // 1x1 占位纹理
});

// 加载器：命令式世界 → 响应式世界的唯一桥
function requestLoad(url: string): void
{
    if (pending.has(url)) return;                     // 去重，同一 url 只加载一次
    pending.add(url);
    createTextureFromUrl(url).then(
        tex => { reactive(textureCache).set(url, tex); pending.delete(url); },     // ← 失效在这里发生
        err => { reactive(textureCache).set(url, ERROR_ENTRY); pending.delete(url); },
    );
}
```

该模式的固有性质：

- **去重与缓存**：以 url 为 key，多个材质引用同一纹理只加载一次。
- **惰性**：声明存在但从未被消费（未进入渲染链）则不发起加载，符合 G2。
- **声明式变更语义完整**：url 字符串变化 → `textureOf` 失效 → 重新占位 → 加载 → 换装。
- **渐进体验**：首帧立即以占位符渲染，加载完成自动换装（现状 `await` 阻塞整个 JSON 构造）。

#### 3.2.2 加载状态与渲染策略

缓存条目携带状态：`{ status: 'loading' | 'loaded' | 'error', texture? }`。渲染策略由消费方按状态选择：

- **占位符换装**（纹理）：`loading` 返回 1x1 占位纹理，视觉渐进。
- **门控渲染**（几何体外联资源，如 `.gltf`）：`loading` 时 `isLoaded = false`，对象暂不渲染。

#### 3.2.3 错误与重试

加载失败写入 `error` 状态条目，保持占位符并暴露错误信息。**重试只能由数据变更触发**（修改 url、或显式 retry 字段），框架层不做自动重试——否则失效循环不可控。

#### 3.2.4 前置依赖：资源回收契约

占位符 → 真纹理换装、url 变更替换纹理都会产生不再被引用的旧 GPU 资源（WGPU 层按资源对象缓存）。大规模使用此模式前必须先落实第 7 章的 GPU 层引用计数回收契约，否则渐进加载会变成渐进泄漏。

### 3.3 宿主锚点（Host Anchors）

DOM 句柄等无法序列化的叶子（canvas 等）正式承认为"锚点"概念：运行时注入、序列化时以引用（如元素 id）替代。锚点列表是封闭集合，不作为常规扩展手段。

### 3.4 可变引用查询

提供正式的查询 API 获取"待修改的数据节点"，替代在字面量内捕获变量的技巧。**起步只做索引路径 + 按名查找辅助函数**，谓词语法（`children[name=Cube]`）等编辑器需求明确后再定——路径语法一旦发布就是兼容性负担：

```ts
// 索引路径
const cube = getByPath(view, 'root/children/0');
// 按名查找（树内递归）
const cube2 = findByName(view, 'Cube');

reactive(cube).position = { x: 1, y: 0, z: 0 };
```

### 3.5 序列化边界

- 可序列化：全部纯数据 + 声明式资源引用 + 锚点引用 + Prefab defs + `$ref` 共享引用。
- 不序列化：Logic 实例（由数据重建）、computed 缓存、GPU 资源。

### 3.6 Prefab 与实例化

千级相似对象不可能在 JSON 中全量展开，Prefab 是 G1（单 JSON 描述应用）的必要组成。**采用 JSON 内联 defs 形态**（独立 prefab 文件后续作为资源声明化的扩展，不进第一版）：

```ts
const view: View = {
    __type__: 'View',
    // 模板定义区：纯数据，不参与运行时响应式追踪
    defs: {
        prefabs: {
            CubePrefab: {                                      // Object3D 模板
                components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry' } }],
            },
        },
    },
    root: {
        __type__: 'Object3D',
        children: [{
            __type__: 'Object3D',
            name: 'Cube-1',
            prefabId: 'CubePrefab',                           // 引用模板（字段已存在于 Object3D）
            overrides: { position: { x: 1, y: 0, z: 0 } },    // 实例差异覆盖
        }],
    },
    // ...
};
```

语义约定：

- **实例化 = 深拷贝模板 + 递归合并 overrides**，发生在构造时（`logic()` 首次触达该节点），实例是独立的响应式数据，修改实例不影响模板与其他实例。
- **模板是数据不是运行时实体**：不创建 Logic、不进场景树、不响应式追踪。
- overrides 按路径深度合并（同名字段覆盖，缺失字段继承模板默认值）。
- 运行时动态实例化（如"克隆 Cube-1"）由 `clone()` 类 Logic 方法支持，本质同语义。

### 3.7 引用共享（`$ref`）

JSON 字面量中同一对象写两处就是两个独立对象——**共享必须显式表达**，采用 path 引用：

```ts
const view: View = {
    __type__: 'View',
    defs: {
        materials: {
            diffuse: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4' } } },
        },
    },
    root: {
        children: [{
            components: [{ __type__: 'MeshRenderer', material: { $ref: 'materials/diffuse' } }],
        }, {
            components: [{ __type__: 'MeshRenderer', material: { $ref: 'materials/diffuse' } }],  // 同一材质实例
        }],
    },
};
```

- `$ref` 在构造时解析为**同一 raw 对象**；reactive 经 WeakMap 缓存返回同一代理，共享语义天然正确：改一处（经代理）处处生效。
- 序列化器负责反向操作：检测到运行时的共享对象，自动提升到 defs 并以 `$ref` 替代（保存 → 加载 → 引用关系等价）。
- `$ref` 与 Prefab 共用 defs 区，路径语法与 3.4 的索引路径一致。

## 4. 响应式计算模型细则

### 4.1 失效粒度：变更驱动为主，帧驱动为白名单例外

- **默认**：所有派生节点按数据依赖失效。脚本 update、用户交互修改数据后，相关 computed 自动重算，无关节点不动。
- **白名单例外**（真正每帧都变的数据源，允许每帧失效下游）：
  - ~~canvas 交换链纹理~~（已从目标模型移除：呈现目标在 submit 执行时解析，不进响应式图，见 4.2）
  - 时间源（`u_time` 等动画 uniform；未被消费时不失效任何节点）
- **禁止**：类似当前 `frameVersion` 的全局每帧失效开关——它让"静态场景零运算"不可能成立。存量迁移见计划文档阶段 1。

### 4.2 拉取式求值规则

- computed 一旦求值即缓存，同一次读取链路内不重复计算。
- 帧循环唯一职责：读 `viewLogic.submit`（触发整图按需求值）并提交。
- **终点判据（G2 的可测量表述）**：静态场景下 `viewLogic.submit` 读取触发**零次** computed 重算，每帧 CPU 开销不随对象数增长（命令编码层的规模成本由 RenderBundle 解决，见 6.5）。为此画布交换链纹理**不进响应式图**——呈现目标在 `webgpu.submit` 执行时解析，数据图本身保持帧无关。
- **按需呈现（render-on-demand）**：数据无变化时**跳过整个渲染提交**——画布在未提交期间保持最后呈现的一帧（WebGPU 画布内容持续保留），不提交不丢画面。机制：`submitComputed` 把全局变更计数写入 submit 版本号，`webgpu.submit` 对比上次已提交版本，相同则直接返回（不编码、不提交）。帧循环保持拉取式检查（读版本号），不引入 effect。
  - 时间源联动：动画播放 → 时间推进 → 变更计数增长 → 每帧提交；动画暂停 → 计数静止 → 自动停止渲染。
  - 非响应式内容源（如 VideoTexture 的视频帧内容变化不经过响应式写入）必须显式标记脏（`markDirty` 类 API），否则呈现会停留在旧帧。
  - 画布尺寸变化 / 首帧自然覆盖：`canvaSize` 同步是响应式写入、初始版本必不同于"未提交"，无需特判。

### 4.3 副作用边界

- computed 内禁止：写 reactive 状态、触发 effect、分配 GPU 资源。
- **白名单例外（幂等触发）**：computed 内允许触发"幂等且记忆化"的加载请求（见 3.2.1 的 `requestLoad`：以 pending 集合去重，同一 key 不会重复发起，且不产生失效循环）。这是惰性资源加载的必要例外；除此之外 computed 内不得有任何副作用。
- GPU 上传：数据 → GPUBuffer 的同步发生在 submit 阶段，由 WebGPU 边界层在提交前统一 pull 差异上传（替代现在的写入时 push `writeBuffers`）。
- 命令式逃生舱：`Script.update` / `ticker` / **资源加载器的 Promise resolve** 保留——它们是响应式源（修改数据），不是派生节点，职责是"产生变化"而非"响应变化"。

### 4.4 惰性优先：effect 受限使用

**原则：统一使用惰性响应式（computed / 拉取求值），默认禁止 effect（立即响应式 / 推模式）。**

理由：

- effect 在写入发生时立即执行，破坏"最终使用时才做最小运算"的承诺（G2）——即使消费点（submit）尚未需要，运算已经发生。
- effect 的执行时机分散在各写入点，形成**隐形控制流**；纯 computed 图的求值顺序由依赖关系唯一确定，可推理、可可视化（第 9 章 devtools）。
- 拉取模式下"没人读的结果"自动不计算；effect 则无论是否被消费都会执行。

**effect 仅允许以下两类场景**：

1. **必须保留：与外部系统的边界同步**。引擎 → 外部世界中确实需要"变化即推送"的地方：DOM/UI 更新、日志与调试输出、音频等无法 pull 的外设。GPU 上传**不属于**此类——它是引擎内部行为，终态为 submit 阶段统一 pull（4.3）。**当前引擎内此类用例暂为空集**，白名单实际只含过渡类；新增边界类 effect 须先在本文档登记用例。
2. **过渡阶段：存量迁移桥**。当前 `WGPUBufferBinding` 的写入时 push `writeBuffers` 等 push 形态，属于向目标架构过渡的兼容层，必须在计划文档阶段 3 完成后消亡。每个过渡 effect 需注释标记 `@过渡 effect` 与对应的迁移任务，防止永久化。

**判定规则**：新代码出现 `effect()` 时默认视为违规，须自证属于上述两类之一。方向性检查：凡是"数据变了之后要做某事"，先问能否改写为"消费时从数据派生"（computed）；只有消费者是引擎外部的推模式系统时，effect 才是正确工具。

注意区分：**外部 → 引擎**的方向（输入事件、Script.update、Promise resolve）不使用 effect——它们直接写数据，是变更源（4.3 命令式逃生舱）；effect 只用于**引擎 → 外部**的同步方向。

### 4.5 时间与动画模型

**时间驱动命令式动画（唯一模型，2026-08-15 决策修订）。** `Animation.update(interval)` 累加 `time`，采样值**经响应式代理写入属性宿主**——动画是变更源头（4.3 命令式逃生舱），写入触发变更驱动渲染链自动更新。

- **通用性是决定性理由**：动画驱动的属性不止 Object3D 的 TRS——PropertyClip 的 path 系统本就指向任意宿主（材质 uniform、颜色、几何参数等）。声明式采样（动画值为 computed）只对自身 TRS 可行，为任意属性宿主发明采样扩展点会使复杂度爆炸，故回退（曾实现 declarative 模式 v1 后移除）。
- **写入必须经响应式代理**（规范 8）：裸写不触发失效——变更驱动渲染（阶段 1 移除 frameVersion）后画面不会更新。这是该模型与变更驱动架构契合的关键约束。
- 暂停即停：`isplaying = false` → update 停止写 time 与属性 → 全局变更计数静止 → 按需呈现自动停止提交（与 G2 自然衔接）。
- 分频更新（动画 60Hz、阴影 15Hz）不进第一版语义，benchmark 证明需要后再设计。

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
- **beforeRender 的正式定位（2026-08-15 修正）**：geometry / material / transform 已由 renderObject computed 变更驱动承担（3d 完成）；剩余的 beforeRender 分发是 **per-camera 数据的正式处理时机**——Billboard/HoldSize/公告牌粒子等矩阵依赖渲染它的相机，多相机下每相机不同，天然属于 pass 级（forward 注入 cameraUniforms 之后）而非 per-entity computed。原终态消亡表述作废。
- **变异型组件 computed 化**：Billboard / HoldSize 这类"修饰模型矩阵"的组件成为矩阵链上的独立节点：

```
local2world (computed) → billboardMatrix (computed，读 cameraUniforms) → renderObject
```

而非在管线执行期间改写 `renderObject.bindingResources.transform`。

- **pass 顺序**是隐式序（阴影在前、主 Pass 在后），在 `submitComputed` 中以显式序列表达，属于少数允许命令式编排的位置。

### 6.5 命令编码缓存（RenderBundle 自动化）

computed 链把派生开销降到零之后，剩余的每帧规模成本在**命令编码**：`webgpu.submit` 把 N 个 draw 逐条编码进 pass，CPU 随对象数线性增长。终态由 WebGPU RenderBundle 解决——**命令编码一次、逐帧重放**，使每帧 CPU 从 O(draw) 降到 O(pass)。

**与声明式绑定的契合（成立的前提）**：相机移动、动画等 uniform 更新走 **buffer 内容写入**（writeBuffer），不替换 bind group、不重编码命令——因此 uniform 变化**不使 bundle 失效**。失效条件仅为编码层面的变化：

| 变化 | bundle 是否失效 |
|------|----------------|
| uniform 数值变化（相机/动画/材质参数） | 否（buffer 内容更新） |
| renderObjects 列表变化（增删对象、剔除结果、排序变化） | 是（重录） |
| pipeline / 绑定包装对象替换 | 是（重录） |

**实现形态（webgpu 包内）**：

- 每个 render pass 按**指纹**缓存 bundle：指纹 = renderObjects 的身份序列 + 各自 pipeline/binding 包装对象的身份。指纹不变 → 直接 `executeBundles` 重放。
- bundle 缓存本身实现为 computed——与 G2 同构：静态场景指纹恒定，零重录。
- 排序敏感的对象（透明混合、按视距排序）**不进 bundle**，保持逐帧编码；不透明主体进 bundle。

**v1 取舍与演进**：

- 相机移动会改变剔除结果 → 指纹变化 → 重录。静态视点（编辑器、监控、展示类应用）与稳定场景是首要受益者；移动相机下重录成本 ≈ 当前逐帧编码成本，不劣化。
- 后续演进：空间分块 bundle（按 sector 录制，逐帧只执行可见 sector 的 bundle 列表），把重录频率从"剔除结果变化"降到"sector 内容变化"。
- RenderBundle 不支持 pass 起止与 compute pass；仅用于 render pass 的 draw 命令段。

## 7. 生命周期与资源回收

### 7.1 数据节点生命周期

```
构造（JSON 字面量）
   │  logic() 首次触达时惰性创建 Logic（WeakMap 缓存）
   ▼
挂载（push 进 parent 的 children / components 数组）
   │  响应式数组追踪 → 组件自动 init（entityLogic 既有机制）→ 场景派生链失效
   ▼
移除（splice / 替换数组元素）
   │  同一失效链路反向发生：renderObject 等派生节点不再依赖该节点
   ▼
逻辑销毁（dispose：级联子对象与组件）
   数据与 Logic 随 GC 回收
```

- 结构性变更（增删 children/components）统一走响应式数组语义，无特殊 API：写数组即挂载/移除，失效自动传播。
- Logic 的 `dispose()` 只负责级联与解除显式引用，不做 GPU 释放（见 7.2 分层）。

### 7.2 两级回收策略

**数据层 / Logic 层：WeakMap + GC，无显式销毁。** Logic 缓存、reactive 代理缓存都以 raw 对象为 key，脱离 JSON 树且无引用后自动回收。不为数据层设计引用计数——纯 JS 对象交给 GC 是正确工具。

**GPU 层：显式引用计数 + 显式 `destroy()`。** WebGPU 资源（GPUBuffer/GPUTexture/GPUBindGroup 等）不能只靠 GC——`GPUDeviceStats` 的 created/freed 统计与显存都要求确定性释放。规则：

- WGPU 缓存层（`WGPUBufferBinding` / `WGPUTextureView` 等，现基于 ChainMap + WeakMap）增加 **refcount**：消费者（RenderPass / BindingResources）开始使用某资源时 `retain()`，不再使用时 `release()`。
- refcount 归零 → 立即调用对应的 `destroy()` 并移除缓存条目，保证 `created == freed + 存活` 恒成立。
- 占位符换装、url 替换、对象从场景移除等所有"旧资源下岗"路径（3.2.4）都经由该机制回收。
- 数据从树移除后，其 GPU 资源经"派生链失效 → 消费者 release"确定性释放，不依赖 GC 时机。

**现状差距**：WGPU 缓存目前无 refcount（GPU 资源随代理/缓存对象 GC，`destroy` 不保证调用），为本章最大待实现项，已列入改造计划阶段 3。

## 8. 错误处理与数据校验

**双模式：dev 严格，prod 宽容。**

### 8.1 computed 求值异常

computed 链中某节点抛异常时，在 submit 拉取点统一捕获（拉取模型的优势：异常收敛到唯一的消费入口，不会散落在各 effect）：

- **dev**：抛出（或 console.error）并附**数据路径定位**（哪个节点、哪个 Logic、依赖链摘要，配合 3.4 查询 API 与第 9 章 devtools），不静默。
- **prod**：降级——该节点保持上一次有效值（或字段默认值），错误计数上报，渲染不中断。

### 8.2 数据校验（JSON 侧）

| 错误 | dev | prod |
|------|-----|------|
| 未注册的 `__type__` | 报错并指出类型名 | 跳过该节点（子树不渲染）+ 错误计数 |
| 字段类型不匹配 | 警告（期望类型 / 实际值） | 静默使用默认值 |
| `getByPath` / `$ref` 路径不存在 | 报错并回显完整路径 | 返回 undefined + 错误计数 |

校验发生在 Logic 构造的默认值填充阶段（规范 11.5 的工厂补默认值处），不引入独立校验层。

### 8.3 资源加载错误

见 3.2.3：失败写 `error` 状态条目、保持占位符、重试仅由数据变更触发。

## 9. 工具链与生态

- **eslint-plugin-feng3d**：响应式纪律的强制层（`r_` 前缀 / 禁导出 / 禁传参），后续可增加"computed 内禁写 reactive"与"effect 使用需标注用途（必须保留 / `@过渡 effect`）"规则（见 4.4）。
- **devtools（目标）**：计算图可视化（节点 = computed，边 = 依赖），显示各节点上次求值时间与失效次数——这是调试"隐形控制流"问题的关键工具。
- **编辑器（目标）**：属性面板直接编辑应用 JSON；查询 API（3.4）为编辑器提供受控修改入口。
- **benchmark（验收基建）**：静态场景帧成本、失效传播开销、GC 频率作为架构决策的量化依据。

## 10. 非目标（明确不做）

- 不追求完全 FRP：输入、脚本、ticker 等命令式入口保留，它们是数据变化的源头。
- 不追求计算图严格为树：scene/camera 喂多个 renderer、renderObject 进多个 Pass 是必要的 DAG。
- **多 View / 多视口（分屏、小地图、编辑器多视口）暂不设计**：现状单 View 语义清晰，等编辑器需求明确后再引入共享场景树的多 View 语义。
- 分频时间订阅（降频更新）不进第一版（见 4.5）。
- 不做响应式系统的持久化订阅（保存/加载走序列化，不走变更流）。
- 不为 Unity/Godot 兼容性设计组件命名与结构。
