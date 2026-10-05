# feng3d

Feng3D 引擎核心包：场景图、组件系统、几何体/材质、渲染器、以及 `View` 的 `submit` 计算链。

引擎的定位与两条根本特性是 **纯数据驱动**（整个应用用一个带 `__type__` 的 JSON 描述）与 **响应式 computed 管线**（数据不变不计算，最终消费时才做最小运算）——目标架构见 [FRAMEWORK_DESIGN.md](../../FRAMEWORK_DESIGN.md)，分层蓝图与规范 R1–R12 见 [docs/ARCHITECTURE_V2.md](../../docs/ARCHITECTURE_V2.md)。

本包**不直接接触 WebGPU API**（源码中无 `navigator.gpu` / `GPUDevice` / `device.create*`）：它引用 [@feng3d/webgpu](../webgpu/README.md) 的纯数据类型与工具（`RenderObject` / `RenderPipeline` / `VertexAttributes` / `Texture` / `BufferBinding`…）来描述「要提交什么」，渲染链最终产出一个 `Submit` 纯数据对象，由 `WebGPU.submit` 执行。

```ts
import { logic, reactive, ticker, View } from 'feng3d';      // 场景、组件、渲染链
import { WebGPU } from '@feng3d/webgpu';                      // GPU 执行
```

---

## 能力清单

| 领域 | 内容 |
|---|---|
| **场景图** | `Object3D`（变换 / 父子层级 / 按名查找）、`Container`、`Entity`、`TransformLayout`、`Prefab`、`GetByPath`（`findByName` / `getByPath`）、`HideFlags` |
| **组件系统** | `Component`、`Behaviour`、`Script`、`MeshRenderer`、`Graphics`、`Billboard`、`Cartoon`、`OutLine`、`Wireframe`、`HoldSize` |
| **相机** | `Camera`、`PerspectiveCamera`、`OrthographicCamera` |
| **光源与阴影** | `DirectionalLight`、`PointLight`、`SpotLight`、`LightType`、`ShadowType`、`LightPicker` |
| **几何体** | `Geometry`、`CustomGeometry`、`GeometryUtils`、`PointGeometry`、`SegmentGeometry`；内置体元：`Cube` / `Sphere` / `Plane` / `Quad` / `Cylinder` / `Cone` / `Capsule` / `Torus` |
| **材质** | `Material`（虚类基接口，不预设字段；子类各自声明 uniforms / renderPipeline / sampler / textureView 并经 `MaterialMap` 纳入联合类型）、`ColorMaterial`、`TextureMaterial`、`NormalMaterial`、`PointMaterial`、`SegmentMaterial`、`StandardMaterial`、`DebugShadowMapMaterial` |
| **渲染器** | `ForwardRenderer`、`ShadowRenderer`、`OutlineRenderer`、`WireframeRenderer`；渲染数据 `Index` / `Uniform` / `enums` |
| **拾取** | `Raycaster`（含层级包围盒剔除）、`ScenePickCache`（编辑器用）、`Mouse3DManager`（游戏侧鼠标拾取）、`RayCastable` |
| **动画** | `Animation`、`AnimationClip`、`PropertyClip`；骨骼 `Skeleton`、`SkinnedMeshRenderer` |
| **控制器** | `FPSController`、`OrbitControls`、`HoverController`、`LookAtController`、`ControllerBase` |
| **纹理与资源** | `TextureResource`、`createTexture`、`AssetType` |
| **音频** | `AudioSource`、`AudioListener` |
| **天空盒** | `SkyBox` |
| **工具** | `Ticker`（帧循环）、`Stats`、`Uuid`、`ImageUtil`、`FunctionWarp`、`RegExps`、`Menu`、`RunEnvironment`、`ObjectViewDefinitions` |

本包同时 `export *` 了它依赖的下层包（`@feng3d/reactivity` / `math` / `event` / `serialization` / `objectview` / `filesystem` / `path` / `polyfill` / `watcher` / `shortcut` / `assets` / `particlesystem` / `terrain`），所以只 `import 'feng3d'` 就能拿到 `reactive` / `computed` / `ticker` / `Vector3` 等。

---

## 快速开始

完整可运行示例（含相机、Cube、Cylinder、逐帧修改旋转与颜色）见
[examples/src/base/Container3DTest.ts](../../examples/src/base/Container3DTest.ts)。骨架：

```ts
import { WebGPU } from '@feng3d/webgpu';
import { findByName, getByPath, logic, reactive, ticker, View } from 'feng3d';
import type { Color4, Object3D } from 'feng3d';

const webgpu = await new WebGPU().init();

// ① 整个场景是一个纯 JSON 字面量：每个节点带 __type__
const view: View = {
    __type__: 'View',
    canvas: document.getElementById('webgpu') as HTMLCanvasElement,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.4, g: 0.38, b: 0.36, a: 1 } }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1, z: 10 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Cube',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4' } } },
            }],
        }],
    },
};

// ② 行为由 logic(data) 提供；submit 是 computed，提交时才做最小运算
const viewLogic = logic(view);

// ③ 查询 API 拿到可变引用（避免在字面量里捕获变量的技巧）
const cube = findByName(view.root, 'Cube') as Object3D;
const cubeRotation = cube.rotation as { readonly x: number; readonly y: number; readonly z: number };
const u_diffuseInput = getByPath(view, 'root/children/1/components/0/material/uniforms/u_diffuseInput') as Color4;

// ④ 修改：从原始对象读当前值、向响应式代理写新值（规范 8.4）
ticker.onframe(() =>
{
    reactive(cubeRotation).y = cubeRotation.y + Math.PI / 180;
    reactive(u_diffuseInput).r = Math.random();

    webgpu.submit(viewLogic.submit);
});
```

