# 编辑器 AI 桥接（Editor AI Bridge）

> 目的：让 AI（DSH、CLI、任何 MCP 客户端）以**语义化、受控**的方式查询与操作编辑器，
> 而不是把整个场景 JSON 塞进上下文，也不是靠 DOM 选择器模拟点击。
>
> **当前进度：P1（只读）+ P2（可撤销写）均已实现并实测，且已作为 MCP server 接入 DSH**
> （`mcp__feng3d-editor__*` 共 19 个工具可直接调用）。写能力默认关闭，需在编辑器 URL 加
> `?bridge=write`（见 §9）。

## 1. 架构（方案 C：编辑器内 RPC）

```
DSH（内置 MCP client 子进程）──stdio──▶ scripts/editor-mcp-server.mjs ─┐
                                                                       ├─HTTP─▶ Vite dev server middleware
scripts/editor-bridge-cli.mjs ─────────────────────────────────────────┘        （packages/editor/bridge/vitePlugin.mjs）
                                                                                    ▲                │
                                                                              轮询 /pending     长轮询 /result
                                                                                    │                ▼
                                                          EditorBridge（浏览器内，packages/editor/src/bridge/EditorBridge.ts）
                                                                                    │
                                                                                    └─▶ 读写 EditorData.editorData.gameScene / logic(entity)
```

编辑器前端跑在**浏览器**里，无法监听端口；而浏览器与 dev server 之间已有通道，因此把 RPC
端点挂在 dev server 的 middleware 上，前端**主动轮询**取任务、执行后回传结果。

**为什么不用 WebSocket**：本仓库 `node_modules` 中不存在 `ws` 依赖，手写 RFC 6455 握手与帧解析
的收益不抵风险。HTTP 方案零依赖、可 curl 调试；长轮询下空转时延 ≈ 一次网络往返。

## 2. 传输协议

前缀 `/__editor-bridge`，全部为 JSON：

| 路由 | 说明 |
|---|---|
| `GET /ping` | → `{ ok: true }`：**只读探针**，供调用方探测 dev server 实际端口（**不能**用 `/pending` 探测，它会取走并丢弃真任务）|
| `POST /call` | body `{ method, params, target? }` → `{ id }` |
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
| `selection.set` | 选中/高亮指定对象——**UI 导航，不改场景数据**，故不需要写通道；空数组清空。让用户看见 AI 指的是哪个对象，也为截图提供视觉焦点 |
| `view.screenshot` | **主视图截帧**（所见即所得，含 gizmo/网格线）：`EditorView.captureFrame()` 提交一帧后 `readPixels` 读回画布纹理；`{ width? }` 默认缩放到 800px |
| `log.tail` | 读编辑器控制台日志（与用户在控制台面板看到的**同一份**缓冲）；支持 `{ type?, limit?, grep?, sinceSeq? }` 过滤与增量读取 |

## 5. 用法

前提：dev server 在跑，**且页面已在浏览器中打开**（桥接前端跑在页面里）。

### 地址：默认自动探测

Vite 的端口是「第一个空闲端口」——默认 3000，被占用就漂到 3001、3002……因此调用方**不写死端口**：
`scripts/editor-bridge-base.mjs` 依次探测 `3000→3003` 的 `GET /__editor-bridge/ping`，命中即用
（每次调用重新校验，dev server 换端口/重启后能自愈）。`EDITOR_BRIDGE_URL` 或 CLI `--url` 可显式覆盖。

```bash
# CLI（仓库根）
node scripts/editor-bridge-cli.mjs editor.info
node scripts/editor-bridge-cli.mjs scene.summary

# 带参数：推荐用环境变量（PowerShell 向 node 传参会剥离内层双引号）
#   PowerShell: $env:BRIDGE_PARAMS = '{"objectId":"/Untitled/Plane"}'
#   bash:       BRIDGE_PARAMS='{"objectId":"/Untitled/Plane"}' node scripts/editor-bridge-cli.mjs scene.get

# 多页面时定向投递（见 §9「定向投递」）
node scripts/editor-bridge-cli.mjs scene.summary --target probe
```

> **地址必须用 `localhost` 而非 `127.0.0.1`**：实测 Node 的 `fetch` 连 `127.0.0.1` 直接
> `fetch failed`，连 `localhost` 正常。探测与请求都遵循这条。

### 在 DSH 中装配（`cordis.patch.yml`）

MCP server 是 `scripts/editor-mcp-server.mjs`（stdio + 换行分隔 JSON-RPC，19 个 tools）。
DSH 侧在 `$DSH_HOME/profiles/web/cordis.patch.yml` 里装配：

```yaml
- insert:
    - id: mcp-feng3d-editor
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: feng3d-editor
        transport: stdio
        command: node
        args: ['C:\feng\gitee\feng3d\feng3d\scripts\editor-mcp-server.mjs']
```

