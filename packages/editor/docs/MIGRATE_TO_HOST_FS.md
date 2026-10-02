# 把 `HostFS` 接进 `EditorRS`（#274 的最后一截）

> 状态：**设计稿**（`HostFS` 本体已落地并有单测，见 [HostFS.ts](../src/assets/HostFS.ts) 与
> `test/hostFS.spec.ts`；本文只说"怎么换、会撞到什么"）。
>
> 前置：`NODE_HOST.md` §6 的 P2（宿主服务 / 宿主方法）与 `HostFS` 已就绪。

## 1. 现状：项目在页面里

`src/assets/EditorRS.ts` 末尾（模块顶层）：

```ts
if (supportNative)
{
    FS.basefs = nativeFS;      // Node 端（编辑器自己跑在 Node 里时）
}
else
{
    FS.basefs = indexedDBFS;   // 浏览器端：项目是页面里的一份 indexedDB 副本
}

export const editorRS = new EditorRS();
FS.fs = new ReadWriteFS();
ReadRS.rs = editorRS;
```

浏览器端打开项目的实际路径是：**用户选一个 zip → 解压进 `indexedDB` → 之后所有读写都对着那份副本**。
于是"项目"有两份：磁盘上一份（VS Code 改的、`npm run build` 跑的、Git 管的），页面里一份。
**页面那份永远追不上磁盘那份**——这不是实现问题，是形态问题。

## 2. 目标

**"编辑器打开的项目"就是宿主那个目录。** 页面对项目的每一次读写，都经宿主方法落到磁盘。

## 3. 会撞到的第一件事：**同步赋值 vs 异步探测**

`FS.basefs` 是**模块顶层的同步赋值**，而"宿主有没有开着项目"只能**异步**问
（`host.workspace.info`；页面启动时宿主可能还在起）。

三个走法：

| 方案 | 做法 | 判断 |
|---|---|---|
| **A（选它）** | 启动流程里**先 `await` 探测**，再决定把 `basefs` 指到谁 | 需要把"决定用哪个 FS"从模块顶层**挪进启动流程**（`main.ts` 的 bootstrap，那里本来就在 await） |
| B | 总是用 `HostFS` | ✗ 宿主没开项目时**全错**（所有路径都失败），而"编辑器单独打开"是常见用法 |
| C | 用 Proxy 让 `FS.basefs` 延迟决定 | ✗ 把一个明确的决策藏进代理里，出问题时最难查的就是它 |

**A 的具体形状**（不改 `FS` 本身，只改"什么时候指哪边"）：

```ts
// src/assets/EditorRS.ts：把"选 FS"抽成一个函数，模块顶层不再决定
export async function pickBaseFS(): Promise<void>
{
    // 宿主开着项目 → 用它；否则保持原样（indexedDB / native）
    try
    {
        const info = await callHost<{ open: boolean }>('host.workspace.info');

        if (info.open) { FS.basefs = new HostFS(); return; }
    }
    catch
    {
        // 宿主不可用（静态部署 / dev server 没接 relay）——**不是错误**，退回原行为
    }
}
```

启动流程里 `await pickBaseFS()`，放在**任何资源读取之前**。

## 4. 混用期：两份项目并存

切换不可能一步到位（zip 导入这条路仍在），所以**必须能说清"现在这份项目是哪来的"**：

- 给编辑器加一个**项目来源**标记（`'host' | 'zip' | 'indexedDB'`），
  它决定：宿主面板显不显示、`workspace/changed` 事件要不要订阅、保存走哪条路；
- **不要**用"`FS.basefs instanceof HostFS`"当判据——那是**实现细节**，
  而"项目从哪来"是**产品概念**；两者将来会分叉（比如宿主项目也可能被缓存到页面）。

## 5. 回退与失败语义

- **探测失败**（`fetch` 不通、宿主没起）→ **静默退回**原行为 ✓（静态部署必须还能用）；
- **探测成功但后续调用失败**（宿主中途死了）→ **如实报错**（不静默退回 indexedDB：
  那会让"保存"看着成功、实际写进了另一份项目里 —— 比直接失败危险得多）；
