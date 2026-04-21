# 开发进度跟踪

本文档跟踪 `@feng3d/rendering` 子包的开发进度。

---

## 快速导航

| 链接 | 说明 |
|------|------|
| [README.md](./README.md) | 项目入口和模块概览 |
| [文档索引](#文档索引) | 所有设计文档的进度状态 |
| [总体进度](#总体进度) | 当前开发状态概览 |
| [实现阶段](#实现阶段) | 各阶段详细任务清单 |

---

## 文档索引

### 核心文档（按实现阶段）

| 文档 | 阶段 | 类型 | 实现状态 | 文档状态 |
|------|------|------|----------|----------|
| [00-架构概览](./docs/00-architecture.md) | - | 设计 | ⬜ 未实现 | ✅ 完成 |
| [01-全GPU渲染核心](./docs/01-gpu-rendering-core.md) | 1 | 实现 | ⏳ 进行中 | ✅ 完成 |
| [02-SDF光线前进](./docs/02-sdf-raymarching.md) | 2 | 实现 | ⬜ 未开始 | ✅ 完成 |
| [03-透明渲染](./docs/03-transparent-rendering.md) | 3 | 实现 | ⬜ 未开始 | ✅ 完成 |
| [04-3D Gaussian Splatting](./docs/04-3d-gaussian-splatting.md) | 4 | 实现 | ⬜ 未开始 | ✅ 完成 |
| [05-剔除系统](./docs/05-culling.md) | 5 | 实现 | ⬜ 未开始 | ✅ 完成 |
| [06-LOD系统](./docs/06-lod.md) | 6 | 实现 | ⬜ 未开始 | ✅ 完成 |
| [07-性能优化](./docs/07-performance.md) | 7 | 实现 | ⬜ 未开始 | ✅ 完成 |

### 扩展文档（按实现阶段）

| 文档 | 阶段 | 类型 | 优先级 | 文档状态 |
|------|------|------|--------|----------|
| [08-阴影系统](./docs/08-shadow-system.md) | 8 | 设计 | 🟡 中 | ✅ 完成 |
| [09-延迟渲染](./docs/09-deferred-rendering.md) | 9 | 设计 | 🟡 中 | ✅ 完成 |
| [10-Forward+](./docs/10-forward-plus.md) | 10 | 设计 | 🟡 中 | ✅ 完成 |
| [11-后处理](./docs/11-post-processing.md) | 11 | 设计 | 🟡 中 | ✅ 完成 |
| [12-全局光照](./docs/12-global-illumination.md) | 12 | 设计 | 🟢 低 | ✅ 完成 |
| [13-特殊效果](./docs/13-special-effects.md) | 13 | 设计 | 🟢 低 | ✅ 完成 |
| [14-高级渲染](./docs/14-advanced-rendering.md) | 14 | 设计 | 🟢 低 | ✅ 完成 |

### 参考文档

| 文档 | 类型 | 文档状态 |
|------|------|----------|
| [15-常见问题](./docs/15-troubleshooting.md) | 参考 | ✅ 完成 |
| [16-API参考](./docs/16-api-reference.md) | 参考 | ✅ 完成 |
| [17-代码示例](./docs/17-examples.md) | 参考 | ✅ 完成 |
| [18-术语表](./docs/18-glossary.md) | 参考 | ✅ 完成 |
| [快速开始指南](./docs/QUICKSTART.md) | 指南 | ✅ 完成 |

### 图例

- **实现状态**：⬜ 未开始 | ⏳ 进行中 | ✅ 已完成
- **文档状态**：✅ 完成 | ⏳ 编写中 | ⬜ 待编写
- **优先级**：🔴 高 | 🟡 中 | 🟢 低

---

## 当前状态

**版本**：0.1.0
**开发阶段**：阶段1 - 全GPU渲染核心
**总体进度**：10% (阶段0完成，阶段1进行中)
**阶段规划**：14 个阶段（7 核心 + 7 扩展）

---

## 实现阶段

### 阶段0：子项目结构搭建 ✅ 已完成

**目标**：搭建独立的子项目结构，配置构建环境

**任务清单**：

| 任务 | 状态 | 代码位置 |
|------|------|----------|
| 创建 package.json | ✅ 完成 | rendering/package.json |
| 创建 tsconfig.json | ✅ 完成 | rendering/tsconfig.json |
| 创建 global.d.ts | ✅ 完成 | rendering/src/types/global.d.ts |
| 创建 src 目录结构 | ✅ 完成 | rendering/src/ |
| 配置项目引用 | ✅ 完成 | tsconfig.json |
| 更新根 package.json workspaces | ✅ 完成 | package.json |
| ESLint 配置 | ✅ 完成 | 根目录共享配置 |

**验收标准**：
- [x] 可以独立 `npm install` 安装依赖
- [x] 可以独立 `npm run types` 类型检查
- [x] workspace 协议正确链接 @feng3d/webgpu
- [x] 与 @feng3d/webgpu 配置对齐

---

### 阶段1：全GPU渲染核心 ⏳ 进行中

**目标**：GPU生成绘制命令，CPU仅触发渲染，支持不透明物体批量渲染

**相关文档**：[01-全GPU渲染核心](./docs/01-gpu-rendering-core.md)

**任务清单**：

| 任务 | 子任务 | 状态 | 代码位置 |
|------|--------|------|----------|
| **1.1 数据结构** | | | |
| | ObjectData, Camera, Material 接口 | ✅ | src/core/types.ts |
| | 结构化数据类型（CameraData, MaterialData 等） | ✅ | src/core/types.ts |
| | 序列化/反序列化工具 | ✅ | src/core/serialization.ts |
| | DrawIndexedIndirect 结构 | ✅ | src/core/types.ts |
| **1.2 全局资源** | | | |
| | 物体缓冲 | ✅ | src/core/ObjectBuffer.ts |
| | 材质缓冲 | ✅ | src/core/MaterialBuffer.ts |
| | 相机缓冲 | ✅ | src/core/GPUDrivenRenderer.ts |
| | 视锥体缓冲 | ✅ | src/core/GPUDrivenRenderer.ts |
| **1.3 计算着色器** | | | |
| | 命令生成计算着色器 | ✅ | src/compute/CommandGenerator.wgsl.ts |
| | Workgroup 配置 | ✅ | src/core/GPUDrivenRenderer.ts |
| **1.4 间接绘制** | | | |
| | Indirect Buffer 管理 | ✅ | src/core/IndirectBuffer.ts |
| | 按材质分组的命令缓冲 | ✅ | src/core/GPUDrivenRenderer.ts |
| **1.5 渲染管线** | | | |
| | GPUDrivenRenderer 主类 | ⏳ | src/core/GPUDrivenRenderer.ts |
| | 响应式数据流 | ✅ | src/core/GPUDrivenRenderer.ts |
| | Submit 结构构建 | ✅ | src/core/GPUDrivenRenderer.ts |
| **1.6 CPU渲染流程** | | | |
| | 响应式自动序列化 | ✅ | src/core/GPUDrivenRenderer.ts |
| | 计算着色器调度 | ✅ | src/core/GPUDrivenRenderer.ts |
| | 渲染通道构建 | ✅ | src/core/GPUDrivenRenderer.ts |
| **1.7 示例与测试** | | | |
| | 使用示例 | ⬜ | examples/ |
| | 单元测试 | ⬜ | test/ |

**架构亮点**：
- ✅ 使用 @feng3d/reactivity 实现响应式数据流
- ✅ 使用 @feng3d/webgpu 声明式接口
- ✅ 结构化数据类型，外部使用简单
- ✅ 自动序列化/反序列化

**验收标准**：
- [x] CPU端无物体遍历逻辑
- [x] 所有绘制命令由GPU生成
- [ ] 使用multiDrawIndexedIndirect批量渲染（待 @feng3d/webgpu 支持）
- [ ] 能够正确渲染多个不透明物体（待示例验证）

**预计工作量**：4-6天（已完成约60%）

---

### 阶段2：SDF光线前进渲染 ⬜ 未开始

**目标**：实现基于有向距离场（SDF）的光线前进渲染，支持程序化几何体和混合渲染

**相关文档**：[18-SDF光线前进](./docs/18-sdf-raymarching.md)

**任务清单**：

| 任务 | 子任务 | 状态 | 代码位置 |
|------|--------|------|----------|
| **2.1 SDF基础** | | | |
| | SDF形状库（球体、立方体、圆柱等） | ⬜ | src/sdf/SDFPrimitives.wgsl |
| | SDF运算（并、交、差、平滑） | ⬜ | src/sdf/SDFOps.wgsl |
| | 变换函数（平移、旋转、缩放） | ⬜ | src/sdf/SDFTransforms.wgsl |
| **2.2 光线前进** | | | |
| | Ray Marching主循环 | ⬜ | src/sdf/Raymarching.wgsl |
| | 法线计算（梯度） | ⬜ | src/sdf/Raymarching.wgsl |
| | 软阴影 | ⬜ | src/sdf/SDFShadows.wgsl |
| **2.3 着色** | | | |
| | PBR材质响应 | ⬜ | src/sdf/SDFShading.wgsl |
| | 环境光遮蔽（AO） | ⬜ | src/sdf/SDFShading.wgsl |
| **2.4 混合渲染集成** | | | |
| | 深度缓冲读取 | ⬜ | src/sdf/SDFRenderer.ts |
| | 与光栅化结果混合 | ⬜ | src/sdf/SDFRenderer.ts |
| | 渲染顺序协调 | ⬜ | src/core/RenderPathManager.ts |

**验收标准**：
- [ ] 能够渲染程序化SDF场景
- [ ] 支持软阴影和AO
- [ ] 与光栅化渲染正确混合
- [ ] 深度测试协调一致

**预计工作量**：3-4天

---

### 阶段3：透明渲染 ⬜ 未开始

**目标**：透明物体深度聚类排序和批次渲染

**相关文档**：[02-透明渲染](./docs/02-transparent-rendering.md)

**任务清单**：

| 任务 | 子任务 | 状态 | 代码位置 |
|------|--------|------|----------|
| **3.1 透明物体收集** | | | |
| | 透明/不透明物体分离 | ⬜ | src/transparent/ObjectCollector.ts |
| | 透明命令缓冲 | ⬜ | src/transparent/TransparentBuffer.ts |
| **3.2 Bitonic Sort** | | | |
| | 排序键生成（聚类+材质+深度） | ⬜ | src/transparent/SortKeyGenerator.wgsl |
| | Bitonic Sort着色器 | ⬜ | src/transparent/BitonicSort.wgsl |
| **3.3 批次渲染** | | | |
| | GPU批次生成着色器 | ⬜ | src/transparent/BatchGenerator.wgsl |
| | 批次信息缓冲 | ⬜ | src/transparent/BatchBuffer.ts |
| | CPU异步读取 | ⬜ | src/transparent/BatchReader.ts |
| | 按批次批量绘制 | ⬜ | src/transparent/TransparentRenderer.ts |
| | 深度缓冲配置 | ⬜ | src/transparent/TransparentRenderer.ts |

**预计工作量**：3-4天

---

### 阶段4：3D Gaussian Splatting ⬜ 未开始

**目标**：实现 3D 高斯溅射渲染，支持场景重建和动态 3DGS

**相关文档**：[16-特殊效果 - 3DGS 章节](./docs/16-special-effects.md#3d-gaussian-splatting-3dgs)

**依赖**：阶段3（透明渲染）- 复用深度排序系统

**任务清单**：

| 任务 | 子任务 | 状态 | 代码位置 |
|------|--------|------|----------|
| **4.1 数据结构** | | | |
| | Gaussian 3D 数据结构 | ⬜ | src/gaussian/types.ts |
| | 协方差矩阵计算 | ⬜ | src/gaussian/math.wgsl |
| | 高斯缓冲管理 | ⬜ | src/gaussian/GaussianBuffer.ts |
| **4.2 投影与渲染** | | | |
| | 屏幕空间投影计算 | ⬜ | src/gaussian/GaussianProjection.wgsl |
| | 2D 协方差投影 | ⬜ | src/gaussian/GaussianProjection.wgsl |
| | 高斯密度计算 | ⬜ | src/gaussian/GaussianRender.wgsl |
| | Alpha Blending 累积 | ⬜ | src/gaussian/GaussianRenderer.ts |
| **4.3 深度排序** | | | |
| | 复用 Bitonic Sort | ⬜ | src/transparent/BitonicSort.wgsl |
| | 从前到后排序 | ⬜ | src/gaussian/GaussianSorter.wgsl |
| **4.4 混合渲染集成** | | | |
| | 深度协调 | ⬜ | src/gaussian/GaussianRenderer.ts |
| | 与光栅化混合 | ⬜ | src/core/RenderPathManager.ts |
| **4.5 动态 3DGS（可选）** | | | |
| | 高斯参数更新 | ⬜ | src/gaussian/GaussianUpdater.wgsl |
| | 物理/动画支持 | ⬜ | src/gaussian/GaussianPhysics.wgsl |

**验收标准**：
- [ ] 能够渲染静态 3DGS 场景
- [ ] 正确的深度排序和 Alpha 混合
- [ ] 与光栅化渲染正确混合
- [ ] （可选）支持动态高斯更新

**预计工作量**：4-5天

---

### 阶段5：剔除系统 ⬜ 未开始

**目标**：GPU端视锥剔除和Hi-Z遮挡剔除

**相关文档**：[03-剔除系统](./docs/03-culling.md)

**任务清单**：

| 任务 | 子任务 | 状态 | 代码位置 |
|------|--------|------|----------|
| **4.1 视锥剔除** | | | |
| | AABB结构扩展 | ⬜ | src/culling/types.ts |
| | 视锥平面计算 | ⬜ | src/culling/Frustum.ts |
| | AABB-视锥相交检测 | ⬜ | src/culling/FrustumCulling.wgsl |
| | 集成到命令生成着色器 | ⬜ | src/compute/CommandGenerator.wgsl |
| | 显隐控制（显示/隐藏/自动） | ⬜ | src/core/ObjectBuffer.ts |
| **4.2 Hi-Z遮挡剔除** | | | |
| | 深度金字塔生成着色器 | ⬜ | src/culling/HiZGenerator.wgsl |
| | 遮挡检测逻辑 | ⬜ | src/culling/HiZCulling.wgsl |
| | 仅不透明物体启用 | ⬜ | src/culling/HiZCulling.ts |

**预计工作量**：2-3天

---

### 阶段6：LOD系统 ⬜ 未开始

**目标**：基于距离的LOD选择和Dithered过渡

**相关文档**：[04-LOD系统](./docs/04-lod.md)

**任务清单**：

| 任务 | 子任务 | 状态 | 代码位置 |
|------|--------|------|----------|
| **6.1 基础LOD** | | | |
| | 多级LOD数据结构 | ⬜ | src/lod/types.ts |
| | 距离判断LOD选择 | ⬜ | src/lod/LODSelector.wgsl |
| | 集成到命令生成着色器 | ⬜ | src/compute/CommandGenerator.wgsl |
| **6.2 Dithered过渡** | | | |
| | 基于位置的dither计算 | ⬜ | src/lod/DitherTransition.wgsl |
| | 过渡区间逻辑 | ⬜ | src/lod/LODSelector.wgsl |
| **6.3 动态物体** | | | |
| | 静态/动态物体分离 | ⬜ | src/core/ObjectBuffer.ts |
| | 每帧动态物体更新 | ⬜ | src/core/ObjectBuffer.ts |

**预计工作量**：2-3天

---

### 阶段7：性能监控与优化 ⬜ 未开始

**目标**：性能监控和系统优化

**相关文档**：[05-性能优化](./docs/05-performance.md)

**任务清单**：

| 任务 | 子任务 | 状态 | 代码位置 |
|------|--------|------|----------|
| **7.1 性能监控** | | | |
| | timestamp query | ⬜ | src/utils/PerformanceMonitor.ts |
| | 性能HUD显示 | ⬜ | examples/src/utils/ |
| **7.2 优化** | | | |
| | 缓冲复用策略 | ⬜ | src/utils/BufferPool.ts |
| | workgroup优化 | ⬜ | src/compute/ |
| | 双缓冲策略（可选） | ⬜ | src/utils/DoubleBuffer.ts |

**预计工作量**：1-2天

---

### 阶段8：阴影系统 ⬜ 未开始

**目标**：实现GPU驱动的阴影渲染系统

**相关文档**：[11-阴影系统](./docs/11-shadow-system.md)

**优先级**：🟡 中

**任务清单**：

| 任务 | 状态 | 代码位置 |
|------|------|----------|
| 阴影贴图 | ⬜ | src/shadow/ShadowMap.ts |
| 级联阴影贴图 (CSM) | ⬜ | src/shadow/CSM.ts |
| PCF/PCSS 软阴影 | ⬜ | src/shadow/shaders/ |
| GPU驱动的阴影渲染 | ⬜ | src/shadow/ShadowRenderer.ts |

**预计工作量**：3-4天

---

### 阶段9：延迟渲染路径 ⬜ 未开始

**目标**：实现延迟渲染路径，支持多光源场景

**相关文档**：[12-延迟渲染](./docs/12-deferred-rendering.md)

**优先级**：🟡 中

**任务清单**：

| 任务 | 状态 | 代码位置 |
|------|------|----------|
| G-Buffer Pass | ⬜ | src/deferred/GBuffer.ts |
| 光照Pass | ⬜ | src/deferred/LightingPass.ts |
| 前向+延迟混合 | ⬜ | src/deferred/HybridRenderer.ts |
| 渲染路径管理器 | ⬜ | src/core/RenderPathManager.ts |

**预计工作量**：4-5天

---

### 阶段10：Forward+ 路径 ⬜ 未开始

**目标**：实现光照分块前向渲染，支持大量动态光源

**相关文档**：[13-Forward+](./docs/13-forward-plus.md)

**优先级**：🟡 中

**任务清单**：

| 任务 | 状态 | 代码位置 |
|------|------|----------|
| 光照分块 (Tiled/Clustered) | ⬜ | src/forwardplus/ |
| 光照列表生成 | ⬜ | src/forwardplus/LightList.wgsl |
| 前向+渲染Pass | ⬜ | src/forwardplus/ForwardPlusRenderer.ts |

**预计工作量**：3-4天

---

### 阶段11：后处理管线 ⬜ 未开始

**目标**：实现后处理效果管线

**相关文档**：[14-后处理](./docs/14-post-processing.md)

**优先级**：🟡 中

**任务清单**：

| 任务 | 状态 | 代码位置 |
|------|------|----------|
| Tone Mapping | ⬜ | src/postprocess/ToneMapping.ts |
| Bloom/Glow | ⬜ | src/postprocess/Bloom.ts |
| TAA/FXAA | ⬜ | src/postprocess/AntiAliasing.ts |
| 后处理管线管理 | ⬜ | src/postprocess/PostProcessPipeline.ts |

**预计工作量**：2-3天

---

### 阶段12：全局光照 ⬜ 未开始

**目标**：实现屏幕空间全局光照效果

**相关文档**：[15-全局光照](./docs/15-global-illumination.md)

**优先级**：🟢 低

**任务清单**：

| 任务 | 状态 | 代码位置 |
|------|------|----------|
| SSAO | ⬜ | src/gi/SSAO.ts |
| SSGI | ⬜ | src/gi/SSGI.ts |
| 光照探针 | ⬜ | src/gi/LightProbes.ts |

**预计工作量**：4-5天

---

### 阶段13：特殊效果 ⬜ 未开始

**目标**：实现粒子系统、体积效果等特殊渲染（不含 3DGS）

**相关文档**：[16-特殊效果](./docs/16-special-effects.md)

**优先级**：🟢 低

**任务清单**：

| 任务 | 状态 | 代码位置 |
|------|------|----------|
| 粒子系统 | ⬜ | src/particles/ |
| 体积光/云/雾 | ⬜ | src/volumetric/ |
| 水面渲染 | ⬜ | src/water/ |

**预计工作量**：4-5天

---

### 阶段14：高级渲染路径 ⬜ 未开始

**目标**：集成光线追踪和体素渲染

**相关文档**：[17-高级渲染](./docs/17-advanced-rendering.md)

**优先级**：🟢 低

**任务清单**：

| 任务 | 状态 | 代码位置 |
|------|------|----------|
| 光线追踪集成 | ⬜ | src/raytracing/ |
| 体素渲染集成 | ⬜ | src/voxel/ |

**预计工作量**：6-8天

---

## 总体进度

```
核心阶段 (0-7)：
阶段0：子项目结构搭建         [██████████] 100%
阶段1：全GPU渲染核心         [█████░░░░░] 60%
阶段2：SDF光线前进           [░░░░░░░░░░] 0%
阶段3：透明渲染              [░░░░░░░░░░] 0%
阶段4：3D Gaussian Splatting [░░░░░░░░░░] 0%
阶段5：剔除系统              [░░░░░░░░░░] 0%
阶段6：LOD系统               [░░░░░░░░░░] 0%
阶段7：性能监控              [░░░░░░░░░░] 0%

扩展阶段 (8-14)：
阶段8：阴影系统              [░░░░░░░░░░] 0%
阶段9：延迟渲染路径          [░░░░░░░░░░] 0%
阶段10：Forward+ 路径        [░░░░░░░░░░] 0%
阶段11：后处理管线           [░░░░░░░░░░] 0%
阶段12：全局光照             [░░░░░░░░░░] 0%
阶段13：特殊效果             [░░░░░░░░░░] 0%
阶段14：高级渲染路径         [░░░░░░░░░░] 0%

核心总进度：7% (阶段0完成，阶段1进行中)
全部总进度：4% (1/15 阶段完成，1个进行中)
```

---

## 依赖关系

```
@feng3d/webgpu 扩展
    │
    ▼
阶段0：子项目结构搭建
    │
    ▼
阶段1：全GPU渲染核心 ──────┬─→ 阶段7：性能监控
    │                      │
    ▼                      │
阶段2：SDF光线前进 ─────────┤
    │                      │
    ▼                      │
阶段3：透明渲染 ────────────┤
    │  (提供深度排序)      │
    ▼                      │
阶段4：3D Gaussian Splatting (依赖排序)
    │                      │
    ▼                      │
阶段5：剔除系统 ────────────┤
    │                      │
    ▼                      │
阶段6：LOD系统 ─────────────┘
    │
    ▼
阶段8-14：扩展功能（阴影、延迟渲染、Forward+、后处理、GI、特效、高级渲染）
```

**阶段依赖说明**：
- 阶段1（核心）是所有后续阶段的基础
- 阶段2（SDF）独立实现，仅需深度缓冲
- 阶段3（透明渲染）提供深度排序系统
- 阶段4（3DGS）依赖阶段3的排序系统
- 阶段5-6（剔除/LOD）是性能优化，可在功能之后
- 阶段7（性能监控）是系统优化
- 阶段8-14 可并行开发（阴影、延迟渲染、Forward+、后处理、GI、特效、高级渲染）

---

## @feng3d/webgpu 扩展依赖

在开始阶段1之前，需要在主包 `@feng3d/webgpu` 中完成以下扩展：

详见项目根目录的 [EXTENSIONS.md](../EXTENSIONS.md)。

| 扩展 | 状态 | 代码位置 |
|------|------|----------|
| WGPURenderPassEncoder.drawIndexedIndirect | ⬜ | src/caches/ |
| WGPURenderPassEncoder.multiDrawIndexedIndirect | ⬜ | src/caches/ |
| STORAGE Buffer usage | ⬜ | src/caches/ |
| 原子操作支持 | ⬜ | src/data/ |

---

> 最后更新：2026-04-21（阶段0完成，阶段1进行中 60%）
