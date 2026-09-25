import { logic as getLogic } from 'feng3d';
import { toRaw } from '@feng3d/reactivity';
import type { Object3D, Scene } from 'feng3d';
import { getActiveEditorView } from '../feng3d/editorViewRegistry';
import { pixelsToDataURL } from '../feng3d/screenShotCanvas';
import { EditorData } from '../global/EditorData';
import { installEditorLogCapture, queryEditorLogs } from '../utils/editorLog';
import type { EditorLogType } from '../utils/editorLog';
import { WRITE_HANDLERS } from './EditorBridgeWrite';

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

/** 组件摘要中需要跳过的字段：大数组与二进制数据，避免上下文膨胀 */
const SKIPPED_FIELD_PATTERN = /^(positions|normals|uvs|colors|tangents|indices|drawRange|data)$/;

interface BridgeRequest
{
    readonly id: string;
    readonly method: string;
    readonly params: Record<string, unknown>;
}

let started = false;

/** 启动桥接（幂等；由编辑器初始化时调用一次） */
export function startEditorBridge(): void
{
    if (started || typeof window === 'undefined') return;
    started = true;

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
            const response = await fetch(
                `${BRIDGE_PREFIX}/pending?clientId=${encodeURIComponent(BRIDGE_CLIENT_ID)}`,
                { cache: 'no-store' },
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

    void tick();
}

/** 已执行过的请求 id：防止同一请求被重复执行（曾观测到 scene.add 被执行两次，产生同名 #0 对象） */
const executedRequestIds = new Set<string>();

/** 执行单个请求并回传结果 */
async function runRequest(request: BridgeRequest): Promise<void>
{
    // 去重兜底：前端若有多个轮询器（例如桥接模块经历热更新重载），同一请求可能被投递两次。
    // 写操作不幂等（scene.add 会创建两个对象），因此按请求 id 保证只生效一次。
    if (executedRequestIds.has(request.id)) return;
    executedRequestIds.add(request.id);
    if (executedRequestIds.size > 500)
    {
        const oldest = executedRequestIds.values().next().value;
        if (oldest !== undefined) executedRequestIds.delete(oldest);
    }

    let ok = true;
    let result: unknown;
    let error: string | undefined;

    try
    {
        const handler = HANDLERS[request.method];
        if (!handler)
        {
            throw new Error(`未知方法 ${request.method}；P1 只读方法：${Object.keys(HANDLERS).join(', ')}`);
        }
        result = await handler(request.params ?? {});
    }
    catch (e)
    {
        ok = false;
        error = String((e as { message?: string })?.message ?? e);
    }

    try
    {
        await fetch(`${BRIDGE_PREFIX}/result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: request.id, ok, result, error }),
        });
    }
    catch
    {
        // 回传失败（页面重载等）：调用方会因超时得知
    }
}

// ---------------------------------------------------------------------------
// 只读方法
// ---------------------------------------------------------------------------

/** 取当前场景根对象；未加载场景时抛错 */
export function requireSceneRoot(): Object3D
{
    const scene: Scene | null = EditorData.editorData.gameScene;
    const root = scene ? (getLogic(scene)?.entity as Object3D | null) : null;
    if (!root) throw new Error('当前没有场景（EditorData.editorData.gameScene 为空）');

    return root;
}

/** 对象路径式 id：逐级拼接 name，同级重名追加 #序号 */
export function getObjectId(object: Object3D): string
{
    const scene = EditorData.editorData.gameScene;
    // 必须 toRaw：场景树遍历拿到的是原始对象，而 logic(...).entity 可能经代理返回，
    // 不还原会出现「同一对象却 !== 」导致场景根判定失效（前缀裁不掉）。
    const sceneRoot = scene ? toRaw(getLogic(scene)?.entity as Object3D | null) : null;
    const segments: string[] = [];
    let current: Object3D | null = object;

    while (current)
    {
        const parent = getLogic(current)?.parent as Object3D | null;
        // 以**场景根**为路径起点：向上走到场景根即停。否则会把编辑器内部层级
        // （editorViewRoot 之类）暴露给 AI，既无意义又会随编辑器结构调整而变动。
        if (!parent || toRaw(current) === sceneRoot)
        {
            segments.unshift(current.name ?? 'Object3D');
            break;
        }
        const name = current.name ?? 'Object3D';
        const sameName = (parent.children ?? []).filter((c) => (c.name ?? 'Object3D') === name);
        const index = sameName.indexOf(current);
        segments.unshift(sameName.length > 1 ? `${name}#${index + 1}` : name);
        current = parent;
    }

    return `/${segments.join('/')}`;
}

/** 解析路径式 id 为对象；`#序号` 段参与匹配 */
export function resolveObjectId(id: string): Object3D
{
    const root = requireSceneRoot();
    const segments = id.split('/').filter(Boolean);
    if (segments.length === 0) return root;

    let current: Object3D = root;
    for (let i = 1; i < segments.length; i++)
    {
        const [name, indexText] = segments[i].split('#');
        const candidates = (current.children ?? []).filter((c) => (c.name ?? 'Object3D') === name);
        const target = indexText ? candidates[Number(indexText) - 1] : candidates[0];
        if (!target) throw new Error(`路径不存在：${id}（在 ${current.name} 下找不到 ${segments[i]}）`);
        current = target;
    }

    return current;
}

/** 组件/几何参数的摘要：去掉大数组，只保留可读的构造参数 */
function summarizeValue(value: unknown, depth = 0): unknown
{
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value))
    {
        return value.length > 8 ? `[${value.length} 项数组]` : value.map((v) => summarizeValue(v, depth + 1));
    }
    if (depth > 3) return '[嵌套过深]';

    const source = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(source))
    {
        if (SKIPPED_FIELD_PATTERN.test(key)) continue;
        output[key] = summarizeValue(source[key], depth + 1);
    }

    return output;
}

