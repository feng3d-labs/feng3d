# Editor → 主仓 API 迁移指南

> 分支：`feat/editor-api-migration`
> 基线：`npm run type-check --workspace feng3d-editor`（vue-tsc）→ **1337 行错误**
> 本指南是批量迁移的**唯一执行依据**：每条规则都来自实测，可直接机械套用。

---

## 1. 为什么需要迁移：不是改名，是换范式

editor 最后一次适配主仓在 **2026-07-04**。此后主仓经历三轮架构演进：

| 提交 | 删除/变更内容 | 对 editor 的影响 |
|---|---|---|
| `e4f11d92` (07-19) | 删除 assets 子系统（1399 行） | 资源/文件 API 消失 |
| `f80a182a` (07-25) | 移除 filesystem / assets / ui / tsl | 同上 |
| `f9671019` | 移除 `Feng3dObject` | 组件基类消失 |
| `c7a61f11` / `b289b462` | 移除 `createXxx()` 命令式 API | 构造方式变更 |
| — | `transformLogic` → `logic` 统一 | 取 Logic 方式变更 |

**关键结论**：旧的「class + 继承 + 字符串事件」范式在主仓**已整体不存在**。
editor 的 1337 个错误中，绝大多数不是「拼错了名字」，而是「整段代码用了已废弃的范式」。

---

## 2. 错误码分布（实测）

| 错误码 | 数量 | 含义 | 性质 |
|---|---|---|---|
| `TS2339` | 441 | 属性不存在 | 逐处对照 |
| `TS2693` | **348** | **类型仅表示类型，不能用作值** | **机械可改（范式）** |
| `TS2540` | **51** | **不能赋值给只读属性** | **机械可改（范式）** |
| `TS2305` | 51 | 模块没有导出成员 | 替换导入 |
| `TS2345` | 29 | 参数类型不匹配 | 逐处对照 |
| `TS2689` | 18 | 不能继承接口 | 机械可改（范式） |
| `TS2551` | 13 | 属性不存在（含拼写建议） | 逐处对照 |
| `TS2322` | 9 | 类型不可赋值 | 逐处对照 |
| 其他 | ~19 | TS2578 / TS2300 / TS2367 / TS2554 | 逐处 |

**优先信号**：`TS2693` + `TS2540` + `TS2689` = **417 处（31%）来自三个纯范式根因**，修完这三类即可消除约三分之一错误，且规则完全机械。

---

## 3. 核心范式对照表（机械规则）

### 3.1 类型不能作值（TS2693，348 处）

新范式中 `DirectionalLight`、`Component`、`Object3D` 等是**纯数据 interface**，只能出现在类型位置，
不能用于 `instanceof` / `new` / 作参数 / 作 `Map` 键。

| ✗ 旧写法 | ✓ 新写法 |
|---|---|
| `component instanceof DirectionalLight` | `component.__type__ === 'DirectionalLight'` |
| `new Object3D()` | `({ __type__: 'Object3D', name: 'x' }) as Object3D` |
| `getComponentsInChildren(Component)` | `logic(container).getComponentsInChildren('Component')` |
| `new Map<DirectionalLight, Icon>()` | `new Map<string, Icon>()`（键用 `__type__` + id，或改用数组） |
| `@RegisterComponent()` | `registerLogic('X', XLogic)`（见 §4） |
| `class X extends Component` | `interface X extends Component3D` + `class XLogic extends ComponentLogic` |

> 主仓的类型判别工具：`isRenderable(component)` / `isRayCastable(component)`（内部用 `__type__` 字符串 Set）。

### 3.2 只读字段必须经响应式写入（TS2540，51 处）

纯数据接口的字段类型上一律 `readonly`（根规范 §8.5），**直接赋值会报 TS2540**：

```ts
// ✗ 旧写法
object3D.name = 'DirectionLightIcon';
component.light = null;

// ✓ 新写法
import { reactive } from '@feng3d/reactivity';
reactive(object3D).name = 'DirectionLightIcon';
reactive(component).light = null;
```

注意 §8.4：**避免「读响应式再写回」**。从 raw 读当前值，向代理写新值。

### 3.3 取 Logic 统一走 `logic()`（替代所有 `xxxLogic` 函数）

```ts
// ✗ 旧
transformLogic(object3D).position
componentLogic(component)

// ✓ 新
import { logic } from '@feng3d/reactivity';
logic(object3D).position
logic(component)
```

签名（`packages/reactivity/src/logic.ts:110`）：

