# Feng3D Web3D Engine

Feng3D 是一个基于 WebGPU 的 Web 3D 引擎 monorepo，统一管理所有 @feng3d/* 模块。

核心特性：**纯数据驱动**（整个应用用一个 JSON 描述）+ **响应式 computed 管线**（数据不变不计算，最终消费时才做最小运算）。目标架构详见 [FRAMEWORK_DESIGN.md](./FRAMEWORK_DESIGN.md)。

---

## 📐 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        应用层 (Application)                      │
│              一个 JSON 声明场景 + XLogic 提供行为                 │
└────────────────────────────────────────┬────────────────────────┘
                                         │ 纯数据（响应式源）
┌────────────────────────────────────────▼────────────────────────┐
│                           feng3d                                 │
│  场景图 • 组件系统 • 几何体/材质 • 渲染器（Forward/Shadow/        │
│  Outline/Wireframe）• View 的 submit 计算链                      │
└────────────────────────────────────────┬────────────────────────┘
                                         │ Submit（computed 派生）
┌────────────────────────────────────────▼────────────────────────┐
│                       @feng3d/webgpu                             │
│  WebGPU 抽象 • 声明式 Buffer/Texture 绑定 • 执行 Submit           │
│  WGPU* 缓存层自动资源管理                                         │
└─────────────────────────────────────────────────────────────────┘
```

**设计原则**（完整定义见 [FRAMEWORK_DESIGN.md](./FRAMEWORK_DESIGN.md)）：

- **数据即应用**：场景/组件/材质全部是带 `__type__` 的纯 JSON 字面量，可序列化往返
- **最小计算**：全链路 computed，无修改零运算，有修改在最终消费时仅做必要的最小运算
- **惰性优先**：统一 computed 拉取求值，默认禁止 effect（立即响应式），仅限外部系统边界同步与过渡阶段
- **模块独立**：模块间只通过数据连接，渲染链最终产出一个 `Submit` 交给 WebGPU

---

## 📦 Packages

### 核心层

| 包名 | 职责 | 文档 |
|------|------|------|
| [feng3d](packages/feng3d/) | 引擎核心：场景图、组件、几何体、材质、渲染器、View 提交链 | - |
| [@feng3d/webgpu](packages/webgpu/) | WebGPU 底层抽象：设备、缓冲、管线、命令编码、Submit 执行 | [README](packages/webgpu/README.md) |

### 基础库层

| 包名 | 职责 |
|------|------|
| [@feng3d/reactivity](packages/reactivity/) | 响应式系统（reactive / computed / effect / logic），API 与 @vue/reactivity 对齐 |
| [@feng3d/math](packages/math/) | 数学库：向量、矩阵、四元数等 |
| [@feng3d/event](packages/event/) | 事件系统 |
| [@feng3d/serialization](packages/serialization/) | 序列化任意对象 |
| [@feng3d/objectview](packages/objectview/) | 由数据对象自动生成界面 |
| [@feng3d/watcher](packages/watcher/) | 对象属性监听器 |
| [@feng3d/polyfill](packages/polyfill/) | 浏览器 Polyfill 与工具函数 |
| [@feng3d/path](packages/path/) | node.js path 模块的浏览器可用版本 |
| [@feng3d/shortcut](packages/shortcut/) | 快捷键管理 |

### 领域模块层

| 包名 | 职责 |
|------|------|
| [@feng3d/particlesystem](packages/particlesystem/) | 粒子系统 |
| [@feng3d/terrain](packages/terrain/) | 地形系统 |
| [@feng3d/addons](packages/addons/) | 非核心扩展（移植自 three.js 的几何体/函数库等），按需显式 import |

### 工程工具

| 名称 | 职责 |
|------|------|
| [eslint-plugin-feng3d](packages/eslint-plugin-feng3d/) | 强制响应式使用纪律的自定义 ESLint 规则（`r_` 前缀 / 禁导出 / 禁传参） |
| [@feng3d/error-logger](packages/error-logger/) | 前端日志收集 vite 插件 |
| [feng3d-examples](examples/) | 示例应用（vite dev server，含 e2e 视觉回归基线） |

---

## 🚀 快速开始

### 运行示例

```bash
npm install
cd examples && npm run dev     # http://localhost:3000
```

### 声明一个场景

整个场景是一个纯 JSON 字面量（完整示例见 [examples/src/base/Container3DTest.ts](examples/src/base/Container3DTest.ts)）：

```typescript
import { WebGPU } from '@feng3d/webgpu';
import { reactive, ticker, View, logic } from 'feng3d';

const webgpu = await new WebGPU().init();

const view: View = {
    __type__: 'View',
    canvas: document.getElementById('webgpu') as HTMLCanvasElement,
    root: {
        __type__: 'Object3D',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.4, g: 0.38, b: 0.36, a: 1 } }],
        children: [{
            __type__: 'Object3D', name: 'Main Camera',
            position: { x: 0, y: 1, z: 10 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D', name: 'Cube',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4' } } },
            }],
        }],
    },
};
const viewLogic = logic(view);

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
```

修改数据通过响应式代理进行，渲染链自动失效重算：

```typescript
reactive(cubeRotation).y += Math.PI / 180;   // 旋转 Cube
```

自定义行为通过「纯数据接口 + XLogic」扩展（完整示例见 [examples/src/base/ScriptTest.ts](examples/src/base/ScriptTest.ts)）。

---

## 👨‍💻 开发指南

### 环境要求

- Node.js >= 18
- 支持 WebGPU 的浏览器

### 常用命令

```bash
npm install               # 安装依赖
npm run build             # 构建引擎包
npm run types             # 类型检查
npm run test              # 单元测试（vitest）
npm run test:e2e          # e2e 视觉回归（playwright，基线在 .verify/）
npm run lint              # 代码检查（含 eslint-plugin-feng3d 响应式纪律规则）
```

> 提交规范、代码风格、响应式使用规则等**开发规范的唯一权威来源是 [AGENTS.md](./AGENTS.md)**。

---

## 📄 文档索引

| 文档 | 内容 |
|------|------|
| [FRAMEWORK_DESIGN.md](./FRAMEWORK_DESIGN.md) | 目标架构设计：纯数据驱动 + 响应式计算管线 |
| [docs/POSITIONING.md](./docs/POSITIONING.md) | 定位与竞争优势：目标场景、护城河分类、非目标 |
| [docs/ARCHITECTURE_V2.md](./docs/ARCHITECTURE_V2.md) | 架构演进规划 V2：分层蓝图、规范 R1–R12、实施路径 P0–P4 |
| [AGENTS.md](./AGENTS.md) | 开发规范（提交、代码风格、响应式规则等） |
| [docs/EDITOR_AI_BRIDGE.md](./docs/EDITOR_AI_BRIDGE.md) | **编辑器 AI 桥接**：让 AI（DSH 的 MCP 工具 / CLI）用语义化方法查询与操作编辑器场景——协议、方法表、AI 工作流建议、已知限制 |
| [packages/webgpu/README.md](packages/webgpu/README.md) | webgpu 库文档（架构速览 + 用法示例） |
| [BENCHMARK_BASELINE.md](./BENCHMARK_BASELINE.md) | 静态场景性能基线（三档规模） |
| [EFFECT_INVENTORY.md](./EFFECT_INVENTORY.md) | effect 使用点盘点（边界 / 过渡 / 违规） |
| [docs/archive/](./docs/archive/) | 历史文档归档（上一轮改造计划等，不再作为执行依据） |

---

## 🤝 贡献

1. Fork 本仓库
2. 创建特性分支
3. 提交更改（约定式提交，简体中文描述，见 [AGENTS.md](./AGENTS.md)）
4. 创建 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 🔗 相关链接

- [WebGPU 规范](https://www.w3.org/TR/webgpu/)
- [Gitee 仓库](https://gitee.com/feng3d/feng3d)
- [GitHub 仓库](https://github.com/feng3d-labs/feng3d)
