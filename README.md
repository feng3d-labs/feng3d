# Feng3D Web3D Engine

Feng3D 是一个基于 WebGPU 的 Web 3D 引擎 monorepo，统一管理所有 @feng3d/* 模块。

---

## 📐 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        应用层 (Application)                      │
│                    用户代码、游戏逻辑、工具                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                         @feng3d/core                            │
│  场景图 • 组件系统 • 矩阵更新 • 资源管理 • 响应式数据            │
└────────────────────────────┬────────────────────────────────────┘
                             │ 预处理数据 (响应式)
┌────────────────────────────▼────────────────────────────────────┐
│                       @feng3d/rendering                         │
│  GPU 剔除 • LOD 选择 • 命令生成 • Submit (响应式)               │
│  • 使用 @feng3d/webgpu 的 Buffer 接口间接管理资源                │
└────────────────────────────┬────────────────────────────────────┘
                             │ Submit (响应式)
┌────────────────────────────▼────────────────────────────────────┐
│                       @feng3d/webgpu                            │
│  WebGPU 抽象 • 执行 Submit • WGPUBuffer 自动资源管理           │
└─────────────────────────────────────────────────────────────────┘
```

**设计原则**:
- **响应式驱动**: 使用 @feng3d/reactivity 自动维护数据流
- **声明式资源**: 通过 Buffer 接口间接管理 GPU 资源
- **单向依赖**: 上层依赖下层，下层不依赖上层

---

## 📦 Packages

### 核心层

| 包名 | 职责 | 状态 | 文档 |
|------|------|------|------|
| [@feng3d/webgpu](packages/webgpu/) | WebGPU 底层抽象（设备、缓冲、管线、命令编码） | ✅ 稳定 | [docs](packages/webgpu/docs/) |
| [@feng3d/rendering](packages/rendering/) | GPU 驱动渲染核心（接收预处理数据，执行 GPU 剔除、LOD、命令生成、渲染） | 🔄 开发中 | [README](packages/rendering/) |

### 引擎层

| 包名 | 职责 | 状态 | 文档 |
|------|------|------|------|
| @feng3d/core | 场景图、组件系统、矩阵更新、资源管理 | ⏳ 待迁移 | - |
| @feng3d/math | 数学库（向量、矩阵、四元数等） | ⏳ 待迁移 | - |
| @feng3d/event | 事件系统 | ⏳ 待迁移 | - |

### 基础设施层

| 包名 | 职责 | 状态 | 文档 |
|------|------|------|------|
| [@feng3d/reactivity](packages/reactivity/) | 响应式系统（细粒度数据更新通知） | ✅ 稳定 1.0.12 | [README](packages/reactivity/) |
| [@feng3d/watcher](packages/watcher/) | 对象属性监听器 | ✅ 稳定 0.8.14 | [README](packages/watcher/) |

### 待迁移

| 包名 | 职责 | 优先级 |
|------|------|--------|
| @feng3d/serialization | 序列化/反序列化 | 🟢 低 |
| @feng3d/bezier | 贝塞尔曲线 | 🟢 低 |
| @feng3d/objectview | 对象视图/调试工具 | 🟢 低 |
| @feng3d/polyfill | 浏览器 Polyfill | 🟢 低 |
| @feng3d/task | 任务系统 | 🟢 低 |
| @feng3d/filesystem | 虚拟文件系统 | 🟢 低 |
| @feng3d/shortcut | 快捷键管理 | 🟢 低 |
| @feng3d/renderer | 渲染器抽象层（已被 gpu-driven-rendering 取代） | 🟢 低 |
| @feng3d/terrain | 地形系统 | 🟢 低 |
| @feng3d/particlesystem | 粒子系统 | 🟢 低 |
| @feng3d/assets | 资源管理 | 🟢 低 |
| @feng3d/parsers | 模型/场景解析器 | 🟢 低 |
| @feng3d/ui | UI 组件 | 🟢 低 |

> 图例：✅ 稳定 | 🔄 开发中 | ⏳ 待迁移 | 🔴 高 | 🟡 中 | 🟢 低

---

## 🔗 核心库职责边界

### @feng3d/webgpu
- ✅ 设备管理、Buffer/Texture/Sampler 声明式接口
- ✅ WGPUBuffer/WGPUTexture 自动资源管理
- ✅ Submit/RenderPass/ComputePass 命令抽象
- ✅ 执行渲染，将声明式数据转换为 WebGPU 调用
- ❌ 不负责场景管理、渲染算法

### @feng3d/rendering
- ✅ 接收预处理数据（ObjectData[], Material[], Camera）
- ✅ GPU 视锥/遮挡剔除、LOD 选择、深度排序
- ✅ 使用 @feng3d/webgpu 的 Buffer 接口间接创建资源
- ✅ 返回响应式 Submit 结构
- ❌ 不负责场景图、组件系统、矩阵更新
- ❌ 不直接调用 WebGPU API

### @feng3d/core
- ✅ 场景图、组件系统、变换更新、包围盒计算
- ✅ 响应式状态管理，数据变化自动通知
- ✅ 可选择 @feng3d/rendering 作为渲染后端

---

## 🚀 快速开始

### 安装

```bash
npm install @feng3d/webgpu
```

### 基础示例

```typescript
import { WebGPU } from '@feng3d/webgpu';

const gpu = await WebGPU.create();
// ...
```

更多示例见 [@feng3d/webgpu/examples](packages/webgpu/examples/)

---

## 👨‍💻 开发指南

### 环境要求

- Node.js >= 18
- npm >= 9
- 支持 WebGPU 的浏览器

### 常用命令

```bash
npm install              # 安装依赖
npm run build           # 构建所有包
npm run types           # 类型检查
npm run lint            # 代码检查
npm run dev -w @feng3d/webgpu-examples  # 运行示例
```

---

## 📝 迁移记录

| 日期 | 包名 | 操作 |
|------|------|------|
| 2024-04 | webgpu | 初始 monorepo |
| 2024-04 | webgpu-examples | 从 webgpu 分离 |
| 2026-04-21 | watcher | 从 gitee 迁移 v0.8.14 |
| 2026-04-21 | reactivity | 从 github 迁移 v1.0.12 |
| 2026-04-21 | rendering | 核心渲染模块开发中（原 gpu-driven-rendering）|

详细迁移计划见 [MIGRATION_PLAN.md](MIGRATION_PLAN.md)

---

## 🤝 贡献

1. Fork 本仓库
2. 创建特性分支
3. 提交更改 (`git commit -m 'feat: xxx'`)
4. 创建 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 🔗 相关链接

- [WebGPU 规范](https://www.w3.org/TR/webgpu/)
- [Gitee 仓库](https://gitee.com/feng3d/feng3d)
- [GitHub 仓库](https://github.com/feng3d-labs/feng3d)
