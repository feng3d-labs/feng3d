# 编辑器 AI 桥接（Editor AI Bridge）

> 目的：让 AI（DSH、CLI、任何 MCP 客户端）以**语义化、受控**的方式查询与操作编辑器，
> 而不是把整个场景 JSON 塞进上下文，也不是靠 DOM 选择器模拟点击。
>
> **当前进度：P1（只读）+ P2（可撤销写）均已实现并实测，且已作为 MCP server 接入 DSH**
> （`mcp__feng3d-editor__*` 工具可直接调用，清单见 §9）。写能力**默认开启**，可在编辑器
> 「设置 → AI 桥接」里关掉（见 §9）。

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

> **开工前先调 `editor.overview`**：一次给全通道与场景概览、方法分类、相机状态、场景规模、
> 体检摘要与画面统计（比分别调四个方法省三次往返，且画面与体检取自同一时刻）。要细看某一项时
> 再单独调下面这些。

| 方法 | 说明 |
|---|---|
| `editor.overview` | **一次看全**：`editor.info` + `scene.summary` + `scene.validate` 摘要（前几条问题）+ `view.probe` 的画面统计（4×4 网格）+ 日志计数与最近几条 error + 按当前状态定制的 `hint`（写通道开着才提写方法）。`{ issues?, projectAll? }`。**刻意不给 `methods`**——它是 `readMethods` + `writeMethods` 的并集，重复一遍纯属浪费上下文 |

| 方法 | 用途 |
|---|---|
| `editor.info` | 通道自述：场景名、选中数、当前工具、可用方法列表 |
| `scene.summary` | 层级摘要：对象/组件总数、**组件类型分布**（一眼看出有没有相机、光源、几个可渲染对象）、最大深度、一级子对象（**不含几何数据**）、可渲染对象的可见 / 不可见数量 |
| `scene.list` | 分层展开，`{ path?, depth?, limit? }`，默认 depth=2、limit=100（节点到量后不再展开并标记 `truncated`——两百个对象在 depth=2 下能列出二十多万字符，足以撑爆上下文）|
| `scene.get` | 单对象详情：变换 + 子对象 + 组件摘要；`includeScreen` 附带 NDC、画布像素与是否在视野内、`includeBounds` 附带包围盒（两者都与 `scene.find` 一致）；`objectIds` 一次取多个时受 `limit` 约束（默认 50，每个详情约 300 字符） |
| `scene.find` | 按名称/类型/tag 检索，返回 `count`（返回条数）、`total`（命中总数）与 `truncated`（是否被 limit 截断，上限 500）。名称支持精确 `name`、子串 `nameContains`（大小写不敏感）、正则 `namePattern`；`includeTransform` 附带 position；`includeScreen` 附带 NDC、画布像素与是否在视野内；`includeBounds` 附带各自包围盒；`sortBy`（`name` 或 `position.<轴>`）+ `order` 排序；`where` 按字段值过滤（如 `{ path: "position.y", op: "lt", value: 0 }` 找平面下的对象，op 支持 `eq/ne/lt/lte/gt/gte/exists/in`），传**数组**表示全部满足（AND）|
| `scene.bounds` | 世界包围盒（**AI 计算"平面中心"这类问题的前提**）；传 `objectIds` 可拿多个对象**合并后**的包围盒（"这一堆整体占多大、中心在哪"）|
| `scene.export` | 导出对象（含子树）为纯数据 JSON——把搭好的东西交给用户复用（贴进 examples、存成预制体、或作为下次 `scene.add` 的 `components`）。几何与材质存构造参数而不是顶点数组，所以体积可控；省略 `objectId`/`objectIds` 则导出整个场景 |
| `selection.get` | 当前选中对象：id、名称、组件类型，以及是否在相机视野内——用户说"就这个"时用它对齐指代 |
| `selection.set` | 选中/高亮指定对象——**UI 导航，不改场景数据**，故不需要写通道；空数组清空。让用户看见 AI 指的是哪个对象，也为截图提供视觉焦点 |
| `camera.focus` | 把编辑器相机对准指定对象（框住看特写）——保留相机朝向，只调距离与裁剪面；同样是**UI 导航**，不需要写通道。`distance` 可指定距离（省略则自动框住，"退远看整体"要显式给值） |
| `camera.setView` | 从预设方向观察：`front`/`back`/`left`/`right`/`top`/`bottom`/`iso`，可配 `objectId` 取景与 `distance`。`camera.focus` 只框住对象、保留朝向，所以"从上方看"这类意图要用它 |
| `view.screenshot` | **主视图截帧**（所见即所得，含 gizmo/网格线）：`EditorView.captureFrame()` 提交一帧后 `readPixels` 读回画布纹理；`{ width?, region? }` 默认缩放到 800px，`region` 只截一块区域（与 `view.probe` 同一套坐标） |
| `view.probe` | **像素统计**（不返回图片，只有几百字节）：`{ grid?, colors?, region?, project?, projectAll? }` → 颜色种类、主色占比、亮度范围、灰度缩略网格。判断"画面上到底有没有东西"比截图省几十倍上下文：`uniqueColors` 为 1 = 纯色画面，`maxLuminance` 为 0 = 全黑。`region` 只看一块区域；`project` 返回指定对象在画面上的**像素坐标与是否可见**；`projectAll` 一次投影所有可渲染对象（上限 50，带总数与截断提示） |
| `log.tail` | 读编辑器控制台日志（与用户在控制台面板看到的**同一份**缓冲）；支持 `{ type?, limit?, grep?, grepRegex?, sinceSeq? }` 过滤与增量读取 |
| `scene.validate` | 场景健康检查：无相机/光源、MeshRenderer 缺几何**或缺材质**、**纯黑材质**、**不在相机视野内的对象**、**完全重叠的对象**、变换含 NaN、scale 为 0、同级重名。`error` = 基本渲染不出来，`warn` = 很可能不是你要的效果。`{ issues? }` 控制返回条数（默认 50），`issueCount` 始终是总数；`stats` 含可渲染对象的可见 / 不可见数 |

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
- ~~**P4 闭环**：AI 截图看结果 → 自我修正~~ —— **已打通**（§11）：`view.probe` 用几百字节判断
  "画面上有没有东西、改完有没有变化"，确认有变化再取图看细节；端到端实测见 §11
