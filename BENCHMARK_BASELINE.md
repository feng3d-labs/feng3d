# 静态场景 Benchmark 基线

> 由 `examples/src/base/BenchmarkTest.html?count=N` 采集（阶段 0，改造计划见 [FRAMEWORK_REFACTOR_PLAN.md](./FRAMEWORK_REFACTOR_PLAN.md)）。
> 每次阶段 1 / 3 等触及渲染链的改造完成后，用相同环境重跑并更新本表对比。

## 采集环境

- 2026-08-15，Windows，Chrome 150（headed，视口 1610×950）
- 场景：N 个 ColorMaterial 立方体网格（共享 geometry / material），无动画、无交互、无异步资源
- 指标取稳态（预热 1-2 秒后）连续采样均值

## 基线数据

| 规模 | 帧率 | 平均帧时间 | 最大帧时间 | computed 求值/帧 | GPU buffer | GPU bindGroup | GPU renderPipeline | 显存 |
|------|------|-----------|-----------|------------------|------------|---------------|--------------------|------|
| 200 | 60（vsync 上限） | 16.7 ms | ~18 ms | 16 | 603 | 200 | 1 | 1110 KB |
| 1000 | ~30 | 33-36 ms | ~48 ms | 16 | 3003 | 1000 | 1 | 1448 KB |
| 5000 | ~4.5 | 215-255 ms | ~288 ms | 16 | 15003 | 5000 | 1 | 3136 KB |

所有规模下 GPU 计数与显存逐秒稳定（无泄漏）；首帧预热尖峰（5000 规模约 11.3 万次求值）为构造期，不计入稳态。

## 关键观察（阶段 1 的靶子）

1. **稳态 computed 求值次数与规模无关（恒 16/帧）**：每帧真实重算的只有 renderer/view 级 computed（frameVersion 直接依赖者）；对象级 computed（matrix/local2world/renderObject）在数据不变时保持缓存、零重算。computed 缓存机制本身是有效的。
2. **帧时间随规模线性增长（200→16.7ms、1000→34ms、5000→220ms），但求值数不变**——说明每帧成本不在 computed 重求值，而在 renderer computed **内部执行**：每帧收集渲染对象 + 逐对象执行 beforeRender 写入（frameVersion 使 renderer computed 每帧失效重跑，其函数体按对象数线性耗时）。
3. **阶段 1 的验收因此需要修正表述**：仅看"computed 求值/帧"无法反映收益（已经是 16）；应以**静态场景帧时间**为主要标尺（目标：移除 frameVersion 后静态场景不再逐对象重跑 renderer computed，帧时间应大幅下降并趋平）。
4. bindGroup = 对象数（每 RenderObject 一组）、buffer ≈ 3×对象数 + 常量，符合当前每对象绑定的实现，可作为阶段 3 收敛绑定数量的参照。
