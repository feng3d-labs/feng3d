import { logic as getLogic } from 'feng3d';
import type { Object3D } from 'feng3d';
import { reactive, toRaw } from '@feng3d/reactivity';
import { MAX_TREE_DEPTH, getObjectId, requireSceneRoot, resolveObjectId } from '../EditorBridge';
import { requireWriteEnabled, pushCommand } from './writeCore';
import { normalizeObjectName } from './writeGeometry';

/**
 * 把一组对象归到一个新建的组下（可撤销）。
 *
 * 用途：AI 组装的部件散在场景根下会越来越乱，"把这些放进一个组"是常见的整理操作——
 * 自己建空对象再逐个 `reparent` 要 N+1 次调用，这里一次完成，且只占一个撤销步。
 *
 * @param params.objectIds 要归组的对象，至少 1 个
 * @param params.name 组名，默认 `Group`
 * @param params.parentId 组的父级，默认与第一个成员同父级
 */
export function sceneGroup(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const rawIds = params.objectIds;
    if (!Array.isArray(rawIds) || rawIds.length === 0) throw new Error('需要非空的 objectIds 数组');
    if (rawIds.length > 200) throw new Error(`一次最多 200 个对象（收到 ${rawIds.length}）`);

    // 先全部解析校验：任一项不合格都在建组前抛出，不留半成品
    // 同一个对象出现两次会被移进组两次（第二次摘除时已找不到原位置），场景树随即损坏
    const seenMembers = new Set<Object3D>();
    const members = rawIds.map((id) =>
    {
        const objectId = String(id);
        const object = toRaw(resolveObjectId(objectId));

        if (seenMembers.has(object)) throw new Error(`objectIds 里有重复对象：${objectId}`);
        seenMembers.add(object);

        // 场景根的判据用「路径深度」而不是「对象相等」：路径式 id 的深度就是它在场景里的层级，
        // 场景根没有父级前缀（就是 /<场景名>）。对象相等在本包里出现过判断不生效的情况
        // （同一文件的 remove/reparent 正常、group 不生效，原因未查明），id 反而更直接
        if (getObjectId(object).split('/').filter(Boolean).length <= 1)
        {
            throw new Error(`不能对场景根对象分组：${objectId}`);
        }

        const oldParent = toRaw(getLogic(object)?.parent as Object3D | null);
        if (!oldParent) throw new Error(`对象没有父级，无法分组：${objectId}`);

        return {
            objectId,
            object,
            oldParent,
            index: (oldParent.children ?? []).findIndex((child) => toRaw(child) === object),
        };
    });

    const parent = params.parentId
        ? toRaw(resolveObjectId(String(params.parentId)))
        : members[0].oldParent;

    const group = {
        __type__: 'Object3D',
        name: normalizeObjectName(params.name, 'Group'),
    } as Object3D;

    const childrenOf = (target: Object3D) =>
        reactive(target as object as Record<string, unknown>).children as Object3D[];

    childrenOf(parent).push(group);
    for (const member of members)
    {
        const children = childrenOf(member.oldParent);
        const at = children.findIndex((child) => toRaw(child) === member.object);
        if (at >= 0) children.splice(at, 1);
        childrenOf(group).push(member.object);
    }

    pushCommand({
        label: `group ${members.length} objects`,
        undo: () =>
        {
            // 顺序很重要：先把成员从组里摘掉、移除组，最后才放回原父级。否则成员会**同时**
            // 挂在组与原父级下（同一个对象出现在两个 children 数组里），场景树随即损坏、
            // 后续遍历与撤销爆栈（实测踩过）
            const groupChildren = childrenOf(group);
            for (const member of members)
            {
                const at = groupChildren.findIndex((child) => toRaw(child) === toRaw(member.object));
                if (at >= 0) groupChildren.splice(at, 1);
            }

            const siblings = childrenOf(parent);
            const at = siblings.findIndex((child) => toRaw(child) === toRaw(group));
            if (at >= 0) siblings.splice(at, 1);

            // 再按原 index 升序放回原父级（同一父级下多个成员才能恢复原顺序）
            for (const member of [...members].sort((a, b) => a.index - b.index))
            {
                const children = childrenOf(member.oldParent);
                children.splice(Math.min(member.index, children.length), 0, member.object);
            }
        },
        redo: () =>
        {
            childrenOf(parent).push(group);
            for (const member of members)
            {
                // 同样要先从原父级摘掉，再放进组里
                const children = childrenOf(member.oldParent);
                const at = children.findIndex((child) => toRaw(child) === toRaw(member.object));
                if (at >= 0) children.splice(at, 1);
                childrenOf(group).push(member.object);
            }
        },
    });

    return {
        groupId: getObjectId(group),
        name: group.name,
        parentId: getObjectId(parent),
        members: members.map((member) => getObjectId(member.object)),
    };
}

