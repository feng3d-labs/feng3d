import { logic as getLogic } from 'feng3d';
import { toRaw } from '@feng3d/reactivity';
import type { Object3D, Scene } from 'feng3d';
import { getActiveEditorView } from '../feng3d/editorViewRegistry';
import { analyzePixels } from '../feng3d/pixelStats';
import { pixelsToDataURL } from '../feng3d/screenShotCanvas';
import { EditorData } from '../global/EditorData';
import { installEditorLogCapture, queryEditorLogs, subscribeEditorLog } from '../utils/editorLog';
import type { EditorLogType } from '../utils/editorLog';
import { WRITE_HANDLERS, isWriteEnabled } from './EditorBridgeWrite';

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

/**
 * 场景树遍历的深度上限（兜底保护）。
 *
 * 正常场景远达不到这个深度。设置它是因为多处逻辑沿 `parent` 向上遍历
 * （`getObjectId` 算路径、`scene.reparent` 的防环检查）——万一场景树因异常已经成环，
 * 没有上限就会**把页面卡死**：JS 单线程死循环后桥接再也无法响应，只能刷新页面。
 */
export const MAX_TREE_DEPTH = 1000;

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

    // 一律返回**原始对象**：代理与原始混用会让 `===` / `indexOf` / `logic()` 的 WeakMap 缓存失效
    return toRaw(root);
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
    let depth = 0;

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
        // 兜底：场景树若因异常成环，这里只报错，不会把页面卡死
        if (++depth > MAX_TREE_DEPTH)
        {
            throw new Error(`对象层级超过 ${MAX_TREE_DEPTH} 层，疑似场景树已成环，已中止路径计算`);
        }
        const name = current.name ?? 'Object3D';
        const rawCurrent = toRaw(current);
        const sameName = (parent.children ?? []).filter((c) => (c.name ?? 'Object3D') === name);
        // 用 toRaw 比较：parent.children 可能经响应式代理返回，而 current 是原始对象，
        // 直接 indexOf 会得到 -1，进而生成 `名字#0` 这种不稳定的 id
        const index = sameName.findIndex((c) => toRaw(c) === rawCurrent);
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
    if (segments.length === 0) return toRaw(root);

    // 第一段必须是场景根的名字：桥接的路径式 id 以场景根为起点。
    // 像 `/editorViewRoot` 这类编辑器层对象不在游戏场景树里——不校验的话，单段 id 会
    // 「安静地返回场景根」，于是写入落到完全不相干的对象上（实测：改环境色却写错对象）
    const rootName = root.name ?? 'Object3D';
    if (segments[0] !== rootName)
    {
        throw new Error(`路径 ${id} 不以场景根 /${rootName} 开头；桥接只能寻址游戏场景内的对象`);
    }

    let current: Object3D = root;
    for (let i = 1; i < segments.length; i++)
    {
        const [name, indexText] = segments[i].split('#');
        const candidates = (current.children ?? []).filter((c) => (c.name ?? 'Object3D') === name);
        const target = indexText ? candidates[Number(indexText) - 1] : candidates[0];
        if (!target) throw new Error(`路径不存在：${id}（在 ${current.name} 下找不到 ${segments[i]}）`);
        current = target;
    }

    // 同上：调用方会拿它去比对/比较，必须与树里的原始对象可比
    return toRaw(current);
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
/**
 * 统计可渲染对象的可见情况（在不在相机视野内）。
 *
 * 与 `scene.validate` 的 outside-view 用同一套判据，区别只是这里给**数量**：
 * "我刚加了 10 个东西，几个看得见"是决定下一步做什么时最先想知道的事。
 *
 * @returns 可见 / 不可见的数量；相机尚未就绪时返回 `null`（不编造数字）
 */
function countVisibleRenderers(root: Object3D): { visible: number, invisible: number } | null
{
    const project = getProjector();
    if (!project) return null;

    let visible = 0;
    let invisible = 0;
    const walk = (object: Object3D) =>
    {
        if ((object.components ?? []).some((component) => component.__type__ === 'MeshRenderer'))
        {
            if (isInsideNdc(project(objectCenter(object)))) visible++;
            else invisible++;
        }
        for (const child of object.children ?? []) walk(child);
    };
    walk(root);

    return { visible, invisible };
}

/**
 * 场景层级摘要（AI 最常调的第一个方法：先建立整体印象）。
 *
 * @param params 暂不需要参数
 */
