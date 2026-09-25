# 编辑器 AI 桥接（Editor AI Bridge）

> 目的：让 AI（DSH、CLI、任何 MCP 客户端）以**语义化、受控**的方式查询与操作编辑器，
> 而不是把整个场景 JSON 塞进上下文，也不是靠 DOM 选择器模拟点击。
>
> **当前进度：P1（只读）+ P2（可撤销写）均已实现并实测，且已作为 MCP server 接入 DSH**
> （`mcp__feng3d-editor__*` 工具可直接调用，清单见 §9）。写能力默认关闭，需在编辑器 URL 加
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
- **只覆盖游戏场景**：传入不以场景根开头的路径（如 `/editorViewRoot`）会**明确报错**。早期实现会
  静默返回场景根——因为解析从第二段才开始，单段路径直接落到根上，于是写入会落到完全不相干的
  对象上（实测：改环境色却写错了对象）
- 相比运行时 `WeakMap<Object3D, string>`：确定性、无状态、**跨会话稳定**，AI 才能引用"上次那个对象"
- 组件/几何参数在返回时做**摘要化**：跳过 `positions/normals/uvs/colors/tangents/indices/drawRange/data` 等大字段，数组超过 8 项只报长度——避免上下文膨胀

## 4. P1 方法（全部只读）

| 方法 | 用途 |
|---|---|
| `editor.info` | 通道自述：场景名、选中数、当前工具、可用方法列表 |
| `scene.summary` | 层级摘要：对象/组件总数、最大深度、一级子对象（**不含几何数据**）|
| `scene.list` | 分层展开，`{ path?, depth? }`，默认 depth=2 |
| `scene.get` | 单对象详情：变换 + 子对象 + 组件摘要 |
| `scene.find` | 按名称/类型/tag 检索。名称支持精确 `name`、子串 `nameContains`（大小写不敏感）、正则 `namePattern`；`includeTransform` 附带 position；`where` 按字段值过滤（如 `{ path: "position.y", op: "lt", value: 0 }` 找平面下的对象，op 支持 `eq/ne/lt/lte/gt/gte/exists`）|
| `scene.bounds` | 世界包围盒（**AI 计算"平面中心"这类问题的前提**）|
| `selection.get` | 当前选中对象 |
| `selection.set` | 选中/高亮指定对象——**UI 导航，不改场景数据**，故不需要写通道；空数组清空。让用户看见 AI 指的是哪个对象，也为截图提供视觉焦点 |
| `camera.focus` | 把编辑器相机对准指定对象（框住看特写）——保留相机朝向，只调距离与裁剪面；同样是**UI 导航**，不需要写通道 |
| `camera.setView` | 从预设方向观察：`front`/`back`/`left`/`right`/`top`/`bottom`/`iso`，可配 `objectId` 取景。`camera.focus` 只框住对象、保留朝向，所以"从上方看"这类意图要用它 |
| `view.screenshot` | **主视图截帧**（所见即所得，含 gizmo/网格线）：`EditorView.captureFrame()` 提交一帧后 `readPixels` 读回画布纹理；`{ width? }` 默认缩放到 800px |
| `view.probe` | **像素统计**（不返回图片，只有几百字节）：`{ grid?, colors? }` → 颜色种类、主色占比、亮度范围、灰度缩略网格。判断"画面上到底有没有东西"比截图省几十倍上下文：`uniqueColors` 为 1 = 纯色画面，`maxLuminance` 为 0 = 全黑 |
| `log.tail` | 读编辑器控制台日志（与用户在控制台面板看到的**同一份**缓冲）；支持 `{ type?, limit?, grep?, sinceSeq? }` 过滤与增量读取 |
| `scene.validate` | 场景健康检查：无相机/光源、MeshRenderer 缺几何**或缺材质**、**纯黑材质**、变换含 NaN、scale 为 0、同级重名。`error` = 基本渲染不出来，`warn` = 很可能不是你要的效果 |

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

MCP server 是 `scripts/editor-mcp-server.mjs`（stdio + 换行分隔 JSON-RPC，把下面的方法逐一暴露为 tools）。
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

