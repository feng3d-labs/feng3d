import type { UnReadonly } from '@feng3d/reactivity';
import type { Object3D } from './Object3D';

/**
 * Prefab 注册表（框架设计文档 3.6）。
 *
 * 模板是纯数据（不创建 Logic、不进场景树、不响应式追踪）。
 * 应用 JSON 的 defs.prefabs 在 View 构造时经 {@link registerPrefabs} 注册；
 * 带 prefabId 的节点在 logic() 首次触达时实例化（深拷贝模板 + 递归合并 overrides）。
 */
const _prefabRegistry = new Map<string, Object3D>();

/**
 * 注册 Prefab 模板（View 构造时由 viewLogic 自动调用，也可手动注册）。
 */
export function registerPrefabs(prefabs: Record<string, Object3D>): void
{
    for (const key in prefabs)
    {
        _prefabRegistry.set(key, prefabs[key]);
    }
}

/**
 * 查询已注册的 Prefab 模板。
 */
export function getPrefab(prefabId: string): Object3D | undefined
{
    return _prefabRegistry.get(prefabId);
}

/**
 * Prefab 实例化（构造期、非响应式，直接写入原始数据）。
 *
 * 合并语义：
 * - 模板字段深拷贝写入实例的缺失字段（实例自身字段优先）
 * - overrides 递归合并：对象字段递归、数组与原始值整体覆盖
 * - prefabId / overrides 字段保留在实例上（序列化可还原）
 *
 * @param object3D 带 prefabId 的实例节点（raw）
 */
export function applyPrefab(object3D: Object3D): void
{
    const writable = object3D as UnReadonly<Object3D> as { prefabId?: string; overrides?: Record<string, unknown> };
    const prefabId = writable.prefabId;
    if (!prefabId) return;

    const template = _prefabRegistry.get(prefabId);
    if (!template)
    {
        console.error(`[Prefab] 未注册的 prefabId '${prefabId}'（先经 registerPrefabs / View.defs 注册）`);

        return;
    }

    const overrides = writable.overrides ?? {};

    // 1) 模板字段补缺（实例自身字段优先，如 name）
    mergeMissing(object3D as unknown as Record<string, unknown>, template as unknown as Record<string, unknown>);

    // 2) overrides 覆盖（对象递归合并、数组/原始值整体替换）
    if (overrides) mergeOverrides(object3D as unknown as Record<string, unknown>, overrides as Record<string, unknown>);
}

/**
 * 把模板字段深拷贝写入 target 的缺失字段。
 */
function mergeMissing(target: Record<string, unknown>, template: Record<string, unknown>): void
{
    for (const key in template)
    {
        if (key === '__type__' || key === 'prefabId' || key === 'overrides') continue;
        if (target[key] !== undefined) continue;

        target[key] = structuredClone(template[key]);
    }
}

/**
 * 把 overrides 覆盖写入 target：对象字段递归合并，数组与原始值整体替换。
 */
function mergeOverrides(target: Record<string, unknown>, overrides: Record<string, unknown>): void
{
    for (const key in overrides)
    {
        const value = overrides[key];
        const existing = target[key];

        if (value !== null && typeof value === 'object' && !Array.isArray(value)
            && existing !== null && typeof existing === 'object' && !Array.isArray(existing))
        {
            mergeOverrides(existing as Record<string, unknown>, value as Record<string, unknown>);
        }
        else
        {
            target[key] = value;
        }
    }
}
