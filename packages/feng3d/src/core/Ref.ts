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
 *
 * 同时维护 raw → 键 反查表，供 {@link liftSharedRefs} 在保存侧还原为 $ref。
 */
export function registerShared(refs: Record<string, object>): void
{
    for (const key in refs)
    {
        _sharedRegistry.set(key, refs[key]);
        _sharedSet.add(refs[key]);
        _sharedKeyByObject.set(refs[key], key);
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

// ============================================================================
// 序列化反向提升（设计 3.7 保存侧）
//
// 加载侧：defs.materials.x + { $ref: 'materials/x' } → 构造期替换为同一 raw 对象。
// 保存侧（本节）：克隆数据树，运行期被多处引用（或已在共享注册表）的纯数据对象
// 反向提升到 defs 表并以 { $ref: '表/名' } 替代，保证 保存 → 加载 → 引用关系等价。
// ============================================================================

/** raw 共享对象 → 注册键 的反查表（registerShared 时维护），供保存侧还原为 $ref */
const _sharedKeyByObject = new Map<object, string>();

/**
 * 序列化反向提升（设计 3.7 保存侧）。
 *
 * 深克隆纯数据树，两类对象反向提升到 defs 并以 `{ $ref: '表/名' }` 替代：
 * 1. 已在共享注册表的对象（加载时来自 defs）→ 还原为**原注册键**；
 * 2. 树内被 ≥2 处引用的纯数据对象/数组 → 提升到 `shared` 表，名按首遇顺序编号。
 *
 * 与 {@link resolveRefs} 对称：`resolveRefs(liftSharedRefs(x).root)` 后引用关系等价。
 *
 * 扫描/克隆范围与 resolveRefs 相同：只处理纯数据对象与数组，运行时对象
 * （Matrix4x4/TypedArray 等）原样引用返回（由调用方决定丢弃或另行序列化）。
 * 纯数据出现循环引用时抛错（JSON 字面量本就不可能构造出环）。
 *
 * @param node 待序列化的数据树根（View / Object3D 等纯数据结构）
 * @returns root 为克隆后的树（原树不被修改），defs 为提升出的表（可直接合并进 View.defs）
 */
export function liftSharedRefs(node: object): { root: Record<string, unknown>; defs: Record<string, Record<string, object>> }
{
    // ---- 第一遍：统计引用计数（含注册表对象标记） ----
    const refCount = new Map<object, number>();
    countRefs(node, refCount, new Set<object>());

    // ---- 第二遍：克隆 + 提升 ----
    const defs: Record<string, Record<string, object>> = {};
    const hoisted = new Map<object, { $ref: string }>();
    let autoIndex = 0;
    const root = clone(node, refCount, defs, hoisted, () => `shared/obj${++autoIndex}`, new Set<object>()) as Record<string, unknown>;

    return { root, defs };
}

/** 统计纯数据对象/数组在树内的引用次数（跳过注册表对象内部与运行时对象） */
function countRefs(target: object, refCount: Map<object, number>, visited: Set<object>): void
{
    if (visited.has(target)) return;
    visited.add(target);

    const writable = target as Record<string, unknown>;
    for (const key in writable)
    {
        const value = writable[key];
        if (value === null || typeof value !== 'object') continue;
        if (!isPlainObject(value) && !Array.isArray(value)) continue;

        refCount.set(value, (refCount.get(value) ?? 0) + 1);

        // 注册表对象内部已定形（加载侧模板），不重复计入；也不再深入
        if (_sharedSet.has(value)) continue;

        countRefs(value, refCount, visited);
    }
}

/** 克隆节点：需提升的对象替换为 { $ref }，其余递归浅结构克隆 */
function clone(
    value: unknown,
    refCount: Map<object, number>,
    defs: Record<string, Record<string, object>>,
    hoisted: Map<object, { $ref: string }>,
    nextName: () => string,
    inProgress: Set<object>,
): unknown
{
    if (value === null || typeof value !== 'object') return value;
    if (!isPlainObject(value) && !Array.isArray(value)) return value; // 运行时对象原样返回

    // 已在注册表 → 还原为原注册键
    const registeredKey = _sharedKeyByObject.get(value);
    if (registeredKey !== undefined)
    {
        return { $ref: registeredKey };
    }

    // 多处引用 → 提升（首遇时挂到 defs 并缓存 $ref 替身，后续直接复用）
    if ((refCount.get(value) ?? 0) >= 2)
    {
        let ref = hoisted.get(value);
        if (!ref)
        {
            const name = nextName();
            const [table, entry] = name.split('/');
            ref = { $ref: name };
            // 先登记替身：子树内若再次引用到自身，直接复用替身避免无限递归
            hoisted.set(value, ref);
            // 内容克隆：对根级跳过注册表/提升替换（此处即定义点），仅子级生效
            (defs[table] ||= {})[entry] = (
                Array.isArray(value)
                    ? value.map(item => clone(item, refCount, defs, hoisted, nextName, inProgress))
                    : Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v, refCount, defs, hoisted, nextName, inProgress)]))
            ) as object;
        }

        return ref;
    }

    if (inProgress.has(value))
    {
        throw new Error('[Ref] liftSharedRefs 遇到循环引用（纯数据树不应成环）');
    }
    inProgress.add(value);

    const result: unknown = Array.isArray(value)
        ? value.map(item => clone(item, refCount, defs, hoisted, nextName, inProgress))
        : Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v, refCount, defs, hoisted, nextName, inProgress)]));

    inProgress.delete(value);

    return result;
}