function sceneSummary(): unknown
{
    const root = requireSceneRoot();
    const counts = countTree(root);
    const visibility = countVisibleRenderers(root);

    return {
        rootId: getObjectId(root),
        sceneName: root.name,
        objectCount: counts.objects,
        componentCount: counts.components,
        maxDepth: counts.maxDepth,
        selectedCount: EditorData.editorData.selectedObject3Ds?.length ?? 0,
        // "几个看得见"决定下一步是继续搭还是先找镜头，比总数更有用
        ...(visibility ? { renderVisible: visibility.visible, renderInvisible: visibility.invisible } : {}),
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

/** 单个对象的详情：变换 + 组件摘要 */
function objectDetail(objectId: string, includeScreen = false, includeBounds = false): unknown
{
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
        // 与 scene.find 的 includeScreen / includeBounds 同一套换算（同样的信息在两个方法里应当长得一样）
        ...(includeScreen ? { view: projectObjectView(object, getProjector(), getCanvasSize()) } : {}),
        ...(includeBounds ? { bounds: readBounds(objectId).bounds } : {}),
    };
}

/**
 * 单对象详情；也支持一次取多个（`objectIds`）。
 *
 * 多对象形态是为了省往返：AI 常要对比几个对象（"这两个球的位置差多少"），
 * 逐个查询会把一次交互拆成 N 次。
 *
 * @param params.includeScreen 附带 NDC 与是否在相机视野内（与 `scene.find` 一致）
 * @param params.includeBounds 附带世界包围盒（与 `scene.find` 一致）——省掉再调一次 `scene.bounds`
 */
function sceneGet(params: Record<string, unknown>): unknown
{
    const rawIds = params.objectIds ?? (params.objectId === undefined ? undefined : [params.objectId]);
    if (rawIds === undefined) throw new Error('缺少 objectId（或 objectIds）；可用 scene.summary / scene.list 获取');
    if (!Array.isArray(rawIds) || rawIds.length === 0) throw new Error('objectIds 必须是非空数组');

    const details = rawIds.map((id) => objectDetail(
        String(id),
        params.includeScreen === true,
        params.includeBounds === true,
    ));

    return rawIds.length === 1 ? details[0] : { count: details.length, objects: details };
}

/** 按字段路径读值（只读；中途缺失返回 undefined） */
function readFieldPath(root: unknown, path: string): unknown
{
    const segments = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter((segment) => segment.length > 0);
    let current: unknown = root;
    for (const segment of segments)
    {
        if (current === null || current === undefined) return undefined;
        current = (current as Record<string, unknown>)[segment];
    }

    return current;
}

/** 按条件比较字段值；大小比较仅对数字生效（类型不符视为不匹配，而不是报错） */
function compareField(actual: unknown, op: string, expected: unknown): boolean
{
    switch (op)
    {
        case 'exists': return actual !== undefined && actual !== null;
        case 'eq': return actual === expected;
        case 'ne': return actual !== expected;
        default: break;
    }

    if (typeof actual !== 'number' || typeof expected !== 'number') return false;
    switch (op)
    {
        case 'lt': return actual < expected;
        case 'lte': return actual <= expected;
        case 'gt': return actual > expected;
        case 'gte': return actual >= expected;
        default:
            throw new Error(`未知的比较符 ${op}（可用 eq / ne / lt / lte / gt / gte / exists）`);
    }
}

/**
 * 按名称/类型/tag 检索对象。
 *
 * 名称支持三种写法，覆盖 AI 记不准名字的常见情形：
 * - `name`：精确匹配（原行为）
 * - `nameContains`：子串，大小写不敏感（"sphere" 能匹配到 AISphere）
 * - `namePattern`：正则（"^AISphere\\d$"）
 *
 * 还可用 `where` 按字段值过滤，例如"找出掉到平面下的对象"：
 * `{ where: { path: "position.y", op: "lt", value: 0 } }`。
 */
function sceneFind(params: Record<string, unknown>): unknown
{
    const root = requireSceneRoot();
    const name = params.name === undefined ? undefined : String(params.name);
    const nameContains = params.nameContains === undefined ? undefined : String(params.nameContains).toLowerCase();
    const namePattern = params.namePattern === undefined ? undefined : String(params.namePattern);
    const type = params.type === undefined ? undefined : String(params.type);
    const tag = params.tag === undefined ? undefined : String(params.tag);
    const requestedLimit = params.limit === undefined ? 50 : Number(params.limit);
    if (!Number.isFinite(requestedLimit) || requestedLimit < 1)
    {
        throw new Error(`limit 需要正整数，收到：${JSON.stringify(params.limit)}`);
    }
    // 上限 500：再大就不是"检索"而是"倾倒整个场景"，上下文与内存都不划算
    const limit = Math.min(500, Math.floor(requestedLimit));
    const includeTransform = params.includeTransform === true;
    // 视野信息与 includeTransform 一样按需返回：它是"找没找到"之外最常被追问的一件事
    const includeScreen = params.includeScreen === true;
    const project = includeScreen ? getProjector() : null;
    const canvasSize = includeScreen ? getCanvasSize() : null;
    // 同理：找到之后常要问"它们各自多大、摆在哪儿"，一次带回来省掉 N 次 scene.bounds
    const includeBounds = params.includeBounds === true;
    // 排序：回答"哪个最高、谁离得最远"这类问题时，结果顺序本身就是答案
    const sortBy = params.sortBy === undefined ? undefined : String(params.sortBy);
    const order = params.order === undefined ? 'asc' : String(params.order);
    if (order !== 'asc' && order !== 'desc') throw new Error(`order 只能是 asc / desc，收到：${order}`);
    if (sortBy !== undefined && sortBy !== 'name' && !sortBy.startsWith('position.'))
    {
        throw new Error(`sortBy 只能是 name 或 position.<轴>（如 position.y），收到：${sortBy}`);
    }

    // where 既可以是单个条件，也可以是数组（数组表示**全部满足**）——
    // "y 在平面之上、且名字里带 Ball"这类筛选用单个条件表达不了，只能把结果拉回来自己再过一遍
    const rawWhere = params.where === undefined ? [] : (Array.isArray(params.where) ? params.where : [params.where]);
    const conditions = rawWhere.map((raw) =>
    {
        const condition = (raw ?? {}) as { path?: unknown, op?: unknown, value?: unknown };
        const path = String(condition.path ?? '');
        if (!path)
        {
            throw new Error('where.path 不能为空，例如 { where: { path: "position.y", op: "lt", value: 0 } }');
        }
        const op = String(condition.op ?? 'eq');
        const allowedOps = ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'exists'];
        // 拼错 op 时静默返回 false 会让"筛不出东西"变得无法解释，所以直接报错
        if (!allowedOps.includes(op)) throw new Error(`where.op 只能是 ${allowedOps.join(' / ')}，收到：${op}`);

        return { path, op, value: condition.value };
    });

    if (name === undefined && nameContains === undefined && namePattern === undefined
        && type === undefined && tag === undefined && conditions.length === 0)
    {
        throw new Error('至少提供 name / nameContains / namePattern / type / tag / where 之一');
    }

    let regex: RegExp | undefined;
    if (namePattern !== undefined)
    {
        try
        {
            regex = new RegExp(namePattern);
        }
        catch (e)
        {
            throw new Error(`namePattern 不是合法正则：${String((e as { message?: string })?.message ?? e)}`);
        }
    }

    const matched: Record<string, unknown>[] = [];
    // 命中总数与返回条数分开：`count` 只是返回了几条，分不出"就这么多"与"还有更多"
    let totalHits = 0;
    const walk = (object: Object3D) =>
    {
        const objectName = object.name ?? 'Object3D';
        const typeNames = (object.components ?? []).map((c) => c.__type__);
        const hit = (name === undefined || objectName === name)
            && (nameContains === undefined || objectName.toLowerCase().includes(nameContains))
            && (regex === undefined || regex.test(objectName))
            && (tag === undefined || object.tag === tag)
            && (type === undefined || typeNames.includes(type))
            && conditions.every((condition) => compareField(readFieldPath(object, condition.path), condition.op, condition.value));
        if (hit)
        {
            totalHits++;
            // 到量之后仍继续遍历（只是为了把总数数准），但不再构造返回项——构造才是贵的那部分
            if (matched.length < limit)
            {
                matched.push({
                    id: getObjectId(object),
                    name: objectName,
                    types: typeNames,
                    // 位置往往和 id 一样重要（"找到并知道它在哪"），但要 AI 主动要才返回，避免膨胀
                    ...(includeTransform ? { position: object.position ?? null } : {}),
                    // 只给 NDC 与可见性（不给屏幕像素：find 面向"哪些对象在视野里"，无需画布尺寸）
                    ...(includeScreen ? { view: projectObjectView(object, project, canvasSize) } : {}),
                    ...(includeBounds ? { bounds: readBounds(getObjectId(object)).bounds } : {}),
                });
            }
        }
        for (const child of object.children ?? []) walk(child);
    };
    walk(root);

    if (sortBy !== undefined)
    {
        // 排序键从对象上现取：matched 里只带按需返回的字段，position 未必在里面
        const keyOf = (item: Record<string, unknown>): number | string =>
        {
            const object = resolveObjectId(String(item.id));
            if (sortBy === 'name') return object.name ?? '';
            const value = readFieldPath(object, sortBy);

            return typeof value === 'number' ? value : 0;
        };
        const decorated = matched.map((item) => ({ item, key: keyOf(item) }));
        decorated.sort((a, b) =>
        {
            const result = typeof a.key === 'string' || typeof b.key === 'string'
                ? String(a.key).localeCompare(String(b.key))
                : Number(a.key) - Number(b.key);

            return order === 'desc' ? -result : result;
        });
        matched.length = 0;
        for (const entry of decorated) matched.push(entry.item);
    }

    return {
        count: matched.length,
        total: totalHits,
        // 截断了就明说：AI 只看到 count 时，会把"还有 30 个没返回"当成"一共就这些"
        ...(totalHits > matched.length ? { truncated: true, hint: `命中 ${totalHits} 个，只返回前 ${matched.length} 个（可用 limit 调整）` } : {}),
        limit,
        matched,
    };
}