- **P3 生成式**：AI 生成场景片段 → **预览 diff** → 确认 → 插入。目前 AI 已能一次提交整组操作
  （`scene.batch`，失败自动回滚），但"先看 diff 再决定"还没有——需要一个**不落笔**的
  `scene.preview`，把"将要发生什么"（新增/修改/删除的对象与字段）先返回给调用方
- **并发（P2 遗留）**：人与 AI 同时编辑时没有锁。现在只能靠 `history.status` 的栈深与标签观察，
  缺少"这条改动是不是用户在我操作期间做的"这类判据

## 9. P2 可撤销写通道

### 启用方式（默认开启，可在设置面板关闭）

写能力**默认可用**。要关掉它，在编辑器里打开「设置 → AI 桥接 → 允许 AI 写场景」把开关关掉
（写入 `localStorage["editor-bridge-write"] = "0"`；**立即生效，不需要刷新**）。

判断按优先级来，URL 参数用于覆盖设置面板：

| 来源 | 效果 |
|---|---|
| URL `?bridge=write` | **强制开**（自动化脚本、临时授权） |
| URL `?bridge=read` | **强制关**（"只许看"的页面） |
| `localStorage["editor-bridge-write"] === "0"` | 关（设置面板写的就是它） |
| 其余情况 | 开（默认） |

关闭后写方法返回明确错误（并指出去哪里重新打开），只读方法不受影响。

### 已实现

| 方法 | 说明 |
|---|---|
| `scene.set` | 写对象字段，`path` 支持 `position.y`、`components[0].material.uniforms.u_diffuse.r` 这类形式。**路径不存在或类型不匹配直接报错**（并列出可用字段），避免拼错路径时静默新增字段、让 AI 误以为"改完了"；确实要新增字段传 `create: true` |
| `scene.setMany` | 对多个对象写同一字段（"这些球都变蓝"），**先全部校验再统一落笔**——要么全改、要么一个都不改，且只占一个撤销步 |
| `scene.setFields` | 对**同一个对象**写多个字段（`{ fields: { 'position.y': 1, 'scale.x': 2 } }`），同样是原子的、只占一个撤销步。与 `setMany` 互补：那边是"多对象同字段"，这边是"同对象多字段"——摆一个对象常要同时定位置、旋转、缩放 |
| `scene.setMaterial` | 语义化设置材质外观：`color`/`specular`/`ambient`/`glossiness`/`reflectivity`/`alphaThreshold`，自动映射到 `StandardMaterial` 的 uniforms（比写深层路径可靠）；支持批量 |
| `scene.setEnvironment` | 设置背景色 / 环境光（自动补全 `Color4` 的 `__type__` 与缺失分量）。会**同时写视图场景与游戏场景**：视口里看到的背景来自前者 |
| `scene.arrange` | 排列一组对象：`mode: 'line'` 沿轴等间距排开、`'align'` 对齐（默认中心对到平均值，可用 `value` 指定坐标、`edge` 选按中心/下界/上界对齐——`edge: 'min'` + `value: 0` 就是贴地面）、`'circle'` 围成一圈（可用 `centerObjectId`/`center` 指定圆心）、`'grid'` 按 `columns` 列铺成网格。用**世界**包围盒计算，尺寸不同的对象也不会叠在一起；一次撤销 |
| `scene.add` | 新增对象。推荐 `shape` 简写（`cube`/`sphere`/`plane`/`cylinder`/`cone`/`capsule`/`torus`/`quad`，可配 `color`、`specular`、`glossiness`、`reflectivity`、`alphaThreshold`、`geometryParams`、`tag`）自动组装网格与材质——建对象时就能一次给全材质细节，不必再调一次 `scene.setMaterial`；`geometryParams` 的**参数名按形状校验**（如 `sphere` 只认 `radius`/`segmentsW`/`segmentsH`，写错名字直接报错，而不是被引擎静默忽略）；精细控制时才用 `components` 直传字面量（两者互斥） |
| `scene.duplicate` | 复制对象（含子树与组件，走 `serialization` 深拷贝，不漏字段）；默认**沿 X 轴按包围盒宽度排开**，避免与原对象重叠得看不出来；`offset` 给相对源对象的位移（第 i 个副本偏 i+1 份）。`count` 上限 50 |
| `scene.group` | 把一组对象归到一个新建的组下（一次撤销）。比"建空对象 + 逐个 `reparent`"省 N 次调用，也只有一个撤销步 |
| `scene.remove` | 删除对象及其子树，支持 `objectIds` 批量（先全部校验再统一删除，不会删一半）；撤销时**插回原对象引用**（不是副本），位置与同级顺序都复原。也可用 `name` / `nameContains` / `tag` 选择器直接删一批；**不支持 `where` 那种任意字段条件**——想按复杂条件删，先 `scene.find` 看清再传 `objectIds` |
| `scene.import` | 导入 `scene.export` 导出的数据（**含子树**），可撤销——`scene.add` 只收 `components`（单对象、不带子树），而导出的可能是一整棵子树。最多 20 个对象 |
| `scene.reparent` | 移动对象到另一个父级，可选 `index`；拒绝挂到自己的子孙下（防环）|
| `scene.save` | 把场景写回存储（浏览器里是 indexedDB），使改动在刷新后仍存在 |
| `history.status` | 撤销栈状态（写通道是否启用、可撤销/可重做数量、**当前打过哪些标记**、最近操作标签）；`{ labels?: number }` 默认只给最近 20 条，传 0 完全不返回——两百个对象的场景里全量标签会让每次调用多出几百个字符串 |
| `history.undo` / `history.redo` | 撤销 / 重做，`{ count? }` 可一次多步（默认 1，上限 50），返回被撤销 / 重做的标签；要退到确定位置用 `scene.rollback` 更可靠 |
| `scene.mark` / `scene.rollback` | 在撤销栈上打标记、之后一次回滚到该处。"先试试看"的workflow：不必自己数做了几步（数错会退过头、把用户之前的操作也撤掉） |
| `scene.batch` | **事务**：一次调用执行多步写操作，`{ steps: [{ method, params }, ...] }`，最多 50 步。任一步失败就**逆序回滚**已完成的步骤，场景回到调用前——不会留下半成品让 AI 再去清理。传 `dryRun: true` 则只**预演**：整组操作照常跑一遍再全部回滚，返回每一步的结果（新对象 id、校验结果）供确认，场景与撤销栈都不变。只接受写方法，不允许嵌套。与 `mark`/`rollback` 的分工：那两个是**显式**的试验-回退（适合探索），这个是**自动**的（适合"确定要做、只是步骤多"）|
| `log.clear` | 清空控制台日志（复现问题前先清空，`log.tail` 就只读到本次日志）|