> ⚠ **必须用 `- insert:` 包裹**。patch 条目默认语义是「按 `id` 覆盖**已有**条目」，
> 直接写 `- id: <新名字> / name: / config:` 会匹配不到任何行，被 `dsh-app-boot` 的
> `applyEntryPatches()` **静默跳过**（只留一条 warn），表现为「配置明明写了、插件却从未加载」。
> 进程列表里始终没有 `editor-mcp-server` 就是这个原因。
>
> 该 profile 的 `patchReload: "live"`，因此改完 patch 文件**热加载即刻生效，无需重启 DSH**。
> 工具以 `mcp__feng3d-editor__<tool>` 形式出现。

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

**2026-09-26 复测（走 MCP 通道，不再是 CLI 代跑）**：`mcp__feng3d-editor__editor_info` 与
`scene_summary` 直接调用成功，读到 `objectCount: 10`（含此前 AI 添加的 `AISphere` 系列），
`history_status` 返回 `writeEnabled: true`。

## 8. 下一步

- ~~**P1 收尾**：MCP server（把方法暴露为 tools）~~ —— 已完成，并已在 DSH 中装配（§5）
- ~~**P2 可撤销写**~~ —— 已完成（§9）
- ~~`view.screenshot`~~ —— **已打通**（见 §11）：改走 `EditorView.captureFrame()` 帧内读回，
  不再是取不到内容的 `canvas.toDataURL()`
- **P3 生成式**：AI 生成场景片段/材质 → 预览 diff → 确认 → 插入
- **P4 闭环**：AI 截图看结果 → 自我修正

## 9. P2 可撤销写通道（进行中）

### 启用方式（默认关闭）

写能力**默认不可用**，必须显式开启其一：

- 编辑器 URL 加参数：`http://localhost:3001/?bridge=write`
- 或控制台执行 `localStorage.setItem("editor-bridge-write", "1")` 后刷新

未启用时写方法返回明确错误，只读方法不受影响。

### 已实现

| 方法 | 说明 |
|---|---|
| `scene.set` | 写对象字段，`path` 支持 `position.y`、`components[0].material.uniforms.u_diffuse.r` 这类形式 |
| `scene.add` | 新增对象，返回新对象 id；`components` 传纯数据字面量数组 |
| `scene.remove` | 删除对象及其子树；撤销时**插回原对象引用**（不是副本），位置也复原 |
| `scene.reparent` | 移动对象到另一个父级，可选 `index`；拒绝挂到自己的子孙下（防环）|
| `scene.save` | 把场景写回存储（浏览器里是 indexedDB），使改动在刷新后仍存在 |
| `history.status` | 撤销栈状态（写通道是否启用、可撤销/可重做数量与标签）|
| `history.undo` / `history.redo` | 撤销 / 重做一步 |
| `log.clear` | 清空控制台日志（复现问题前先清空，`log.tail` 就只读到本次日志）|

**撤销机制采用「命令式」而非「全场景快照」**：每个写操作记录自己的反向操作。粒度精确、实现可控。
历史栈上限 100，`undo`/`redo` 对称。

> **`scene.remove` 为什么不重建对象**：最初用 `serialization` 快照 + `deserialize` 复原，结果
> 引用变化，更早的 `add` 命令按引用找不到它，`add → remove → undo(remove) → undo(add)` 序列下
> 最后一次撤销失效、对象残留（实测发现）。改为复用原对象引用后两个命令正确互操作。

写入一律经 `reactive(holder)[key] = value`，与人工编辑同构，因此渲染与 UI 会即时响应。

写操作还会触发 `editor.selectedObjectsChanged` 使层级面板 / 检查器刷新。实测：写入后
**不刷新页面**，层级面板已列出新增对象（此前不触发该事件时面板看不到新对象）。

### 定向投递（多个页面同时打开时必用）

多个编辑器页面（用户浏览器一个、自动化探针一个）会同时轮询同一个 `/pending`，请求会被
**任一**页面抢先取走。实测踩过：探针以为在操作自己的页面，结果对象加到了用户页面——
判据是 `scene.save` 返回的 `childCount` 与探针页面实际子对象数不符（返回 9，探针只有 5）。
因此：

- 页面通过 URL `?bridgeClient=<name>` 自报身份，缺省为 `default`
- `POST /call` 可带 `target: '<name>'`，只有该身份的页面会取到这条请求
- 不带 `target` 时行为不变（任何页面都可取，向后兼容）

CLI 侧用 `--target <name>` 或环境变量 `BRIDGE_TARGET`。

### 持久化落在哪里（易误解）

`scene.save()` 走 `serialization.serialize` + `editorRS.fs.writeObject`，与编辑器自身的
`beforeunload` 保存是同一条链路。**关键**：浏览器环境下 `FS.basefs` 是 **indexedDB**
（`nativeFS` 才是磁盘，编辑器在浏览器里跑用不到），所以：

- 项目目录**不会**出现 `scene.json` 文件——我曾据此误判为「落盘失败」，实际只是搜错了地方
- `readScene` 从同一处读回，因此**刷新页面后场景能恢复**。实测：新增对象 → `scene.save`
  → `page.reload()` → `scene.find` 仍能查到，且层级面板可见