/**
 * 世界包围盒。
 *
 * `selfWorldBounds` 由渲染侧 Logic 提供，形态可能是 Computed 也可能是裸值，这里做运行时探测，
 * 取不到时返回 null 而不是抛错（P1 目标是"能问"，不是"必须有答案"）。
 *
 * 支持一次问多个对象：合并后的包围盒回答的是"这一堆整体占多大、中心在哪"——
 * "把它们摆到某个位置"这类操作的前提，逐个调用再自己合并既啰嗦又容易算错。
 *
 * @param params.objectId 单个对象
 * @param params.objectIds 多个对象（最多 200 个），返回合并后的包围盒
 */
function sceneBounds(params: Record<string, unknown>): unknown
{
    const rawIds = params.objectIds ?? (params.objectId === undefined ? undefined : [params.objectId]);
    if (rawIds === undefined) throw new Error('缺少 objectId 或 objectIds');
    if (!Array.isArray(rawIds) || rawIds.length === 0) throw new Error('objectIds 必须是非空数组');
    if (rawIds.length > 200) throw new Error(`一次最多 200 个对象（收到 ${rawIds.length}）`);

    const details = rawIds.map((rawId) => readBounds(String(rawId)));
    if (rawIds.length === 1) return details[0];

    const boxes = details.map((detail) => detail.bounds).filter((bounds) => !!bounds);
    const merged = mergeBounds(boxes);

    return {
        count: details.length,
        withBounds: boxes.length,
        bounds: merged,
        ...(merged ? {} : { reason: '这些对象都没有包围盒' }),
        objects: details,
    };
}

/** 读单个对象的世界包围盒（没有 MeshRenderer 或渲染侧未提供时给出原因） */
function readBounds(objectId: string): { id: string, bounds: unknown, reason?: string }
{
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

/** 合并多个包围盒（min 取最小、max 取最大）；没有可用项时返回 null */
function mergeBounds(list: unknown[]): { min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number } } | null
{
    type Point = { x: number, y: number, z: number };
    let min: Point | null = null;
    let max: Point | null = null;

    for (const item of list)
    {
        const box = item as { min?: Point, max?: Point } | null;
        if (!box?.min || !box?.max) continue;
        min = min
            ? { x: Math.min(min.x, box.min.x), y: Math.min(min.y, box.min.y), z: Math.min(min.z, box.min.z) }
            : { ...box.min };
        max = max
            ? { x: Math.max(max.x, box.max.x), y: Math.max(max.y, box.max.y), z: Math.max(max.z, box.max.z) }
            : { ...box.max };
    }

    return min && max ? { min, max } : null;
}

/**
 * 场景健康检查（只读）。
 *
 * 为什么需要它：AI 改完场景常遇到"画面不对但看不出原因"——没有相机、没有光源、
 * scale 为 0 导致对象不可见、MeshRenderer 没有几何。这些都能从数据里直接判断，
 * 不必让 AI（或用户）靠猜。级别 `error` 表示"基本渲染不出来"，`warn` 表示"很可能不是你要的效果"。
 */