```ts
export function logic<K extends keyof LogicMap>(data: { __type__: K }): LogicMap[K]
```

> ⚠️ 类型声明为**非空**，但运行时未注册类型会返回 `null`（R6 已知违规项）。
> 迁移时按「可能为 null」防御性编写，不要依赖类型声明的非空。

### 3.4 组件实例事件 → `effect()` 响应式

> ⚠️ **本节曾判断错误，已修正**。此前写作「主仓没有 `globalEmitter` / `anyEmitter`」是**错的**——
> 只搜了 `packages/feng3d/src` 目录内部，漏掉了 `feng3d/src/index.ts:106` 的
> `export * from '@feng3d/event'` 这条 re-export 通道。

**必须区分两类事件**：

| 类型 | 现状 | 处理 |
|---|---|---|
| **全局事件总线** `globalEmitter` / `anyEmitter` | ✅ **仍然存在**（`packages/event/src/GlobalEmitter.ts:16`、`AnyEmitter.ts:184`） | **保留原样，不要改** |
| **组件 / 对象实例事件**：`'addComponent'`、`'removeComponent'`、`'addChild'`、`'removeChild'`、`'scenetransformChanged'`、`'lensChanged'`、`'addedToScene'` | ❌ **已废除**（`Entity` / `Container` 改用 `effect` 驱动结构同步） | 改为 `effect()` 读 `reactive(entity).components` |

旧**实例事件**必须改为响应式：

```ts
// ✗ 旧：组件实例事件
scene.on('addComponent', this._onAddComponent, this);
scene.off('removeComponent', this._onRemoveComponent, this);

// ✓ 新：effect 监听数据变化
effect(() =>
{
    const r_components = reactive(entity).components;   // 建立依赖
    // 响应结构变化
});
```

参考实现：`packages/feng3d/src/core/Entity.ts:116`（主仓自己如何响应 components 变化）。

**规模**：editor 中 `.on/.off/.once` 共 **114 处**，其中组件/子对象**实例**事件名 **10 处**。
其余 100+ 处是 UI/DOM/自定义/全局事件，不一定要改——**只有依赖已废除 API 的才需迁移**。

### 3.5 `serialization.setValue(...)` → 推荐改为纯数据字面量

> ⚠️ **本节曾判断错误，已修正**。**`serialization` 仍然存在**：
> `packages/serialization/src/Serialization.ts:451` 有 `export const serialization = new Serialization()`，
> `setValue<T>(target: T, source: gPartial<T>)` 在 **354 行**（`@feng3d/serialization`，
> 经 `feng3d/src/index.ts:114` 的 `export * from '@feng3d/serialization'` 挂到 `feng3d`）。

迁移中**仍推荐**改用纯数据字面量——理由**不是 API 缺失**，而是字面量更符合
「纯数据声明式」范式（根规范 §2 / §11），而 `setValue` 是命令式赋值：

```ts
// ⚠️ 旧写法（能编译，但命令式）
serialization.setValue(icon, { light: null });

// ✓ 推荐：纯数据字面量 / 响应式赋值
reactive(icon).light = null;
logic(icon.object3D).dispose();
```

### 3.6 关键 API 变更总表（均已实测确认）

