# effect 使用盘点

> 三类标注：**边界**（必须保留，引擎 → 外部系统）、**过渡**（待迁移，标注对应迁移任务）、**待评估**（尚未定性）。
> 另有 `框架内部`（reactivity 自身实现）、`编辑器` / `示例`（不受"引擎核心渲染路径 effect 清零"约束，登记只为防腐化）。
>
> **统计口径**：`packages/**` 下的 `.ts` 源码；排除 `*.spec.ts`、`test/`、`dist/`、`node_modules/`、`.d.ts`，
> 并排除注释与 `function effect(...)` / 方法声明行。
> **统计时点**：2026-10-05，全仓库 63 处 `effect()` 调用（34 个文件）。
>
> **机器校验**：`node scripts/check-effect-inventory.mjs`（已进 CI 门禁）。下表与代码不一致即失败——
> 这样清单不会再悄悄腐化（issue #79：旧清单停在 30 处，实际早已增长且个别条目写错）。

## 权威计数表

<!-- EFFECT_INVENTORY:START -->
| 文件 | 数量 | 类别 | 用途 / 迁移任务 |
| --- | --- | --- | --- |
| `packages/feng3d/src/assets/Object3DAssets.ts` | 1 | 边界 | 对象树资源就绪通知（等待异步纹理加载完成，issue #60） |
| `packages/feng3d/src/audio/AudioSource.ts` | 6 | 边界 | 音频外设状态同步（播放/音量/循环等 → AudioBufferSourceNode） |
| `packages/feng3d/src/audio/AudioListener.ts` | 2 | 边界 | 听者位置/朝向同步到音频上下文 |
| `packages/feng3d/src/materials/StandardMaterial.ts` | 2 | 边界 | onLoadCompleted 一次性回调通知（触发后立即 pause） |
| `packages/feng3d/src/materials/TextureMaterial.ts` | 2 | 边界 | 同上 |
| `packages/feng3d/src/core/Mouse3DManager.ts` | 1 | 边界 | DOM 指针状态同步（若可纯数据派生应改 computed） |
| `packages/feng3d/src/core/Entity.ts` | 1 | 过渡 | 组件自动初始化（数据 → 数据的同步写） |
| `packages/feng3d/src/core/Container.ts` | 1 | 过渡 | children → parent 同步 |
| `packages/feng3d/src/core/BoundingBox.ts` | 1 | 过渡 | 包围盒缓存失效同步 |
| `packages/feng3d/src/core/TransformLayout.ts` | 3 | 过渡 | u_rect 等布局同步（随 beforeRender 退役处理） |
| `packages/feng3d/src/animation/Animation.ts` | 2 | 过渡 | 命令式动画（帧驱动写数据，声明式动画取代） |
| `packages/terrain/src/TerrainGeometry.ts` | 1 | 待评估 | 待评估 |
| `packages/terrain/src/TerrainMaterial.ts` | 1 | 待评估 | 待评估 |
| `packages/webgpu/src/ReactiveObject.ts` | 1 | 框架内部 | `effectScope` 包装（框架自身能力，非业务副作用） |
| `packages/reactivity/src/ReactiveObject.ts` | 1 | 框架内部 | 同上（两个包各有一份同名实现） |
| `packages/webgpu/src/caches/WGPUBuffer.ts` | 2 | 过渡 | **有生产者**：`data` / `writeBuffers` 写入通路（原清单称"无生产者"是错的） |
| `packages/webgpu/src/caches/WGPUQuerySet.ts` | 1 | 待评估 | 待评估 |
| `packages/webgpu/src/caches/WGPUTimestampQuery.ts` | 1 | 待评估 | 待评估 |
| `packages/webgpu/examples/src/webgpu/bitonicSort/index.ts` | 1 | 示例 | 示例代码 |
| `packages/webgpu/examples/src/webgpu/sky/index.ts` | 2 | 示例 | 示例代码 |
| `packages/webgpu/examples/src/webgpu/timestampQuery/index.ts` | 2 | 示例 | 示例代码 |
| `packages/editor/src/feng3d/EditorComponent.ts` | 2 | 编辑器 | 编辑器内核 |
| `packages/editor/src/feng3d/hierarchy/Hierarchy.ts` | 1 | 编辑器 | 编辑器内核 |
| `packages/editor/src/feng3d/mrsTool/models/MToolModel.ts` | 3 | 编辑器 | 编辑器内核 |
| `packages/editor/src/feng3d/mrsTool/models/RToolModel.ts` | 2 | 编辑器 | 编辑器内核 |
| `packages/editor/src/feng3d/mrsTool/models/SToolModel.ts` | 1 | 编辑器 | 编辑器内核 |
| `packages/editor/src/feng3d/mrsTool/models/SectorObject3D.ts` | 1 | 编辑器 | 编辑器内核 |
| `packages/editor/src/scripts/CameraIcon.ts` | 3 | 编辑器 | 编辑器内核 |
| `packages/editor/src/scripts/DirectionLightIcon.ts` | 2 | 编辑器 | 编辑器内核 |
| `packages/editor/src/scripts/PointLightIcon.ts` | 2 | 编辑器 | 编辑器内核 |
| `packages/editor/src/scripts/SpotLightIcon.ts` | 2 | 编辑器 | 编辑器内核 |
| `packages/editor/src/ui/assets/AssetNode.ts` | 1 | 编辑器 | 编辑器内核 |
| `packages/ui/src/core/Transform2D.ts` | 6 | 过渡 | Transform2D ↔ TransformLayout / Object3D 变换的字段镜像（数据 → 数据同步，复刻原 `watcher.bind`） |
| `packages/ui/src/Text.ts` | 2 | 过渡 | 文本/样式变化 → 重绘失效标志（复刻原两处 `watcher.watch`；样式内部字段仍由 `TextStyle` 的 `changed` 事件通知） |
| **合计** | **63** | | 34 个文件 |
<!-- EFFECT_INVENTORY:END -->

## 引擎核心渲染路径

`渲染核心路径（render / materials 的纹理绑定 / webgpu 的 binding 上传）已 effect 清零`这一结论仍然成立：
`WGPUBufferBinding` 的 per-item 上传 effect 已在 `e5db22ac` 改为 pull 模型（惰性 computed + `GpuUploadRegistry`
+ `runSubmit` 编码后统一拉取差异上传），`StandardMaterial` / `TextureMaterial` / `DebugShadowMapMaterial`
的纹理绑定 effect 也已改为纯 computed。

剩余 `packages/feng3d` 的 21 处都在**外部系统边界**（音频 / 材质加载回调 / DOM 指针）或**数据同步过渡**
（Entity / Container / BoundingBox / TransformLayout / Animation），没有渲染核心路径。

## 违规类

无。新增 `effect` 默认视为违规，必须自证属于边界 / 过渡并登记到上表，否则 `effect-annotation` lint 规则与
本脚本的 CI 校验会拦下来。
