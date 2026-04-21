# 04-LOD系统

本文档描述基于距离的LOD选择和Dithered过渡实现。

---

## 实现状态

**阶段**：阶段4 - LOD系统
**状态**：⬜ 未开始
**相关代码**：`src/lod/`
**依赖阶段**：[阶段1 - 全GPU渲染核心](./01-gpu-rendering-core.md)
**进度跟踪**：[PROGRESS.md](../PROGRESS.md#阶段4lod系统-⬜-未开始)

---

LOD（Level of Detail）系统通过根据相机距离自动选择不同精度的模型，平衡渲染质量和性能。

### 概述

LOD系统包含以下核心功能：

1. **距离判断**：根据相机与物体的距离选择合适的LOD级别
2. **Dithered过渡**：在LOD切换边界使用抖动模式，平滑过渡
3. **动态配置**：每个物体可自定义LOD级别数量和切换距离

## LOD数据结构

### WGSL定义

```wgsl
// LOD级别数据（4级LOD）
struct LODLevels {
  offsets: vec4u,  // 各级LOD的索引起始偏移 (x=LOD0, y=LOD1, z=LOD2, w=LOD3)
  counts: vec4u,   // 各级LOD的索引数量
};

// 物体数据（含LOD信息）
struct Object {
  worldMat: mat4x4f,
  aabb: vec4f[2],
  materialType: u32,
  materialIndex: u32,
  lodLevels: LODLevels,     // LOD参数
  lodDistances: vec4f,      // LOD切换距离
  visible: u32,
  isDynamic: u32,
  _padding: u32,
};
```

### CPU端数据准备

```javascript
// 为每个物体准备LOD数据
function prepareObjectLOD(mesh) {
  return {
    lodLevels: {
      offsets: [
        mesh.lod0.indexOffset,
        mesh.lod1.indexOffset,
        mesh.lod2.indexOffset,
        mesh.lod3.indexOffset
      ],
      counts: [
        mesh.lod0.indexCount,
        mesh.lod1.indexCount,
        mesh.lod2.indexCount,
        mesh.lod3.indexCount
      ]
    },
    lodDistances: [
      10.0,  // LOD0 → LOD1: 10米
      25.0,  // LOD1 → LOD2: 25米
      50.0,  // LOD2 → LOD3: 50米
      Infinity // LOD3之后保持
    ]
  };
}
```

## 距离判断LOD选择

### 基础实现

```wgsl
// 基础LOD选择（基于距离）
fn selectLODDistance(dist: f32, lodDistances: vec4f) -> u32 {
  if (dist < lodDistances[0]) { return 0; }
  if (dist < lodDistances[1]) { return 1; }
  if (dist < lodDistances[2]) { return 2; }
  return 3;
}
```

### 计算着色器集成

```wgsl
@compute @workgroup_size(64)
fn lodCulling(@builtin(global_invocation_id) gid: vec3u) {
  let objIdx = gid.x;
  let obj = objects[objIdx];

  // 计算相机到物体的距离
  let objPos = obj.worldMat[3].xyz;
  let dist = distance(camera.pos, objPos);

  // 选择LOD级别
  let lod = selectLODDistance(dist, obj.lodDistances);

  // 构建绘制命令
  var cmd: DrawCommand;
  cmd.indexCount = obj.lodLevels.counts[lod];
  cmd.firstIndex = obj.lodLevels.offsets[lod];
  cmd.instanceCount = 1;
  cmd.vertexOffset = 0;
  cmd.baseInstance = objIdx;

  // 写入命令缓冲
  writeCommand(objIdx, cmd);
}
```

## Dithered过渡

### 原理

Dithered过渡在LOD切换边界使用基于空间位置的抖动模式，使两个LOD级别在同一区域内混合渲染，消除明显的popping现象。

### WGSL实现

```wgsl
// Dithered LOD选择
fn selectLODDithered(
  dist: f32,
  lodDistances: vec4f,
  worldPos: vec3f
) -> u32 {
  // 计算dither值（基于世界坐标的哈希）
  let dither = fract(dot(worldPos, vec3f(12.9898, 78.233, 45.164)) * 43758.5453);

  // 过渡区间（30%的距离范围）
  let transitionRange = 0.3;

  var lod: u32 = 0;

  // LOD0 → LOD1
  if (dist > lodDistances[0]) {
    let t = (dist - lodDistances[0]) / (lodDistances[1] - lodDistances[0]);
    if (t < transitionRange && dither < t / transitionRange) {
      lod = 0; // 保持LOD0
    } else {
      lod = 1; // 切换到LOD1
    }
  }

  // LOD1 → LOD2
  if (dist > lodDistances[1]) {
    let t = (dist - lodDistances[1]) / (lodDistances[2] - lodDistances[1]);
    if (t < transitionRange && dither < t / transitionRange) {
      lod = 1;
    } else {
      lod = 2;
    }
  }

  // LOD2 → LOD3
  if (dist > lodDistances[2]) {
    let t = (dist - lodDistances[2]) / (lodDistances[3] - lodDistances[2]);
    if (t < transitionRange && dither < t / transitionRange) {
      lod = 2;
    } else {
      lod = 3;
    }
  }

  return lod;
}
```

### 片段着色器Alpha混合

```wgsl
// 片段着色器：Dithered过渡的alpha混合
@fragment
fn fsDithered(
  @builtin(position) pos: vec4f,
  @location(0) worldPos: vec3f
) -> @location(0) vec4f {
  // 获取材质颜色
  let color = getMaterialColor();

  // 计算dither值
  let dither = fract(dot(worldPos, vec3f(12.9898, 78.233, 45.164)) * 43758.5453);

  // 在过渡区域应用dither alpha
  let dist = distance(camera.pos, worldPos);
  let alpha = calculateDitherAlpha(dist, lodDistances, dither);

  return vec4f(color.rgb, alpha);
}

// 计算dither alpha
fn calculateDitherAlpha(
  dist: f32,
  lodDistances: vec4f,
  dither: f32
) -> f32 {
  const transitionRange = 0.3;

  // 检查是否在过渡区间
  for (var i: u32 = 0; i < 3; i++) {
    let t = (dist - lodDistances[i]) / (lodDistances[i + 1] - lodDistances[i]);
    if (t < transitionRange) {
      return mix(1.0, 0.0, t / transitionRange);
    }
  }

  return 1.0;
}
```

## 完整LOD计算着色器

```wgsl
@compute @workgroup_size(64)
fn lodMain(@builtin(global_invocation_id) gid: vec3u) {
  let objIdx = gid.x;
  let obj = objects[objIdx];

  // 显隐检查
  if (obj.visible == 0) { return; }

  // 视锥剔除
  if (!isAABBInFrustum(obj.aabb, camera.frustum)) { return; }

  // 计算距离
  let objPos = obj.worldMat[3].xyz;
  let dist = distance(camera.pos, objPos);

  // LOD选择（带Dithered过渡）
  let lod = selectLODDithered(dist, obj.lodDistances, objPos);

  // 构建绘制命令
  var cmd: DrawCommand;
  cmd.indexCount = obj.lodLevels.counts[lod];
  cmd.instanceCount = 1;
  cmd.firstIndex = obj.lodLevels.offsets[lod];
  cmd.vertexOffset = 0;
  cmd.baseInstance = objIdx;

  // 写入命令
  writeCommand(objIdx, cmd);
}
```

## 性能优化

### 1. LOD距离配置建议

| 场景类型 | LOD0距离 | LOD1距离 | LOD2距离 | 说明 |
|---------|---------|---------|---------|------|
| 室内场景 | 5m | 15m | 30m | 近距离观察，高质量 |
| 开放世界 | 10m | 50m | 100m | 远距离为主， aggressive |
| 移动端 | 3m | 10m | 20m | 性能优先 |

### 2. 多级LOD网格简化

```javascript
// LOD多边形数量建议
const lodPolyRatios = {
  lod0: 1.0,    // 100% 三角形
  lod1: 0.5,    // 50% 三角形
  lod2: 0.25,   // 25% 三角形
  lod3: 0.1     // 10% 三角形（最小版本）
};
```

### 3. 屏幕空间LOD（可选）

```wgsl
// 基于屏幕投影大小的LOD选择
fn selectLODScreenSpace(
  aabb: AABB,
  viewProjMat: mat4x4f,
  screenSize: vec2f
) -> u32 {
  // 计算物体在屏幕上的投影大小
  let center = (aabb.min + aabb.max) * 0.5;
  let clipPos = viewProjMat * vec4f(center, 1.0);
  let projectedSize = length(aabb.max - aabb.min) / clipPos.w;

  // 转换为屏幕像素
  let screenSizeInPixels = projectedSize * screenSize.y;

  // 根据像素大小选择LOD
  if (screenSizeInPixels > 100) { return 0; }
  if (screenSizeInPixels > 50) { return 1; }
  if (screenSizeInPixels > 20) { return 2; }
  return 3;
}
```

## 常见问题

| 问题 | 解决方案 |
|------|---------|
| LOD切换闪烁明显 | 启用Dithered过渡，增加过渡区间 |
| 远处物体消失 | 检查最远LOD级别距离设置，添加最小LOD |
| LOD内存占用大 | 使用共享顶点缓冲，仅索引偏移不同 |
| 过渡区域性能下降 | 减小dither计算复杂度，或使用预计算dither贴图 |

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [01-全GPU渲染核心](./01-gpu-rendering-core.md) | 基础渲染管线 |
| [03-剔除系统](./05-culling.md) | 视锥和遮挡剔除 |
| [05-性能优化](./07-performance.md) | 性能监控与优化（下一阶段） |
| [07-API参考](./16-api-reference.md) | LOD着色器 API |
| [09-术语表](./18-glossary.md) | LOD、Dithered 术语 |

---

> 最后更新：2026-04-20