| 旧 API（editor 在用） | 主仓现状 | 替代写法 |
|---|---|---|
| `@RegisterComponent()` | **已删除** | `registerLogic('X', XLogic as unknown as new (data: X) => XLogic)` |
| `MixinsComponentMap` | **已删除** | `declare module 'feng3d' { interface ComponentMap { X: X } }` |
| `class X extends Component` / `Behaviour` / `Script` | **接口不能继承**（TS2689） | `interface X extends Behaviour` + `class XLogic extends BehaviourLogic` |
| `Camera` + `PerspectiveLens`（`camera.lens`、`instanceof PerspectiveLens`） | **已合并进相机** | `PerspectiveCamera`（内联 `fov` / `aspect` / `near` / `far`）；判别用 `__type__ === 'PerspectiveCamera'` |
| `Camera` + `OrthographicLens` | **已合并进相机** | `OrthographicCamera`（内联 `left` / `right` / `top` / `bottom` / `near` / `far`） |
| `new Texture2D()` | **已删除** | `{ __type__: 'Texture', ... }`（见 `packages/feng3d/src/textures/TextureResource.ts`） |
| `Transform` / `this.transform` | **已删除**（无独立 Transform 对象） | `logic(object3D).local2world`（`local2world` 直接挂在 Object3D 的 logic 上） |
| 组件内 `this.object3D`（访问所属实体） | **已删除** | `logic(component).entity`（`Component3DLogic.entity: Object3D \| null`） |
| `serialization.setValue(obj, { ... })` | **存在**（`@feng3d/serialization`，`Serialization.ts:354`） | 推荐改字面量（范式更纯）；运行时赋值仍可用 `setValue` 或 `reactive(obj).field = v` |
| `globalEmitter` / `anyEmitter`（全局事件总线） | ✅ **存在**（`@feng3d/event`，经 `feng3d` re-export） | **保留原样** |
| `scene.on('addComponent' / 'addChild' / ...)`（**组件实例事件**） | ❌ **已废除** | `effect(() => { const r_c = reactive(entity).components; ... })` |
| `getComponentsInChildren(SomeClass)` | **签名变更** | `logic(container).getComponentsInChildren('TypeName')`（传 `__type__` 字符串） |
| `xxxLogic(obj)` / `transformLogic(obj)` | **已统一** | `logic(obj)`（局部重名时用别名 `getLogic`，见 AGENTS §4） |
| `watcher.watch(obj, 'field', fn, this)` | **存在** | ✅ 用法可能微调，见 `packages/watcher/` |
| `ticker` / `shortcut` | 待确认 | — |
| `Feng3dObject`（组件基类） | **已删除** | — |

> 核对方式：任何「疑似已删除」的 API，用 `grep` 在主仓 `packages/*/src` 搜 `__type__: '<名字>'`
> 或 `interface <名字>` 确认现状，**不要凭猜测改写**。

### 3.7 属性面板（`@oav()`）的范式冲突 —— 需要独立决策

> ⚠️ **措辞修正**：`oav` **并未被删除**，它仍是可用 API。

editor 的属性检查器用**装饰器**标注可编辑字段：

```ts
@oav()
private num = 100;
```

`oav` 的实现（`packages/objectview/src/ObjectView.ts:117`）是标准**属性装饰器**：

```ts
export function oav(param?: OAVComponentParams)
{
    return (target: object, propertyKey: string) => { objectview.addOAV(target, propertyKey, param); };
}
```

冲突在于**装饰器只能作用于 class**，而新范式下数据类型是纯 interface，**装饰器无处可施**。

处理原则：
1. 迁移阶段先移除 `@oav()` 让类型通过（标记 `TODO` 注明属性发现机制待重建）；
2. 属性面板的字段发现应改为**直接遍历纯数据接口的字段**——数据驱动范式下，
   `data` 对象本身就是完整、自描述的属性来源，不再需要装饰器标注；
3. 该改造是**独立任务**，不计入 §5.2 的类型迁移批次。

同样性质的问题：`@RegisterComponent()`（已由 `registerLogic` 解决，见 §4）。

### 3.8 实测 API 对照表（`scripts/` 范本组编译通过后回填）

以下对照均已在 `scripts/` 组实际通过 `vue-tsc`，后续批次**可直接套用**：

