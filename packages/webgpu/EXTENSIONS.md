# @feng3d/webgpu 扩展任务跟踪

本文档跟踪 @feng3d/webgpu 库为支持全GPU驱动渲染所需的扩展功能。

## 背景

全GPU驱动渲染需要以下 WebGPU 高级特性：
- 间接绘制（drawIndexedIndirect、multiDrawIndexedIndirect）
- STORAGE 缓冲区（可读写）
- 原子计数器
- 计算着色器协调

当前 @feng3d/webgpu 尚未完全支持这些功能，需要扩展。

---

## 扩展任务概览

| 任务 | 优先级 | 预计工作量 | 依赖 | 状态 |
|------|--------|-----------|------|------|
| 任务1：间接绘制支持 | P0 | 2-3天 | - | ⬜ 未开始 |
| 任务2：数据类型扩展 | P0 | 1天 | 任务1 | ⬜ 未开始 |
| 任务3：STORAGE 缓冲支持 | P0 | 1-2天 | - | ⬜ 未开始 |
| 任务4：计算着色器协调 | P1 | 2天 | 任务3 | ⬜ 未开始 |
| 任务5：示例验证 | P1 | 2-3天 | 任务1-4 | ⬜ 未开始 |

**总预计工作量**：8-11天

---

## 任务1：间接绘制支持

### 目标
添加 `drawIndexedIndirect` 和 `multiDrawIndexedIndirect` 的完整支持。

### 子任务清单

| 子任务 | 描述 | 状态 | 代码位置 |
|--------|------|------|----------|
| 1.1 | 添加 `DrawIndexedIndirect` 数据类型 | ⬜ 待实现 | `src/data/DrawIndexedIndirect.ts` |
| 1.2 | 添加 `IndirectBuffer` 数据类型 | ⬜ 待实现 | `src/data/IndirectBuffer.ts` |
| 1.3 | 实现 `WGPURenderPassEncoder.drawIndexedIndirect()` | ⬜ 待实现 | `src/caches/WGPURenderPassEncoder.ts` |
| 1.4 | 实现 `WGPURenderPassEncoder.drawIndirect()` | ⬜ 待实现 | `src/caches/WGPURenderPassEncoder.ts` |
| 1.5 | 添加 `multiDrawIndexedIndirect` 支持（检测特性） | ⬜ 待实现 | `src/caches/WGPURenderPassEncoder.ts` |
| 1.6 | 更新 `RenderObject` 支持 `indirectDraw` 属性 | ⬜ 待实现 | `src/data/RenderObject.ts` |
| 1.7 | 更新 `runDraw.ts` 处理间接绘制分支 | ⬜ 待实现 | `src/internal/renderobject/runDraw.ts` |
| 1.8 | 导出新类型到 `index.ts` | ⬜ 待实现 | `src/index.ts` |

### 验收标准
- [ ] `drawIndexedIndirect()` 方法正常工作
- [ ] `multiDrawIndexedIndirect()` 在支持设备上正常工作
- [ ] 不支持设备有适当的 fallback
- [ ] 类型检查通过
- [ ] 单元测试通过

### 预计工作量：2-3天

---

## 任务2：数据类型扩展

### 目标
扩展数据类型以支持 GPU 生成的绘制命令。

### 子任务清单

| 子任务 | 描述 | 状态 | 代码位置 |
|--------|------|------|----------|
| 2.1 | 扩展 `BufferBinding` 支持 STORAGE usage | ⬜ 待实现 | `src/data/BufferBinding.ts` |
| 2.2 | 添加 `AtomicCounter` 数据类型 | ⬜ 待实现 | `src/data/AtomicCounter.ts` |
| 2.3 | 添加 `StorageBuffer` 数据类型 | ⬜ 待实现 | `src/data/StorageBuffer.ts` |
| 2.4 | 扩展 `BindingResources` 类型定义 | ⬜ 待实现 | `src/data/BindingResources.ts` |

### 验收标准
- [ ] 新类型可正确创建和使用
- [ ] 类型定义完整
- [ ] 导出到 `index.ts`

### 预计工作量：1天

---

## 任务3：STORAGE 缓冲支持

### 目标
添加可读写 STORAGE 缓冲区的完整支持。

### 子任务清单

| 子任务 | 描述 | 状态 | 代码位置 |
|--------|------|------|----------|
| 3.1 | 扩展 `WGPUBuffer` 支持 STORAGE usage | ⬜ 待实现 | `src/caches/WGPUBuffer.ts` |
| 3.2 | 添加原子操作支持（atomicAdd、atomicSub 等） | ⬜ 待实现 | `src/utils/atomicOps.ts` |
| 3.3 | 更新 `WGPUBindGroupEntry` 处理 STORAGE 缓冲 | ⬜ 待实现 | `src/caches/WGPUBindGroupEntry.ts` |
| 3.4 | 添加 STORAGE 缓冲区使用示例 | ⬜ 待实现 | `examples/` |

