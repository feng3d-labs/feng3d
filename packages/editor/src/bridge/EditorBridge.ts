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

/** 单个对象的详情：变换 + 组件摘要 */
function objectDetail(objectId: string): unknown
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
    };
}

/**
 * 单对象详情；也支持一次取多个（`objectIds`）。
 *
 * 多对象形态是为了省往返：AI 常要对比几个对象（"这两个球的位置差多少"），
 * 逐个查询会把一次交互拆成 N 次。
 */
function sceneGet(params: Record<string, unknown>): unknown
{
    const rawIds = params.objectIds ?? (params.objectId === undefined ? undefined : [params.objectId]);
    if (rawIds === undefined) throw new Error('缺少 objectId（或 objectIds）；可用 scene.summary / scene.list 获取');
    if (!Array.isArray(rawIds) || rawIds.length === 0) throw new Error('objectIds 必须是非空数组');

    const details = rawIds.map((id) => objectDetail(String(id)));

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
    const limit = params.limit === undefined ? 50 : Number(params.limit);
    const includeTransform = params.includeTransform === true;

    const where = params.where as { path?: unknown, op?: unknown, value?: unknown } | undefined;
    const wherePath = where === undefined ? undefined : String(where.path ?? '');
    const whereOp = where === undefined ? 'eq' : String(where.op ?? 'eq');
    if (where !== undefined && !wherePath)
    {
        throw new Error('where.path 不能为空，例如 { where: { path: "position.y", op: "lt", value: 0 } }');
    }

    if (name === undefined && nameContains === undefined && namePattern === undefined
        && type === undefined && tag === undefined && wherePath === undefined)
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
    const walk = (object: Object3D) =>
    {
        if (matched.length >= limit) return;
        const objectName = object.name ?? 'Object3D';
        const typeNames = (object.components ?? []).map((c) => c.__type__);
        const hit = (name === undefined || objectName === name)
            && (nameContains === undefined || objectName.toLowerCase().includes(nameContains))
            && (regex === undefined || regex.test(objectName))
            && (tag === undefined || object.tag === tag)
            && (type === undefined || typeNames.includes(type))
            && (wherePath === undefined || compareField(readFieldPath(object, wherePath), whereOp, where.value));
        if (hit)
        {
            matched.push({
                id: getObjectId(object),
                name: objectName,
                types: typeNames,
                // 位置往往和 id 一样重要（"找到并知道它在哪"），但要 AI 主动要才返回，避免膨胀
                ...(includeTransform ? { position: object.position ?? null } : {}),
            });
        }
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
    const view = getActiveEditorView();
    const cameraLogic = view ? getLogic(view.camera as never) as {
        project?: (point: { x: number, y: number, z: number }) => { x: number, y: number, z: number },
    } | null : null;
    /** 视野判断：取不到相机就一律返回 true（别把"不知道"报成问题） */
    const inView = (point: { x: number, y: number, z: number }): boolean =>
    {
        if (!cameraLogic?.project) return true;
        const ndc = cameraLogic.project(point);

        return ndc.x >= -1 && ndc.x <= 1 && ndc.y >= -1 && ndc.y <= 1 && ndc.z >= 0 && ndc.z <= 1;
    };

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

    return {
        count: selected.length,
        objects: selected.map((object) => ({ id: getObjectId(object), name: object.name })),
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
 * 把编辑器相机对准指定对象（看特写）。
 *
 * 用途：`scene.bounds` 只知道尺寸、`view.screenshot` 只给全景；AI 要看某个对象的细节时，
 * 需要先移动相机。归入只读通道：它只移动**编辑器相机**（视图状态），不改场景数据。
 *
 * @param params.objectId 目标对象路径式 id
 */
function cameraFocus(params: Record<string, unknown>): unknown
{
    const objectId = String(params.objectId ?? '');
    if (!objectId) throw new Error('缺少 objectId');

    const view = getActiveEditorView();
    if (!view) throw new Error('找不到编辑器视图（EditorView 尚未创建）');

    const object = resolveObjectId(objectId);
    view.focusOn(object);

    return { focused: objectId, name: object.name };
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
 * 把对象投影到画面像素坐标。
 *
 * 为什么需要它：AI 只看得到世界坐标，没法回答"我加的东西到底在画面哪儿、看得见吗"。
 * 有了 NDC 与屏幕坐标，才能把"画面有变化"与"变化的是不是我加的对象"对上——
 * 比如聚焦之后对象应当在画面中心，投影点偏得很远就说明焦距/包围盒出了问题。
 *
 * 与 `SceneView.vue` 的区域选择用同一套换算（`(ndc.x+1)/2*width`、`(1-ndc.y)/2*height`，
 * NDC 的 y 向上、屏幕的 y 向下）。
 *
 * @param camera 编辑器相机（`EditorView.camera`）
 * @param width 画面像素宽
 * @param height 画面像素高
 * @param objectIds 目标对象路径式 id 数组
 */
function projectObjects(
    camera: unknown,
    width: number,
    height: number,
    objectIds: unknown,
): Record<string, unknown>[]
{
    if (!Array.isArray(objectIds)) throw new Error('project 需要 objectId 数组');
    if (objectIds.length > 20) throw new Error(`project 一次最多 20 个对象（收到 ${objectIds.length}）`);

    const cameraLogic = getLogic(camera as never) as {
        project?: (point: { x: number, y: number, z: number }) => { x: number, y: number, z: number },
    } | null;
    if (!cameraLogic?.project) throw new Error('编辑器相机尚未就绪（无法投影）');

    const round = (value: number) => Number(value.toFixed(3));

    return objectIds.map((rawId) =>
    {
        const object = resolveObjectId(String(rawId));
        // 用世界包围盒中心而不是 position：对象挂在有位移的父级下时，两者并不相等
        const center = getLogic(object)?.boundingBox?.worldBounds?.getCenter()
            ?? (object.position as { x: number, y: number, z: number })
            ?? { x: 0, y: 0, z: 0 };
        const ndc = cameraLogic.project!(center);
        const visible = ndc.x >= -1 && ndc.x <= 1 && ndc.y >= -1 && ndc.y <= 1 && ndc.z >= 0 && ndc.z <= 1;

        return {
            id: getObjectId(object),
            name: object.name,
            ndc: { x: round(ndc.x), y: round(ndc.y), z: round(ndc.z) },
            screen: {
                x: Math.round(((ndc.x + 1) / 2) * width),
                y: Math.round(((1 - ndc.y) / 2) * height),
            },
            visible,
        };
    });
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
    const analysis = analyzePixels(
        readPixels.result as Uint8Array,
        readPixels.format,
        width,
        height,
        {
            gridSize: Number.isFinite(requestedGrid) ? Math.min(32, Math.max(0, Math.floor(requestedGrid))) : 8,
            topColors: Number.isFinite(requestedColors) ? Math.min(16, Math.max(1, Math.floor(requestedColors))) : 5,
        },
    );

    return {
        width,
        height,
        ...analysis,
        ...(params.project === undefined
            ? {}
            : { projected: projectObjects(view.camera, width, height, params.project) }),
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
    view.focusOn(target);

    return { preset, rotation, targetId: getObjectId(target), targetName: target.name };
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
        methods: Object.keys(HANDLERS),
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
 * 只读方法表（不写场景数据）。
 *
 * 注意 `selection.set` 是**UI 导航**操作：它改编辑器选中状态，但不改场景数据，故不要求写通道。
 */
const HANDLERS: Record<string, (params: Record<string, unknown>) => unknown | Promise<unknown>> = {
    'editor.info': () => editorInfo(),
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