**撤销机制采用「命令式」而非「全场景快照」**：每个写操作记录自己的反向操作。粒度精确、实现可控。
历史栈上限 500，`undo`/`redo` 对称。一旦发生过裁剪（连续操作超过 500 次），`history.status`
会带上 `truncated: true` 与说明——此时"撤销到底"已经不等于"回到最初"，这比"还能退几步"更需要
被调用方知道。

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

### 预演：`dryRun`

所有**效果能通过撤销栈回滚**的写方法都接受 `dryRun: true`：照常执行一遍再原样回滚，返回
"实际会发生什么"（每步结果、新对象 id、校验是否通过），而场景与撤销栈都回到调用前。
`scene.batch` 的 `dryRun` 是同一个语义，只是它还要区分成功/失败路径，所以单独实现。

反过来，效果不进撤销栈的方法（`log.clear`、`scene.save`、`history.undo`）**会明确拒绝**——
对它们"预演"等于真的执行了，假装什么都没发生比报错更有害。MCP 侧的 schema 会按同一份名单
自动带上 `dryRun` 参数（避免逐个工具手写、漏一个就出现"这个到底能不能预演"的不确定性）。

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

### 谁在线（`GET /ping` 的 `clients`）

```json
{ "ok": true, "clients": [{ "clientId": "probe", "idleMs": 30, "polls": 165 }], "duplicated": [] }
```

页面按 `clientId@来源端口` 记录，空闲超过 3 秒就不再算在线（dev server 重启、页面重载都会换连接，
旧连接会停在最后一刻不动，不区分就会误报"多开"）。

`duplicated` 非空表示同一个 `?bridgeClient=` 被**多个标签页**打开——这时即使指定了 `target` 也救不了：
两个页面都符合条件，请求被随机取走，场景状态在两者之间跳，而输出只表现为一堆互相矛盾的 FAIL。
冒烟脚本据此加了守卫：**同名多开、或不指定 `target` 却有多个页面在线时直接退出并说明原因**，
而不是跑出一份不可信的结果（这个坑实测踩过：场景对象"凭空消失"、撤销栈深度对不上，
真因只是另一个同名页面把请求取走了）。

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

### 实测（写通道默认已开启）

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
- **Vite 自动重启后可能整片白屏**（**已修**）：`server.fs.allow` 原来只写了 `'..'`，它相对 Vite
  root（`packages/editor`）解析成 `packages/`，不含仓库根的 `node_modules`。Vite 因
  `vite.config.js` 或它引入的插件变化而**自动重启**后，element-plus 的样式被 403、Vue 应用挂载
  失败（`Failed to fetch dynamically imported module: .../MainLayout.vue`）——而重启前因缓存
  一切正常，最容易误判成自己的改动有问题。现在 allow 同时包含 `'../..'`
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

### 上下文膨胀的几道闸

桥接的每个返回都直接进 AI 的上下文，所以"一次能给多少"是设计的一部分，不是随手定的：

| 方法 | 闸门 | 默认 | 为什么 |
|---|---|---|---|
| `scene.list` | `limit` | 100 | `depth` 只管层数不管节点数：两百个对象在 depth=2 下能列出二十多万字符 |
| `scene.find` | `limit` + `total` / `truncated` | 50 | 命中数可能远超预期，调用方必须知道"还有更多" |
| `scene.get` | `limit` | 50 | 每个详情约 300 字符（含组件摘要） |
| `scene.validate` | `issues` | 50 | 两百个对象的场景里问题可能有上百条 |
| `view.probe` 的 `projectAll` | 上限 50 | — | 只投影可渲染对象，并给出 `projectedTotal` |
| `view.probe` 的 `project` | 上限 20 | — | 逐对象投影，输出随对象数线性增长 |
| `history.status` | `labels` | 20 | 大场景下全量标签是几百个字符串 |
| `log.tail` | `limit` + `maxMessageLength` | 50 / 2000 | 单条消息本身也可能很长 |
| `view.screenshot` | `width` 缩放 | 800 | 原尺寸 PNG 的 base64 常达数百 KB（`width: 0` 保留原尺寸，慎用） |
| `editor.overview` | 结构与内容都裁剪 | — | 合并了五处信息，实测约 1.9KB（刻意不给与 `readMethods`/`writeMethods` 重复的 `methods`） |