function sceneValidate(): unknown
{
    const root = requireSceneRoot();
    const issues: { level: 'error' | 'warn', code: string, message: string, objectId?: string }[] = [];
    const stats = { objects: 0, cameras: 0, lights: 0, renderers: 0, withGeometry: 0, withMaterial: 0, triangles: 0 };

    /**
     * 可渲染对象的世界中心，用于判断"在不在相机视野里"。
     *
     * "为什么看不到"最常见的原因就是对象根本不在视野内（坐标写大了、父级有位移、相机没对准），
     * 而这一点从数据上完全看不出来——体检把它摆出来，比让调用方反复猜要省事得多。
     */
    const renderCenters: { objectId: string, center: { x: number, y: number, z: number } }[] = [];
    const project = getProjector();
    /** 视野判断：取不到相机就一律返回 true（别把"不知道"报成问题） */
    const inView = (point: { x: number, y: number, z: number }): boolean =>
        !project || isInsideNdc(project(point));

    const walk = (object: Object3D) =>
    {
        stats.objects++;
        const objectId = getObjectId(object);

        for (const component of object.components ?? [])
        {
            const type = component.__type__;
            if (type === 'PerspectiveCamera' || type === 'OrthographicCamera') stats.cameras++;
            if (type === 'DirectionalLight' || type === 'PointLight' || type === 'SpotLight') stats.lights++;
            if (type !== 'MeshRenderer') continue;

            stats.renderers++;
            const worldCenter = getLogic(object)?.boundingBox?.worldBounds?.getCenter();
            if (worldCenter) renderCenters.push({ objectId, center: worldCenter });
            const renderer = component as { geometry?: unknown, material?: unknown };
            if (renderer.geometry)
            {
                stats.withGeometry++;
                // 三角面数是「这个场景重不重」最直接的量；几何 logic 的 indices 是惰性求值的，
                // 这里只读长度，必要时会触发一次几何构建
                const geometryLogic = getLogic(renderer.geometry as never) as unknown as { indices?: ArrayLike<number> } | null;
                const indices = geometryLogic?.indices;
                if (indices) stats.triangles += Math.floor(indices.length / 3);
            }
            else issues.push({ level: 'error', code: 'empty-renderer', message: 'MeshRenderer 没有几何，不会被渲染', objectId });
            if (renderer.material)
            {
                stats.withMaterial++;
                // 纯黑材质在深色背景下就是"看不见"，而且不会有任何报错——正是体检该抓的东西
                const diffuse = (renderer.material as {
                    uniforms?: { u_diffuse?: { r?: number, g?: number, b?: number } },
                }).uniforms?.u_diffuse;
                if (diffuse && diffuse.r === 0 && diffuse.g === 0 && diffuse.b === 0)
                {
                    issues.push({
                        level: 'warn',
                        code: 'black-material',
                        message: '材质漫反射色是纯黑，在深色背景下看不见（若确实要全黑可忽略）',
                        objectId,
                    });
                }
            }
            else
            {
                // 无材质的 MeshRenderer 会走引擎兜底渲染路径：历史上它与一次排列组合让后续操作栈溢出
                // （见 docs 已知限制），所以哪怕能画出来也值得提醒
                issues.push({
                    level: 'warn',
                    code: 'no-material',
                    message: 'MeshRenderer 没有材质，走的是引擎兜底路径（历史上与排列组合一起引发过栈溢出），建议补一个材质',
                    objectId,
                });
            }
        }

        // 变换异常：NaN/Infinity 会让矩阵求值出问题，scale 为 0 则该方向不可见
        for (const key of ['position', 'rotation', 'scale'] as const)
        {
            const value = object[key] as { x?: number, y?: number, z?: number } | undefined;
            if (!value) continue;
            for (const axis of ['x', 'y', 'z'] as const)
            {
                const component = value[axis];
                if (component !== undefined && !Number.isFinite(component))
                {
                    issues.push({
                        level: 'error',
                        code: 'invalid-transform',
                        message: `${key}.${axis} 不是有限数字（${component}）`,
                        objectId,
                    });
                }
            }
        }

        const scale = object.scale;
        if (scale && (scale.x === 0 || scale.y === 0 || scale.z === 0))
        {
            issues.push({ level: 'warn', code: 'zero-scale', message: 'scale 有一维为 0，该方向上不可见', objectId });
        }

        // 同级重名：路径 id 会带 `#序号`，AI 引用时容易搞错，值得提醒
        const counts = new Map<string, number>();
        for (const child of object.children ?? [])
        {
            const name = child.name ?? 'Object3D';
            counts.set(name, (counts.get(name) ?? 0) + 1);
        }
        for (const [name, count] of counts)
        {
            if (count > 1)
            {
                issues.push({
                    level: 'warn',
                    code: 'duplicate-name',
                    message: `同级有 ${count} 个名为 ${name} 的对象（路径 id 会带 #序号）`,
                    objectId,
                });
            }
        }

        for (const child of object.children ?? []) walk(child);
    };
    walk(root);

    if (stats.cameras === 0) issues.push({ level: 'error', code: 'no-camera', message: '场景里没有相机，运行起来什么都看不到' });
    if (stats.lights === 0) issues.push({ level: 'warn', code: 'no-light', message: '场景里没有光源，未受光的材质会呈现全黑' });

    // 只汇总一条，不逐个对象报——否则大场景的 issues 会被"视野外"淹没
    const outside = renderCenters.filter((item) => !inView(item.center));
    if (outside.length > 0)
    {
        const names = outside.slice(0, 5).map((item) => item.objectId);
        issues.push({
            level: 'warn',
            code: 'outside-view',
            message: `${outside.length} 个可渲染对象不在当前相机视野内：${names.join('、')}`
                + `${outside.length > names.length ? ' …' : ''}（可用 camera.focus 把镜头对准其中一个）`,
        });
    }

    // 完全重叠：两个对象中心重合时其中一个永远看不见，而数据上毫无异常——
    // AI 摆东西时最容易犯（复制之后忘了挪开、坐标算错落在同一点）
    const overlaps: string[] = [];
    for (let i = 0; i < renderCenters.length; i++)
    {
        for (let j = i + 1; j < renderCenters.length; j++)
        {
            const a = renderCenters[i].center;
            const b = renderCenters[j].center;
            const same = Math.abs(a.x - b.x) < 1e-4 && Math.abs(a.y - b.y) < 1e-4 && Math.abs(a.z - b.z) < 1e-4;
            if (same) overlaps.push(`${renderCenters[i].objectId} / ${renderCenters[j].objectId}`);
        }
    }
    if (overlaps.length > 0)
    {
        issues.push({
            level: 'warn',
            code: 'overlapping',
            message: `${overlaps.length} 对可渲染对象中心完全重合，其中一个看不见：`
                + `${overlaps.slice(0, 3).join('、')}${overlaps.length > 3 ? ' …' : ''}`,
        });
    }

    return {
        ok: issues.every((issue) => issue.level !== 'error'),
        issueCount: issues.length,
        issues,
        stats,
    };
}

