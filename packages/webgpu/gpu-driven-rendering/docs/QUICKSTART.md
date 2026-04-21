# 快速开始指南

本指南帮助你在 5 分钟内了解全GPU驱动渲染的核心概念，并在 30 分钟内运行第一个示例。

## 核心概念

### 什么是全GPU驱动渲染？

传统渲染流程中，CPU 负责物体遍历、剔除、排序，GPU 仅负责绘制：

```
传统渲染：
CPU: 遍历物体 → 剔除 → 排序 → 生成绘制命令 → GPU 绘制
     ↑_______________________↑
           大量计算
```

全GPU驱动渲染将这些计算移至 GPU：

```
全GPU驱动渲染：
CPU: 上传数据 → 触发计算 → 触发绘制
     ↓           ↓          ↓
   GPU:     剔除→排序→生成命令→绘制
```

### 核心优势

| 特性 | 传统渲染 | 全GPU驱动渲染 |
|------|---------|---------------|
| CPU 负载 | 高 | 极低 |
| 10,000 物体 | ~5ms | ~0.5ms |
| 可扩展性 | 受限 | 线性扩展 |
| 代码复杂度 | 高 | 低 |

---

## 前置要求

```bash
# 1. 克隆项目
git clone https://github.com/feng3d-labs/webgpu.git
cd webgpu

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run examples:dev
```

### 浏览器要求

- Chrome 113+ (推荐)
- Edge 113+
- Firefox Nightly (实验性支持)

---

## 5 分钟入门

### 第一步：理解数据流

```wgsl
// GPU 端：物体数据结构
struct Object {
  worldMat: mat4x4f,       // 世界矩阵
  materialIndex: u32,      // 材质索引
  indexOffset: u32,        // 索引起始偏移
  indexCount: u32,         // 索引数量
};

// 计算着色器：GPU 生成绘制命令
@compute @workgroup_size(64)
fn generateCommands(@builtin(global_invocation_id) gid: vec3u) {
  let obj = objects[gid.x];
  
  // 生成间接绘制命令
  commands[gid.x] = DrawIndexedIndirect(
    obj.indexCount, 1, obj.indexOffset, 0, gid.x
  );
}
```

### 第二步：CPU 触发渲染

```typescript
// CPU：仅负责触发
const submit: Submit = {
  commandEncoders: [{
    passEncoders: [
      // 1. 计算着色器生成命令
      { __type__: 'ComputePass', computeObjects: [...] },
      
      // 2. GPU 绘制
      { __type__: 'RenderPass', renderObjects: [...] }
    ]
  }]
};

webgpu.submit(submit);
```

### 第三步：查看结果

打开浏览器访问 `http://localhost:5173/`，查看运行中的示例。

---

## 30 分钟实践

### 练习 1：运行基础示例 (5 分钟)

```bash
# 启动开发服务器后访问
http://localhost:5173/#/instancedCube
```

**目标**：理解实例化渲染的基础

### 练习 2：理解间接绘制 (10 分钟)

阅读 [01-全GPU渲染核心](./gpu-driven-rendering/01-gpu-rendering-core.md)

**关键点**：
- Indirect Buffer 的作用
- DrawIndexedIndirect 结构
- multiDrawIndexedIndirect 批量绘制

### 练习 3：查看计算着色器 (10 分钟)

```bash
# 查看现有计算着色器示例
open examples/src/webgpu/bitonicSort/
```

**学习内容**：
- Workgroup 大小设置
- 原子操作使用
- Buffer 读写

### 练习 4：性能对比 (5 分钟)

```bash
# 运行性能示例
open examples/src/webgpu/timestampQuery/
```

**观察指标**：
- 计算着色器耗时
- 渲染管线耗时
- 总帧时间

---

## 下一步

| 你的目标 | 推荐阅读 |
|---------|---------|
| 理解整体架构 | [00-架构概览](./gpu-driven-rendering/00-architecture.md) |
| 开始实现功能 | [01-全GPU渲染核心](./gpu-driven-rendering/01-gpu-rendering-core.md) |
| 查看代码示例 | [08-代码示例](./gpu-driven-rendering/08-examples.md) |
| 了解 API | [07-API参考](./gpu-driven-rendering/07-api-reference.md) |
| 排查问题 | [06-常见问题](./gpu-driven-rendering/06-troubleshooting.md) |

---

## 常见问题速查

**Q: 浏览器不支持 WebGPU？**
A: 使用 Chrome 113+ 或启用 `chrome://flags/#enable-unsafe-webgpu`

**Q: 间接绘制报错？**
A: 检查设备是否支持 `indirect-first-instance` 特性

**Q: 计算着色器没有执行？**
A: 确认 workgroup 数量计算正确

---

> 需要帮助？查看 [06-常见问题](./gpu-driven-rendering/06-troubleshooting.md) 或提交 Issue

> 最后更新：2026-04-20