| 旧写法 | 新写法（主仓实测签名） |
|---|---|
| `@RegisterComponent()` + `class X extends EditorScript` | `interface X extends EditorScript { readonly __type__: 'X'; ... }` + `class XLogic extends EditorScriptLogic` + `registerLogic('X', XLogic as unknown as new (d: X) => XLogic)` |
| `declare global { interface MixinsComponentMap { X: X } }` | `declare module 'feng3d' { export interface ComponentMap { X: X } }` + `declare module '@feng3d/reactivity' { interface LogicMap { X: XLogic } }` |
| `new Object3D()` + `addChild()` | `{ __type__: 'Object3D', children: [...] }`；运行时挂载用 `reactive(host).children.push(...)` |
| `addComponent(MeshRenderer)` | `components: [{ __type__: 'MeshRenderer', geometry, material }]` |
| `getComponent(Renderable)` | `getLogic(obj).getComponent<MeshRenderer>('MeshRenderer')`（**`Renderable` 不在 `ComponentMap`**） |
| `component.object3D` | `getLogic(component).entity` |
| `this.transform` / `logic(this.transform)` | 直接 `logic(object3D)`（`Object3DLogic` 自带全部矩阵 getter） |
| `logic(transform).worldPosition.value` | `logic(obj).worldPosition`（已是 `Vector3`，**非 `Computed`**） |
| `obj.activeSelf = v` | `reactive(obj).activeSelf = v`（logic 侧只读 getter） |
| `this.enabled = false` | `super.dispose()`（`BehaviourLogic.dispose` 内部写 `enabled = false`） |
| `watcher.watch(this, 'light', cb, this)` | `effect(() => { reactive(data).light; const light = data.light; ... })`（§8.4：代理建依赖、raw 取值） |
| `on('scenetransformChanged' / 'lensChanged')` | `effect` 读 `logic(cameraObj).local2world` / `logic(camera).projectionMatrix` |
| `new Texture2D(); t.source = { url }; t.format = RGBA` | `s_texture: { __type__: 'Texture', url }`（`TextureResource`，消费点懒加载换装） |
| `new TextureMaterial()` + 逐字段赋值 | `{ __type__: 'TextureMaterial', uniforms, s_texture, blend }`（`uniforms` / `s_texture` **必填**） |
| `setBlendEnabled(mat, true)` | `blend: ALPHA_BLEND`（数据字段） |
| `reactive(mat.uniforms).u_x = new Color4(...)` | 字面量内 `uniforms: { u_x: { __type__: 'Color4', r, g, b, a } }` |
| `new Color4()` / `new Color3()` / `color.toColor4()` | `{ __type__: 'Color4', r, g, b, a }`（Color3/Color4 已是纯数据接口，**无方法、不可 `new`**） |
| `new Segment()` | `{ start, end, startColor, endColor }`（**四项全必填**） |
| `geo.segments.length = 0; geo.addSegment(s)` | `reactive(geo).segments = segments`（**无 `addSegment`**） |
| `new PointGeometry()` / `PlaneGeometry()` / `SphereGeometry()` | `{ __type__: 'PointGeometry', points }` / `{ __type__: 'PlaneGeometry', width, height, segmentsW, segmentsH, yUp }` / `{ __type__: 'SphereGeometry', radius }` |
| `BillboardComponent` + `.camera =` | `{ __type__: 'Billboard' }`（**无 camera 字段**，从 cameraUniforms 自动取） |
| `HoldSizeComponent` + `.camera =` | `{ __type__: 'HoldSize', holdSize }`（同样无 camera） |
| `camera.lens.*` | `(camera as PerspectiveCamera).fov/aspect/near/far`；正交用 `(camera as OrthographicCamera).left/right/top/bottom/near/far` |
| `serialization.setValue(obj, { ... })` | 推荐改纯数据字面量（`serialization` 本身仍存在，见 §3.5） |
| `object3D.remove()` | `logic(obj).dispose()` |
| `Transform.inverseTransformDirection(v)` | `Matrix4x4.transformVector3` |
| `Transform.world2localPoint(p)` | `Matrix4x4.transformPoint3` |
| `Transform.setLocal2world(m)` | **无替代** → 自建（见 `packages/editor/src/scripts/iconUtils.ts` 的 `setWorldMatrix`） |

> **声明合并已硬性验证**：`ComponentMap` 增强可使 editor 组件类型并入 `Components` 联合并可作为
> `Object3D.components`；`LogicMap` 增强可使 `logic(cameraIcon)` 正确推断为 `CameraIconLogic`。
> `declare module 'feng3d'` 对 `export *` 重导出的空接口增强**有效**——其余 15 个 editor 组件可放心沿用。

---

## 4. 自定义组件的接入机制（editor 的 16 个组件）

主仓通过**可合并的空 interface** 开放扩展点，`packages/addons/src/geometries/CircleGeometry.ts` 是标准范例：

```ts
// packages/feng3d/src/component/Component.ts:7
export interface ComponentMap { }                        // ← 空接口，供 declaration merging
export type Components = ComponentMap[keyof ComponentMap];
```

editor 的每个自定义组件按此模式接入：

```ts
import { Component3D, ComponentLogic } from 'feng3d';
import { registerLogic, reactive } from '@feng3d/reactivity';

// 1) 注册到主仓的两个映射表
declare module 'feng3d'
{
    interface ComponentMap
    {
        CameraIcon: CameraIcon;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        CameraIcon: CameraIconLogic;
    }
}

// 2) 纯数据接口（只读字段；构造参数可选，工厂补默认）
export interface CameraIcon extends Component3D
{
    readonly __type__: 'CameraIcon';
    readonly camera?: Camera;
    readonly editorCamera?: Camera;
}

// 3) Logic 类（行为；protected constructor + static create）
export class CameraIconLogic extends ComponentLogic
{
    protected constructor(data: CameraIcon)
    {
        super(data);
    }

    static create(data: CameraIcon): CameraIconLogic
    {
        return new CameraIconLogic(data);
    }
}

// 4) 注册
registerLogic('CameraIcon', CameraIconLogic as unknown as new (data: CameraIcon) => CameraIconLogic);
```

