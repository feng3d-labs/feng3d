# effect 使用盘点（框架设计文档 4.4 落地基线）

> 阶段 3 首个任务。三类标注：**边界**（必须保留，引擎 → 外部系统）、**过渡**（待迁移，标注对应迁移任务）、**违规**（改写为 computed 或直接数据写入）。
> 统计时点：2026-08-15，全仓库 30 处 `effect()` 调用（不含测试/注释/工具方法定义）。

## 边界类（必须保留）

| 位置 | 用途 |
|------|------|
| `AudioSource.ts` ×6 | 音频外设状态同步（播放/音量/循环等 → AudioBufferSourceNode） |
| `AudioListener.ts` ×2 | 听者位置/朝向同步到音频上下文 |
| `StandardMaterial.ts:260` / `TextureMaterial.ts:157` | onLoadCompleted 一次性回调通知（引擎 → 外部回调，触发后立即 pause） |
| `Mouse3DManager.ts:58` | DOM 指针状态同步（复核：若为纯数据派生应改 computed，暂列边界） |

## 过渡类（待迁移）

| 位置 | 用途 | 迁移任务 |
|------|------|----------|
| `WGPUBufferBinding.updateBufferBinding` 内 `this.effect` ×N/绑定 | uniform 写入时 push writeBuffers | 阶段 3：submit 前 pull 差异上传 |
| `Entity.ts:127` / `Container.ts:125` | 组件自动初始化、children→parent 同步（数据→数据的同步写） | 阶段 4 class 化时评估 computed 化可行性 |
| `BoundingBox.ts:29` | 包围盒缓存失效同步 | 阶段 4 一并评估 |
| `TransformLayout.ts` ×3 | u_rect 等布局同步 | 阶段 3 随 beforeRender 退役处理 |
| `Animation.ts` ×2 | 命令式动画（帧驱动写数据） | 阶段 6 声明式动画取代 |

## 已清理

- `StandardMaterial` / `TextureMaterial` / `DebugShadowMapMaterial` 的纹理绑定 effect（每材质 5+1+1 个）→ 已改为纯 computed（阶段 2 完成）。

## 违规类

无（新增 effect 默认视为违规，须自证属于边界或过渡并登记本表）。