### 请求去重

写操作不幂等（`scene.add` 会创建两个对象），而前端若有多个轮询器（桥接模块经历热更新重载），
同一请求可能被投递两次。前端按请求 id 记录 `executedRequestIds`（上限 500）兜底，保证只
生效一次。此前观测到的同名 `#0` 对象即由此而来。

### MCP tools

全部 19 个方法都已包装为 tools，DSH 侧可直接调用（10 只读 + 9 写/历史/日志）：

| 类别 | tools |
|---|---|
| 只读 | `editor_info`、`scene_summary`、`scene_list`、`scene_get`、`scene_find`、`scene_bounds`、`selection_get`、`selection_set`、`view_screenshot`、`log_tail` |
| 写/历史/日志 | `scene_set`、`scene_add`、`scene_remove`、`scene_reparent`、`scene_save`、`history_status`、`history_undo`、`history_redo`、`log_clear` |

### 实测（URL 带 `?bridge=write`）

```
history.status  → writeEnabled: true, undoCount: 0
scene.set       → /Untitled/Plane position.y = 1.5 → before: 0, after: 1.5, undoCount: 1
scene.get       → position.y: 1.5      ← 写入生效
history.undo    → undone: "set /Untitled/Plane.position.y"
scene.get       → position.y: 0        ← 撤销生效
```

### 端到端实测（AI 视角完成「在平面中心添加一个立方体」）

用 CLI（等价于 MCP 调用）走完整流程：

```
1. scene.find {name:"Plane"}      → /Untitled/Plane
2. scene.bounds /Untitled/Plane   → min(-5,0,-5) / max(5,0,5)  → 中心 (0,0,0)
3. scene.add {parentId:"/Untitled", name:"AICube", position:{x:0,y:0.5,z:0},
              components:[MeshRenderer + CubeGeometry + 蓝色 StandardMaterial]}
                                  → /Untitled/AICube
4. scene.add {name:"Holder"}      → /Untitled/Holder
5. scene.reparent AICube → Holder → from:/Untitled, to:/Untitled/Holder,
                                     newId:/Untitled/Holder/AICube
6. scene.find {name:"AICube"}     → /Untitled/Holder/AICube
7. history.undo                   → 回到 /Untitled/AICube（reparent 可撤销）
8. scene.remove Holder / AICube   → 清理完毕（find count 0）
```

## 10. 已知限制

- 需要页面保持打开；页面重载期间调用会超时（调用方收到 `TIMEOUT`）
- dev server 热更新可能让前端桥接模块重载，从而出现多个轮询器（语义安全：`/pending` 派发即删，
  不会重复执行；但仍是待清理项）
- `scene.bounds` 依赖渲染侧是否已提供包围盒；取不到时返回 `bounds: null` 并附原因，不抛错

## 11. 主视图截帧（`view.screenshot`）

早期实现走 `canvas.toDataURL()`，对 WebGPU 画布只能取到空白（未保留绘制缓冲），因此当时选择
**明确报错**而不是静默返回空白图——静默空白会让 AI 以为"场景是黑的"，比报错更有害。

现在改为**帧内读回**（与资源预览截图 `Feng3dScreenShotRenderer.render` 同一机制）：

1. `EditorView.captureFrame()`（`src/feng3d/EditorView.ts`）先 `markMutation()`——否则
   `WebGPU.submit` 会因版本号未变而**按需跳过**，画布纹理仍是上一帧 present 的，读回会失效；
2. 再 `webgpu.submit(viewLogic.submit)` 提交一帧，紧接着 `webgpu.readPixels()`：其内部
   `copyTextureToBuffer` 与渲染命令**在同一队列顺序执行**，`await` 返回即代表这一帧确实渲染完毕
   （确定性完成信号，不必用定时器猜时机）；
3. `pixelsToDataURL()` 把像素转 PNG（`bgra8unorm` 需交换 R/B），并按 `width` 缩放（默认 800px，
   原尺寸 base64 常达数百 KB，会挤爆上下文）。

**为什么需要 `editorViewRegistry.ts`**：`EditorView` 实例原本只存在于 `SceneView.vue` 的组件
`ref` 里，非 Vue 模块（桥接）拿不到它，而截帧必须先拿到视图的 WebGPU 与渲染链。新增的
`src/feng3d/editorViewRegistry.ts` 提供一个模块级登记点，`EditorView` 构造时登记自己。

> 附带修正：桥接的 `runRequest` 原先 `result = handler(...)` **不 await**，异步 handler
> （截帧必须异步——`mapBlocks` 只能经 `mapAsync` 完成）会被当成 Promise 直接序列化成 `{}`。
> 现已改为 `await`，`HANDLERS` 类型同步放宽为 `unknown | Promise<unknown>`。

实测（画布 644×510）：返回 `image/png`、95480 字节 base64；画面含网格地面、5 个球体、
立方体、平行光/光照图标与 gizmo —— **与用户在编辑器里看到的完全一致**。