共同约定：**截断必须自报**（`truncated` + `hint`），而"总数"始终给全（`total` / `issueCount` /
`projectedTotal`）——调用方最怕的不是"只给一部分"，而是**把一部分当成全部**。

### 参数越界时：钳制还是拒绝

两种都出现，判据是**越界是否让结果失去意义**（模糊测试把这条边界也轰过一遍）：

| 行为 | 例子 | 为什么 |
|---|---|---|
| **钳到合法范围** | `scene.list` 的 `depth` / `limit` 超过上限、`view.probe` 的 `grid` / `colors` 越界、`editor.overview` 的 `issues` 给 1e9 或负数 | 极限值只是"想多要一些"，给到上限就够；为此报错会让调用方白跑一趟 |
| **直接拒绝** | 路径不存在、类型不符、`op` / `preset` / `mode` 拼错、`region` 整块落在画布外、`objectIds` 里有重复项 | 越界意味着**意图不明或数据本身有问题**，静默兜底会让调用方以为已经生效 |

共同点：无论钳制还是拒绝，**"实际用了什么值"都要能看出来**——钳制就回显（`region` / `limit` /
`grid` 都原样带回），拒绝就在错误信息里带上收到的值。

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
| `nonDominantRatio` | 主色之外的像素占比。**接近 0 就是"只有背景、东西没画出来"**——比读 `dominantColors` 列表再自己算要直接 |
| `dominantColors` | 主色与占比。若只有背景色（占比 ≈ 1），说明物体没进视锥或被剔除 |
| `grid` | 灰度缩略网格（默认 8×8，行优先 0~255）——不下载图片也能看出构图轮廓（**默认只给 `art`**，见下） |
| `art` | 灰度**字符画**（`' .:-=+*#%@'` 由暗到亮，行间 `\n`）：与 `grid` 同一份数据，但文本模型直接看得出轮廓，体积还小六成（16×16 时 769 → 288 字符） |
| `grid` | 灰度数值数组（行优先 0~255）——**默认不给**，需要精确数值时传 `gridValues: true`（`art` 已含同样信息，两条一起给等于把同一件事说两遍） |
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

### 对象在画面哪儿（`view.probe` 的 `project`）

世界坐标回答不了"我加的东西看得见吗、在画面哪个位置"。`view.probe { project: [id...] }`
把对象的**世界包围盒中心**投影到画布，一次返回（与像素统计同一帧、同一坐标系）：

```json
{ "id": "/Untitled/Ball", "name": "Ball",
  "ndc": { "x": 0, "y": 0, "z": 0.991 },
  "screen": { "x": 432, "y": 183 },
  "inFrustum": true, "active": true, "visible": true }
```

- `screen` 是画布像素坐标（相对视口左上角），与 `view.screenshot` 的画面同一坐标系
- **`inFrustum` 与 `active` 分开给**：前者是"进了视锥"，后者是"对象没被 `activeSelf` 关掉"，
  两者都为真才是 `visible`。只报视锥的话，一个被隐藏的对象会被说成"看得见"——实测踩过
- 用世界包围盒中心而不是 `position`：对象挂在有位移的父级下时两者并不相等
- 换算与 `SceneView.vue` 的区域选择同源（`(ndc.x+1)/2*width`、`(1-ndc.y)/2*height`），
  `scene.find` / `scene.get` / `selection.get` 的 `includeScreen` 给的是同一套

实测：`camera.focus` 某个球之后，它的投影正好落在画面中心 `(432, 183)`（画布 863×366）——
"聚焦确实框住了它"这句话由此从描述变成了可断言的判据，冒烟测试也据此断言（偏差 > 5% 即失败）。

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

> 写这套检查时踩过两次「检查自身不稳」：一是统一撤销的步数上限（检查项变多后 50 步不够，
> 表现为「撤销后 undoCount = 8，期望 5」这种看起来像漏撤的失败）；二是视野外检查**依赖了相机
> 当时在哪**（新开的页面相机离场景很远，放远对象也仍在视野内）。判据要只反映被测逻辑：
> 需要什么前置状态就先显式摆好（这里是先 `camera.setView` 对准场景）。

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

只读方法也在覆盖范围内（27 例）：`view.probe` 的越界网格与空区域、`scene.get`/`find`/`list`/`bounds`
的各种非法参数、`editor.overview` 的极端 `issues`、`camera` 与 `selection` 的无效路径……
实测全部吃住，其中"被接受"的三处都是**有意钳到合法范围**（`issues` 负数→1、1e9→50；
`scene.list` 的 `depth` 极大时由 `limit` 拦住完整树）。

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
才会暴露**。这个自检把它们三方对齐；其中 6 项**离线可跑**（不需要编辑器页面），第 7 项对照页面运行时的方法表、需要页面在线：

1. `TOOLS` 定义 ↔ `handleTool` 的 map——定义了 schema 却没接线 / 接了线却没定义 schema
2. map 里的方法名 ↔ 桥接源码的 `HANDLERS`——方法名写错
3. 桥接 `HANDLERS` ↔ map——桥接新增方法但 MCP 没暴露（工具表悄悄落后）
4. 每个工具都有足够长的描述、`object` schema、关掉 `additionalProperties`
5. 实际启动 server 取 `tools/list`，与定义逐一对齐（schema 写坏导致启动失败也在这里暴露）
6. 页面在线时，源码解析出的方法表与运行时 `editor.info` 再对一次
7. 文档方法表是否列出了所有桥接方法——加了方法却没写进文档，读文档的人就以为它不存在