/** 当前选中对象 */
function selectionGet(): unknown
{
    const selected = EditorData.editorData.selectedObject3Ds ?? [];
    const project = getProjector();
    const canvasSize = getCanvasSize();

    return {
        count: selected.length,
        objects: selected.map((object) => ({
            id: getObjectId(object),
            name: object.name,
            // 用户说"就这个"时，AI 得知道它是什么类型、能不能直接看到、在画面哪个位置
            types: (object.components ?? []).map((component) => component.__type__),
            view: projectObjectView(object, project, canvasSize),
        })),
    };
}

/**
 * 选中对象。
 *
 * 用途：AI 需要让**用户看见**它指的是哪个对象（高亮 + gizmo），也为随后的 `view.screenshot`
 * 提供明确的视觉焦点。
 *
 * 归入只读通道（不需要 `?bridge=write`）：它只改编辑器的 UI 选中状态，**不改动场景数据**，
 * 而且用户随手点一下就会被覆盖，不是破坏性操作。
 *
 * @param params.objectIds 路径式 id 数组；也可传单个 `objectId`。传空数组表示清空选中
 */
function selectionSet(params: Record<string, unknown>): unknown
{
    const rawIds = params.objectIds ?? (params.objectId === undefined ? [] : [params.objectId]);
    if (!Array.isArray(rawIds)) throw new Error('objectIds 必须是字符串数组（也可传单个 objectId）');

    const objects = rawIds.map((id) => resolveObjectId(String(id)));

    if (objects.length === 0)
    {
        EditorData.editorData.clearSelectedObjects();
    }
    else
    {
        // isAdd = false：替换当前选中。追加语义会让 AI 无法"只选中这一个"
        EditorData.editorData.selectMultiObject(objects, false);
    }

    return selectionGet();
}

/**
 * 解析取景距离参数。
 *
 * 只接受正数：距离为 0 或负数会让相机与目标重合（画面变成一团糊）；
 * 非法值不做兜底而直接报错，否则调用方会以为"退远看整体"生效了。
 *
 * @param params 桥接参数
 * @returns 距离；未提供时返回 `undefined`，交给 `focusOn` 自动取景
 */
function readFocusDistance(params: Record<string, unknown>): number | undefined
{
    if (params.distance === undefined) return undefined;
    const distance = Number(params.distance);
    if (!Number.isFinite(distance) || distance <= 0)
    {
        throw new Error(`distance 需要正数，收到：${JSON.stringify(params.distance)}`);
    }

    return distance;
}

/**
 * 把编辑器相机对准指定对象（看特写）。
 *
 * 用途：`scene.bounds` 只知道尺寸、`view.screenshot` 只给全景；AI 要看某个对象的细节时，
 * 需要先移动相机。归入只读通道：它只移动**编辑器相机**（视图状态），不改场景数据。
 *
 * @param params.objectId 目标对象路径式 id
 * @param params.distance 相机到目标的距离，省略则自动取景刚好框住它；
 *   给更大的值即"退远点看整体"
 */
function cameraFocus(params: Record<string, unknown>): unknown
{
    const objectId = String(params.objectId ?? '');
    if (!objectId) throw new Error('缺少 objectId');

    const view = getActiveEditorView();
    if (!view) throw new Error('找不到编辑器视图（EditorView 尚未创建）');

    const object = resolveObjectId(objectId);
    view.focusOn(object, readFocusDistance(params));

    return { focused: objectId, name: object.name };
}

/**
 * 解析并裁到画布内的区域参数。
 *
 * `view.screenshot` 与 `view.probe` 共用同一套坐标与校验：同一件事（只看一块）在两个方法里
 * 不该有两套行为。整块落在画布外时直接报错，而不是给一张空图。
 */
function readRegion(
    value: unknown,
    width: number,
    height: number,
): { x: number, y: number, width: number, height: number } | undefined
{
    if (value === undefined) return undefined;
    const raw = (value ?? {}) as { x?: unknown, y?: unknown, width?: unknown, height?: unknown };
    const x = Math.max(0, Math.floor(Number(raw.x ?? 0) || 0));
    const y = Math.max(0, Math.floor(Number(raw.y ?? 0) || 0));
    const right = Math.min(width, x + Math.floor(Number(raw.width ?? width) || width));
    const bottom = Math.min(height, y + Math.floor(Number(raw.height ?? height) || height));
    if (right <= x || bottom <= y)
    {
        throw new Error(`region 超出画布或为空：${JSON.stringify(value)}（画布 ${width}x${height}）`);
    }

    return { x, y, width: right - x, height: bottom - y };
}

/** 从画面里裁出一块（按行拷贝，每像素 4 字节；通道顺序无关，原样搬运） */
function cropPixels(
    pixels: Uint8Array,
    width: number,
    region: { x: number, y: number, width: number, height: number },
): Uint8Array
{
    const cropped = new Uint8Array(region.width * region.height * 4);
    for (let row = 0; row < region.height; row++)
    {
        const from = ((region.y + row) * width + region.x) * 4;
        cropped.set(pixels.subarray(from, from + (region.width * 4)), row * region.width * 4);
    }

    return cropped;
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
 * @param params.region 只截画布上的一块区域 `{ x, y, width, height }`（像素坐标，会被裁到画布内）——
 *   与 `view.probe` 的 `region` 同一套坐标；整块在画布外则报错
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

    // 只看一块区域：与 view.probe 的 region 同一套坐标，省掉"整张图里找那一块"的上下文开销
    const region = readRegion(params.region, sourceWidth, sourceHeight);
    const pixels = region
        ? cropPixels(readPixels.result as Uint8Array, sourceWidth, region)
        : readPixels.result as Uint8Array;
    const pixelsWidth = region?.width ?? sourceWidth;
    const pixelsHeight = region?.height ?? sourceHeight;

    const dataUrl = pixelsToDataURL(
        pixels,
        readPixels.format,
        pixelsWidth,
        pixelsHeight,
        maxWidth,
    );
    const base64 = dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : '';
    if (!base64) throw new Error('截图为空（readPixels 未返回数据）');

    const scale = maxWidth === undefined ? 1 : Math.min(1, maxWidth / pixelsWidth);

    return {
        mimeType: 'image/png',
        width: Math.round(pixelsWidth * scale),
        height: Math.round(pixelsHeight * scale),
        sourceWidth: pixelsWidth,
        sourceHeight: pixelsHeight,
        ...(region ? { region } : {}),
        base64,
    };
}