**待迁移的自定义组件清单（16 个，全部 `extends Component`）**：

| 文件 | 行数 |
|---|---|
| `feng3d/mrsTool/MRSToolTarget.ts` | 352 |
| `feng3d/mrsTool/models/RToolModel.ts` | 343 |
| `feng3d/scene/SceneRotateTool.ts` | 294 |
| `feng3d/Feng3dScreenShot.ts` | 256 |
| `feng3d/mrsTool/models/MToolModel.ts` | 248 |
| `feng3d/hierarchy/Hierarchy.ts` | 225 |
| `feng3d/mrsTool/RTool.ts` | 194 |
| `feng3d/mrsTool/MTool.ts` | 184 |
| `feng3d/EditorComponent.ts` | 183 |
| `feng3d/mrsTool/STool.ts` | 161 |
| `feng3d/mrsTool/MRSTool.ts` | 161 |
| `feng3d/mrsTool/MRSToolBase.ts` | 155 |
| `feng3d/EditorView.ts` | 131 |
| `feng3d/mrsTool/models/SToolModel.ts` | 115 |
| `feng3d/hierarchy/HierarchyNode.ts` | 87 |
| `feng3d/GroundGrid.ts` | 77 |
| `navigation/Navigation.ts` | — |

> `MToolModel.ts` / `RToolModel.ts` / `SToolModel.ts` 各含多个组件类，实际类别数 > 16。

---

## 5. 分批迁移计划

### 5.1 实测错误分布（按模块）

用 `vue-tsc` 输出的错误日志按目录聚合（总约 968 处）：

| 模块 | 错误数 | 说明 |
|---|---|---|
| `feng3d/mrsTool/` | **279** | 最复杂（移动/旋转/缩放工具 + 坐标轴模型），建议最后做 |
| `scripts/`（4 个 Icon + MouseRayTest） | **203** | `PointLightIcon` 64 / `SpotLightIcon` 56 / `CameraIcon` 44 / `DirectionLightIcon` 32 / `MouseRayTestScript` 7 |
| `vue-app/` | **209** | `components` 87 / `objectview` 63 / `views` 57 / `stores` 2 |
| `feng3d/`（除 mrsTool） | **175** | `EditorComponent` 46 / `EditorView` 31 / `Feng3dScreenShot` 27 / `hierarchy` 24 / `scene` 22 / `src` 13 / `GroundGrid` 12 |
| `navigation/` | **53** | `Navigation` 33 / `NavigationProcess` 20 |
| 其他 | **41** | `ui/assets` 17 / `run.ts` 6 / `shortcut` 6 / `utils/materialRenderState` 5 / `configs` 5 / `polyfill` 2 |

### 5.2 批次划分

按「先建立范本 → 再机械铺开 → 最后攻坚」排序：

| 批次 | 范围 | 错误数 | 状态 |
|---|---|---|---|
| **3a** | `transformLogic` → `logic`（18 文件，78 处） | 984 → 966 | ✅ 已提交 `73f2278b` |
| **3b** | 验证已删除 API 清单（`Transform`/`Feng3dObject`/`createXxx`/`addComponent` 等） | — | ✅ 已完成 |
| **3c** | **范本组**：`scripts/`（`EditorScript` 基类 + 4 个 Icon）——建立可复用的改写范式 | 203 | 🔄 进行中 |
| **3d** | `feng3d/` 核心：`EditorComponent` + `EditorView` + `GroundGrid` + `hierarchy` + `scene` | 175 | ⬜ 待做 |
| **3e** | `vue-app/`（Vue 层，与 3d 并行可行） | 209 | ⬜ 待做 |
| **3f** | `navigation/` + 其他零散 | 94 | ⬜ 待做 |
| **3g** | `feng3d/mrsTool/`（最复杂，依赖前面批次建立的范式） | 279 | ⬜ 待做 |

**为什么 `scripts/` 是范本组**：`EditorScript` 是 4 个 Icon 的公共基类，而 Icon 又是
「组件创建 + 子对象 + 材质/几何体 + 只读写入 + 类型判别 + 事件」六种范式的全集，
改完这一组即验证了本指南的**全部规则**，后续批次可直接照抄结构。

---