> 首次运行就抓出 `history_undo` / `history_redo` 的描述只有 7 个字，AI 分不清两者区别
> （已补全为"一次一步、要退回多处用 `scene_rollback`"这类可操作说明）。

## 13. AI 工作流建议

这套工具的价值不在单个方法，而在**组合成闭环**。推荐流程（每一步都对应真实踩过的坑）。
下文用**桥接方法名**（`scene.add`），对应的 MCP 工具名把 `.` 换成 `_`（`scene_add`）。

### 1. 先看再动

```
editor.overview   → 一次给全：有没有场景、写通道是否可用、方法分类、当前相机状态、
                    场景规模与可见数、体检摘要、画面像素统计、日志计数与最近几条错误
```

要细看某一项时再单独调 `editor.info` / `scene.summary` / `scene.validate` / `view.probe`。

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
- 成组：`scene.batch` 把"建桌腿 → 复制 → 排列 → 上色"打包成一次调用，中途失败自动回滚，
  不必自己清理半成品（`scene.add` 出来的对象自带 position/rotation/scale，可直接接着写 `position.y`）

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

### 几个现成配方

**搭一套桌椅**（成组提交，中途失败自动回滚，不留半成品）

```
scene.batch { steps: [
  { method: "scene.add", params: { name: "TableTop", shape: "cube", color: { r: 0.55, g: 0.35, b: 0.2 },
                                   scale: { x: 2, y: 0.1, z: 1.2 }, position: { x: 0, y: 0.75, z: 0 } } },
  { method: "scene.add", params: { name: "Leg", shape: "cube", color: { r: 0.4, g: 0.25, b: 0.15 },
                                   scale: { x: 0.12, y: 0.75, z: 0.12 }, position: { x: 0, y: 0.375, z: 0 } } },
  { method: "scene.duplicate", params: { objectId: "/Untitled/Leg", count: 3, name: "Leg" } },
  { method: "scene.arrange", params: { objectIds: ["/Untitled/Leg", "/Untitled/Leg2", "/Untitled/Leg3", "/Untitled/Leg4"],
                                       mode: "grid", axis: "y", columns: 2, spacing: 1.3 } }
] }
view.probe { grid: 8, project: ["/Untitled/Leg"] }
scene.validate
```

不确定会发生什么就先预演：同一个调用加 `dryRun: true`，返回每一步的结果后全部回滚，场景不变。

**把镜头对准某个东西看清楚**

```
camera.setView { preset: "iso", objectId: "/Untitled/TableTop" }   # 先定方向（focus 保留朝向）
camera.focus   { objectId: "/Untitled/TableTop" }                  # 再框住它
view.probe     { grid: 0, project: ["/Untitled/TableTop"] }        # 投影点应落在画面中心
```

**东西看不见，查为什么**

```
scene.validate                                     # outside-view / black-material / no-material 会直接点名
view.probe { grid: 0, project: ["/Untitled/X"] }   # visible=false ⇒ 不在视锥内
log.tail   { type: "error" }                       # 能画却没画出来时的着色器 / 清屏值报错
```

**把一堆东西摆成整体居中 / 一起落地**

```
scene.bounds    { objectIds: ["/Untitled/A", "/Untitled/B"] }        # 先问整体范围与中心
scene.setFields { objectId: "/Untitled/A", fields: { "position.y": 0, "scale.x": 2 } }
scene.arrange   { objectIds: ["/Untitled/A", "/Untitled/B"], mode: "align", axis: "y", value: 0, edge: "min" }
```

最后一步的 `edge: "min"` 表示"按包围盒下界对齐"——那就是贴到地面，不必自己算高度的一半。

**确认改动真的生效了**（别只看返回值）

```
view.probe                       # 前后各一次，比较 uniqueColors 与 meanLuminance
history.status { labels: 5 }     # 我刚做了什么、还能退几步（栈被裁剪过会带 truncated）
```

