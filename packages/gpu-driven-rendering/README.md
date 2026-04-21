# @feng3d/gpu-driven-rendering

WebGPU 全GPU驱动渲染系统，提供高性能的 GPU 自治渲染解决方案。

---

## 概述

本包实现了完整的全GPU驱动渲染架构，物体的遍历、剔除、排序、命令生成全部由 GPU 完成，CPU 仅负责触发渲染。

### 系统要求

**本系统仅支持 WebGPU API**，需要兼容的浏览器和硬件：

#### 浏览器支持

| 浏览器 | 最低版本 | 发布时间 |
|--------|----------|----------|
| Chrome | 113+ | 2023年5月 |
| Edge | 113+ | 2023年5月 |
| Firefox | 113+ | 2023年10月 |

#### 硬件要求

- 支持 WebGPU 的 GPU（现代独立显卡或集成显卡）
- 详见 [WebGPU Device Support](https://caniuse.com/webgpu)

#### 不支持的浏览器

- Safari（WebGPU 支持开发中）
- 旧版 Chrome/Edge/Firefox
- 任何仅支持 WebGL/WebGL2 的浏览器

> **注意**：本系统**不提供 WebGL2 降级支持**。如需更广的浏览器兼容性，请考虑使用其他渲染方案或升级浏览器。

### 核心特性

- **全GPU驱动**：视锥剔除、遮挡剔除、LOD选择、深度排序、命令生成全由GPU完成
- **高性能**：批量渲染、最小化CPU-GPU同步、异步回读
- **可扩展**：支持静态/动态物体、多材质、阴影、后处理

### 性能指标

```
假设场景：1000透明物体，5种材质

GPU计算：    ~0.5ms（Bitonic Sort）
CPU回读：    ~0.01ms（600B批次信息，异步无等待）
Draw Calls: ~50次（按材质批次）
总开销：     ~0.5ms（60fps下占3%）
```

---

## 文档导航

### 📚 快速入口

| 文档 | 说明 |
|------|------|
| [开发进度](./PROGRESS.md) | 当前开发状态、任务清单、总体进度 |
| [快速开始指南](./docs/QUICKSTART.md) | 5分钟概念入门，30分钟实践指南 |
| [架构概览](./docs/00-architecture.md) | 整体架构、核心目标、设计原则 |

### 🔧 核心模块

| 模块 | 说明 | 文档 | 状态 |
|------|------|------|------|
| **核心渲染** | GPU生成绘制命令、间接绘制、批量渲染 | [01-全GPU渲染核心](./docs/01-gpu-rendering-core.md) | ⬜ 未实现 |
| **SDF光线前进** | 程序化几何、光线步进渲染 | [02-SDF光线前进](./docs/02-sdf-raymarching.md) | ⬜ 未实现 |
| **透明渲染** | 深度聚类排序、材质聚合、批次渲染 | [03-透明渲染](./docs/03-transparent-rendering.md) | ⬜ 未实现 |
| **3D Gaussian Splatting** | 高斯溅射场景重建和渲染 | [04-3D Gaussian Splatting](./docs/04-3d-gaussian-splatting.md) | ⬜ 未实现 |
| **剔除系统** | 视锥剔除、Hi-Z遮挡剔除 | [05-剔除系统](./docs/05-culling.md) | ⬜ 未实现 |
| **LOD系统** | 距离LOD选择、Dithered过渡 | [06-LOD系统](./docs/06-lod.md) | ⬜ 未实现 |
| **性能优化** | 性能监控、优化技巧 | [07-性能优化](./docs/07-performance.md) | ⬜ 未实现 |

### 📖 参考文档

| 文档 | 说明 |
|------|------|
| [API 参考](./docs/16-api-reference.md) | 数据类型、着色器、管线 API |
| [代码示例](./docs/17-examples.md) | 代码示例索引和模板 |
| [术语表](./docs/18-glossary.md) | 关键术语和概念解释 |
| [常见问题](./docs/15-troubleshooting.md) | 问题排查与解决方案 |

### 🚀 扩展功能

| 功能 | 优先级 | 说明 |
|------|--------|------|
| **SDF 光线前进** | 🟡 中 | 程序化几何、软阴影、体积效果 |
| **阴影系统** | 🟡 中 | 阴影贴图、CSM、软阴影 |
| **延迟渲染** | 🟡 中 | G-Buffer、光照Pass |
| **Forward+** | 🟡 中 | 光照分块前向渲染 |
| **后处理** | 🟡 中 | Tone Mapping、Bloom、TAA |
| **全局光照** | 🟢 低 | SSAO、SSGI、光照探针 |
| **特殊效果** | 🟢 低 | 粒子、体积光、水面、3DGS |
| **光线追踪** | 🟢 低 | RT反射、阴影、GI |
| **体素渲染** | 🟢 低 | 体积效果 |

> 详见：[PROGRESS.md](./PROGRESS.md) 扩展阶段规划

---

## 项目结构

```
gpu-driven-rendering/              # 独立子项目
├── package.json                   # 包配置
├── tsconfig.json                  # TypeScript 配置
├── vite.config.ts                 # Vite 构建配置
├── .eslintrc.json                 # ESLint 配置
├── README.md                      # 本文件
├── PROGRESS.md                    # 开发进度跟踪
├── src/                           # 源码目录
│   ├── index.ts                   # 主入口
│   ├── core/                      # 核心渲染模块
│   │   ├── GPUDrivenRenderer.ts   # 主渲染器类
│   │   ├── ObjectBuffer.ts        # 物体缓冲管理
│   │   ├── IndirectBuffer.ts      # 间接绘制缓冲
│   │   ├── MaterialBuffer.ts      # 材质缓冲
│   │   └── types.ts               # 类型定义
│   ├── compute/                   # 计算着色器
│   │   ├── CommandGenerator.wgsl  # 命令生成
│   │   ├── BitonicSort.wgsl       # 排序着色器
│   │   └── utils.wgsl             # 工具函数
│   ├── culling/                   # 剔除系统
│   │   ├── FrustumCulling.ts      # 视锥剔除
│   │   ├── HizCulling.ts          # Hi-Z遮挡剔除
│   │   └── shaders/               # 剔除着色器
│   ├── lod/                       # LOD 系统
│   │   ├── LODSelector.ts         # LOD选择器
│   │   └── shaders/               # LOD着色器
│   ├── transparent/               # 透明渲染
│   │   ├── DepthClusteredSort.ts  # 深度聚类排序
│   │   ├── BatchRenderer.ts       # 批次渲染
│   │   └── shaders/               # 透明渲染着色器
│   └── utils/                     # 工具函数
│       ├── buffer.ts              # 缓冲工具
│       ├── math.ts                # 数学工具
│       └── PerformanceMonitor.ts  # 性能监控
├── docs/                          # 设计文档
│   ├── QUICKSTART.md              # 快速开始
│   ├── 00-architecture.md         # 架构概览
│   ├── 01-gpu-rendering-core.md   # 核心渲染
│   ├── 02-transparent-rendering.md # 透明渲染
│   ├── 03-culling.md              # 剔除系统
│   ├── 04-lod.md                  # LOD 系统
│   ├── 05-performance.md          # 性能优化
│   ├── 06-troubleshooting.md      # 问题排查
│   ├── 07-api-reference.md        # API 参考
│   ├── 08-examples.md             # 代码示例
│   └── 09-glossary.md             # 术语表
├── examples/                      # 子项目示例
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── basicGPUDriven.ts      # 基础示例
│   │   ├── transparentRendering.ts # 透明渲染
│   │   ├── cullingDemo.ts         # 剔除演示
│   │   └── lodDemo.ts             # LOD 演示
│   └── public/
│       └── index.html
└── test/                          # 测试
    ├── core/
    └── utils/
```

---

## 模块依赖关系

```
┌─────────────────────────────────────────────────────────┐
│                    @feng3d/webgpu                       │
│                    (主包，含扩展功能)                    │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ workspace: "*"
                         │
┌────────────────────────▼────────────────────────────────┐
│            @feng3d/gpu-driven-rendering                 │
│                     (本包)                              │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌──────────┐  ┌──────┐  ┌──────┐       │
│  │  core   │→│culling   │  │  lod │  │transparent│    │
│  └─────────┘  └──────────┘  └──────┘  └──────┘       │
│       │             │           │          │          │
│       └─────────────┴───────────┴──────────┘          │
│                         │                              │
│                    ┌─────▼─────┐                      │
│                    │   utils   │                      │
│                    └───────────┘                      │
└─────────────────────────────────────────────────────────┘
                         │
                         │ workspace: "*"
                         │
┌────────────────────────▼────────────────────────────────┐
│          gpu-driven-rendering/examples                   │
│                  (示例项目)                              │
└─────────────────────────────────────────────────────────┘
```

---

## 开发工作流

### 作为子项目开发

```bash
# 在主项目目录
cd gpu-driven-rendering
npm install           # 安装依赖（自动链接 @feng3d/webgpu:*）
npm run dev           # 启动示例开发服务器
npm run build         # 构建子包
npm run test          # 运行测试
npm run lint          # 代码检查
```

### 独立仓库运行

```bash
# 克隆独立仓库后
git clone https://github.com/feng3d-labs/gpu-driven-rendering.git
cd gpu-driven-rendering

# 修改 package.json 中的依赖
# "@feng3d/webgpu": "*" → "@feng3d/webgpu": "^0.1.0"

npm install
npm run dev
```

---

## 导出结构

```typescript
// 主入口 - 核心渲染
import { GPUDrivenRenderer } from '@feng3d/gpu-driven-rendering';
import type { ObjectData, Camera, Material } from '@feng3d/gpu-driven-rendering';

// 子路径导出 - 可选功能
import { FrustumCulling } from '@feng3d/gpu-driven-rendering/culling';
import { LODSelector } from '@feng3d/gpu-driven-rendering/lod';
import { DepthClusteredSort } from '@feng3d/gpu-driven-rendering/transparent';
```

---

## 快速开始

1. 阅读 [快速开始指南](./docs/QUICKSTART.md) 了解核心概念
2. 阅读 [00-架构概览](./docs/00-architecture.md) 了解整体设计
3. 查看 [开发进度](./PROGRESS.md) 了解当前状态
4. 从 [01-全GPU渲染核心](./docs/01-gpu-rendering-core.md) 开始实现

---

## 与现代引擎对比

本方案与 Unreal Engine 5 的 Nanite、Unity DOTS 等现代引擎的 GPU 驱动渲染架构一致。

| 引擎 | 技术 | 对应功能 |
|------|------|---------|
| Unreal Engine 5 | Nanite | 虚拟几何体、GPU驱动渲染 |
| Unity DOTS | ECS + GPU Jobs | GPU计算驱动 |
| Godot 4 | Vulkan Compute | GPU粒子、遮挡剔除 |

---

## 相关链接

- **主项目**：[@feng3d/webgpu](../)
- **扩展任务**：[EXTENSIONS.md](../EXTENSIONS.md)
- **设计文档**：[docs/](./docs/)

---

## 许可证

MIT

---

> 最后更新：2026-04-20