### 验收标准
- [ ] STORAGE 缓冲区可正确创建和绑定
- [ ] 原子操作正常工作
- [ ] 示例可运行

### 预计工作量：1-2天

---

## 任务4：计算着色器协调

### 目标
增强计算着色器支持，实现多 Pass 协调和数据传递。

### 子任务清单

| 子任务 | 描述 | 状态 | 代码位置 |
|--------|------|------|----------|
| 4.1 | 扩展 `ComputePass` 支持 `inputFrom`/`outputTo` | ⬜ 待实现 | `src/data/ComputePass.ts` |
| 4.2 | 添加 `ComputePipelineChain` 类型 | ⬜ 待实现 | `src/data/ComputePipelineChain.ts` |
| 4.3 | 实现计算着色器之间的数据依赖管理 | ⬜ 待实现 | `src/internal/computeChain.ts` |
| 4.4 | 添加计算着色器协调示例 | ⬜ 待实现 | `examples/` |

### 验收标准
- [ ] 多计算着色器可正确链接
- [ ] 数据传递正确
- [ ] 示例可运行

### 预计工作量：2天

---

## 任务5：示例验证

### 目标
创建全GPU驱动渲染示例验证所有扩展功能。

### 子任务清单

| 子任务 | 描述 | 状态 | 代码位置 |
|--------|------|------|----------|
| 5.1 | 创建基础间接绘制示例 | ⬜ 待实现 | `examples/src/webgpu/indirectDrawing/` |
| 5.2 | 创建计算着色器命令生成示例 | ⬜ 待实现 | `examples/src/webgpu/gpuCulling/` |
| 5.3 | 创建完整 GPU 驱动渲染示例 | ⬜ 待实现 | `examples/src/webgpu/gpuDrivenRendering/` |
| 5.4 | 添加性能监控和对比 | ⬜ 待实现 | 同上 |
| 5.5 | 编写示例文档 | ⬜ 待实现 | `examples/README.md` |

### 验收标准
- [ ] 所有示例可运行
- [ ] 性能达到预期（开销 < 2%）
- [ ] 文档完整

### 预计工作量：2-3天

---

## 总体进度

```
任务1：间接绘制支持    [░░░░░░░░░░] 0%
任务2：数据类型扩展    [░░░░░░░░░░] 0%
任务3：STORAGE 缓冲支持 [░░░░░░░░░░] 0%
任务4：计算着色器协调  [░░░░░░░░░░] 0%
任务5：示例验证        [░░░░░░░░░░] 0%

总进度：0% (0/5 任务完成)
```

---

## 依赖关系

```
任务1（间接绘制）
  ├─ 任务2（数据类型）→ 依赖任务1
  └─ 任务5（示例验证）→ 依赖任务1-4

任务3（STORAGE 缓冲）
  └─ 任务4（计算着色器）→ 依赖任务3

任务2、任务4
  └─ 任务5（示例验证）→ 依赖任务2、任务4
```

---

## 实施顺序

### 第1周：核心功能
- 任务1：间接绘制支持（3天）
- 任务2：数据类型扩展（1天）

### 第2周：高级功能
- 任务3：STORAGE 缓冲支持（2天）
- 任务4：计算着色器协调（2天）

### 第3周：验证完善
- 任务5：示例验证（3天）
- 文档更新和收尾（1天）

---

## 文件变更清单

### 新增文件
```
src/data/
  ├── DrawIndexedIndirect.ts
  ├── IndirectBuffer.ts
  ├── AtomicCounter.ts
  ├── StorageBuffer.ts
  └── ComputePipelineChain.ts

src/utils/
  └── atomicOps.ts

src/internal/
  └── computeChain.ts

examples/src/webgpu/
  ├── indirectDrawing/
  ├── gpuCulling/
  └── gpuDrivenRendering/
```

### 修改文件
```
src/data/
  ├── BufferBinding.ts        (扩展 STORAGE 支持)
  ├── BindingResources.ts     (扩展类型)
  ├── ComputePass.ts          (添加 inputFrom/outputTo)
  ├── RenderObject.ts         (添加 indirectDraw)

src/caches/
  ├── WGPURenderPassEncoder.ts (实现间接绘制)
  ├── WGPUBuffer.ts           (STORAGE 支持)
  └── WGPUBindGroupEntry.ts   (STORAGE 处理)

src/internal/renderobject/
  └── runDraw.ts              (间接绘制分支)

src/index.ts                  (导出新类型)
```

---

## 验收标准

所有任务完成后应满足：

- [ ] 所有新功能正常工作
- [ ] 性能开销 < 2%
- [ ] 类型检查 100% 通过
- [ ] 单元测试覆盖率 > 80%
- [ ] 示例代码可运行
- [ ] 文档更新完整
- [ ] 向后兼容（不破坏现有代码）

---

> 最后更新：2026-04-20