写操作返回体自带 `newLogErrors`：非空就说明这次改动引发了控制台报错，不必再单独查一次日志。

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
| `scene.add` 可一次给全材质 | 原先只能给颜色，光泽度 / 反射强度 / 透明裁剪得再调一次 `scene.setMaterial`（多一次往返、多一个失败点） |
| `scene.duplicate` | "再来几个一样的"不必重复描述材质与几何 |
| `scene.group` | 整理散落部件：比"建空对象 + 逐个 reparent"省 N 次调用、只占一个撤销步 |
| `scene.arrange`（line/align/circle/grid） | 自己算坐标容易把尺寸不同的对象叠在一起 |
| `scene.setMany` | 批量改同一字段，先全校验再落笔（要么全改要么不改） |
| `scene.setFields` | 同对象多字段的原子写法：与 `setMany` 互补，摆位置 + 旋转 + 缩放一次写完、只占一步撤销 |
| `scene.bounds` 支持多对象合并 | "这一堆整体占多大、中心在哪"原先要逐个取回包围盒自己合并，既啰嗦又容易算错 |
| `scene.find` 的 `includeBounds` | 找到对象之后常要问"各自多大"，省掉对每个结果再调一次 `scene.bounds` |
| `scene.find` 的 `sortBy` / `order` | "哪个最高、谁在最左边"这类问题，结果顺序本身就是答案；原先只能全拉回来自己排 |
| `scene.find` 的 `total` / `truncated` | `count` 只是返回条数，分不出"就这么多"与"还有更多没返回"——AI 会把截断当成全部 |
| `includeScreen` 统一给出屏幕像素 | 原先 `scene.find` 只给 NDC、而 `view.probe` 的 `project` 给像素坐标，同一件事两处不一样（还有一处得自己算） |
| `view.probe` 的 `projectAll` | 想看清"东西都在画面哪儿"要先 find 一轮再逐个投影；现在一次给全（带上限与总数） |
| `view.screenshot` 的 `region` | `view.probe` 能只看一块、截图却只能整张；两者现在共用同一套坐标与校验（越界都报错） |
| `scene.remove` 支持选择器 | "把这些临时对象清掉"要两次调用（先 find 再 remove）；现在可给 name/nameContains/tag 一次删掉，但**故意不支持** where 那种任意条件——删除前应当确实看过 |
| `scene.add` 总给出 `activeSelf` | 它是可选字段，新建对象上没有 → `scene.set { path: activeSelf }` 与 `where` 检索都用不了（与变换字段同一个坑） |
| `visible` 把"在视锥内"与"真的可见"分开 | 原先只算视锥：一个被 `activeSelf` 关掉的对象会被报成"看得见"，而它其实一个像素都不渲染 |
| `view.probe` 的 `region` | 配合 `project` 的屏幕坐标，只统计画面上一块区域——"我关心的那一块渲染出来了吗"不必被其它部分干扰 |
| `scene.setFields` | 同对象多字段的原子写法：与 `setMany` 互补，摆位置 + 旋转 + 缩放一次写完、只占一步撤销 |
| `scene.remove` 批量 | 同上，且不会删一半 |
| `scene.setEnvironment` | 改背景/环境光不必先猜 `components[N]` 里的 N |
| `scene.get` 支持多对象 | 对比几个对象不必拆成 N 次往返 |
| `scene.mark` / `scene.rollback` | "先试试看"：不必自己数做了几步（数错会退过头、撤掉用户的操作） |
| `history.undo` / `redo` 支持 `count` | "退掉我刚才那几步"要调 N 次往返；现在一次退多步并返回被撤销的标签 |
| `view.probe` 的 `nonDominantRatio` | "画面是不是只有背景"原先要读主色列表自己算；现在一个数就能答 |
| `scene.find` 子串/正则 | AI 记不准对象名 |
| `scene.find` 的 `where` 支持多条件 | 数组表示全部满足："y 在平面之上、且名字里带 Ball"用单条件表达不了，只能把结果拉回来自己过滤 |
| `scene.find` 的 `where` 支持 `in` | "名字是这几个之一"原先要拆成多次查询再合并；`in` 时 value 传数组，非数组直接报错 |
| `scene.add` 可设 `tag` | `scene.find` 早就支持按 tag 检索，却没有任何办法通过桥接**设置** tag——闭环缺口 |
| `scene.summary` 带视野统计 | "我刚加了 10 个东西，几个看得见"是决定下一步做什么时最先想知道的事，应当在第一个方法里就有 |
| `scene.bounds` 支持多对象合并 | "这一堆整体占多大、中心在哪"要逐个取回包围盒自己合并，既啰嗦又容易算错 |
| `scene.set` 路径与类型防呆 | 拼错路径原先会静默新增字段，让"改完了"变成假象 |
| `editor.info` 的 `writeEnabled` | 不必试一次写操作才知道写通道是否可用 |
| 写操作返回体自带 `newLogErrors` | "改完必须查日志"从纪律变成返回体的一部分，AI 少调一次 `log.tail` |
| `history.status` 的 `labels` 有上限 | 两百个对象的场景里全量标签会让每次调用多出几百个字符串 |
| `scene.validate` 补上缺材质 / 纯黑材质 | 无材质的 `MeshRenderer` 正是栈溢出根因的形态；纯黑材质则是"画面上看不见却毫无报错" |
| `scene.validate` 报出视野外的对象 | "为什么看不到"最常见的原因就是不在相机视野里（坐标写大、父级有位移、相机没对准），而这一点从数据上完全看不出来 |
| `scene.validate` 报出完全重叠的对象 | 两个对象中心重合时其中一个永远看不见，数据上毫无异常——"复制之后忘了挪开"最容易踩 |
| `editor.info` 按通道分类方法 | 方法清单原先混在一起，规划一组操作时得逐个读描述才知道哪些要写通道 |
| `editor.info` 报出相机位置与朝向 | 调过 `camera.focus` / `camera.setView` 之后没有别的办法确认"现在从哪看" |
| `editor.overview` 一次看全 | 开工前要看四样（通道/规模/体检/画面），分开调是四次往返四段上下文；合并后实测约 1.9KB（含方法分类、4×4 网格与日志计数，刻意省掉了与分类重复的 `methods`） |
| `history.status` 报出当前标记 | `scene.rollback` 要名字，而 AI 隔几步就忘了自己标过什么 |
| `project` 与 `projectAll` 互斥 | 两个都给时 `projected` 会互相覆盖；与其静默挑一个，不如说清楚 |
| `scene.list` 加 `limit` | 两百个对象的场景在 depth=2 下能列出二十多万字符，足以撑爆上下文；到量后截断并标记 |
| `scene.get` / `scene.validate` 加数量上限 | 同类风险：两百个对象详情约六万字符、上百条体检问题同样能撑爆上下文；两者都改为默认截断并如实标记 |
| `scene.validate` 的 stats 加可见数 | 与 `scene.summary` 同口径，两处都能回答"几个看得见"；冒烟断言 visible + invisible = renderers |
| `editor.overview` 按状态给 `hint` | 写通道没开就别提写方法、开了就把最省事的几个说清楚——把工作流建议嵌进返回里，而不是只写在文档 |
| `view.probe` 给出灰度字符画 | 调用方是文本模型：64 个数字要在脑子里拼成图像，字符画直接就是轮廓，还顺带省六成体积 |
| `scene.summary` 给出组件类型分布 | 只有总数时，AI 还得逐个对象去看才知道场景里有没有相机、光源；顺带在已有的遍历里统计，不额外遍历 |
| `scene.export` 导出可复用数据 | 搭好的东西原先"只存在于编辑器里"：要贴进 examples、存成预制体、或喂回 `scene.add` 都没有出口 |
| `scene.import` 把导出数据放回来 | 只有 export 没有 import 等于"导出复用"只做了一半；而且导出的可能是整棵子树，`scene.add` 的 `components` 收不了 |
| `projectAll` 在对象超过 20 个时必然失败 | `project` 的上限是 20、`projectAll` 是 50，而后者复用的函数把 20 写死在内部。默认场景只有 2 个可渲染对象，所以冒烟与集成验收都没覆盖到——是**扩展压力测试**才抓出来的 |
| CLI 的 `--help` | 用法原先只写在脚本注释里，读源码的人才看得到；命令行工具该自己说出来 |
| 批量上限校验抽成共用函数 | 「一次最多 200 个对象」在五个方法里各写一遍字面量，改上限要改五处、文案也容易不一致；现在统一带上方法名与「拆成多次调用」的指引 |
| 几处错误信息补上「怎么办」 | AI 全靠错误信息自救：「没有 MeshRenderer」「材质缺 uniforms」「不能复制场景根」「步数超限」原先只说错，现在都给出下一步 |
| `view.probe` 支持 `project` | 世界坐标回答不了"我加的东西在画面哪儿、看得见吗"；聚焦后投影应当落在画面中心，由此成为可断言的判据 |
| `scene.arrange` 的 `align` 支持 `value` / `edge` | 原先只能对齐到平均值，"把这一排都放到地面 y=0"表达不出来，只能逐个 `scene.set`；现在 `edge: 'min'` 直接贴地面，不必自己算高度的一半 |
| `camera.focus` / `setView` 支持 `distance` | 自动取景只会"刚好框住"，没法表达"退远点看整体"；也给不出固定距离的对比视角 |
| `scene.duplicate` 支持 `offset` | "在旁边再放两个"要自己算绝对坐标，而相对偏移才是最自然的表达 |
| `scene.batch` 事务化多步操作 | 多步写入中途失败会留下半成品，而错误信息里并不含"我已经建了哪些"，AI 只能再调几次去清理 |
| `scene.add` 总给出变换字段 | 不给 `position` 时对象上真的没有该字段，紧接着的 `scene.set { path: position.y }` 会撞上防呆报错——而"先建对象、再摆位置"正是最自然的一步 |
| `geometryParams` 按形状校验参数名 | 引擎对多余字段是**静默忽略**：照着 three.js 写 `radiusTop`（引擎用的是 `topRadius`）会"设置成功"却毫无变化；旧名单里还有 `widthSegments`/`radialSegments` 这些引擎根本不认的名字。顺带补上 `cone` 与 `quad` 两种形状 |
| `scene.batch` 的 `dryRun` | 想在落笔前知道"会发生什么"：整组照跑一遍再回滚，返回每步结果，场景与撤销栈都不变 |
| 所有可回滚的写方法都支持 `dryRun` | 原先只有 `scene.batch` 有；单条改动同样需要"先看一眼"，否则同类能力一半有一半没有 |
| `scene.find` 的 `includeScreen` | 找到对象之后最常追问的就是"它们看得见吗、在画面哪个方位" |
| `history.status` 的 `limit` / `truncated` | 撤销栈上限从 100 提到 500，且一旦发生裁剪就如实上报——此时"撤到底"已经不等于"回到最初" |
| `GET /ping` 的在线页面列表 | 同名页面多开时请求会被随机取走，这是排查里最容易走弯路的情形，现在能直接看见 |

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
| Vite 自动重启后整片白屏 | `server.fs.allow` 只写了 `..`，相对 Vite root 解析成 `packages/`，不含仓库根的 `node_modules`——重启后 element-plus 的样式被 403、Vue 挂载失败；而重启前因缓存一切正常，极易误判成自己的代码问题 |
| 同名页面多开时结果不可信 | 请求被随机取走，场景状态在两个页面之间跳，输出只表现为一堆互相矛盾的 FAIL（对象"凭空消失"、撤销栈深度对不上）。桥接现在上报在线页面，冒烟/压力脚本据此直接停下而不是跑出不可信的结果 |
| 跨文件导出失配 | 拆分时漏改两处 import（仍从旧模块取 `isFiniteF32`），页面模块加载失败白屏。lint 不做模块解析，**只有类型检查能抓到**——改跨文件导出后必须跑 `type-check` |
| `dryRun` 的预演命令留在重做栈 | 撤销栈回退了、重做栈却多出一条预演命令：之后任何一次 `history.redo`（包括用户按快捷键）都会把"只看不动"变成**真实写入**，同时用户原有的重做历史被清空。现在预演走 `discard` 模式并在结束时整栈恢复 |
| `scene.batch` 的"事务"在有 `history.undo` 步骤时不成立 | 该步会把撤销栈弄**短**，失败回滚于是无事可做，却照报"已回滚 0 步，场景回到调用前"（实测哨兵对象已经消失）。现在 batch 复用与 `dryRun` 同一份"可回滚方法"白名单，并且在动手**之前**把整组步骤校验完 |
| `scene.group` 漏了防环检查 | `parentId` 指向成员自己或它的后代即成环：遍历爆栈、页面卡死，而且**事后无法用桥接修复**（`reparent` 的防环检查会把修复尝试也拒掉）。`reparent` 一直有这道检查，现在两者共用 |
| `scene.find` 先截断再排序 | `sortBy` 与 `limit` 同时给时，排序作用在被截断的子集上：实测 12 个 y=0..11 的对象上 `desc` + `limit=3` 返回了 2、1、0——"最高的三个"给成了最低的三个。现在先对**全部命中**排序再截断 |
| `null` 绕过类型防呆 | `primitiveTypeOf(null)` 与 `primitiveTypeOf(undefined)` 都返回 `null`，使类型比对整段跳过：`position.y = null` 被接受，矩阵随即变 NaN、对象从画面消失。写入口现在直接拒绝空值 |
| `scene.add` 的 `color` 不走颜色校验 | 原先用 `Number(color?.r ?? 1)` 兜底，`{ r: 'x' }` 会把 NaN 写进 `u_diffuse`——而同一个函数里的 `glossiness` 却走了校验。现在与 `setMaterial` 共用同一套 |
| `scene.import` 绕开数值守卫 | `scene.add` 会校验变换、import 直接反序列化：`position: { x: 1e39 }` 进来就是矩阵 NaN。导入前统一过 `assertFiniteNumbers`，中途失败还会把已挂上去的对象摘掉 |
| 撤销/重做的出栈顺序 | `pop()` 先于 `undo()`：`undo()` 一旦抛错，这条命令两层栈都不在——场景停在半途而撤销栈里查无记录。现在先执行再出栈，抛错时命令留在栈上 |
| `marks` 不随历史裁剪前移 | 标记记的是绝对深度，`pushCommand` 裁掉最老一条后所有深度都该前移一格；不调整的话 `scene.rollback` 会连标记**之前**的操作一起撤掉，而返回的 `undoneCount` 看不出任何异常 |
| 多步落笔中途失败留下半成品 | `setMany` / `setFields` / `arrange` 的落笔循环改用 `commitAll`：失败时逆序还原已落笔的部分，不再出现"改了一半、撤销栈里只有一半记录" |
| 自检工具自己的口径 | `editor-mcp-check.mjs` 曾把 `SKIP` 计入"通过"（离线跑也报 7/7，实际只跑了 6 项）；`editor-bridge-fuzz.mjs` 没有任何失败退出码，页面已被轰坏时还返回 `0`——两者现在都如实反映结果 |

