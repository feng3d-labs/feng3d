import { logic as getLogic } from 'feng3d';
import { isBridgeSocketOnline, startBridgeSocket, subscribeBridgeEvent } from './bridgeSocket';
import { useEditorStore } from '../vue-app/stores/editorStore';
import { installEditorLogCapture, queryEditorLogs, subscribeEditorLog } from '../utils/editorLog';
import { WRITE_HANDLERS, isWriteEnabled } from './EditorBridgeWrite';
import { editorReloadScene, sceneSave } from './write/writeMisc';
import type { EditorRS } from '../assets/EditorRS';
import type { EditorAsset } from '../ui/assets/EditorAsset';
import { requireSceneRoot } from './read/readCore';
import { sceneBounds, sceneExport, sceneGet, sceneList, sceneSummary } from './read/sceneRead';
import { sceneFind } from './read/sceneQuery';
import { sceneValidate } from './read/sceneValidate';
import { viewProbe, viewScreenshot } from './read/viewRead';
import { logTail, readCameraState, cameraSetView, cameraFocus, selectionSet, selectionGet } from './read/editorRead';
import { editorPlugins, editorSetPlugin } from './read/pluginRead';
import { getBridgeMethodContributions, getContributionTable, getLogicContributions, getPanelContributions, getPlugins, getSceneOverlays } from '../plugins';
export { MAX_TREE_DEPTH, getObjectId, requireSceneRoot, resolveObjectId } from './read/readCore';

/**
 * 编辑器只读桥接（P1）—— 前端半。
 *
 * 目标：让 AI（DSH 等）能以**语义化、只读**的方式查询编辑器场景，而不是把整个场景 JSON
 * 塞进上下文，也不是靠 DOM 选择器模拟点击。
 *
 * 架构（见 docs/EDITOR_AI_BRIDGE.md）：
 * ```
 * DSH / CLI ──HTTP──▶ Vite middleware（packages/editor/bridge/vitePlugin.mjs）
 *                        ▲            │
 *                  轮询 pending    长轮询 result
 *                        │            ▼
 *                    本模块（浏览器内）──▶ 只读查询 EditorData / logic(entity)
 * ```
 * 前端跑在浏览器里无法监听端口，因此由本模块**主动轮询**取任务、执行后回传结果。
 *
 * **对象标识**：P1 用**路径式 id**（如 `/Untitled/Cube`，同名追加 `#2`）——确定性、无状态、
 * 跨会话稳定、可读，明显优于运行时 `WeakMap<Object3D, string>`；后者跨会话即失效，无法让
 * AI 引用"上次那个对象"。
 *
 * **只读边界**：本模块不提供任何写入方法。P1 的全部方法只读取数据，不改动场景。
 */

const BRIDGE_PREFIX = '/__editor-bridge';

const POLL_INTERVAL_MS = 100;

/**
 * 读服务端注入的**一次性 token**（#273 P2 / D9 第二步）。
 *
 * 注入有两条路、**脚本格式同一份**（`bridgeTokenScript`）：dev 走 vite 的 `transformIndexHtml`、
 * 生产走宿主的 `bootScript`。
 *
 * ## 为什么必须放在**模块级**
 *
 * 这两个函数被两处用：`startEditorBridge` 里的轮询、以及**模块级**的 `runRequest`（回传结果）。
 * 一开始把它们写进了 `startEditorBridge` 内部 —— 于是 `runRequest` 里那处调用抛 `ReferenceError`，
 * 而它被 `catch { /* 回传失败 *\/ }` **静默吞掉**：任务收到了、执行了、结果却回不去，
 * 调用方只看到"20s 超时"（实测踩到，靠抓 WebSocket 帧才定位）。
 *
 * 另外用**懒读**而不是模块级常量：模块加载时 `window` 未必存在（单测环境就没有）。
 */
function bridgeToken(): string
{
    return (globalThis as { __EDITOR_BRIDGE_TOKEN__?: string }).__EDITOR_BRIDGE_TOKEN__ ?? '';
}

/** 带 token 的请求头（没注入 token 时给空对象，不添乱） */
function bridgeTokenHeaders(): Record<string, string>
{
    const token = bridgeToken();

    return token ? { 'x-editor-bridge-token': token } : {};
}

/**
 * 本页面的桥接客户端标识。
 *
 * URL 带 `?bridgeClient=xxx` 时用它，否则为 `default`。多个编辑器页面同时打开时，
 * 调用方可在 `POST /call` 里用 `target` 指定只投递给某个页面——否则请求会被任一
 * 页面抢先取走（实测曾把对象加到用户页面、而探针页面拿不到结果）。
 */