## 6. 验收标准

每批次完成必须满足：

1. `npm run type-check --workspace feng3d-editor` 错误数**严格下降**且记录到本文件 §5 表格
2. 主仓基线不回退：`feng3d` / `webgpu` / `reactivity` / `filesystem` / `assets` 的 `tsc --noEmit` 均 exit=0
3. 主仓测试基线保持：**70 文件 / 632 测试通过**
4. 提交规范：Conventional Commits + 简体中文，一次提交只做一类改动
5. 每批完成即在 `feat/editor-api-migration` 上提交，阶段成果经 PR 合入 `master`

---

## 7. 重要约束

- **`packages/editor/**` 当前在根 `eslint.config.js` 的 `ignores` 中**（带 TODO）。
  API 迁移完成后必须移除该 ignore，让 editor 纳入响应式规则检查（`r_` 前缀 / 不导出响应式 / 不传响应式参数）。
- editor 的 `tsconfig.json` 与主仓**严格度不同**：迁移时不要把主仓的 `strictNullChecks` 等设置直接套用。
- **不要为通过类型检查而放宽类型**（加 `any` / `@ts-ignore` / 关 strict）。
  错误数下降必须来自真实适配，否则只是把债务换了形式。

---

## 8. 已知功能缺口（迁移导致的行为退化）

迁移中确认主仓**已删除且无替代**的能力。这些**不是类型问题，而是功能损失**，
需要独立决策（补主仓能力 / 换实现 / 接受退化）：

| 缺口 | 原用途 | 处数 | 处理 |
|---|---|---|---|
| `Object3D.hideFlags = HideFlags.Hide` | 图标对象在层级面板中隐藏 | 6 | 丢弃。主仓 `Object3D` 无该字段；`HideFlags` 枚举仍导出但**全仓 0 消费方**（孤儿导出） |
| 组件 per-object `mousedown` 事件 | 点击图标选中相机 / 光源 | 4 | 保留 `selectCamera()` / `selectLight()` 公开方法并标 TODO；`Mouse3DManager` 中 `object3D.emit('mousedown')` **已被注释**，只剩未接线的 `pickClick` |
| `setDepthWrite(material, false)` | 关闭深度写入 | 1 | `TextureMaterial` 未暴露 depthWrite 数据字段（pipeline 是材质 logic 私有 `#renderPipeline`） |
| `Texture2D.premulAlpha` / `TextureFormat.RGBA` | 纹理格式控制 | 各 3 | 声明式 `{ __type__: 'Texture', url }` 无对应字段（加载器固定 `rgba8unorm`） |
| `Scene.mouseRay3D` | 鼠标射线 | 1 | ✅ 已用场景相机 `getRay3D(ndcX, ndcY)` 现算替代（NDC 按窗口尺寸换算，注释已说明视口假设） |

> **建议**：前四项各开一个 issue 跟踪——它们是**编辑器功能的真实缺失**，
> 不会因为类型错误清零而自动恢复。

---

## 9. 类型可构造性矩阵（决定 `new X()` 是否合法）

**这是最容易踩的坑**：`feng3d` 桶**同时**导出了两套颜色/数学类型，且
**显式命名导出优先于 `export *`**：

```ts
export type { Color3 } from './core/Color3';   // ← 纯 interface（新范式）
export type { Color4 } from './core/Color4';   // ← 纯 interface
export * from '@feng3d/math';                  // ← 含 class 版 Color3 / Color4
```

因此 `import { Color4 } from 'feng3d'` 拿到的是 **interface**，`new Color4()` 运行时抛
`TypeError: Color4 is not a constructor`；而 `Vector3` 只由 `@feng3d/math` 提供，
是 **class**，`new Vector3()` 完全合法。

| 类型 | 形态 | `new` 是否合法 | 来源 |
|---|---|---|---|
| `Vector3` / `Vector2` / `Vector4` | class | ✅ | `@feng3d/math` |
| `Matrix4x4` / `Matrix3x3` | class | ✅ | `@feng3d/math` |
| `Rectangle` | class | ✅ | `@feng3d/math` |
| `Plane` | class | ✅ | `@feng3d/math` |
| **`Color3`** | **interface** | ❌ 崩 | `feng3d/src/core/Color3.ts`（显式导出优先） |
| **`Color4`** | **interface** | ❌ 崩 | `feng3d/src/core/Color4.ts`（显式导出优先） |
| **`Quaternion`** | **interface** | ❌ 崩 | `@feng3d/math/src/geom/Quaternion.ts` |

