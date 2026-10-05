# @feng3d/ui

feng3d 引擎的 UI 库。原先在独立外仓（https://gitee.com/feng3d/ui），已收编进主仓 `packages/ui`，
与其余包同等追踪、同等门禁（类型检查 / 构建 / 测试 / 覆盖率 / 分层）。

## 三条约定

1. **组件形态**：纯数据 `interface Xxx`（字段全 `readonly`）+ Logic 工厂 + `registerLogic`，
   与仓库根 [AGENTS.md](../../AGENTS.md) 第 3 / 11 章一致。
2. **类型登记**：每个组件都要用 `feng3d` 的 `registerComponentType` 登记（写在同文件的
   `registerLogic` 旁边）。不登记的话，引擎的类型表认不出它，`Scene.models` /
   `getComponentsInChildren('Renderable')` / `Scene.behaviours` / `Raycaster.pick`
   会全部扫不到它——UI 就渲染不出来、也拾取不到。回归测试见
   [test/uiWireup.spec.ts](test/uiWireup.spec.ts)。
3. **独立渲染 Pass**：UI 渲染器登记为 `renderPass: 'ui'`（不是默认的 `'forward'`），
   由 [src/core/UIPass.ts](src/core/UIPass.ts) 注册的 UI Pass 渲染：
   - 绘制顺序 = 树的前序遍历（父先画、子后画）——这就是**层级序**，不再靠 z 值凑；
   - 相机无关的正交投影（UI 着色器用 `globalUniforms.u_Viewport` 做像素 → NDC），
     因此不受 3D 相机的视锥剔除影响，**不需要** `frustumCulling: false`；
   - 布局由 Pass 的每帧准备驱动（`CanvasLogic.layout`），**不需要**应用层每帧调 `drawCanvas`；
   - `drawCanvas(view, mousePos)` 现在只负责鼠标射线（拾取用）。

   UI 材质与着色器见 [src/core/UIMaterial.ts](src/core/UIMaterial.ts)，
   回归测试见 [test/uiPass.spec.ts](test/uiPass.spec.ts) 与 [test/uiDrawPath 相关用例](test/canvasRenderer.spec.ts)。

本包当前是 `"private": true`（收编初期防止把未迁完的版本发到 npm），发布策略见
[docs/CI.md](../../docs/CI.md) 的发布章节。
