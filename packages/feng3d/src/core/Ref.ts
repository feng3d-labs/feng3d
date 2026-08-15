import type { UnReadonly } from '@feng3d/reactivity';

/**
 * 共享引用注册表（框架设计文档 3.7）。
 *
 * JSON 字面量中同一对象写两处就是两个独立对象——共享必须显式表达：
 * `{ $ref: 'materials/diffuse' }` 在构造期解析为注册表中的同一 raw 对象。
 * reactive 经 WeakMap 缓存返回同一代理，"改一处处处生效"天然成立。
 */
const _sharedRegistry = new Map<string, object>();
const _sharedSet = new Set<object>();

/**
 * 注册共享对象（View 构造时由 viewLogic 自动调用，也可手动注册）。
 */
export function registerShared(refs: Record<string, object>): void
{
    for (const key in refs)
    {
        _sharedRegistry.set(key, refs[key]);
        _sharedSet.add(refs[key]);
    }
}

/**
 * 查询已注册的共享对象。
 */
export function getShared(ref: string): object | undefined
{
    return _sharedRegistry.get(ref);
}

/**
 * 解析节点内的 `$ref` 引用（构造期、非响应式，原地替换字段值）。
 *
 * 只扫描**纯数据对象**（plain object：原型为 Object.prototype/null）与数组——
 * $ref 只出现在 JSON 字面量中；跳过 class 实例与 TypedArray/ImageData 等运行时
 * 对象（深扫它们的索引属性会造成秒级卡顿，见 PointLightTest 回归）。
 * 未注册的 $ref 打印错误并保留原值。
 */
export function resolveRefs(node: object): void
{
    _resolve(node, new Set<object>());
}

/** 判断是否为纯数据对象（JSON 字面量的原型形态） */
function isPlainObject(value: object): boolean
{
    const proto = Object.getPrototypeOf(value);

    return proto === null || proto === Object.prototype;
}

function _resolve(target: object, visited: Set<object>): void
{
    if (visited.has(target)) return;
    visited.add(target);

    const writable = target as UnReadonly<Record<string, unknown>>;

    for (const key in writable)
    {
        const value = writable[key];
        if (value === null || typeof value !== 'object') continue;

        // 只处理纯数据对象与数组；运行时对象（Matrix4x4/ImageData/TypedArray 等）跳过
        if (!isPlainObject(value) && !Array.isArray(value)) continue;

        // $ref 引用：替换为注册表中的共享对象
        const ref = (value as { $ref?: unknown }).$ref;
        if (typeof ref === 'string' && Object.keys(value).length === 1)
        {
            const shared = _sharedRegistry.get(ref);
            if (shared)
            {
                writable[key] = shared;
            }
            else
            {
                console.error(`[Ref] 未注册的 $ref '${ref}'（先经 registerShared / View.defs 注册）`);
            }

            continue;
        }

        // 共享对象来自注册表，内部已解析过，避免重复扫描
        if (_sharedSet.has(value)) continue;

        _resolve(value, visited);
    }
}