**迁移写法**：

```ts
// ✗ 运行时崩
const c = new Color4(1, 0, 0, 0.5);

// ✓ 纯数据字面量
const c: Color4 = { __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.5 };
```

注意 `Color4` / `Color3` 的字段**全部可选**（缺失时由消费方补默认），
且**没有** `fromUnit()` / `fromUnit24()` / `BLACK` 等静态成员 —— editor 中这些调用需一并改写。

**受影响范围**（实测约 30 处）：`ColorPicker.vue`、`ColorPickerView.vue`、`OAVColorPicker.vue`、
`MinMaxCurveEditor.vue`、`MinMaxCurveView.vue`、`MinMaxGradientView.vue` 等颜色编辑组件。
这些崩在**组件挂载 / 交互时**（不是模块加载期），不阻塞编辑器启动，
但会让属性面板的颜色编辑整体不可用。

**判别原则**：改写任何 `new X()` 之前，先确认 X 的形态，**不要凭印象**：

```powershell
Get-ChildItem 'packages/<pkg>/src' -Recurse -Filter *.ts |
    Select-String "export (class|interface) X\b"
```

---

## 10. 颜色编辑迁移成果与长期边界

颜色编辑已在 `vue-app/components/` 与 `objectview/oav/` 两处完成迁移，旧 class 方法**统一收敛到新模块**
`packages/editor/src/utils/colorUtils.ts`（纯函数、无副作用、不写数据）。

### 10.1 工具函数替代关系

| 旧 class 方法 / 静态成员 | 新工具函数 |
|---|---|
| `toInt()` / `toHexString()` | `colorToInt()` / `colorToHexString()`（后者保留旧语义：大写，Color4 为 `AARRGGBB`） |
| `fromUnit(v)`（ARGB 语义）/ `fromUnit24(v)` | `colorFromUnit(v, a?)` / `colorFromUnit24(v, a=1)` |
| `toColor3()` / Color3 → Color4 | `color4ToColor3()` / `color3ToColor4()` |
| `mix()` / `mixTo()` | `color3Mix(a, b, rate)`（**非变异**） |
| `equals()` | `color3Equals()`（1e-6 精度，与旧实现一致） |
| `Color4.BLACK` / `.WHITE` | `COLOR4_BLACK` / `COLOR4_WHITE`（`COLOR3_*` 同理） |
| —— | `colorToHex()`（`#rrggbb` 小写）、`colorToCssRgb()` / `colorToCssRgba()` |

判别统一用 `isColor4()` / `isColor3()`（基于 `__type__`），**不要用 `instanceof`**（运行时没有构造器）。

### 10.2 一个容易漏掉的响应式陷阱（Vue 侧）

**Vue 的 props 是 `shallowReactive`**：`props.color` 是原始对象，直接读 `props.color.r`
**不会建立响应式依赖**，因此输入框 / 取色矩形不会随颜色变化刷新——这是「颜色面板不可用」
除 `new` 崩溃之外的另一半原因。正确做法是在闭包内经 Vue 的 `reactive()` 代理读字段，
返回**普通快照**（代理不外泄，符合根规范 §8.2 / §8.6）。

### 10.3 长期存在的形态边界（需主仓根治）

| 边界 | 说明 | 现状处理 |
|---|---|---|
| **`ImageUtil` 参数仍是 math class `Color4`** | 直接传纯数据 `{ __type__: 'Color4' }` 会 TS2345（缺 `__class__` / `setTo` 等约 20 个成员） | 必须经 `toImageUtilColor()` 做边界转换（内部一次 `as unknown as` 并注释说明；调用路径只读 r/g/b/a，运行时安全） |
| **`Gradient` / `MinMaxGradient` / `MinMaxCurve` 仍是 math class** | 关键点颜色是 class 实例、无 `__type__`，且 `Gradient.getColor()` 会调用实例方法 `v.mixTo(...)` | 读取侧用 `ColorLike`（`{r?,g?,b?,a?}`）兼容；**写入侧不可整体替换为字面量**，否则渐变采样会崩在 `mixTo is not a function` |
| **默认值口径不一致** | `colorToHexString` 按主仓约定缺失分量补 `1`（白，依据 `webgpu/caches/color4Logic.ts` 的 `?? 1`），而部分 editor 代码补 `0`（黑） | 字段齐全时完全等价；仅「漏写 r/g/b 的异常字面量」会出现色块与 Hex 框不一致，后续统一到 `colorToCssRgb` / `colorToCssRgba` |