/** 汇总对象数量 */
function countTree(root: Object3D): { objects: number, components: number, maxDepth: number }
{
    let objects = 0;
    let components = 0;
    let maxDepth = 0;
    const walk = (object: Object3D, depth: number) =>
    {
        objects++;
        components += (object.components ?? []).length;
        maxDepth = Math.max(maxDepth, depth);
        for (const child of object.children ?? []) walk(child, depth + 1);
    };
    walk(root, 0);

    return { objects, components, maxDepth };
}

/** 层级摘要（不含几何数据，用于让 AI 先建立整体印象） */
function sceneSummary(): unknown
{
    const root = requireSceneRoot();
    const counts = countTree(root);

    return {
        rootId: getObjectId(root),
        sceneName: root.name,
        objectCount: counts.objects,
        componentCount: counts.components,
        maxDepth: counts.maxDepth,
        selectedCount: EditorData.editorData.selectedObject3Ds?.length ?? 0,
        children: (root.children ?? []).map((child) => ({
            id: getObjectId(child),
            name: child.name,
            childCount: (child.children ?? []).length,
            types: (child.components ?? []).map((c) => c.__type__),
        })),
        hint: '用 scene.list 展开某一层，用 scene.get 取单个对象详情；scene.find 可按名称/类型检索。',
    };
}

/** 分层展开：默认只展开两层，避免上下文膨胀 */
function sceneList(params: Record<string, unknown>): unknown
{
    const root = requireSceneRoot();
    const start = params.path ? resolveObjectId(String(params.path)) : root;
    const depth = params.depth === undefined ? 2 : Number(params.depth);

    const build = (object: Object3D, level: number): unknown => ({
        id: getObjectId(object),
        name: object.name,
        types: (object.components ?? []).map((c) => c.__type__),
        activeSelf: getLogic(object)?.activeSelf ?? true,
        childCount: (object.children ?? []).length,
        children: level >= depth ? undefined : (object.children ?? []).map((c) => build(c, level + 1)),
    });

    return { depth, node: build(start, 0) };
}