/**
 * 按选择器收集要删除的对象 id。
 *
 * 只支持 `name` / `nameContains` / `tag` 这类**看得见**的条件，不支持 `scene.find` 那种
 * 任意字段的 `where`：删除是破坏性操作，想按复杂条件删就先用 `scene.find` 看清要删哪些、
 * 再传 `objectIds` ——多一步换来"删之前确实看过"。
 *
 * @returns 匹配到的 id 数组；没有给任何选择器时返回 `undefined`（走原先的 objectId 路径）
 */
function collectIdsBySelector(params: Record<string, unknown>): string[] | undefined
{
    const name = params.name === undefined ? undefined : String(params.name);
    const nameContains = params.nameContains === undefined ? undefined : String(params.nameContains).toLowerCase();
    const tag = params.tag === undefined ? undefined : String(params.tag);
    if (name === undefined && nameContains === undefined && tag === undefined) return undefined;

    const root = requireSceneRoot();
    const rootId = getObjectId(root);
    const ids: string[] = [];
    const walk = (object: Object3D) =>
    {
        const objectName = object.name ?? 'Object3D';
        const hit = (name === undefined || objectName === name)
            && (nameContains === undefined || objectName.toLowerCase().includes(nameContains))
            && (tag === undefined || object.tag === tag);
        // 场景根即使被名字匹配到也不能删（删除路径还会再拦一次，这里先排除免得整批失败）
        if (hit && getObjectId(object) !== rootId) ids.push(getObjectId(object));
        for (const child of object.children ?? []) walk(child);
    };
    walk(root);

    return ids;
}

export function sceneRemove(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    // 选择器（name / nameContains / tag）与显式 id 二选一；都给时以显式 id 为准
    const selected = collectIdsBySelector(params);
    const rawIds = params.objectIds ?? (params.objectId === undefined
        ? (selected ?? [])
        : [params.objectId]);
    if (!Array.isArray(rawIds) || rawIds.length === 0)
    {
        throw new Error('需要 objectId / objectIds，或 name / nameContains / tag 之一（选择器没匹配到任何对象）');
    }
    if (rawIds.length > 200) throw new Error(`一次最多删除 200 个对象（收到 ${rawIds.length}）`);

    const childrenOf = (target: Object3D) =>
        reactive(target as object as Record<string, unknown>).children as Object3D[];

    const sceneRoot = requireSceneRoot();

    // 先全部解析校验：任一项不合格都在删除前抛出。
    // 一律 toRaw：children 经响应式代理读出时元素是代理，与原始对象比较必须还原
    // 重复项会让撤销时把同一个对象插回两次，场景树随即出现两个相同成员
    const seenRemovals = new Set<Object3D>();
    const targets = rawIds.map((id) =>
    {
        const objectId = String(id);
        const object = toRaw(resolveObjectId(objectId));

        if (seenRemovals.has(object)) throw new Error(`objectIds 里有重复对象：${objectId}`);
        seenRemovals.add(object);
        if (object === toRaw(sceneRoot)) throw new Error(`不能删除场景根对象：${objectId}`);

        const parent = toRaw(getLogic(object)?.parent as Object3D | null);
        if (!parent) throw new Error(`对象没有父级，无法删除：${objectId}`);

        return {
            objectId,
            object,
            parent,
            index: (parent.children ?? []).findIndex((child) => toRaw(child) === object),
        };
    });

    const detachAll = () =>
    {
        for (const target of targets)
        {
            const children = childrenOf(target.parent);
            const at = children.findIndex((child) => toRaw(child) === target.object);
            if (at >= 0) children.splice(at, 1);
        }
    };

    // 按原 index 升序插回：同一父级下多个对象才能恢复原来的顺序
    const attachAll = () =>
    {
        for (const target of [...targets].sort((a, b) => a.index - b.index))
        {
            const children = childrenOf(target.parent);
            children.splice(Math.min(target.index, children.length), 0, target.object);
        }
    };

    detachAll();
    pushCommand({
        label: targets.length === 1 ? `remove ${targets[0].objectId}` : `remove ${targets.length} objects`,
        undo: attachAll,
        redo: detachAll,
    });

    const parents: string[] = [];
    for (const target of targets)
    {
        const parentId = getObjectId(target.parent);
        if (!parents.includes(parentId)) parents.push(parentId);
    }

    return { removed: targets.map((target) => target.objectId), count: targets.length, parents };
}

