# 03-剔除系统

本文档描述GPU端的视锥剔除和Hi-Z遮挡剔除实现。

---

## 实现状态

**阶段**：阶段3 - 剔除系统
**状态**：⬜ 未开始
**相关代码**：`src/culling/`
**依赖阶段**：[阶段1 - 全GPU渲染核心](./01-gpu-rendering-core.md)
**进度跟踪**：[PROGRESS.md](../PROGRESS.md#阶段3剔除系统-⬜-未开始)

---

剔除系统是全GPU驱动渲染的核心组成部分，负责在GPU端完成视锥剔除和遮挡剔除，最大限度减少不需要绘制的物体。

### 概述

剔除系统包含两个核心模块：

1. **视锥剔除**：检测物体是否在相机可视范围内
2. **遮挡剔除**：检测物体是否被其他物体遮挡

两个剔除操作均在GPU计算着色器中并行执行，CPU无需参与。

## 视锥剔除

### 原理

视锥剔除通过判断物体AABB包围盒与视锥六个平面是否相交，快速排除不在视野内的物体。

### WGSL实现

```wgsl
// 视锥平面结构（6个平面：左、右、上、下、近、远）
struct Frustum {
  planes: vec4f[6];
};

// AABB包围盒结构
struct AABB {
  min: vec3f,
  max: vec3f,
};

// 视锥剔除判断
fn isAABBInFrustum(aabb: AABB, frustum: Frustum) -> bool {
  // 对每个平面进行检测
  for (var i: u32 = 0; i < 6; i++) {
    let plane = frustum.planes[i];

    // 找到AABB在平面法线方向上最远的顶点
    let p = vec3f(
      select(aabb.min.x, aabb.max.x, plane.x > 0.0),
      select(aabb.min.y, aabb.max.y, plane.y > 0.0),
      select(aabb.min.z, aabb.max.z, plane.z > 0.0)
    );

    // 计算点到平面距离
    let distance = dot(p, plane.xyz) + plane.w;

    // 如果距离小于0，说明AABB在平面外侧，被剔除
    if (distance < 0.0) {
      return false;
    }
  }

  return true;
}
```

### 物体显隐控制

物体的`visible`属性支持三种模式：

| 值 | 模式 | 行为 |
|----|------|------|
| 0 | 强制隐藏 | 不渲染，跳过所有检查 |
| 1 | 强制显示 | 跳过剔除检查，直接渲染 |
| 2 | 自动模式 | 执行完整的剔除流程 |

### 计算着色器集成

```wgsl
@compute @workgroup_size(64)
fn cullingMain(@builtin(global_invocation_id) gid: vec3u) {
  let objIdx = gid.x;
  let obj = objects[objIdx];

  // 1. 强制隐藏检测
  if (obj.visible == 0) { return; }

  // 2. 强制显示（跳过剔除）
  if (obj.visible == 1) {
    writeDrawCommand(objIdx, obj);
    return;
  }

  // 3. 自动模式：执行视锥剔除
  if (!isAABBInFrustum(obj.aabb, camera.frustum)) {
    return; // 被剔除
  }

  // 4. 通过剔除，写入绘制命令
  writeDrawCommand(objIdx, obj);
}
```

## 遮挡剔除（Hi-Z）

### 原理

Hi-Z（Hierarchical Z-Buffer）遮挡剔除通过构建深度金字塔，在物体级别快速检测遮挡关系：

1. 上一帧深度缓冲构建Mipmap金字塔
2. 将物体包围盒投影到屏幕空间
3. 在适当Mipmap层级查询深度值
4. 如果物体全部被遮挡，则跳过绘制

### Hi-Z金字塔生成

```wgsl
// Hi-Z金字塔生成计算着色器
@group(0) @binding(0) var inputDepth: texture_2d<f32>;
@group(0) @binding(1) var outputDepth: texture_storage_2d<r32float, read_write>;

@compute @workgroup_size(16, 16)
fn generateHiZ(@builtin(global_invocation_id) gid: vec3u) {
  let texSize = vec2f(textureDimensions(inputDepth));
  let outputSize = vec2f(textureDimensions(outputDepth));
  let coord = gid.xy;

  // 采样2x2区域，取最小深度值
  let uv0 = vec2f(coord * 2u + 0u) / texSize;
  let uv1 = vec2f(coord * 2u + 1u) / texSize;
  let uv2 = vec2f(coord * 2u + 2u) / texSize;
  let uv3 = vec2f(coord * 2u + 3u) / texSize;

  let d0 = textureLoad(inputDepth, vec2i(coord * 2u + 0u), 0).r;
  let d1 = textureLoad(inputDepth, vec2i(coord * 2u + 1u), 0).r;
  let d2 = textureLoad(inputDepth, vec2i(coord * 2u + 2u), 0).r;
  let d3 = textureLoad(inputDepth, vec2i(coord * 2u + 3u), 0).r;

  let minDepth = min(min(d0, d1), min(d2, d3));
  textureStore(outputDepth, vec2i(coord), vec4f(minDepth, 0.0, 0.0, 0.0));
}
```

### 遮挡检测

```wgsl
// Hi-Z遮挡剔除判断
fn isOccludedByHiZ(
  aabb: AABB,
  viewProjMat: mat4x4f,
  hiZTexture: texture_2d<f32>
) -> bool {
  // 1. 计算AABB中心点
  let center = (aabb.min + aabb.max) * 0.5;

  // 2. 投影到裁剪空间
  let clipPos = viewProjMat * vec4f(center, 1.0);
  let ndc = clipPos.xyz / clipPos.w;

  // 3. 转换到纹理坐标
  let texCoord = ndc.xy * 0.5 + 0.5;
  let depth = ndc.z;

  // 4. 检查是否在深度范围内
  if (texCoord.x < 0.0 || texCoord.x > 1.0 ||
      texCoord.y < 0.0 || texCoord.y > 1.0) {
    return false; // 超出屏幕范围，不算被遮挡
  }

  // 5. 从Hi-Z金字塔采样深度
  let texSize = vec2f(textureDimensions(hiZTexture));
  let mipLevel = u32(log2(max(texSize.x, texSize.y) / 8.0)); // 自适应Mipmap级别
  let hiZDepth = textureLoad(hiZTexture, vec2i(texCoord * texSize), mipLevel).r;

  // 6. 比较深度（考虑精度误差）
  return hiZDepth < (depth - 0.001);
}
```

## 完整剔除流程

```wgsl
// 完整的剔除计算着色器
@compute @workgroup_size(64)
fn fullCulling(@builtin(global_invocation_id) gid: vec3u) {
  let objIdx = gid.x;
  let obj = objects[objIdx];

  // 1. 显隐判断
  if (obj.visible == 0) { return; }

  // 2. 强制显示跳过剔除
  if (obj.visible == 1) {
    generateCommand(objIdx, obj);
    return;
  }

  // 3. 视锥剔除
  if (!isAABBInFrustum(obj.aabb, camera.frustum)) {
    return;
  }

  // 4. 遮挡剔除（仅对不透明物体）
  if (!isTransparent(obj.materialType)) {
    if (isOccludedByHiZ(obj.aabb, camera.viewProjMat, hiZTexture)) {
      return;
    }
  }

  // 5. 通过所有剔除，生成绘制命令
  generateCommand(objIdx, obj);
}
```

## 性能优化要点

### 1. Early Exit策略

```wgsl
// 按成本从低到高排序检查
fn quickCulling(obj: Object) -> bool {
  // 1. 最低成本：显隐标记检查
  if (obj.visible == 0) { return true; }

  // 2. 中等成本：视锥剔除
  if (!isAABBInFrustum(obj.aabb, camera.frustum)) {
    return true;
  }

  // 3. 最高成本：遮挡剔除（最后检查）
  if (!isTransparent(obj.materialType)) {
    if (isOccludedByHiZ(obj.aabb, camera.viewProjMat, hiZTexture)) {
      return true;
    }
  }

  return false;
}
```

### 2. 自适应Hi-Z Mipmap级别

```wgsl
// 根据物体大小选择合适的Mipmap级别
fn selectMipLevel(aabb: AABB, viewProjMat: mat4x4f) -> u32 {
  // 计算物体在屏幕上的投影大小
  let size = length(aabb.max - aabb.min);
  let projectedSize = size / distance(camera.pos, aabb.min);

  // 选择合适的Mipmap级别
  return u32(clamp(log2(1024.0 / projectedSize), 0.0, 10.0));
}
```

### 3. 双缓冲Hi-Z

使用双缓冲避免读写冲突：

```javascript
// 交替使用两帧的Hi-Z数据
const hiZBuffers = [
  createHiZBuffer(), // 偶数帧
  createHiZBuffer()  // 奇数帧
];

function getHiZBuffer(frameIndex) {
  return hiZBuffers[frameIndex % 2];
}
```

## 常见问题

| 问题 | 解决方案 |
|------|---------|
| 物体闪烁（误剔除） | 增加深度比较的epsilon值（0.001 → 0.005） |
| 剔除效率低 | 检查AABB计算是否正确，确保包围盒紧贴模型 |
| Hi-Z生成开销大 | 降低Mipmap级别数量，使用1/4分辨率 |
| 透明物体被错误遮挡 | 对透明物体跳过遮挡剔除 |

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [01-全GPU渲染核心](./01-gpu-rendering-core.md) | 基础渲染管线 |
| [02-透明渲染](./03-transparent-rendering.md) | 透明物体渲染 |
| [04-LOD系统](./06-lod.md) | LOD系统（下一阶段） |
| [07-API参考](./16-api-reference.md) | 剔除着色器 API |
| [09-术语表](./18-glossary.md) | 视锥剔除、Hi-Z 术语 |

---

> 最后更新：2026-04-20