- 这两条的区别要写进注释：**"没有宿主"是正常态，"宿主挂了"是错误态**。

## 6. 已知代价（**已量过**，见 `scripts/editor-host-io-bench.mjs`）

`HostFS` 的**每一次读写都是一次 HTTP 往返**（`POST /call` + `GET /result`）。实测（本机回环、40 个文件）：

| 读法 | 40 个文件 | 每个文件 |
|---|---|---|
| **串行** | **1011 ms** | 25.3 ms |
| **并发** | **52 ms** | 1.30 ms |
| **一次批量**（`readMany`） | **26 ms** | 0.66 ms |
| 一次列目录（40 条元数据） | 17 ms | — |

两条结论，**都不是猜的**，而且**都已经落地（#274 的"批量 + 并发"一截）**：

1. **绝不能串行**——并发比串行快 **~20×**、批量比串行快 **~38×**。所以凡是成批的地方
   （资源清单、目录扫描）一律**并发**或**批量**。已落地的两处：
   - **宿主列目录的类型信息不再半路丢掉**：`host.workspace.list` 本来就回 `directory`，
     而 `IReadFS.readdir` 的契约只回名字，于是调用方对**每个条目**再问一次 `isDirectory`
     （宿主下就是每个条目多两趟 HTTP）。现在 `IReadWriteFS.readdirWithTypes`（**可选**能力）
     把类型带回来，`ReadWriteFS.getAllPathsInFolder` 检测到就用它、检测不到退回**并发**补问；
   - `EditorRS` 的模板文件写入（创建 / 升级项目）改**并发**。
2. **批量宿主方法已做**（`host.workspace.readMany`），理由**不是**"省往返次数"——而是
   **调用方未必能并发**：编辑器加载资源那条链（`feng3d` 的 loader）是**串行**的，那不在我们手里。
   而引擎侧**不认识编辑器**：`IReadFS.readStrings` 是**可选**能力，`ReadFS.readStrings`
   检测到就走一趟读到、检测不到退回**并发**逐个。端到端判据
   [check-editor-host-batch.mjs](../../../scripts/check-editor-host-batch.mjs)：
   与逐个读**逐字节一致**、**只走一次** `/call`（"真的走了批量"，不是"结果恰好也对"）、
   坏路径与越界**逐条如实**、入参非法**如实报错**。

**不要给 `HostFS` 加缓存**：那会引入"磁盘变了、页面还是旧的"这类**新语义问题**，而批量不改变语义。

> 一条**待查的线索**：串行下单趟请求要 ~12–14 ms，而并发 / 批量时每趟摊到 ~0.6 ms。
> 已排除"连接没复用"（响应头是 `connection: keep-alive`）与 Nagle（设了 `server.noDelay` 无改善），
> **原因未查清**。它不影响上面的结论——并发与批量都能绕开它，所以它不是"必须修的 bug"。

> 一条**已知局限**（本阶段未收）：批量里"文件不存在"那条的 `error` 文本来自 Node 的 `ENOENT`，
> **里面带着宿主的绝对路径**（单个 `readText` 抛错也是这样，不是批量引入的）。
> 页面本不该看到宿主的绝对路径——要单独收（把宿主侧错误里的绝对路径剥成项目内相对路径）。

## 7. 怎么算"成了"

一条**端到端**判据（e2e，不是单测）：

1. 起宿主 + 一个真项目目录（含 `scenes/xxx.json`）；
2. 打开编辑器页面 → **页面里读到的项目文件列表 = 磁盘上的那份**；
3. **在页面里改一个文件**（或建一个）→ **磁盘上真的变了**（测试进程直接 `existsSync` / `readFileSync` 核实）；
4. 反过来：**测试进程改磁盘上的文件** → 页面收到 `workspace/changed` 并刷新（这条已由
   `editor-page-host-call.mjs` 的判据覆盖，可复用）。

第 3 条是关键：它同时排除了"页面还在用 indexedDB 副本"（磁盘不会变）与
"界面说保存了其实没写"（#271 的教训）。
