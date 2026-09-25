# 编辑器 AI 桥接（Editor AI Bridge）

> 目的：让 AI（DSH、CLI、任何 MCP 客户端）以**语义化、受控**的方式查询与操作编辑器，
> 而不是把整个场景 JSON 塞进上下文，也不是靠 DOM 选择器模拟点击。
>
> **当前进度：P1（只读通道）已实现并实测。** 写入能力（P2）尚未开始，本通道**不含任何写入方法**。

## 1. 架构（方案 C：编辑器内 RPC）

```
DSH / CLI ──HTTP──▶ Vite dev server middleware（packages/editor/bridge/vitePlugin.mjs）
                        ▲                    │
                  轮询 /pending         长轮询 /result
                        │                    ▼
                 EditorBridge（浏览器内，packages/editor/src/bridge/EditorBridge.ts）
                        │
                        └─▶ 只读查询 EditorData.editorData.gameScene / logic(entity)
```

编辑器前端跑在**浏览器**里，无法监听端口；而浏览器与 dev server 之间已有通道，因此把 RPC
端点挂在 dev server 的 middleware 上，前端**主动轮询**取任务、执行后回传结果。

**为什么不用 WebSocket**：本仓库 `node_modules` 中不存在 `ws` 依赖，手写 RFC 6455 握手与帧解析
的收益不抵风险。HTTP 方案零依赖、可 curl 调试；长轮询下空转时延 ≈ 一次网络往返。

## 2. 传输协议

前缀 `/__editor-bridge`，全部为 JSON：

| 路由 | 说明 |
|---|---|
| `POST /call` | body `{ method, params }` → `{ id }` |
| `GET /pending` | → `{ requests: [{ id, method, params }] }`（**派发即从队列移除**，保证一次性语义）|
| `POST /result` | body `{ id, ok, result, error }` |
| `GET /result?id=` | → 结果；未就绪时**挂起至多 20s**（长轮询）|

## 3. 对象标识：路径式 id

形如 `/Untitled/Plane`，同级重名追加 `#2`（`/Untitled/Cube#2`）。

- **以场景根为起点**：不暴露 `editorViewRoot` 等编辑器内部层级（它们既无意义，又会随编辑器结构调整而变动）
- 相比运行时 `WeakMap<Object3D, string>`：确定性、无状态、**跨会话稳定**，AI 才能引用"上次那个对象"
- 组件/几何参数在返回时做**摘要化**：跳过 `positions/normals/uvs/colors/tangents/indices/drawRange/data` 等大字段，数组超过 8 项只报长度——避免上下文膨胀

## 4. P1 方法（全部只读）

| 方法 | 用途 |
|---|---|
| `editor.info` | 通道自述：场景名、选中数、当前工具、可用方法列表 |
| `scene.summary` | 层级摘要：对象/组件总数、最大深度、一级子对象（**不含几何数据**）|
| `scene.list` | 分层展开，`{ path?, depth? }`，默认 depth=2 |
| `scene.get` | 单对象详情：变换 + 子对象 + 组件摘要 |
| `scene.find` | 按 `{ name?, type?, tag?, limit? }` 检索，返回 id 列表 |
| `scene.bounds` | 世界包围盒（**AI 计算"平面中心"这类问题的前提**）|
| `selection.get` | 当前选中对象 |

## 5. 用法

前提：dev server 在跑，**且页面已在浏览器中打开**（桥接前端跑在页面里）。

```bash
# CLI（仓库根）
node scripts/editor-bridge-cli.mjs editor.info
node scripts/editor-bridge-cli.mjs scene.summary
node scripts/editor-bridge-cli.mjs scene.list --url http://127.0.0.1:3001

# 带参数：推荐用环境变量（PowerShell 向 node 传参会剥离内层双引号）
#   PowerShell: $env:BRIDGE_PARAMS = '{"objectId":"/Untitled/Plane"}'
#   bash:       BRIDGE_PARAMS='{"objectId":"/Untitled/Plane"}' node scripts/editor-bridge-cli.mjs scene.get
```

MCP server（`scripts/editor-mcp-server.mjs`）为下一步，把上述方法包装成 MCP tools 供 DSH 直接调用。

## 6. 安全边界（P1）

- **只读**：实现中没有任何写入方法（方法表 `HANDLERS` 全部只读）
- **仅 dev**：插件 `apply: 'serve'`，生产构建不挂载；端点只在 dev server 上存在
- **本机**：dev server 默认仅监听 localhost

P2 引入写入时必须补齐：**事务 + 撤销**、破坏性操作二次确认、并发（人与 AI 同时编辑）处理。

## 7. 实测记录（2026-09-25）

| 调用 | 结果 |
|---|---|
| `editor.info` | `hasScene: true`、`sceneName: "Untitled"`、7 个方法 |
| `scene.summary` | `rootId: "/Untitled"`、`objectCount: 5`、4 个一级子对象（Main Camera / DirectionalLight / Plane / Sphere）|
| `scene.get {"objectId":"/Untitled/Plane"}` | 变换 + `MeshRenderer`（`PlaneGeometry 10×10` + 灰色 `StandardMaterial`），无大数组 |
| `scene.find {"type":"MeshRenderer"}` | `count: 2`（Plane / Sphere）|
| `scene.bounds {"objectId":"/Untitled/Plane"}` | `min(-5,0,-5) / max(5,0,5)` |

## 8. 下一步

- **P1 收尾**：MCP server（把方法暴露为 tools）；`view.screenshot`（AI 需要"看"结果）
- **P2 可撤销写**：先补**快照式事务**——事务开始时对受影响子树 `serialization.serialize`，回滚时
  `deserialize` 回去，完全复用既有序列化能力，**不必改造现有的一堆 `reactive(x).field = v`**；
  再加 `scene.add / set / remove / reparent` 与 `history.undo/redo`
- **P3 生成式**：AI 生成场景片段/材质 → 预览 diff → 确认 → 插入
- **P4 闭环**：AI 截图看结果 → 自我修正

## 9. 已知限制

- 需要页面保持打开；页面重载期间调用会超时（调用方收到 `TIMEOUT`）
- dev server 热更新可能让前端桥接模块重载，从而出现多个轮询器（语义安全：`/pending` 派发即删，
  不会重复执行；但仍是待清理项）
- `scene.bounds` 依赖渲染侧是否已提供包围盒；取不到时返回 `bounds: null` 并附原因，不抛错
