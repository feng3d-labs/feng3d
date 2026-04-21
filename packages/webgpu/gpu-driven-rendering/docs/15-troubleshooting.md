# 常见问题

本文档汇总全GPU驱动渲染实施过程中的常见问题及解决方案。

## 渲染问题

### 透明物体渲染顺序错误

**现象**：远处物体覆盖近处物体，混合效果异常

**原因**：
- 排序键生成逻辑错误
- 深度反转计算错误
- Bitonic Sort实现错误

**解决方案**：
```wgsl
// 检查排序键生成
fn getSortKey(depth: f32, materialType: u32) -> u64 {
  let cluster = getCluster(depth);
  // 确保深度反转正确（远处→近处）
  let reversedDepth = u32(1000000.0 / (depth + 0.001));

  // 检查位偏移是否正确
  return (u64(cluster) << 48) |      // 聚类ID优先
         (u64(materialType) << 32) |  // 材质类型次之
         u64(reversedDepth);           // 精确深度最后
}
```

### 不透明物体批量绘制漏画

**现象**：部分不透明物体不显示

**原因**：
- 被剔除物体的indexCount未设为0
- multiDrawIndexedIndirect的drawCount设置错误
- 命令缓冲写入位置错误

**解决方案**：
```wgsl
// 确保被剔除物体的命令正确处理
if (isCulled(obj)) {
  // 方案1：写入空命令
  var emptyCmd: DrawIndexedIndirect;
  emptyCmd.indexCount = 0;  // 关键：设为0
  emptyCmd.instanceCount = 0;
  emptyCmd.firstIndex = 0;
  emptyCmd.vertexOffset = 0;
  emptyCmd.baseInstance = 0;
  cmds[objIdx] = emptyCmd;
}
```

### 透明物体互相遮挡错误

**现象**：透明物体之间的遮挡关系异常

**原因**：
- 深度写入开启
- 深度测试配置错误

**解决方案**：
```javascript
// 确认深度缓冲配置
const transparentPipeline = device.createRenderPipeline({
  depthStencil: {
    depthWriteEnabled: false,  // 必须关闭
    depthCompare: 'less',      // 必须开启
    format: 'depth24plus-stencil8'
  }
});
```

### LOD切换闪烁明显

**现象**：LOD切换时模型明显跳动

**原因**：
- 未使用Dithered过渡
- LOD距离设置不合理

**解决方案**：
```wgsl
// 启用Dithered过渡
fn selectLODDithered(dist: f32, lodDistances: vec4f, worldPos: vec3f) -> u32 {
  let dither = fract(dot(worldPos, vec3f(12.9898, 78.233, 45.164)) * 43758.5453);
  let transitionRange = 0.3;

  // 在过渡区间使用dither
  if (dist > lodDistances[0] && dist < lodDistances[0] * 1.3) {
    if (dither < (dist - lodDistances[0]) / (lodDistances[0] * 0.3)) {
      return 1;
    }
    return 0;
  }
  // 其他LOD级别同理...
}
```

## 性能问题

### CPU性能开销过高

**现象**：CPU占用率高，帧率下降

**原因**：
- 存在多余的同步回读
- 使用await阻塞执行
- 频繁的buffer创建/销毁

**解决方案**：
```javascript
// 1. 使用异步读取
buffer.mapAsync(GPUMapMode.READ).then(() => {
  // 处理数据
});

// 2. 避免await
// ❌ 错误
const data = await buffer.mapAsync(...); // 阻塞

// ✓ 正确
buffer.mapAsync(...).then(() => { ... }); // 非阻塞

// 3. 复用缓冲
// ❌ 错误：每帧创建
function render() {
  const buffer = device.createBuffer({...});
}

// ✓ 正确：初始化创建，每帧更新
const buffer = device.createBuffer({...});
function render() {
  device.queue.writeBuffer(buffer, 0, data);
}
```

### GPU计算耗时过长

**现象**：Bitonic Sort耗时超过1ms

**原因**：
- 透明物体数量过多
- workgroup大小不合理
- 排序算法选择错误

**解决方案**：
```wgsl
// 1. 优化workgroup大小
@compute @workgroup_size(1024)  // 增加并行度
fn bitonicSort(...) { }

// 2. 分批排序
// 如果透明物体超过4096，分批处理

// 3. 考虑使用Radix Sort（大数据量）
```

### 材质切换频繁

**现象**：setPipeline调用次数过多

**原因**：
- 透明物体未按材质聚合
- 深度聚类间距过小

**解决方案**：
```wgsl
// 增加聚类间距
const CLUSTER_DISTANCE: f32 = 1.0;  // 从0.5增加到1.0
```

## 配置问题

### multiDrawIndexedIndirect不可用

**现象**：调用multiDrawIndexedIndirect报错

**原因**：
- 设备不支持`indirect-first-instance`特性
- 未正确请求特性

**解决方案**：
```javascript
// 1. 检测特性
const hasMultiDraw = adapter.features.has('indirect-first-instance');

// 2. 请求特性
const device = await adapter.requestDevice({
  requiredFeatures: hasMultiDraw ? ['indirect-first-instance'] : []
});

// 3. 使用fallback
if (hasMultiDraw) {
  pass.multiDrawIndexedIndirect(buffer, 0, count);
} else {
  for (let i = 0; i < count; i++) {
    pass.drawIndexedIndirect(buffer, i * 20);
  }
}
```