**改了 `editor-mcp-server.mjs`（比如新增一个 tool）之后**：进程里跑的还是旧代码，得让它重启一次。
DSH 的 `@deepseek-ai/dsh-mcp-client` 自带重连——把旧进程杀掉即可，它会自动拉起新进程并
**重新注册工具表**（日志：`reconnected and re-synced tools`），**不必重启 DSH**：

```powershell
# 注意排除自身：命令文本里也含 mcp-server 字样，直接按名字杀会连带杀掉执行这条命令的进程
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -like '*mcp-server*' -and $_.CommandLine -notlike '*-Command*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

实测：`view_probe` 加进工具表后，按上面重启一次，当前会话里 `mcp__feng3d-editor__view_probe`
立刻可调用（返回像素统计），无需重开会话。

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
| `scene.set` | 写对象字段，`path` 支持 `position.y`、`components[0].material.uniforms.u_diffuse.r` 这类形式。**路径不存在或类型不匹配直接报错**（并列出可用字段），避免拼错路径时静默新增字段、让 AI 误以为"改完了"；确实要新增字段传 `create: true` |
| `scene.setMany` | 对多个对象写同一字段（"这些球都变蓝"），**先全部校验再统一落笔**——要么全改、要么一个都不改，且只占一个撤销步 |
| `scene.setMaterial` | 语义化设置材质外观：`color`/`specular`/`ambient`/`glossiness`/`reflectivity`/`alphaThreshold`，自动映射到 `StandardMaterial` 的 uniforms（比写深层路径可靠）；支持批量 |
| `scene.setEnvironment` | 设置背景色 / 环境光（自动补全 `Color4` 的 `__type__` 与缺失分量）。会**同时写视图场景与游戏场景**：视口里看到的背景来自前者 |
| `scene.arrange` | 排列一组对象：`mode: 'line'` 沿轴等间距排开、`'align'` 中心对齐到平均值、`'circle'` 围成一圈（可用 `centerObjectId`/`center` 指定圆心）、`'grid'` 按 `columns` 列铺成网格。用**世界**包围盒计算，尺寸不同的对象也不会叠在一起；一次撤销 |
| `scene.add` | 新增对象。推荐 `shape` 简写（`cube`/`sphere`/`plane`/`cylinder`/`capsule`/`torus`，可配 `color`、`geometryParams`）自动组装网格与材质；精细控制时才用 `components` 直传字面量（两者互斥） |
| `scene.duplicate` | 复制对象（含子树与组件，走 `serialization` 深拷贝，不漏字段）；默认**沿 X 轴按包围盒宽度排开**，避免与原对象重叠得看不出来。`count` 上限 50 |
| `scene.group` | 把一组对象归到一个新建的组下（一次撤销）。比"建空对象 + 逐个 `reparent`"省 N 次调用，也只有一个撤销步 |
| `scene.remove` | 删除对象及其子树，支持 `objectIds` 批量（先全部校验再统一删除，不会删一半）；撤销时**插回原对象引用**（不是副本），位置与同级顺序都复原 |
| `scene.reparent` | 移动对象到另一个父级，可选 `index`；拒绝挂到自己的子孙下（防环）|
| `scene.save` | 把场景写回存储（浏览器里是 indexedDB），使改动在刷新后仍存在 |
| `history.status` | 撤销栈状态（写通道是否启用、可撤销/可重做数量、最近操作标签）；`{ labels?: number }` 默认只给最近 20 条，传 0 完全不返回——两百个对象的场景里全量标签会让每次调用多出几百个字符串 |
| `history.undo` / `history.redo` | 撤销 / 重做一步 |
| `scene.mark` / `scene.rollback` | 在撤销栈上打标记、之后一次回滚到该处。"先试试看"的workflow：不必自己数做了几步（数错会退过头、把用户之前的操作也撤掉） |
| `log.clear` | 清空控制台日志（复现问题前先清空，`log.tail` 就只读到本次日志）|

**撤销机制采用「命令式」而非「全场景快照」**：每个写操作记录自己的反向操作。粒度精确、实现可控。
历史栈上限 100，`undo`/`redo` 对称。

> **`scene.remove` 为什么不重建对象**：最初用 `serialization` 快照 + `deserialize` 复原，结果
> 引用变化，更早的 `add` 命令按引用找不到它，`add → remove → undo(remove) → undo(add)` 序列下
> 最后一次撤销失效、对象残留（实测发现）。改为复用原对象引用后两个命令正确互操作。

写入一律经 `reactive(holder)[key] = value`，与人工编辑同构，因此渲染与 UI 会即时响应。

写操作还会触发 `editor.selectedObjectsChanged` 使层级面板 / 检查器刷新。实测：写入后
**不刷新页面**，层级面板已列出新增对象（此前不触发该事件时面板看不到新对象）。

### 每次写操作都带回「本次新出现的报错」

写方法在 `EditorBridge.ts` 里被统一包了一层（`withNewErrors`）：调用期间若控制台出现 `error`，
返回体上会多一个 `newLogErrors: string[]`（最多 5 条）。

为什么默认带上：**桥接调用成功 ≠ 场景没问题**——渲染报错、材质告警只出现在控制台。
"改完必须查日志"原本只是一条纪律（靠调用方自觉），现在它是**返回体的一部分**：AI 不必再额外
调一次 `log.tail` 就能知道这次改动有没有引发异常；模糊测试也据此把"被接受了、却让引擎报错"
的输入一起统计出来。

用订阅而不是"前后计数相减"：日志缓冲有 1000 条上限，滚动之后计数会失真。

### 数值守卫：JS 里合法 ≠ GPU 侧合法

`Number.isFinite` 挡不住 `1e39`——它在 JS 里是有限数，转成 f32 就是 `Infinity`。写进变换会让
矩阵变 NaN（对象从画面上消失），写进 `clearValue` 会报 `clearValue is non-finite`（整页渲染不出来，
实测踩过）。因此所有写入口统一用 `isFiniteF32()`：`scene.set`（含 `position: { x: 1e39 }` 这类
嵌套对象，递归校验）、`scene.add` 的变换与几何参数、`scene.duplicate` 的 `position`、
`scene.setMaterial` 的数值、`scene.setEnvironment` 的颜色分量、`scene.arrange` 的
`spacing`/`radius`（`columns` 另限 1~1000 的整数，否则算出来的坐标同样是溢出值）。

颜色分量**给了就必须合法**：`{ r: 'x' }` / `{ r: 1e39 }` 直接报错，不再静默当成 1——
静默替换会让调用方以为"背景色改成红色成功了"，实际拿到的是白色。

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

全部 20 个方法都已包装为 tools，DSH 侧可直接调用（11 个不改场景数据 + 9 个写/历史/日志）：

| 类别 | tools |
|---|---|
| 不改场景数据 | `editor_info`、`scene_summary`、`scene_list`、`scene_get`、`scene_find`、`scene_bounds`、`scene_validate`、`selection_get`、`selection_set`、`camera_focus`、`view_screenshot`、`view_probe`、`log_tail` |
| 写/历史/日志 | `scene_set`、`scene_set_many`、`scene_set_environment`、`scene_set_material`、`scene_arrange`、`scene_add`、`scene_duplicate`、`scene_group`、`scene_remove`、`scene_reparent`、`scene_save`、`history_status`、`history_undo`、`history_redo`、`scene_mark`、`scene_rollback`、`log_clear` |

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
- **改桥接源码后撤销栈会清空**：Vite 对 `src/bridge/*.ts` 的改动会重新加载模块（日志里的
  `page reload`），模块级的撤销栈随之消失，而场景对象可能仍留在页面内存里。实测：演示做到
  一半改了桥接代码，栈里只剩最后一项、5 个演示对象却都还在——这时只能用 `scene.remove`
  清理，`history.undo` 已经回不去了。用 CLI / MCP 操作场景本身不会触发这个问题
- ~~**极端非法输入组合后可能栈溢出**~~ —— **已定位并修复**：根因是 `scene.add` 的 `shape` 简写
  在不带 `color` 时**不生成材质**，这种无材质的 `MeshRenderer` 渲染时会走 fallback 路径，与一次
  排列（`scene.arrange`）组合之后，后续的环境设置与撤销都会栈溢出、页面卡死。现在 `shape` 简写
  总会配一个默认材质（材质色取 `color` 或缺省白）。排查过程记在 §14：prerequisite 是"无材质对象"，
  arrange、负半径、子对象、名字都只是表象

## 11. 看得见画面（`view.screenshot` / `view.probe`）

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

### 不下载图片也能判断画面（`view.probe`）

截图 base64 动辄数百 KB，而 AI 多数时候只想确认"改完之后画面上有没有变化"。`view.probe` 同样
提交一帧，但**只统计像素**，返回几百字节（`src/feng3d/pixelStats.ts`）：

| 字段 | 判读 |
|---|---|
| `uniqueColors` / `minLuminance` / `maxLuminance` | `uniqueColors` 为 1 且亮度无范围 → 纯色画面（空白 / 画面冻结）；`maxLuminance` 为 0 → 全黑（材质、光照或着色器出错） |
| `dominantColors` | 主色与占比。若只有背景色（占比 ≈ 1），说明物体没进视锥或被剔除 |
| `grid` | 灰度缩略网格（默认 8×8，行优先 0~255）——不下载图片也能看出构图轮廓 |
| `sampled` | 实际采样点数（大画布按步长抽样，上限 12 万，保证大分辨率下耗时可控） |

颜色按每通道 5 位量化后建直方图，所以 `uniqueColors` 是"量化色数"而非精确去重数：判断
"画面有没有内容"足够，不要拿它当精确调色板。

实测（画布 863×366）：`uniqueColors` 30；主色 `#4a4a4a` 占 62%（编辑器底色）、`#3a3a3a` 占 34%
（网格区）；`maxLuminance` 1.0（物体与 gizmo）；4×4 网格已能看出左亮右暗的构图。

冒烟测试用它做了**闭环检查**：黑背景 → 白背景，`meanLuminance` 0.086 → 0.97。只改数据、不改
画面这类问题（"背景色改对了、物体却全黑"就是）用返回值永远发现不了，必须看像素。

**端到端实测**（探针页面）：新增一个红色球体并 `camera.focus` 它——`uniqueColors` 30 → 112，
主色里出现 `#630000`（球体暗部）；删掉它又回到 30。同一状态下 `view.screenshot` 抓到的是红球、
高光、网格地面与 gizmo，**与用户在编辑器里看到的完全一致**。至此"写 → 渲染 → 像素 → 视觉"
整条链路闭环，且每一步都有机器可判的判据。

## 12. 冒烟自检

`scripts/editor-bridge-smoke.mjs` 覆盖桥接的每个方法：只读方法断言返回结构，写方法执行后
**统一撤销还原**，因此除了 `scene.save` 会把（已还原的）场景写回存储外，不会改变场景内容。

```bash
node scripts/editor-bridge-smoke.mjs                 # 全部
node scripts/editor-bridge-smoke.mjs --skip-write    # 只测只读
node scripts/editor-bridge-smoke.mjs --target probe  # 多页面时定向（见 §9「定向投递」）
```

- 退出码：`0` 全通过 / `1` 有失败 / `2` **页面不可达**
- 页面不可达时**立即退出**并提示原因，而不是让二十多项各等 20s 超时、输出一片 FAIL 掩盖真因
- 记录开始时的撤销栈深度，结束时一路 `history.undo` 回到该深度，因此场景与跑之前一致

**性能**（探针页面，206 个对象）：`scene.summary` 138ms、`scene.list` 136ms、`scene.find` 115ms、
`scene.validate` 135ms、`view.screenshot` 130ms。**耗时主要是前端 100ms 轮询间隔带来的等待**，
方法本身开销很小；批量建成 200 个对象后一路撤销可完全还原（206 → 5）。

> 这套自检抓出过一个真问题：`resolveObjectId` 与 `logic().parent` 一个返回响应式代理、
> 一个返回原始对象时，`indexOf` / `===` 都不成立——批量删除只删掉一个，防环检查漏检把场景树
> 弄成环，随后递归遍历爆栈、页面卡死。现已统一 `toRaw` 并为向上遍历加深度兜底。

### 模糊测试

```bash
node scripts/editor-bridge-fuzz.mjs
```

用非法与边界参数逐个轰写方法（场景根、重复项、字符串当数字、负半径几何、特殊字符名、
超限数组……），**每一步之后都探活并体检**，因此它回答的是"有没有哪个输入被接受了、
却把场景悄悄弄坏"，而不只是"该不该报错"。

> 第一次运行就抓出四个缺陷：`scene.duplicate` 传场景根被接受、`scene.group`/`scene.remove`
> 传重复对象会让同一对象挂两处、`scene.set` 能把 `position` 设成字符串、NaN 与负半径几何
> 会让渲染栈溢出。这些已全部修掉并由冒烟自检长期看护。

> 早先它会把页面轰到异常状态、跑完必须刷新；根因是"`shape` 简写不带 `color` 时对象没有材质，
> 与排列组合会让后续操作栈溢出"——**已修复**（`scene.add` 现在总会补一个默认材质）。清理逻辑
> 也一并改稳了：以**对象集合**而非撤销栈深度为准（`rollback` 会把命令挪进 redo 栈，深度相同
> 不代表场景相同），跑完场景对象数与起始一致。

### MCP 工具一致性自检

```bash
node scripts/editor-mcp-check.mjs
```

MCP 工具表（`editor-mcp-server.mjs`）与桥接方法表（`EditorBridge.ts` / `EditorBridgeWrite.ts`）
是两份需要手工同步的清单：加了桥接方法却忘了加工具、或者方法名写错一个字符，**只有真去调用
才会暴露**。这个自检把它们三方对齐，且**离线可跑**（不需要编辑器页面）：

1. `TOOLS` 定义 ↔ `handleTool` 的 map——定义了 schema 却没接线 / 接了线却没定义 schema
2. map 里的方法名 ↔ 桥接源码的 `HANDLERS`——方法名写错
3. 桥接 `HANDLERS` ↔ map——桥接新增方法但 MCP 没暴露（工具表悄悄落后）
4. 每个工具都有足够长的描述、`object` schema、关掉 `additionalProperties`
5. 实际启动 server 取 `tools/list`，与定义逐一对齐（schema 写坏导致启动失败也在这里暴露）
6. 页面在线时，源码解析出的方法表与运行时 `editor.info` 再对一次

> 首次运行就抓出 `history_undo` / `history_redo` 的描述只有 7 个字，AI 分不清两者区别
> （已补全为"一次一步、要退回多处用 `scene_rollback`"这类可操作说明）。

## 13. AI 工作流建议

这套工具的价值不在单个方法，而在**组合成闭环**。推荐流程（每一步都对应真实踩过的坑）。
下文用**桥接方法名**（`scene.add`），对应的 MCP 工具名把 `.` 换成 `_`（`scene_add`）。

### 1. 先看再动

```
editor.info       → 有没有场景、写通道是否可用、有哪些方法
scene.summary     → 对象/组件规模、一级子对象
scene.validate    → 有没有「根本渲染不出来」的硬伤（无相机 / 无光源 / MeshRenderer 缺几何）
```

### 2. 定位对象

```
scene.find { nameContains: "sphere" }      记不准名字时用子串（大小写不敏感）
scene.find { namePattern: "^Ball\\d$" }    有规律时用正则
scene.get    { objectId }                  变换 + 材质 + 几何参数
scene.bounds { objectId }                  「放到平面中心」这类请求的前提
```

### 3. 动手改

- 新建：`scene.add` 的 `shape` 简写（自动配网格与材质，比手写 `components` 字面量可靠得多）
- 复制：`scene.duplicate`（不必重复描述材质与几何）
- 批量：`scene.setMany`（先全部校验再统一落笔，要么全改要么不改）
- 布局：`scene.arrange` 的 `line` / `align` / `circle`
- 微调：`scene.set`——路径写错会**报错并列出可用字段**，不会静默改错地方

### 4. 必须验证（最容易省，最不该省）

```
view.probe        画面有没有内容、改完变没变（几百字节，先看它）
view.screenshot   画面到底变成什么样（所见即所得）
log.tail          有没有报错（type=error）
scene.validate    有没有「看不出来但确实坏了」的问题
```

**先 `view.probe` 再 `view.screenshot`**：前者几百字节就能判出"纯色画面 / 全黑 / 只有背景"，
后者数百 KB。确认画面有变化之后再取图看细节，能省掉大量上下文。

**桥接调用成功 ≠ 场景没问题**：材质告警、渲染异常、矩阵求逆失败都只出现在控制台。
实测「背景色改对了、物体却全变黑」就是靠 `log.tail` 读到 `clearValue is non-finite` 才定位的。
好消息是不必每次都主动查：写操作的返回体自带 `newLogErrors`（本次调用期间新出现的报错），
看到它就说明这次改动有问题；`log.tail` 用来追更早、更完整的历史。

### 5. 收尾

```
scene.save      写回存储（否则刷新即丢）
history.status  撤销栈状态
history.undo    不满意就回滚——所有写方法都可撤销，批量操作也只占一步
```

### 一条给「改这套代码的人」的经验

**代理与原始对象混用是这个代码库的高频陷阱**：凡是拿到 `logic(x).parent`、
`reactive(x).children` 的地方，比较与 `indexOf` 都必须 `toRaw`，否则会静默失配——
表现为「该删的没删」「防环没拦住」，严重时把场景树弄成环、页面卡死（§11、§12 各踩过一次）。

## 14. 一轮自主优化的概览

以下由 AI 在无人监督下完成，全部在 `feat/editor-ai-optimize` 分支上（`master` 未被改动）。

### 新增能力

| 能力 | 解决什么 |
|---|---|
| `view.screenshot` | AI 看不到画面。改为帧内 `readPixels` 读回，不再依赖取不到内容的 `canvas.toDataURL()` |
| `view.probe` | 截图数百 KB 会挤爆上下文，而多数时候只想确认"画面有没有变化"——新增像素统计（颜色种类/主色占比/亮度范围/灰度网格），几百字节 |
| `camera.setView` | `camera.focus` 保留朝向，没法表达"从上方看"——很多问题只有换视角才看得出来 |
| `log.tail` / `log.clear` | AI 看不到控制台报错。日志改由模块级日志中心承载，面板与桥接读同一份缓冲 |
| `scene.validate` | 排查"画面不对但看不出原因"：无相机/无光源、缺几何、NaN 变换、scale 为 0、同级重名 |
| `scene.add` 的 `shape` 简写 | 手写 `components` 字面量又长又容易写错结构 |
| `scene.duplicate` | "再来几个一样的"不必重复描述材质与几何 |
| `scene.group` | 整理散落部件：比"建空对象 + 逐个 reparent"省 N 次调用、只占一个撤销步 |
| `scene.arrange`（line/align/circle/grid） | 自己算坐标容易把尺寸不同的对象叠在一起 |
| `scene.setMany` | 批量改同一字段，先全校验再落笔（要么全改要么不改） |
| `scene.remove` 批量 | 同上，且不会删一半 |
| `scene.setEnvironment` | 改背景/环境光不必先猜 `components[N]` 里的 N |
| `scene.get` 支持多对象 | 对比几个对象不必拆成 N 次往返 |
| `scene.mark` / `scene.rollback` | "先试试看"：不必自己数做了几步（数错会退过头、撤掉用户的操作） |
| `scene.find` 子串/正则 | AI 记不准对象名 |
| `scene.set` 路径与类型防呆 | 拼错路径原先会静默新增字段，让"改完了"变成假象 |
| `editor.info` 的 `writeEnabled` | 不必试一次写操作才知道写通道是否可用 |
| 写操作返回体自带 `newLogErrors` | "改完必须查日志"从纪律变成返回体的一部分，AI 少调一次 `log.tail` |
| `history.status` 的 `labels` 有上限 | 两百个对象的场景里全量标签会让每次调用多出几百个字符串 |
| `scene.validate` 补上缺材质 / 纯黑材质 | 无材质的 `MeshRenderer` 正是栈溢出根因的形态；纯黑材质则是"画面上看不见却毫无报错" |

### 修复的真实缺陷

| 缺陷 | 影响 |
|---|---|
| 场景根守卫失效 | `remove`/`reparent` 会把**整棵场景**移出视图（游戏场景根挂在视图 root 下、有父级，所以"无父级即根"的判断不成立） |
| 代理与原始对象混用 | 批量删除只删掉一个；防环检查漏检 → 场景树成环 → 递归爆栈、页面卡死 |
| `resolveObjectId` 静默返回场景根 | 非场景树路径（如 `/editorViewRoot`）的写入落到不相干的对象上 |
| 颜色缺 `a` 分量 | 清屏 `clearValue` 变成非有限值，`beginRenderPass` 报错、整个视图渲染不出来 |
| `scene.group` 撤销顺序 | 成员同时挂在组与原父级下（同一对象出现在两个 `children` 里），场景树随即损坏 |
| editor 的 lint 从未真正运行 | 根配置整体忽略 `packages/editor/**`（命令行绕不过），本包脚本又用了 eslint 9 已移除的参数 |
| `scene.duplicate` 传场景根被接受 | 与 `remove`/`reparent` 同类：场景根有父级，不能只判"有没有父级" |
| 批量方法未拦重复项 | `setMany`/`arrange`/`setMaterial` 传同一对象两次会让写入与撤销各作用两次——撤销后回不到原值 |
| 名字里的空值 / `/` / `#` | 路径式 id 出现空段或错位（`/Untitled/Plane/`），随后的操作会异常 |
| NaN 与负半径几何 | 写进 uniform 或几何构造参数后渲染栈溢出、页面卡死 |
| f32 溢出（`1e39`）被当作合法数值 | `Number.isFinite` 拦不住它，写进变换后矩阵变 NaN（对象消失）、写进颜色后 `clearValue` 变成非有限值——现在所有写入口统一按"能否被 f32 表示"校验，颜色分量也不再静默替换 |
| `shape` 简写不带 `color` 时无材质 | 无材质的 `MeshRenderer` 渲染走 fallback 路径，与一次排列组合后会让环境设置与撤销栈溢出——这是 AI 最常用的写法之一 |

### 验证手段

- **冒烟自检** 44 项：`node scripts/editor-bridge-smoke.mjs`（写操作测完自动撤销还原）
- **单元测试** 11 项：`npm run test`（`packages/editor/test/`，覆盖像素统计的量化、通道交换、抽样与报错路径）
- **模糊测试** 41 例 + 4 个合法操作序列：`node scripts/editor-bridge-fuzz.mjs`（非法/边界参数逐个轰，每步探活+体检，并统计"引擎报错"）
- **MCP 一致性** 6 项：`node scripts/editor-mcp-check.mjs`（工具表 ↔ 方法表对齐，离线可跑）
- **类型检查**：editor 自身代码零错误（15 个既有错误全在 `feng3d`/`polyfill`）
- **lint**：`npm run lint` 退出码 0
- **压力**：206 个对象下各方法 125–146ms（主要是 100ms 轮询间隔的等待），200 个对象可一路撤销完全还原

### 一个完整例子：搭一张桌子

```
# 桌面：形状 + 颜色 + 缩放一次给全
scene.add { name: "TableTop", shape: "cube", color: { r: 0.55, g: 0.35, b: 0.2 },
            scale: { x: 2, y: 0.12, z: 2 }, position: { x: 0, y: 1, z: 0 } }

# 一条腿，再复制出另外三条（不必重复描述材质与几何）
scene.add { name: "Leg", shape: "cube", color: { r: 0.4, g: 0.25, b: 0.15 },
            scale: { x: 0.15, y: 1, z: 0.15 }, position: { x: 0, y: 0.5, z: 0 } }
scene.duplicate { objectId: "/Untitled/Leg", count: 3, name: "Leg" }

# 四条腿摆到四个角：2 列网格，间距 1.6
scene.arrange { objectIds: ["/Untitled/Leg", "/Untitled/Leg1", "/Untitled/Leg2", "/Untitled/Leg3"],
                mode: "grid", axis: "y", columns: 2, spacing: 1.6 }

# 看结果、查问题
view.probe
view.screenshot
scene.validate
```

总共 4 次写调用 + 3 次验证。四个角的位置不用自己算——`arrange` 用世界包围盒推导步长，
对象尺寸不同也不会叠在一起。实测截图确认桌面与四条腿都到位。