### 工程改进（不是新能力，但让后续改动更稳）

- **写通道按职责拆成 `src/bridge/write/` 下的 8 个模块**：原先单文件 1500 行（约定是 ≤300 行），
  继续往里加功能只会更难维护；拆分顺带把 `scene.rollback` 与 `scene.batch` 里重复的回滚循环
  抽成了 `rewindTo`
- **纯函数抽成 `writePure.ts`**：f32 边界、颜色分量、路径解析原先与引擎、响应式依赖缠在一起，
  只能靠端到端 fuzz 验证；搬出来后可直接单测，**单元测试 11 → 43 项**（含撤销/重做栈的顺序语义：
> 预演命令不得进重做栈、`undo()` 抛错时命令必须留在栈上）
- **压力测试正式化**：从 `.verify/`（不入库、随时会被清掉）移进 `scripts/`，补齐 `--target`、
  同名多开守卫与更多方法的耗时基线
- **投影换算抽成共用工具**：`view.probe` 的 `project`、`scene.find` 的 `includeScreen`、
  `scene.validate` 的视野检查共用 `getProjector` / `isInsideNdc` / `objectCenter`，
  避免三处各写一遍后逐渐走偏

### 验证手段

- **冒烟自检** 85 项：`node scripts/editor-bridge-smoke.mjs`（写操作测完自动撤销还原）
- **单元测试** 35 项：`npm run test`（`packages/editor/test/`：像素统计的量化/通道交换/抽样/区域/主色占比/字符画，
  以及写通道纯函数——f32 边界、颜色分量校验、路径解析、批量上限、深拷贝语义）