### 透明物体批次信息读取失败

**现象**：读取批次信息时数据为空或错误

**原因**：
- buffer缺少MAP_READ usage
- 读取时机错误（在submit之前）
- 未正确unmap

**解决方案**：
```javascript
// 1. 正确创建buffer
const buffer = device.createBuffer({
  size: MAX_BATCHES * 12,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.MAP_READ  // 必须包含MAP_READ
});

// 2. 正确的读取时机
// ❌ 错误：submit之前读取
async function renderBad() {
  computePass.end();
  await buffer.mapAsync(...); // 此时GPU未执行！
  device.queue.submit(...);
}

// ✓ 正确：submit之后读取（下一帧）
function renderGood() {
  device.queue.submit(...);
  buffer.mapAsync(...).then(() => {
    // 下一帧数据
  });
}
```

### 遮挡剔除无效

**现象**：被遮挡的物体仍被渲染

**原因**：
- Hi-Z纹理未正确生成
- 深度值比较逻辑错误
- Hi-Z纹理未绑定

**解决方案**：
```wgsl
// 1. 确保Hi-Z金字塔生成
@compute @workgroup_size(16, 16)
fn generateHiZ(...) {
  // 正确采样2x2区域
  let d0 = textureLoad(inputDepth, pos * 2 + vec2i(0, 0), 0).r;
  let d1 = textureLoad(inputDepth, pos * 2 + vec2i(1, 0), 0).r;
  let d2 = textureLoad(inputDepth, pos * 2 + vec2i(0, 1), 0).r;
  let d3 = textureLoad(inputDepth, pos * 2 + vec2i(1, 1), 0).r;
  let minDepth = min(min(d0, d1), min(d2, d3));
  textureStore(outputDepth, pos, vec4f(minDepth, 0.0, 0.0, 0.0));
}

// 2. 正确的深度比较
fn isOccluded(aabb: AABB) -> bool {
  let hiZDepth = textureLoad(hiZTexture, texCoord, mipLevel).r;
  return hiZDepth < (depth - 0.001);  // 考虑精度误差
}
```

## 数据一致性问题

### 动态物体更新延迟

**现象**：动态物体位置更新滞后

**原因**：
- writeBuffer在submit之后执行
- 使用了错误的数据源

**解决方案**：
```javascript
// 确保在submit之前更新
function renderFrame() {
  // 1. 更新动态物体
  device.queue.writeBuffer(dynamicObjectBuffer, 0, data);

  // 2. 提交命令
  device.queue.submit([encoder.finish()]);
}
```

### 双缓冲数据不同步

**现象**：读取到错误的帧数据

**原因**：
- 双缓冲索引管理错误
- 未正确切换缓冲

**解决方案**：
```javascript
let frameIndex = 0;

function renderFrame() {
  const currentBuffer = buffers[frameIndex % 2];
  const prevBuffer = buffers[(frameIndex - 1) % 2];

  // 读取上一帧数据
  readFromBuffer(prevBuffer);

  // 写入当前帧数据
  writeToBuffer(currentBuffer);

  frameIndex++;
}
```

## 调试技巧

### 启用验证模式

```javascript
// 在开发时启用WebGPU验证
const device = await adapter.requestDevice({
  requiredFeatures: [],
  // Chrome DevTools中启用webgpu-debug标志
});
```

### 使用WebGPU Inspector

1. 安装Chrome扩展：WebGPU Inspector
2. 打开DevTools → WebGPU面板
3. 查看绘制调用、资源绑定、着色器代码

### 着色器调试

```wgsl
// 使用debug输出（需要支持诊断特性）
@diagnostic(off, derivative_uniformity);  // 禁用特定警告
```

### 性能分析

```javascript
// 记录详细的时间戳
const timestamps = {
  frameStart: 0,
  computeEnd: 0,
  opaqueEnd: 0,
  transparentEnd: 0
};

// 计算各阶段耗时
const computeTime = timestamps.computeEnd - timestamps.frameStart;
const opaqueTime = timestamps.opaqueEnd - timestamps.computeEnd;
const transparentTime = timestamps.transparentEnd - timestamps.opaqueEnd;

console.table({
  'Compute': `${computeTime}μs`,
  'Opaque': `${opaqueTime}μs`,
  'Transparent': `${transparentTime}μs`
});
```

## 问题排查清单

遇到问题时，按以下顺序排查：

1. **检查特性支持**：设备是否支持所需特性
2. **验证数据上传**：缓冲是否正确创建和上传
3. **确认绑定正确**：BindGroup绑定是否正确
4. **检查管线状态**：管线配置是否匹配
5. **验证计算结果**：使用小规模数据测试
6. **分析性能瓶颈**：使用timestamp query定位问题
7. **查看错误信息**：浏览器控制台错误提示

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [00-架构概览](./00-architecture.md) | 整体架构 |
| [01-全GPU渲染核心](./01-gpu-rendering-core.md) | 核心渲染常见问题 |
| [02-透明渲染](./03-transparent-rendering.md) | 透明渲染常见问题 |
| [03-剔除系统](./05-culling.md) | 剔除系统常见问题 |
| [04-LOD系统](./06-lod.md) | LOD系统常见问题 |
| [05-性能优化](./07-performance.md) | 性能问题排查 |
| [快速开始指南](./QUICKSTART.md) | 常见问题速查 |

---

> 最后更新：2026-04-20