运行示例工程：

```bash
npm install
cd examples && npm run dev        # http://localhost:3000
```

---

## 核心概念

### 纯数据 + `__type__`

数据类（几何体、材质、颜色、组件…）只声明 `readonly` 字段，用 `__type__` 字面量声明，不使用 `new`、不调用 `createXxx()` 工厂：

```ts
const geometry: CubeGeometry = { __type__: 'CubeGeometry', width: 1 };
```

抽象基接口（如 `Geometry`）不声明 `__type__`，只构造具体子接口；构造参数一律可选，缺失字段由 Logic 工厂补默认值。

### 数据与行为分离：`logic(data)`

- 纯数据接口放**数据**（`interface Xxx`），`XxxLogic` 放**行为**（getter / computed / 方法），二者同文件、一一对应
- `XxxLogic` 是 class（不是 interface + 工厂），`protected constructor`，只有 `logic()` 能创建；实例对外**只读**
- `logic(data)` 返回 `Logic | null`，调用方须显式处理（R6）

```ts
const meshLogic = logic(meshRenderer);
if (meshLogic) { /* … */ }
```

### 写入经响应式代理

数据只读，修改走 `reactive(raw)` 代理；**从原始对象读，向代理写**（避免读响应式建立依赖）：

```ts
reactive(cubeRotation).y = cubeRotation.y + Math.PI / 180;   // ✓
cubeRotation.y += Math.PI / 180;                             // ✗ 数据是只读的
```

响应式对象只存在于函数/闭包内，不得导出、不得作为属性存储或函数参数传递——由
[eslint-plugin-feng3d](../eslint-plugin-feng3d/README.md) 的三条规则强制。

### 惰性优先

全链路 computed：无修改零运算，有修改在最终消费（`webgpu.submit`）时只做必要的最小运算。
`effect` 只用于外部系统边界与过渡阶段，使用点盘点见 [EFFECT_INVENTORY.md](../../EFFECT_INVENTORY.md)。

---

## 目录结构

```
src/
├── index.ts          # 公开导出面（+ export * 下层包）
├── core/             # Object3D / Container / Entity / Component / MeshRenderer / Renderable / View / Prefab / Ref
├── scene/            # Scene / ScenePickCache / SceneUtil
├── component/        # Behaviour / Script 之外的各类组件（Billboard / Cartoon / OutLine / Wireframe / Graphics …）
├── cameras/          # PerspectiveCamera / OrthographicCamera
├── light/            # DirectionalLight / PointLight / SpotLight / ShadowType / pickers / shadow
├── geometry/         # Geometry / CustomGeometry / GeometryUtils
├── primitives/       # Cube / Sphere / Plane / Quad / Cylinder / Cone / Capsule / Torus
├── materials/        # Material 与各内置材质
├── render/           # data/（Index / Uniform / enums）+ renderer/（Forward / Shadow / Outline / Wireframe）
├── pick/             # Raycaster
├── controllers/      # FPS / Orbit / Hover / LookAt
├── animation/        # Animation / AnimationClip / PropertyClip
├── animators/        # skeleton/（Skeleton / SkinnedMeshRenderer）
├── textures/         # TextureResource / createTexture
├── audio/ skybox/    # AudioSource / AudioListener、SkyBox
├── shaders/          # 内联 WGSL（由同目录 *.glsl 翻译而来）
├── test/             # 测试辅助（webgpu-stub / reactiveGeometryTest）
└── utils/            # Ticker / Stats / Uuid / ImageUtil / FunctionWarp / RegExps / ObjectViewDefinitions
```

单元测试与被测源码同目录（`src/**/*.spec.ts`，24 个）：

```bash
npx vitest run packages/feng3d      # 只跑本包
```

---

## 相关文档

| 文档 | 内容 |
|---|---|
| [FRAMEWORK_DESIGN.md](../../FRAMEWORK_DESIGN.md) | 目标架构：纯数据驱动 + 响应式计算管线（**设计原则的唯一权威定义**） |
| [docs/ARCHITECTURE_V2.md](../../docs/ARCHITECTURE_V2.md) | 分层蓝图、规范 R1–R12 与执行者、架构演进路径 P0–P4 |
| [docs/POSITIONING.md](../../docs/POSITIONING.md) | 定位与竞争优势、非目标 |
| [docs/CI.md](../../docs/CI.md) | CI 门禁与 npm 发布流程、已知缺口 |
| [docs/EDITOR_AI_BRIDGE.md](../../docs/EDITOR_AI_BRIDGE.md) | 编辑器 AI 桥接：用语义化方法查询/操作编辑器场景 |
| [EFFECT_INVENTORY.md](../../EFFECT_INVENTORY.md) | `effect` 使用点盘点（边界 / 过渡 / 违规） |
| [BENCHMARK_BASELINE.md](../../BENCHMARK_BASELINE.md) | 静态场景性能基线（三档规模） |
| [AGENTS.md](../../AGENTS.md) | 开发规范（提交、代码风格、响应式使用规则） |
| [packages/webgpu/README.md](../webgpu/README.md) | 下层 GPU 执行层：设备、缓存、命令编码 |
| [packages/editor/readme.md](../editor/README.md) | 基于本包的编辑器 |

---

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE)
