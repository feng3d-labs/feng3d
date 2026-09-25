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

### 3.4 字符串事件 → `effect()` 响应式

**主仓没有 `globalEmitter` / `anyEmitter`，也没有 `'addComponent'` / `'addChild'` 事件名**
（已实测搜索确认）。旧的事件驱动必须改为响应式：

```ts
// ✗ 旧：字符串事件
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

**规模**：editor 中 `.on/.off/.once` 共 **114 处**，其中组件/子对象事件名 **10 处**。
其余 100+ 处是 UI/DOM/自定义事件，不一定要改——**只有依赖已删除 API 的才需迁移**。

### 3.5 `serialization.setValue(...)` → 直接响应式赋值

主仓**无 `setValue` 导出**（已实测确认）：

```ts
// ✗ 旧
serialization.setValue(icon, { light: null }).object3D.remove();

// ✓ 新
reactive(icon).light = null;
logic(icon.object3D).remove();   // 或对应删除方法，按主仓实际 API 调整
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
| `serialization.setValue(obj, { ... })` | **已删除** | `reactive(obj).field = v` |
| `scene.on('addComponent' / 'addChild' / ...)` | **已删除**（主仓无全局事件对象） | `effect(() => { const r_c = reactive(entity).components; ... })` |
| `getComponentsInChildren(SomeClass)` | **签名变更** | `logic(container).getComponentsInChildren('TypeName')`（传 `__type__` 字符串） |
| `xxxLogic(obj)` / `transformLogic(obj)` | **已统一** | `logic(obj)`（局部重名时用别名 `getLogic`，见 AGENTS §4） |
| `watcher.watch(obj, 'field', fn, this)` | **存在** | ✅ 用法可能微调，见 `packages/watcher/` |
| `ticker` / `shortcut` | 待确认 | — |
| `Feng3dObject`（组件基类） | **已删除** | — |

> 核对方式：任何「疑似已删除」的 API，用 `grep` 在主仓 `packages/*/src` 搜 `__type__: '<名字>'`
> 或 `interface <名字>` 确认现状，**不要凭猜测改写**。

### 3.7 属性面板（`@oav()`）的范式冲突 —— 需要独立决策

editor 的属性检查器用**装饰器**标注可编辑字段：

```ts
@oav()
private num = 100;
```

这是**架构冲突，而非 API 缺失**：新范式下数据类型是纯 interface，**装饰器无处可施**。

处理原则：
1. 迁移阶段先移除 `@oav()` 让类型通过（标记 `TODO` 注明属性发现机制待重建）；
2. 属性面板的字段发现应改为**直接遍历纯数据接口的字段**——数据驱动范式下，
   `data` 对象本身就是完整、自描述的属性来源，不再需要装饰器标注；
3. 该改造是**独立任务**，不计入 §5.2 的类型迁移批次。

同样性质的问题：`@RegisterComponent()`（已由 `registerLogic` 解决，见 §4）。

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