// 供 P2 后续批次（reparent）复用

/** 移动对象到另一个父级（可撤销），可选 `index` 指定插入位置 */
export function sceneReparent(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const objectId = String(params.objectId ?? '');
    const parentId = String(params.parentId ?? '');
    if (!objectId || !parentId) throw new Error('需要 objectId 与 parentId');
    if (objectId === parentId) throw new Error('不能把对象挂到它自己下面');

    // 统一 toRaw 规范化：`resolveObjectId` 与 `logic().parent` 可能分别返回代理与原始对象，
    // 混用时 `===` / `indexOf` 都不成立——防环检查会因此**漏检**，实测把场景树弄成环后页面栈溢出。
    const object = toRaw(resolveObjectId(objectId));
    const newParent = toRaw(resolveObjectId(parentId));
    // 不能只判「有没有父级」：游戏场景根挂在**编辑器视图的 root** 下，是有父级的，
    // 只判 parent 会让「删除/移动场景根」静默通过（实测把整棵场景从视图里移除了）
    if (object === requireSceneRoot()) throw new Error('不能移动场景根对象');
    const oldParent = toRaw(getLogic(object)?.parent as Object3D | null);
    if (!oldParent) throw new Error('对象没有父级，无法移动');

    // 防环：把对象挂到自己的子孙下会让场景树遍历死循环。
    // 步数上限是兜底——即使树已因异常成环，这里也只报错，而不会把页面卡死
    let ancestor: Object3D | null = newParent;
    let depth = 0;
    while (ancestor)
    {
        if (ancestor === object) throw new Error('不能把对象移动到它自己的子孙下');
        if (++depth > MAX_TREE_DEPTH) throw new Error(`场景树深度超过 ${MAX_TREE_DEPTH}，疑似已经成环，已中止`);
        ancestor = toRaw(getLogic(ancestor)?.parent as Object3D | null);
    }

    const oldIndex = (oldParent.children ?? []).findIndex((child) => toRaw(child) === object);
    const newIndex = params.index === undefined ? undefined : Number(params.index);

    const childrenOf = (parent: Object3D) =>
        reactive(parent as object as Record<string, unknown>).children as Object3D[];
    // 一律 toRaw 比较：children 经响应式代理读出时元素是代理，对原始对象 indexOf 得 -1，
    // 会导致「该移除的没移除」，对象同时挂在两个父级下
    const detach = (parent: Object3D) =>
    {
        const children = childrenOf(parent);
        const at = children.findIndex((child) => toRaw(child) === object);
        if (at >= 0) children.splice(at, 1);
    };
    const attach = (parent: Object3D, index?: number) =>
    {
        const children = childrenOf(parent);
        children.splice(index === undefined ? children.length : Math.min(index, children.length), 0, object);
    };

    detach(oldParent);
    attach(newParent, newIndex);

    pushCommand({
        label: `reparent ${objectId} -> ${parentId}`,
        undo: () =>
        {
            detach(newParent);
            attach(oldParent, oldIndex < 0 ? undefined : oldIndex);
        },
        redo: () =>
        {
            detach(oldParent);
            attach(newParent, newIndex);
        },
    });

    return { objectId, from: getObjectId(oldParent), to: getObjectId(newParent), newId: getObjectId(object) };
}