/**
 * 编辑器相机的投影器（世界坐标 → NDC）。
 *
 * `view.probe` 的 `project`、`scene.find` 的 `includeScreen`、`scene.validate` 的视野外检查
 * 用的是同一套换算（NDC 的 y 向上、屏幕的 y 向下）——三处各写一遍迟早会走偏。
 *
 * @returns 投影函数；相机尚未就绪时返回 `null`，由调用方决定"不知道"怎么表达
 */
function getProjector(): ((point: { x: number, y: number, z: number }) => { x: number, y: number, z: number }) | null
{
    const view = getActiveEditorView();
    const cameraLogic = view ? getLogic(view.camera as never) as {
        project?: (point: { x: number, y: number, z: number }) => { x: number, y: number, z: number },
    } | null : null;

    return cameraLogic?.project ? (point) => cameraLogic.project!(point) : null;
}

/** NDC 是否落在视锥内：x/y ∈ [-1,1]，深度 ∈ [0,1]（WebGPU 约定） */
function isInsideNdc(ndc: { x: number, y: number, z: number }): boolean
{
    return ndc.x >= -1 && ndc.x <= 1 && ndc.y >= -1 && ndc.y <= 1 && ndc.z >= 0 && ndc.z <= 1;
}

/** 对象在场景中的代表点：世界包围盒中心（没有包围盒时退回 position，再退回原点） */
function objectCenter(object: Object3D): { x: number, y: number, z: number }
{
    return getLogic(object)?.boundingBox?.worldBounds?.getCenter()
        ?? (object.position as { x: number, y: number, z: number })
        ?? { x: 0, y: 0, z: 0 };
}

