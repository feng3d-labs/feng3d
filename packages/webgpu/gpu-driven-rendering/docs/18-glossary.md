# 术语表

本文档列出 WebGPU 全GPU驱动渲染系统中使用的关键术语和概念。

## 目录

- [核心概念](#核心概念)
- [WebGPU 术语](#webgpu-术语)
- [渲染术语](#渲染术语)
- [优化技术](#优化技术)
- [算法术语](#算法术语)

---

## 核心概念

### 全GPU驱动渲染 (Full GPU-Driven Rendering)

一种渲染架构，其中物体的遍历、剔除、排序、命令生成等全部由 GPU 完成，CPU 仅负责触发渲染。

**优势**：
- CPU 负载极低
- 可线性扩展到大量物体
- 代码更简洁

**相关文档**：[01-全GPU渲染核心](./01-gpu-rendering-core.md)

### 间接绘制 (Indirect Drawing)

GPU 从缓冲区读取绘制命令参数并执行绘制，而非从 CPU 接收参数。

**结构**：`DrawIndexedIndirect`（20 字节）

| 字段 | 类型 | 说明 |
|------|------|------|
| indexCount | u32 | 索引数量 |
| instanceCount | u32 | 实例数量 |
| firstIndex | u32 | 起始索引 |
| vertexOffset | i32 | 顶点偏移 |
| baseInstance | u32 | 基础实例ID |

### 批量绘制 (Batch Rendering)

将多个物体的绘制合并为一次绘制调用，减少 Draw Call 开销。

**实现方式**：
- 按材质分组
- 使用巨型缓冲区
- 间接绘制

---

## WebGPU 术语

### Compute Shader (计算着色器)

用于通用计算的着色器，非渲染专用。

**用途**：
- 视锥剔除
- 遮挡剔除
- 排序（Bitonic Sort）
- 命令生成

### Workgroup (工作组)

计算着色器的工作单元，由多个线程组成。

**推荐大小**：64（平衡性能和硬件利用率）

### Storage Buffer (存储缓冲)

可读写的大型缓冲区，用于存储大量数据。

**用途**：
- 物体数据
- 材质数据
- 绘制命令

### 原子操作 (Atomic Operations)

GPU 上的线程安全操作，用于并发计数和同步。

**常用函数**：
- `atomicAdd` - 原子加法
- `atomicMax` - 原子最大值
- `atomicExchange` - 原子交换

---

## 渲染术语

### Draw Call (绘制调用)

CPU 向 GPU 发出的绘制命令。

**传统渲染**：每个物体一次 Draw Call（10,000 物体 = 10,000 次）
**GPU 驱动**：按材质批次（10,000 物体 ≈ 50-100 次）

### 实例化渲染 (Instanced Rendering)

一次绘制调用渲染同一物体的多个实例。

**优势**：
- 减少 Draw Call
- 共享几何数据

**相关文档**：[01-全GPU渲染核心](./01-gpu-rendering-core.md)

### 不透明物体 (Opaque Objects)

完全遮挡后方物体的物体，需要深度写入。

**渲染顺序**：任意（依赖深度测试）

### 透明物体 (Transparent Objects)

部分透明或半透明的物体，需要特殊排序。

**渲染顺序**：从后到前

**相关文档**：[02-透明渲染](./03-transparent-rendering.md)

---

## 优化技术

### 视锥剔除 (Frustum Culling)

剔除相机视野外的物体，减少不必要的绘制。

**方法**：AABB 与视锥平面相交测试

**相关文档**：[03-剔除系统](./05-culling.md)

### 遮挡剔除 (Occlusion Culling)

剔除被其他物体完全遮挡的物体。

**实现**：Hi-Z 深度金字塔

**相关文档**：[03-剔除系统](./05-culling.md)

### LOD (Level of Detail)

根据距离使用不同精度的模型。

**目的**：减少远处物体的渲染开销

**相关文档**：[04-LOD系统](./06-lod.md)

### Dithered Transition

使用抖动模式实现 LOD 之间的平滑过渡。

**优势**：避免突变的 LOD 切换

### 深度聚类 (Depth Clustering)

将透明物体按深度分桶，优化排序性能。

**间距**：0.5 米（可配置）

**相关文档**：[02-透明渲染](./03-transparent-rendering.md)

---

## 算法术语

### Bitonic Sort

高效的并行排序算法，适合 GPU 实现。

**用途**：透明物体深度排序

**时间复杂度**：O(n log² n)

**相关文档**：[02-透明渲染](./03-transparent-rendering.md)

### AABB (Axis-Aligned Bounding Box)

轴对齐包围盒，用于碰撞检测和剔除。

**结构**：
```
AABB[0] = minPosition  // 最小点
AABB[1] = maxPosition  // 最大点
```

### 双缓冲 (Double Buffering)

使用两套缓冲区交替使用，避免读写冲突。

**用途**：
- 异步数据回读
- 帧间数据传递

### Hi-Z (Hierarchical Z)

分层深度缓冲，用于加速遮挡检测。

**构建**：Mipmap 金字塔

---

## 性能指标

### GPU Time

GPU 执行计算和渲染的总时间。

**目标**：< 16ms（60 FPS）

### CPU Time

CPU 准备和提交命令的时间。

**GPU 驱动优势**：CPU 时间 < 1ms

### Draw Overhead

渲染系统的额外开销。

**目标**：< 2%（如 Bitonic Sort 0.5ms）

---

## 缩写速查

| 缩写 | 全称 | 中文 |
|------|------|------|
| GPU | Graphics Processing Unit | 图形处理器 |
| CPU | Central Processing Unit | 中央处理器 |
| API | Application Programming Interface | 应用程序接口 |
| LOD | Level of Detail | 细节层次 |
| AABB | Axis-Aligned Bounding Box | 轴对齐包围盒 |
| PBR | Physically Based Rendering | 基于物理的渲染 |
| Hi-Z | Hierarchical Z | 分层深度 |
| WGSL | WebGPU Shading Language | WebGPU 着色器语言 |

---

## 相关链接

- [快速开始指南](./QUICKSTART.md)
- [API 参考](./16-api-reference.md)
- [代码示例](./17-examples.md)
- [架构概览](./00-architecture.md)

---

> 最后更新：2026-04-20