const BRIDGE_CLIENT_ID = (() =>
{
    try
    {
        return new URLSearchParams(window.location.search).get('bridgeClient') ?? 'default';
    }
    catch
    {
        return 'default';
    }
})();

/**
 * 一条待执行的桥接请求（HTTP `/pending` 与 WebSocket 推送**同形状**——两条通道共用命令层，
 * 所以页面侧的消费方式也一样）。
 */
export interface BridgeRequest
{
    readonly id: string;
    readonly method: string;
    readonly params: Record<string, unknown>;
}

/**
 * 桥接需要的**注入**（#278"挪创建点"）。
 *
 * 为什么用模块级变量而不是参数：方法表现算发生在 `runRequest` 里，而它是**模块级函数**，
 * 拿不到 `startEditorBridge` 的入参。这些调用都发生在"桥接启动之后"（轮询由启动时拉起），
 * 所以在这里赋值一次即可——比给整条调用链加参数干净。
 */
let bridgeDeps: { rs: EditorRS; assetManager: EditorAsset } | null = null;

/** 启动桥接（幂等；由编辑器初始化时调用一次） */
export function startEditorBridge(rs: EditorRS, assetManager: EditorAsset): void
{
    if (started || typeof window === 'undefined') return;
    started = true;

    bridgeDeps = { rs, assetManager };

    // 日志拦截由桥接负责尽早安装（早于 Console 面板挂载），ConsoleView 订阅同一份缓冲。
    // 这样页面启动阶段（WebGPU 初始化、资源加载等）的报错也能被 AI 读到。
    installEditorLogCapture();

    let polling = false;

    const tick = async () =>
    {
        if (polling) return;
        polling = true;
        try
        {
            // WebSocket 在线时不拉任务：任务会被**推**过来（见 bridgeSocket.ts）。
            // 它一断这里立刻接上——于是"WS 挂了"最坏就是回到原来的轮询行为，不会没人干活。
            // （return 落在 try 内，finally 仍会排下一轮，所以在线期间只是空转一次判断。）
            if (isBridgeSocketOnline()) return;

            const response = await fetch(
                `${BRIDGE_PREFIX}/pending?clientId=${encodeURIComponent(BRIDGE_CLIENT_ID)}`,
                // 页面侧端点要带一次性 token（见 `bridgeTokenHeaders`）
                { cache: 'no-store', headers: bridgeTokenHeaders() },
            );
            const payload = await response.json() as { requests?: BridgeRequest[] };
            for (const request of payload.requests ?? [])
            {
                await runRequest(request);
            }
        }
        catch
        {
            // dev server 未就绪 / 页面正在重载：静默重试
        }
        finally
        {
            polling = false;
            window.setTimeout(tick, POLL_INTERVAL_MS);
        }
    };

    // 先连 WebSocket：有推送就不必轮询。**不等它成功**——连不上会自动退回轮询，
    // 页面启动不该为了一条可选通道而阻塞（dev 的 vite 插件与宿主都提供它）
    startBridgeSocket({
        // token 走**查询串**：WS 握手不能自定义请求头
        url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${BRIDGE_PREFIX}/ws`
            + (bridgeToken() ? `?token=${encodeURIComponent(bridgeToken())}` : ''),
        clientId: BRIDGE_CLIENT_ID,
        onRequest: runRequest,
        onOnlineChange: (value) =>
        {
            console.log(`[bridge] WebSocket ${value ? '已连接（任务将被推送）' : '断开（退回轮询）'}`);
        },
    });

    // 服务端事件（#272 P2 第二阶段）：宿主服务广播"外面发生了什么"。
    // 这里先把"项目文件变了"记进编辑器日志——于是 AI 的 `log.tail` 也看得到
    //（用户视角是"编辑器知道文件变了"，其实是宿主推来的）。
    // 真正的消费方（资源树刷新、脚本重载…）接进来时，从这里再分发即可。
    subscribeBridgeEvent('workspace/changed', (payload) =>
    {
        const change = payload as { path?: string; kind?: string };

        if (!change?.path) return;

        console.log(`[bridge] 项目内变化：${change.path}（${change.kind ?? 'unknown'}）`);
    });

    void tick();
}

let started = false;

/** 执行单个请求并回传结果 */
async function runRequest(request: BridgeRequest): Promise<void>
{
    // 去重兜底：前端若有多个轮询器（例如桥接模块经历热更新重载），同一请求可能被投递两次。
    // 写操作不幂等（scene.add 会创建两个对象），因此按请求 id 保证只生效一次。
    if (getExecutedRequestIds().has(request.id)) return;
    getExecutedRequestIds().add(request.id);
    if (getExecutedRequestIds().size > 500)
    {
        const oldest = getExecutedRequestIds().values().next().value;
        if (oldest !== undefined) getExecutedRequestIds().delete(oldest);
    }

    let ok = true;
    let result: unknown;
    let error: string | undefined;
    let stack: string | undefined;

    try
    {
        // 方法表现算：插件可被关掉，表必须跟着变（见 bridgeMethodTables 的说明）
        const handlers = bridgeMethodTables().all;
        const handler = handlers[request.method];
        if (!handler)
        {
            throw new Error(`未知方法 ${request.method}；当前可用方法：${Object.keys(handlers).join(', ')}`);
        }
        result = await handler(request.params ?? {});
    }
    catch (e)
    {
        ok = false;
        error = String((e as { message?: string })?.message ?? e);
        // 带上堆栈：桥接的报错常常是引擎内部抛出的（如"reading 'elements'"），
        // 只有一句话根本无从定位——调用方（AI）拿到前几帧就能自己找到源头。
        // 截断是必须的：完整堆栈动辄上万字符，会把调用方的上下文吃光
        stack = formatErrorStack(e);
    }

    try
    {
        await fetch(`${BRIDGE_PREFIX}/result`, {
            method: 'POST',
            // 页面侧端点要带一次性 token
            headers: { 'Content-Type': 'application/json', ...bridgeTokenHeaders() },
            body: JSON.stringify({ id: request.id, ok, result, error, stack }),
        });
    }
    catch
    {
        // 回传失败（页面重载等）：调用方会因超时得知
    }
}

/** 错误堆栈最多回传的行数（含首行消息） */
const MAX_STACK_LINES = 8;

/**
 * 把异常堆栈裁成可回传的短文本。
 *
 * 只保留前若干帧：定位桥接调用失败靠的是"最内层那几帧"，剩下的调用链对调用方没有增量信息，
 * 却可能让返回体从几百字符涨到上万。
 *
 * @param e 捕获到的异常
 * @returns 裁剪后的堆栈；拿不到堆栈时返回 `undefined`（不编造）
 */
function formatErrorStack(e: unknown): string | undefined
{
    const raw = (e as { stack?: unknown })?.stack;
    if (typeof raw !== 'string' || raw.length === 0) return undefined;

    return raw.split('\n').slice(0, MAX_STACK_LINES).join('\n').slice(0, 1500);
}

// ---------------------------------------------------------------------------
// 只读方法
// ---------------------------------------------------------------------------

/** 已执行过的请求 id：防止同一请求被重复执行（曾观测到 scene.add 被执行两次，产生同名 #0 对象） */
function createExecutedRequestIds()
{
    return new Set<string>();
}

let executedRequestIds: ReturnType<typeof createExecutedRequestIds> | null = null;

/** 取 getExecutedRequestIds() 缓存（首次使用时创建；R2 零模块级副作用，issue #88） */
function getExecutedRequestIds(): ReturnType<typeof createExecutedRequestIds>
{
    if (!executedRequestIds)
    {
        executedRequestIds = createExecutedRequestIds();
    }

    return executedRequestIds;
}

/**
 * 一次写操作期间最多附带多少条新报错（返回体不能因此失控）
 */
const MAX_NEW_ERRORS = 5;

/**
 * 写方法统一包装：把**这次调用期间新出现的报错**附在返回结果上。
 *
 * 为什么默认带上：桥接调用成功 ≠ 场景没问题——渲染报错、材质告警只出现在控制台。
 * "改完必须查日志"原本只是一条纪律（写在 AGENTS.md 里），靠调用方自觉；现在它是**返回体的
 * 一部分**，AI 不必额外再调一次 `log.tail` 就能知道这次改动有没有引发异常。
 *
 * 用订阅而不是"前后计数相减"：日志缓冲有 1000 条上限，滚动之后计数会失真。
 */
function withNewErrors(
    handlers: Record<string, (params: Record<string, unknown>) => unknown | Promise<unknown>>,
): Record<string, (params: Record<string, unknown>) => unknown | Promise<unknown>>
{
    const wrapped: Record<string, (params: Record<string, unknown>) => unknown | Promise<unknown>> = {};
    for (const [name, handler] of Object.entries(handlers))
    {
        wrapped[name] = async (params) =>
        {
            const errors: string[] = [];
            const unsubscribe = subscribeEditorLog((item) =>
            {
                if (item.type === 'error' && errors.length < MAX_NEW_ERRORS) errors.push(item.message);
            });
            try
            {
                const result = await handler(params);
                if (errors.length === 0 || !result || typeof result !== 'object') return result;

                return { ...(result as Record<string, unknown>), newLogErrors: errors };
            }
            finally
            {
                unsubscribe();
            }
        };
    }

    return wrapped;
}

/**
 * 核心只读方法表（不写场景数据）。
 *
 * 注意 `selection.set` 是**UI 导航**操作：它改编辑器选中状态，但不改场景数据，故不要求写通道。
 */
const CORE_READ_HANDLERS: Record<string, (params: Record<string, unknown>) => unknown | Promise<unknown>> = {
    'editor.info': () => editorInfo(),
    'editor.overview': (params) => editorOverview(params),
    'editor.plugins': () => editorPlugins(),
    // 启用/禁用插件：改编辑器状态与引擎侧注册，不碰场景数据 → 只读通道
    'editor.setPlugin': (params) => editorSetPlugin(params),
    'scene.summary': () => sceneSummary(),
    'scene.list': (params) => sceneList(params),
    'scene.get': (params) => sceneGet(params),
    'scene.find': (params) => sceneFind(params),
    'scene.bounds': (params) => sceneBounds(params),
    'scene.export': (params) => sceneExport(params),
    'selection.get': () => selectionGet(),
    'selection.set': (params) => selectionSet(params),
    'camera.focus': (params) => cameraFocus(params),
    'camera.setView': (params) => cameraSetView(params),
    'view.screenshot': (params) => viewScreenshot(params),
    'view.probe': (params) => viewProbe(params),
    'log.tail': (params) => logTail(params),
    'scene.validate': (params) => sceneValidate(params),
};

/**
 * 全量方法表：核心方法 + **启用插件**贡献的方法。
 *
 * **每次请求现算**（而不是模块级常量）是有意的：插件能被关掉，方法表必须跟着变
 * ——关掉变换工具插件后 `editor.setTool` 就该消失，而不是留一张过期表。
 * 每次约 40 个条目的浅拷贝，代价可以忽略。
 *
 * 插件贡献的写方法同样过 `withNewErrors`（把本次新出现的报错带回去），
 * 与核心写方法一条口径——否则"插件方法报错了却看不到日志"会成为排查黑洞。
 *
 * @returns `read` / `write` / `all` 三个视图，以及写方法名列表
 */
function bridgeMethodTables(): {
    readonly read: Record<string, BridgeHandler>;
    readonly write: Record<string, BridgeHandler>;
    readonly all: Record<string, BridgeHandler>;
}
{
    const deps = bridgeDeps;

    if (!deps)
    {
        throw new Error('桥接还没启动：方法表需要注入的资源系统与资源管理器（由 startEditorBridge 设置）');
    }

    const contributed = getBridgeMethodContributions();
    const contributedRead = contributed.filter((entry) => entry.write !== true);
    const contributedWrite = contributed.filter((entry) => entry.write === true);

    const read: Record<string, BridgeHandler> = {
        ...CORE_READ_HANDLERS,
        ...Object.fromEntries(contributedRead.map((entry) => [entry.name, entry.handler])),
    };
    // P2 写通道（默认开启，可在「设置」面板里关掉；URL ?bridge=write / ?bridge=read 可强制）
    // 统一包一层：每次写操作都把「期间新出现的报错」带回给调用方
    const write = withNewErrors({
        ...WRITE_HANDLERS,
        // #278"挪创建点"：这两条要用**注入**的实例——`scene.save` 落盘、
        // `editor.reloadScene` 重读场景。它们原来挂在模块级写方法表里直接 import 单例，
        // 是依赖环的最后一截；现在由入口经 `Editor` 传进来。
        'scene.save': (params) => sceneSave(params, deps.rs),
        'editor.reloadScene': (params) => editorReloadScene(params, deps.assetManager),
        ...Object.fromEntries(contributedWrite.map((entry) => [entry.name, entry.handler])),
    });

    return { read, write, all: { ...read, ...write } };
}

/** 桥接方法处理器 */
type BridgeHandler = (params: Record<string, unknown>) => unknown | Promise<unknown>;

/** 编辑器概览 */
function editorInfo(): unknown
{
    const root = getLogic(requireSceneRoot())?.scene ?? null;
    // 方法表现算（插件可被关掉）：计数与列表必须反映**当前**可用方法，
    // 否则关掉插件后 editor.info 还在报一个调不通的方法
    const tables = bridgeMethodTables();
    const readMethods = Object.keys(tables.read);
    const writeMethods = Object.keys(tables.write);

    return {
        bridge: 'P1 只读 + P2 可撤销写',
        hasScene: !!root,
        sceneName: requireSceneRoot().name,
        selectedCount: useEditorStore().selectedObject3Ds?.length ?? 0,
        toolType: useEditorStore().toolType,
        // 写通道是否可用：不说的话 AI 只能靠试一次写操作才知道，而且要读一段错误提示
        writeEnabled: isWriteEnabled(),
        // 按通道分类：规划一组操作时，先要知道哪些需要写通道、哪些不需要
        readMethods,
        writeMethods,
        methods: Object.keys(tables.all),
        // 装了哪些插件：四类贡献点（面板 / 浮层 / Logic / 属性控件）都来自插件清单（见 src/plugins/），
        // 这里只报数量，要看清"哪个贡献点来自哪个插件"用 editor.plugins
        plugins: {
            count: getPlugins().length,
            panels: getPanelContributions().length,
            sceneOverlays: getSceneOverlays().length,
            logics: getLogicContributions().length,
            typeAttributeViews: getContributionTable().typeAttributeViews.length,
        },
        // 现在从哪看：调过 camera.focus / setView 之后要能确认
        camera: readCameraState(),
    };
}

/**
 * 一次拿到"开工前该看的东西"：通道与场景概览、体检摘要、画面统计。
 *
 * 为什么合并成一个方法：AI 每次接手编辑器都要先看这几样（`editor.info` / `scene.summary` /
 * `scene.validate` / `view.probe`），分开调是四次往返、四段上下文。这里一次给全，并刻意把
 * 体检的 issues 截到前几条——它要回答的是"有没有问题"，逐条细读再用 `scene.validate`。
 *
 * @param params.issues 体检问题返回条数（默认 5，上限 50）
 * @param params.projectAll 是否顺带投影所有可渲染对象（默认 false，输出会大不少）
 */
async function editorOverview(params: Record<string, unknown>): Promise<unknown>
{
    const requested = params.issues === undefined ? 5 : Number(params.issues);
    const limit = Number.isFinite(requested) ? Math.max(1, Math.min(50, Math.floor(requested))) : 5;
    // 直接让 sceneValidate 按需截断，这里不再自己 slice 一遍
    const report = sceneValidate({ issues: limit }) as {
        ok: boolean, issueCount: number, issueCounts: Record<string, number>,
        issues: unknown[], truncated?: boolean, hint?: string,
    };
    // methods 是 readMethods + writeMethods 的并集，概览里没必要重复一遍
    const { methods: _methods, ...info } = editorInfo() as Record<string, unknown>;

    return {
        ...info,
        summary: sceneSummary(),
        validation: {
            ok: report.ok,
            issueCount: report.issueCount,
            issueCounts: report.issueCounts,
            issues: report.issues,
            ...(report.truncated ? { truncated: true, hint: '完整问题列表用 scene.validate' } : {}),
        },
        // 画面统计与体检取自同一时刻，两边的结论不会互相矛盾。
        // 网格用 4×4：概览只需要"构图大概长什么样"，看得出轮廓就够
        view: await viewProbe({ grid: 4, colors: 3, projectAll: params.projectAll === true }),
        // 控制台动静也一并给出：开工前就该知道"这里刚才有没有报错"，而不是等改完才发现
        log: {
            counts: queryEditorLogs({ limit: 1 }).counts,
            recentErrors: queryEditorLogs({ type: 'error', limit: 3, includeStack: false })
                .entries.map((entry) => entry.message),
        },
        // 按当前状态给下一步：写通道没开就别提写方法，开了就把最省事的那几个说清楚
        hint: isWriteEnabled()
            ? '写通道已启用：scene.add（shape 简写 + 颜色 + 材质一次给全）建对象、scene.batch 成组提交'
                + '（失败自动回滚）、scene.set 改字段；改完用 view.probe 看画面、scene.validate 查隐性毛病。'
            : '只能查询：写通道已在「设置」面板里关闭。要写场景请打开「设置 → AI 桥接 → 允许 AI 写场景」，'
                + '或在编辑器 URL 后加 ?bridge=write 再刷新。',
    };
}