/** 编辑器画布的像素尺寸（视图未就绪或尺寸为 0 时返回 null） */
function getCanvasSize(): { width: number, height: number } | null
{
    const view = getActiveEditorView();
    if (!view) return null;
    const canvas = typeof view.canvas === 'string'
        ? document.getElementById(view.canvas) as HTMLCanvasElement | null
        : view.canvas as HTMLCanvasElement | null;
    const width = canvas?.clientWidth ?? 0;
    const height = canvas?.clientHeight ?? 0;

    return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * 对象在相机视野里的位置（NDC + 是否可见，可选屏幕像素）。
 *
 * @param object 目标对象
 * @param projector 由 {@link getProjector} 取到的投影函数；为 `null`（相机未就绪）时返回 `null`，
 *   而不是编造坐标——"不知道"和"看不见"是两回事
 * @param size 画布尺寸；给了才附上屏幕像素。由调用方取一次传进来，避免逐个对象查 DOM
 */
function projectObjectView(
    object: Object3D,
    projector: ((point: { x: number, y: number, z: number }) => { x: number, y: number, z: number }) | null,
    size?: { width: number, height: number } | null,
): { x: number, y: number, z: number, inFrustum: boolean, active: boolean, visible: boolean, screen?: { x: number, y: number } } | null
{
    if (!projector) return null;
    const ndc = projector(objectCenter(object));
    const round = (value: number) => Number(value.toFixed(3));
    const inFrustum = isInsideNdc(ndc);
    // 关掉的对象即使进了视锥也渲染不出来——只报 inFrustum 会让人以为"看得见"
    const active = getLogic(object)?.activeSelf ?? true;

    return {
        x: round(ndc.x),
        y: round(ndc.y),
        z: round(ndc.z),
        inFrustum,
        active,
        visible: inFrustum && active,
        // 与 view.probe 的 project 用同一套换算：同一件事在两处该长得一样
        ...(size ? { screen: ndcToScreen(ndc, size.width, size.height) } : {}),
    };
}

/** 世界点 → 画布像素坐标（NDC 的 y 向上、屏幕的 y 向下） */
function ndcToScreen(ndc: { x: number, y: number }, width: number, height: number): { x: number, y: number }
{
    return {
        x: Math.round(((ndc.x + 1) / 2) * width),
        y: Math.round(((1 - ndc.y) / 2) * height),
    };
}

/**
 * 把对象投影到画面像素坐标。
 *
 * 为什么需要它：AI 只看得到世界坐标，没法回答"我加的东西到底在画面哪儿、看得见吗"。
 * 有了 NDC 与屏幕坐标，才能把"画面有变化"与"变化的是不是我加的对象"对上——
 * 比如聚焦之后对象应当在画面中心，投影点偏得很远就说明焦距/包围盒出了问题。
 *
 * 与 `SceneView.vue` 的区域选择用同一套换算。
 *
 * @param width 画面像素宽
 * @param height 画面像素高
 * @param objectIds 目标对象路径式 id 数组
 */
function projectObjects(width: number, height: number, objectIds: unknown): Record<string, unknown>[]
{
    if (!Array.isArray(objectIds)) throw new Error('project 需要 objectId 数组');
    if (objectIds.length > 20) throw new Error(`project 一次最多 20 个对象（收到 ${objectIds.length}）——要一次看全部用 projectAll，或分多次传`);

    const project = getProjector();
    if (!project) throw new Error('编辑器相机尚未就绪（无法投影）');

    const round = (value: number) => Number(value.toFixed(3));

    return objectIds.map((rawId) =>
    {
        const object = resolveObjectId(String(rawId));
        // 用世界包围盒中心而不是 position：对象挂在有位移的父级下时，两者并不相等
        const ndc = project(objectCenter(object));
        const inFrustum = isInsideNdc(ndc);
        // 与 scene.find 的 includeScreen 同样把"在视锥内"与"真的可见"分开：
        // 被 activeSelf 关掉的对象即使进了视锥也渲染不出来
        const active = getLogic(object)?.activeSelf ?? true;

        return {
            id: getObjectId(object),
            name: object.name,
            ndc: { x: round(ndc.x), y: round(ndc.y), z: round(ndc.z) },
            screen: ndcToScreen(ndc, width, height),
            inFrustum,
            active,
            visible: inFrustum && active,
        };
    });
}

/** `view.probe` 一次投影全部对象时的上限（再多就不是"看清分布"而是倾倒坐标） */
const MAX_PROJECT_ALL = 50;

/**
 * 场景里所有可渲染对象的 id（深度优先，场景根在前）。
 *
 * 用于 `view.probe` 的 `projectAll`：一次看清"东西都在画面哪儿"，不必先 find 一轮。
 */
function collectRendererIds(): string[]
{
    const ids: string[] = [];
    const walk = (object: Object3D) =>
    {
        if ((object.components ?? []).some((component) => component.__type__ === 'MeshRenderer'))
        {
            ids.push(getObjectId(object));
        }
        for (const child of object.children ?? []) walk(child);
    };
    walk(requireSceneRoot());

    return ids;
}

/**
 * 场景视图的**像素统计**（不返回图片）。
 *
 * 为什么需要它：`view.screenshot` 的 base64 动辄数百 KB，会挤爆上下文；而 AI 多数时候
 * 只想确认"改完画面上到底有没有变化"。这里提交一帧后只统计像素——颜色种类、主色占比、
 * 亮度范围、灰度缩略网格——总共几百字节，却能区分出几种"看起来成功、其实没画出来"的情形：
 *
 * - 纯色画面（`uniqueColors` 为 1、亮度无范围）→ 空白或画面冻结
 * - 全黑（`maxLuminance` 为 0）→ 材质/光照/着色器出错
 * - 只有背景色（主色占比 ≈ 1）→ 物体没进视锥或被剔除
 *
 * 典型用法：写操作前后各调一次，比较 `uniqueColors` 与 `meanLuminance` 即可判断改动是否生效。
 *
 * @param params.grid 灰度缩略网格边长（默认 8，传 0 不返回网格，上限 32）
 * @param params.colors 返回的主色数量（默认 5）
 * @param params.project 要投影到画面坐标的对象 id 数组（最多 20 个）：返回它们的 NDC、
 *   屏幕像素与是否在视锥内——"画面有变化"与"变的是不是我加的对象"由此对上
 * @param params.projectAll 投影**所有可渲染对象**（最多 50 个）：一次看清"东西都在画面哪儿"，
 *   不必先 find 一轮；`projectedTotal` 给出可渲染对象总数
 * @param params.region 只统计画布上的一块区域 `{ x, y, width, height }`（像素坐标，会被裁到画布内），
 *   配合 `project` 可精确检查"我关心的那一块渲染出来了吗"
 */
async function viewProbe(params: Record<string, unknown>): Promise<unknown>
{
    const view = getActiveEditorView();
    if (!view) throw new Error('找不到编辑器视图（EditorView 尚未创建）');

    const readPixels = await view.captureFrame();
    const width = Number(readPixels.copySize[0]);
    const height = Number(readPixels.copySize[1]);

    const requestedGrid = params.grid === undefined ? 8 : Number(params.grid);
    const requestedColors = params.colors === undefined ? 5 : Number(params.colors);
    // 只统计一块区域：配合 project 给出的对象坐标，能精确回答"我关心的那一块渲染出来了吗"
    const requestedRegion = params.region as
        { x?: unknown, y?: unknown, width?: unknown, height?: unknown } | undefined;
    const analysis = analyzePixels(
        readPixels.result as Uint8Array,
        readPixels.format,
        width,
        height,
        {
            gridSize: Number.isFinite(requestedGrid) ? Math.min(32, Math.max(0, Math.floor(requestedGrid))) : 8,
            topColors: Number.isFinite(requestedColors) ? Math.min(16, Math.max(1, Math.floor(requestedColors))) : 5,
            ...(requestedRegion === undefined ? {} : {
                region: {
                    x: Number(requestedRegion.x ?? 0),
                    y: Number(requestedRegion.y ?? 0),
                    width: Number(requestedRegion.width ?? width),
                    height: Number(requestedRegion.height ?? height),
                },
            }),
        },
    );

    // projectAll：一次投影所有可渲染对象（上限 50），并如实给出总数
    const projectAll = params.projectAll === true;
    const allIds = projectAll ? collectRendererIds() : [];

    return {
        width,
        height,
        ...analysis,
        ...(projectAll
            ? {
                projected: projectObjects(width, height, allIds.slice(0, MAX_PROJECT_ALL)),
                projectedTotal: allIds.length,
                ...(allIds.length > MAX_PROJECT_ALL
                    ? { projectedTruncated: true, hint: `可渲染对象共 ${allIds.length} 个，只投影了前 ${MAX_PROJECT_ALL} 个` }
                    : {}),
            }
            : {}),
        ...(params.project === undefined
            ? {}
            : { projected: projectObjects(width, height, params.project) }),
    };
}

/**
 * 读取编辑器日志（只读）。
 *
 * 价值：桥接调用成功**不代表场景没问题**——渲染报错、材质告警、未捕获异常都只出现在控制台。
 * 这里返回的正是用户在控制台面板看到的同一份日志（共享缓冲，见 `utils/editorLog.ts`）。
 *
 * 增量读取：先读一次拿到 `lastSeq`，下次传 `sinceSeq` 就只取新增的。
 *
 * @param params.grep 关键字过滤（大小写不敏感）
 * @param params.grepRegex 正则过滤（区分大小写）——子串匹配不了"这几个对象相关的日志"
 *   （`(Ball|Cube)\d+`）；与 `grep` 同时给时两者都要满足
 * @param params.sinceSeq 只要 seq 大于该值的（增量读取）
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
        grepRegex: params.grepRegex === undefined ? undefined : String(params.grepRegex),
        includeStack: params.includeStack !== false,
        maxMessageLength: params.maxMessageLength === undefined ? undefined : Number(params.maxMessageLength),
    });
}

/**
 * 视角预设 → 相机宿主对象的旋转（弧度）。
 *
 * 相机前向 = 旋转矩阵 × (0,0,-1)（与 `Object3DLogic` 的矩阵构造同源），因此
 * 「从 +Z 方向看过去」对应旋转为 0。
 */
const VIEW_ROTATIONS: Record<string, { x: number, y: number, z: number }> = {
    front: { x: 0, y: 0, z: 0 },
    back: { x: 0, y: Math.PI, z: 0 },
    right: { x: 0, y: Math.PI / 2, z: 0 },
    left: { x: 0, y: -Math.PI / 2, z: 0 },
    top: { x: -Math.PI / 2, y: 0, z: 0 },
    bottom: { x: Math.PI / 2, y: 0, z: 0 },
    iso: { x: -Math.PI / 6, y: -Math.PI / 4, z: 0 },
};

/**
 * 从预设方向观察某个对象（可只调朝向而不取景）。
 *
 * 为什么需要它：`camera.focus` 只框住对象、**保留当前朝向**，所以 AI 没法表达"从上方看"
 * 这类意图——而很多问题（腿装反、物体悬空）只有换视角才看得出来。
 * 归入只读通道：只动编辑器相机，不改场景数据。
 *
 * @param params.preset `front` / `back` / `left` / `right` / `top` / `bottom` / `iso`（默认 `iso`）
 * @param params.objectId 取景目标，省略则只设置朝向、不改变距离
 * @param params.distance 取景距离（配合 objectId），省略则自动框住目标
 */
function cameraSetView(params: Record<string, unknown>): unknown
{
    const view = getActiveEditorView();
    if (!view) throw new Error('找不到编辑器视图（EditorView 尚未创建）');

    const preset = String(params.preset ?? 'iso');
    const rotation = VIEW_ROTATIONS[preset];
    if (!rotation) throw new Error(`preset 只能是 ${Object.keys(VIEW_ROTATIONS).join(' / ')}，收到：${preset}`);

    // 顺序：先设朝向，再取景（focusOn 保留朝向、只调距离与裁剪面）
    view.setCameraRotation(rotation);

    if (params.objectId === undefined) return { preset, rotation };

    const target = resolveObjectId(String(params.objectId));
    view.focusOn(target, readFocusDistance(params));

    return { preset, rotation, targetId: getObjectId(target), targetName: target.name };
}

/**
 * 编辑器相机的当前状态（位置与朝向）。
 *
 * 为什么要报出来：AI 调 `camera.focus` / `camera.setView` 之后没有别的办法确认"现在从哪看"，
 * 而"换个视角再看一眼"之类的判断全依赖它。
 *
 * @returns 位置 / 朝向（相机未就绪时返回 `null`，不编造坐标）
 */
function readCameraState(): unknown
{
    const view = getActiveEditorView();
    const camera = view?.camera;
    if (!camera) return null;
    const object = getLogic(camera)?.entity as Object3D | null;
    if (!object) return null;
    const fov = (camera as { fov?: number }).fov;

    return {
        position: summarizeValue(object.position),
        rotation: summarizeValue(object.rotation),
        ...(typeof fov === 'number' ? { fov } : {}),
    };
}

/** 编辑器概览 */
function editorInfo(): unknown
{
    const root = getLogic(requireSceneRoot())?.scene ?? null;

    return {
        bridge: 'P1 只读 + P2 可撤销写',
        hasScene: !!root,
        sceneName: requireSceneRoot().name,
        selectedCount: EditorData.editorData.selectedObject3Ds?.length ?? 0,
        toolType: EditorData.editorData.toolType,
        // 写通道是否可用：不说的话 AI 只能靠试一次写操作才知道，而且要读一段错误提示
        writeEnabled: isWriteEnabled(),
        // 按通道分类：规划一组操作时，先要知道哪些需要写通道、哪些不需要
        readMethods: Object.keys(HANDLERS).filter((name) => !WRITE_HANDLERS[name]),
        writeMethods: Object.keys(WRITE_HANDLERS),
        methods: Object.keys(HANDLERS),
        // 现在从哪看：调过 camera.focus / setView 之后要能确认
        camera: readCameraState(),
    };
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
    const limit = Number.isFinite(requested) ? Math.max(0, Math.min(50, Math.floor(requested))) : 5;
    const report = sceneValidate() as { ok: boolean, issueCount: number, issues: unknown[] };

    return {
        ...(editorInfo() as Record<string, unknown>),
        summary: sceneSummary(),
        validation: {
            ok: report.ok,
            issueCount: report.issueCount,
            issues: report.issues.slice(0, limit),
            ...(report.issueCount > limit ? { truncated: true, hint: '完整问题列表用 scene.validate' } : {}),
        },
        // 画面统计与体检取自同一时刻，两边的结论不会互相矛盾
        view: await viewProbe({ grid: 8, colors: 3, projectAll: params.projectAll === true }),
    };
}

/**
 * 只读方法表（不写场景数据）。
 *
 * 注意 `selection.set` 是**UI 导航**操作：它改编辑器选中状态，但不改场景数据，故不要求写通道。
 */
const HANDLERS: Record<string, (params: Record<string, unknown>) => unknown | Promise<unknown>> = {
    'editor.info': () => editorInfo(),
    'editor.overview': (params) => editorOverview(params),
    'scene.summary': () => sceneSummary(),
    'scene.list': (params) => sceneList(params),
    'scene.get': (params) => sceneGet(params),
    'scene.find': (params) => sceneFind(params),
    'scene.bounds': (params) => sceneBounds(params),
    'selection.get': () => selectionGet(),
    'selection.set': (params) => selectionSet(params),
    'camera.focus': (params) => cameraFocus(params),
    'camera.setView': (params) => cameraSetView(params),
    'view.screenshot': (params) => viewScreenshot(params),
    'view.probe': (params) => viewProbe(params),
    'log.tail': (params) => logTail(params),
    'scene.validate': () => sceneValidate(),
    // P2 写通道（默认关闭，需 ?bridge=write 显式启用）
    // 统一包一层：每次写操作都把「期间新出现的报错」带回给调用方
    ...withNewErrors(WRITE_HANDLERS),
};
