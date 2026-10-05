# @feng3d/ui

feng3d 引擎的 UI 库。原先在独立外仓（https://gitee.com/feng3d/ui），已收编进主仓 `packages/ui`，
与其余包同等追踪、同等门禁（类型检查 / 构建 / 测试 / 覆盖率 / 分层）。

## 两条约定

1. **组件形态**：纯数据 `interface Xxx`（字段全 `readonly`）+ `class XxxLogic` + `registerLogic`，
   与仓库根 [AGENTS.md](../../AGENTS.md) 第 3 / 11 章一致。
2. **类型登记**：每个组件都要用 `feng3d` 的 `registerComponentType` 登记（写在同文件的
   `registerLogic` 旁边）。不登记的话，引擎的类型表认不出它，`Scene.models` /
   `getComponentsInChildren('Renderable')` / `Scene.behaviours` / `Raycaster.pick`
   会全部扫不到它——UI 就渲染不出来、也拾取不到。回归测试见
   [test/uiWireup.spec.ts](test/uiWireup.spec.ts)。

本包当前是 `"private": true`（收编初期防止把未迁完的版本发到 npm），发布策略见
[docs/CI.md](../../docs/CI.md) 的发布章节。