/** 单对象详情：变换 + 组件摘要 */
function sceneGet(params: Record<string, unknown>): unknown
{
    const objectId = String(params.objectId ?? '');
    if (!objectId) throw new Error('缺少 objectId；可用 scene.summary / scene.list 获取');

    const object = resolveObjectId(objectId);
    const objectLogic = getLogic(object);

    return {
        id: getObjectId(object),
        name: object.name,
        tag: object.tag,
        activeSelf: objectLogic?.activeSelf ?? true,
        position: object.position ?? null,
        rotation: object.rotation ?? null,
        scale: object.scale ?? null,
        parentId: objectLogic?.parent ? getObjectId(objectLogic.parent as Object3D) : null,
        children: (object.children ?? []).map((c) => ({ id: getObjectId(c), name: c.name })),
        components: (object.components ?? []).map((component) => ({
            __type__: component.__type__,
            params: summarizeValue(component),
        })),
    };
}

/** 按名称/类型/tag 检索对象 */
function sceneFind(params: Record<string, unknown>): unknown
{
    const root = requireSceneRoot();
    const name = params.name === undefined ? undefined : String(params.name);
    const type = params.type === undefined ? undefined : String(params.type);
    const tag = params.tag === undefined ? undefined : String(params.tag);
    const limit = params.limit === undefined ? 50 : Number(params.limit);

    if (name === undefined && type === undefined && tag === undefined)
    {
        throw new Error('至少提供 name / type / tag 之一');
    }

    const matched: { id: string, name: string, types: string[] }[] = [];
    const walk = (object: Object3D) =>
    {
        if (matched.length >= limit) return;
        const typeNames = (object.components ?? []).map((c) => c.__type__);
        const hit = (name === undefined || object.name === name)
            && (tag === undefined || object.tag === tag)
            && (type === undefined || typeNames.includes(type));
        if (hit) matched.push({ id: getObjectId(object), name: object.name, types: typeNames });
        for (const child of object.children ?? []) walk(child);
    };
    walk(root);

    return { count: matched.length, limit, matched };
}

/**
 * 世界包围盒。
 *
 * `selfWorldBounds` 由渲染侧 Logic 提供，形态可能是 Computed 也可能是裸值，这里做运行时探测，
 * 取不到时返回 null 而不是抛错（P1 目标是"能问"，不是"必须有答案"）。
 */
function sceneBounds(params: Record<string, unknown>): unknown
{
    const objectId = String(params.objectId ?? '');
    if (!objectId) throw new Error('缺少 objectId');

    const object = resolveObjectId(objectId);
    const renderer = (object.components ?? []).find((c) => c.__type__ === 'MeshRenderer');
    if (!renderer) return { id: objectId, bounds: null, reason: '该对象没有 MeshRenderer，无几何包围盒' };

    const rendererLogic = getLogic(renderer) as unknown as Record<string, unknown>;
    const raw = rendererLogic?.selfWorldBounds ?? rendererLogic?.worldBounds;
    const bounds = raw && typeof raw === 'object' && 'value' in (raw as object)
        ? (raw as { value: unknown }).value
        : raw;

    if (!bounds) return { id: objectId, bounds: null, reason: '渲染侧未提供包围盒' };

    return { id: objectId, bounds: summarizeValue(bounds) };
}

/** 当前选中对象 */
function selectionGet(): unknown
{
    const selected = EditorData.editorData.selectedObject3Ds ?? [];

    return {
        count: selected.length,
        objects: selected.map((object) => ({ id: getObjectId(object), name: object.name })),
    };
}

/**
 * 场景视图截图（主视图所见即所得）。
 *
 * 早期实现走 `canvas.toDataURL()`：WebGPU 画布未保留绘制缓冲，只能取到空白，因此当时选择
 * **明确报错**而不是静默返回空白图。现在改为经 `EditorView.captureFrame()` —— 提交一帧后
 * `readPixels` 读回画布纹理（与资源预览截图同一机制），拿到的是编辑器**正在显示**的画面。
 *
 * 默认缩放到 800px 宽：原尺寸 PNG 的 base64 常达数百 KB，会挤爆上下文。
 *
 * @param params.width 目标宽度（像素），默认 800
 */