- **模糊测试** 90 例（写方法 63 + 只读方法 27）+ 4 个合法操作序列：`node scripts/editor-bridge-fuzz.mjs`
  （非法/边界参数逐个轰，每步探活+体检，并统计"引擎报错"）
- **MCP 一致性** 7 项：`node scripts/editor-mcp-check.mjs`（工具表 ↔ 方法表 ↔ 文档三方对齐；
  其中 6 项**离线可跑**，第 7 项"源码解析的方法表 ↔ 页面运行时 `editor.info`"需要页面在线——
  页面不可达时它会打印 `SKIP` 并**单列在汇总里**，不会被算成"通过"）
- **类型检查**：editor 自身代码零错误（15 个既有错误全在 `feng3d`/`polyfill`）
- **lint**：`npm run lint` 退出码 0
- **集成验收** 12 项：`node scripts/editor-bridge-scenario.mjs`（从零搭一张桌子并逐项验证——
  事务预演与提交、失败整组回滚、贴地、整体尺寸、可见性、画面像素、体检、撤销还原）
- **压力** 10 个方法：`node scripts/editor-bridge-stress.mjs`（206 个对象下 106–235ms，与 100ms
  轮询间隔基本吻合，说明耗时来自轮询等待而非方法本身；200 个对象可一路撤销完全还原）
  ——扩展这项测试时抓到一个真 bug：`projectAll` 复用的 `projectObjects` 把"最多 20 个"写死在函数里，
  于是可渲染对象多于 20 个时必然失败，而默认场景只有 2 个，冒烟与集成验收都覆盖不到

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