> 根治需主仓把这些类型迁为纯数据接口。在此之前，**`colorUtils.ts` 是唯一合法的颜色形态转换层**，
> 不要在业务代码里各自 `as any` 绕过。

---

## 11. 定向类型检查的正确姿势（避免假阳性）

各批次为规避 `vue-tsc` 的耗时与并发限制，普遍采用「临时 tsconfig + 白名单 + 纯 `tsc`」自验。
手法有效，但**白名单必须包含 `src/polyfill/**`**，否则会看到一批**假报错**。

**原因**：`globalEmitter` 的事件名依赖 `src/polyfill/feng3d/EventDispatcher.ts` 里的

```ts
declare global { interface MixinsGlobalEvents { /* ... */ } }
```

声明合并。若白名单未把它纳入编译图，合并不生效，于是所有 `globalEmitter.emit('xxx')` /
`.on('xxx')` 都会报类型不匹配。

**实测受影响**（加 include 后**全部消失**，均非真实缺陷）：

| 文件 | 假报错内容 |
|---|---|
| `vue-app/components/MenuAdapter.ts` | `'menu.show'`（3 条） |
| `vue-app/stores/editorStore.ts` | `'editor.toolTypeChanged'` 等（3 条） |
| `ui/assets/EditorAsset.ts` | 6 条事件名 |

**正确做法**：

- 白名单至少 include：目标目录 + `src/polyfill/**/*.ts` + `src/vue-shims.d.ts`（跑 `.vue` 时）
- **不要**在调用点加 `as any` / `@ts-ignore` 绕过——那会把假报错固化成真债务

**另一条经验**：白名单跑 `.vue` 时需把 `<script setup>` 抽出为临时 `.ts`（SFC 宏用 `declare` 模拟），
且**临时文件要放在 `src/` 之外**，否则会污染并行批次的 `src` 目录类型检查范围。

---

## 12. WebGPU 离屏渲染取像素的正确姿势（`Feng3dScreenShot` 缩略图）

迁移动机：`Feng3dScreenShot` 原本走命令式渲染（`ForwardRenderer.draw(gl, ...)` /
`View.setSize()` / `View.render()` / `camera.lens`），这些 API 已全部移除，导致
资源缩略图整体不可用（`drawTexture` / `drawMaterial` / `drawGeometry` /
`drawObject3D` / `toDataURL` 全是待迁移占位）。

**关键结论（实测得出）**：

1. **不要用 `canvas.toDataURL()` 取 WebGPU 画布的像素**。
   对 WebGPU 画布，`toDataURL` 拿到的内容**取决于浏览器合成时机**，提交后立即调用通常得到空白帧，
   属于不可靠做法。

2. **正确姿势是 `webgpu.readPixels()`**：GPU → CPU 拷贝，`await` 返回即代表像素已就绪，
   而不是靠定时器猜时机。

   ```ts
   const webgpu = await this.#ensureWebGPU();
   // 标记一次数据变更：`WebGPU.submit` 对版本号未变的 Submit 会**跳过**（按需呈现）
   // ...（触发一次被追踪的数据写入）
   webgpu.submit(this.viewLogic.submit);          // submit 是 getter，同步构建提交链
   const pixels = await webgpu.readPixels({ ... }); // 队列中顺序执行，await 即完成
   return this.#pixelsToDataURL(pixels.result, pixels.format, width, height);
   ```

3. **签名必须是异步**（`Promise<string>`）。因为第 2 步只能 await，而同步签名无法表达
   「等待 GPU 完成」。调用方 `AssetNode.#updatePreview` 已适配
   `() => string | Promise<string>` + `await`，因此同步实现（如 2D canvas 绘制的
   `drawTexture`）也能共存。

4. **单次触发渲染是可行的**（无需 ticker）：参考 `examples/src/base/Container3DTest.ts`
   与 `PrefabTest.ts`，它们直接 `webgpu.submit(viewLogic.submit)` 而不依赖帧循环。

5. **需要串行化**：多次缩略图生成会共享 WebGPU 设备/画布，必须排队
   （`Feng3dScreenShot` 内部用私有 `#enqueue` 把并发请求串行化），否则互相覆盖。

**教训**：这里的难点不是"API 改名"，而是**渲染模型的范式差异**——命令式"画一次读一次"
变成了"提交 → 等待 GPU → 读回"。这类改动必须重新设计，不能靠替换符号完成。
