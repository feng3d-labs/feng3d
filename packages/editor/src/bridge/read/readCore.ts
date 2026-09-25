import { logic as getLogic } from 'feng3d';
import { toRaw } from '@feng3d/reactivity';
import type { Object3D, Scene } from 'feng3d';
import { EditorData } from '../../global/EditorData';

/**
 * 场景树遍历的深度上限（兜底保护）。
 *
 * 正常场景远达不到这个深度。设置它是因为多处逻辑沿 `parent` 向上遍历
 * （`getObjectId` 算路径、`scene.reparent` 的防环检查）——万一场景树因异常已经成环，
 * 没有上限就会**把页面卡死**：JS 单线程死循环后桥接再也无法响应，只能刷新页面。
 */
export const MAX_TREE_DEPTH = 1000;

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
export function summarizeValue(value: unknown, depth = 0): unknown
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

/** 组件摘要中需要跳过的字段：大数组与二进制数据，避免上下文膨胀 */
const SKIPPED_FIELD_PATTERN = /^(positions|normals|uvs|colors|tangents|indices|drawRange|data)$/;

/** 汇总对象数量 */
export function countTree(root: Object3D): { objects: number, components: number, maxDepth: number }
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

/** 按字段路径读值（只读；中途缺失返回 undefined） */
export function readFieldPath(root: unknown, path: string): unknown
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
export function compareField(actual: unknown, op: string, expected: unknown): boolean
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

/** 读单个对象的世界包围盒（没有 MeshRenderer 或渲染侧未提供时给出原因） */
export function readBounds(objectId: string): { id: string, bounds: unknown, reason?: string }
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
export function mergeBounds(list: unknown[]): { min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number } } | null
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