async function viewScreenshot(params: Record<string, unknown>): Promise<unknown>
{
    const view = getActiveEditorView();
    if (!view) throw new Error('找不到编辑器视图（EditorView 尚未创建）');

    const readPixels = await view.captureFrame();
    const sourceWidth = Number(readPixels.copySize[0]);
    const sourceHeight = Number(readPixels.copySize[1]);
    // width <= 0 表示不缩放（保留原尺寸）
    const requestedWidth = params.width === undefined ? 800 : Number(params.width);
    const maxWidth = requestedWidth > 0 ? requestedWidth : undefined;

    const dataUrl = pixelsToDataURL(
        readPixels.result as Uint8Array,
        readPixels.format,
        sourceWidth,
        sourceHeight,
        maxWidth,
    );
    const base64 = dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : '';
    if (!base64) throw new Error('截图为空（readPixels 未返回数据）');

    const scale = maxWidth === undefined ? 1 : Math.min(1, maxWidth / sourceWidth);

    return {
        mimeType: 'image/png',
        width: Math.round(sourceWidth * scale),
        height: Math.round(sourceHeight * scale),
        sourceWidth,
        sourceHeight,
        base64,
    };
}

/**
 * 读取编辑器日志（只读）。
 *
 * 价值：桥接调用成功**不代表场景没问题**——渲染报错、材质告警、未捕获异常都只出现在控制台。
 * 这里返回的正是用户在控制台面板看到的同一份日志（共享缓冲，见 `utils/editorLog.ts`）。
 *
 * 增量读取：先读一次拿到 `lastSeq`，下次传 `sinceSeq` 就只取新增的。
 */
function logTail(params: Record<string, unknown>): unknown
{
    const type = (params.type === undefined ? 'all' : String(params.type)) as EditorLogType | 'all';
    if (type !== 'all' && !['log', 'warn', 'error', 'info'].includes(type))
    {
        throw new Error(`type 只能是 all / log / warn / error / info，收到：${type}`);
    }

    return queryEditorLogs({
        type,
        limit: params.limit === undefined ? 50 : Number(params.limit),
        sinceSeq: params.sinceSeq === undefined ? undefined : Number(params.sinceSeq),
        sinceTimestamp: params.sinceTimestamp === undefined ? undefined : Number(params.sinceTimestamp),
        grep: params.grep === undefined ? undefined : String(params.grep),
        includeStack: params.includeStack !== false,
        maxMessageLength: params.maxMessageLength === undefined ? undefined : Number(params.maxMessageLength),
    });
}

/** 编辑器概览 */
function editorInfo(): unknown
{
    const root = getLogic(requireSceneRoot())?.scene ?? null;

    return {
        bridge: 'P1 只读通道',
        hasScene: !!root,
        sceneName: requireSceneRoot().name,
        selectedCount: EditorData.editorData.selectedObject3Ds?.length ?? 0,
        toolType: EditorData.editorData.toolType,
        methods: Object.keys(HANDLERS),
    };
}

/** P1 只读方法表（无任何写入方法） */
const HANDLERS: Record<string, (params: Record<string, unknown>) => unknown | Promise<unknown>> = {
    'editor.info': () => editorInfo(),
    'scene.summary': () => sceneSummary(),
    'scene.list': (params) => sceneList(params),
    'scene.get': (params) => sceneGet(params),
    'scene.find': (params) => sceneFind(params),
    'scene.bounds': (params) => sceneBounds(params),
    'selection.get': () => selectionGet(),
    'view.screenshot': (params) => viewScreenshot(params),
    'log.tail': (params) => logTail(params),
    // P2 写通道（默认关闭，需 ?bridge=write 显式启用）
    ...WRITE_HANDLERS,
};
