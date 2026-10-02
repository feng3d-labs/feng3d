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

## 6. 已知代价（要接受，或者后面再优化）

`HostFS` 的**每一次读写都是一次 HTTP 往返**（`POST /call` + `GET /result`）。相比 indexedDB：

- **单个文件读写**：可接受（一次往返几毫秒）；
- **批量**（`Resource.load` 一次拉几十个资源 / 目录递归）：会明显慢。

所以这一步之后，**第一个该做的优化**是给宿主方法加**批量**形态
（一次调用拿多个文件，或让 `host.workspace.list` 支持递归 + 附带元数据），
而不是去给 `HostFS` 加一层缓存——缓存会引入"磁盘变了、页面还是旧的"这类新问题，
而批量不改变语义。**先量一遍再决定**（`editor-bridge-stress.mjs` 是现成的量法）。

## 7. 怎么算"成了"

一条**端到端**判据（e2e，不是单测）：

1. 起宿主 + 一个真项目目录（含 `scenes/xxx.json`）；
2. 打开编辑器页面 → **页面里读到的项目文件列表 = 磁盘上的那份**；
3. **在页面里改一个文件**（或建一个）→ **磁盘上真的变了**（测试进程直接 `existsSync` / `readFileSync` 核实）；
4. 反过来：**测试进程改磁盘上的文件** → 页面收到 `workspace/changed` 并刷新（这条已由
   `editor-page-host-call.mjs` 的判据覆盖，可复用）。

第 3 条是关键：它同时排除了"页面还在用 indexedDB 副本"（磁盘不会变）与
"界面说保存了其实没写"（#271 的教训）。
