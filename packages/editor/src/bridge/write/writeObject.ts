import { logic as getLogic, serialization } from 'feng3d';
import type { Object3D } from 'feng3d';
import { reactive, toRaw } from '@feng3d/reactivity';
import { getObjectId, requireSceneRoot, resolveObjectId } from '../EditorBridge';
import { requireWriteEnabled, cloneValue, pushCommand } from './writeCore';
import { assertFiniteNumbers } from './writeGuards';
import { buildComponents, normalizeObjectName } from './writeGeometry';

/**
 * 新增对象（可撤销）。
 *
 * `parentId` 省略时挂到场景根。两种写法：
 * - `shape`：简写，自动组装 `MeshRenderer + 几何 + 可选材质`，可配 `color` 与 `geometryParams`；
 * - `components`：纯数据字面量直传，例如
 *   `[{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry' } }]`。
 */
export function sceneAdd(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const parent = params.parentId ? resolveObjectId(String(params.parentId)) : requireSceneRoot();
    // 变换参数里的非法数字会让新对象立刻消失（矩阵变 NaN），在入口就拦住
    for (const field of ['position', 'rotation', 'scale'])
    {
        if (params[field] !== undefined) assertFiniteNumbers(params[field], field);
    }
    const components = buildComponents(params);
    // 变换字段总是给全（位置/旋转零向量、缩放 1）：否则"先建对象、再摆位置"这个最自然的
    // 下一步会撞上"字段不存在"的防呆——`scene.add` 不带 position 时对象上真的没有这个字段，
    // 紧接着的 `scene.set { path: 'position.y' }` 就会报错（实测 AI 常这么写）
    const object = {
        __type__: 'Object3D',
        name: normalizeObjectName(params.name, 'Object3D'),
        position: params.position === undefined ? { x: 0, y: 0, z: 0 } : cloneValue(params.position) as object,
        rotation: params.rotation === undefined ? { x: 0, y: 0, z: 0 } : cloneValue(params.rotation) as object,
        scale: params.scale === undefined ? { x: 1, y: 1, z: 1 } : cloneValue(params.scale) as object,
        ...(components === undefined ? {} : { components }),
    } as Object3D;

    const r_parent = reactive(parent as object as Record<string, unknown>);
    (r_parent.children as Object3D[]).push(object);

    pushCommand({
        label: `add ${object.name}`,
        undo: () =>
        {
            const children = reactive(parent as object as Record<string, unknown>).children as Object3D[];
            // 用 toRaw 比较：Vue 的数组代理会把 indexOf 转到原始数组上查找，所以「数组是代理」
            // 不影响匹配，但**参数若是代理**就永远找不到（这正是批量删除只删掉一个的原因）
            const index = children.findIndex((child) => toRaw(child) === toRaw(object));
            if (index >= 0) children.splice(index, 1);
        },
        redo: () => { (reactive(parent as object as Record<string, unknown>).children as Object3D[]).push(object); },
    });

    return { id: getObjectId(object), parentId: getObjectId(parent), name: object.name };
}

/**
 * 复制对象（含子树与组件），可撤销。
 *
 * 用途：AI 常需要"再来几个一样的"，手写 `components` 字面量既啰嗦又容易漏（材质参数、
 * 几何构造参数）。这里走 `serialization` 深拷贝纯数据——与 `scene.save` 同一条链路，
 * 因此不会遗漏任何字段。
 *
 * 默认**沿 X 轴依次排开**：复制体与原对象完全重叠时画面看不出变化，AI 和用户都难以察觉。
 *
 * @param params.objectId 要复制的对象
 * @param params.parentId 新对象的父级，默认与原对象同父级
 * @param params.name 新对象名，默认 `<原名>Copy`；复制多份时自动追加序号
 * @param params.position 新对象位置，默认按包围盒宽度沿 X 轴错开
 * @param params.count 复制份数，默认 1，上限 50
 */
export function sceneDuplicate(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const objectId = String(params.objectId ?? '');
    if (!objectId) throw new Error('需要 objectId');

    const source = toRaw(resolveObjectId(objectId));

    // 场景根不可复制：它挂在编辑器视图的 root 下、是有父级的，只能靠路径深度识别
    if (getObjectId(source).split('/').filter(Boolean).length <= 1)
    {
        throw new Error(`不能复制场景根对象：${objectId}`);
    }

    const sourceParent = toRaw(getLogic(source)?.parent as Object3D | null);
    if (!sourceParent) throw new Error('对象没有父级，无法复制');

    const parent = params.parentId ? resolveObjectId(String(params.parentId)) : sourceParent;
    const count = Math.max(1, Math.min(Number(params.count ?? 1) || 1, 50));
    const baseName = normalizeObjectName(params.name, `${source.name ?? 'Object3D'}Copy`);

    // 错开步长取自身宽度（取不到时退化为 1），确保复制体不会叠在一起
    const size = getLogic(source).boundingBox.worldBounds.getSize();
    const step = Number.isFinite(size.x) && size.x > 0.001 ? size.x * 1.1 : 1;
    const sourcePosition = source.position;
    const baseX = Number.isFinite(sourcePosition?.x) ? (sourcePosition as { x: number }).x : 0;
    const baseY = Number.isFinite(sourcePosition?.y) ? (sourcePosition as { y: number }).y : 0;
    const baseZ = Number.isFinite(sourcePosition?.z) ? (sourcePosition as { z: number }).z : 0;
    if (params.position !== undefined) assertFiniteNumbers(params.position, 'position');

    const childrenOf = (target: Object3D) =>
        reactive(target as object as Record<string, unknown>).children as Object3D[];

    const created: Object3D[] = [];
    for (let i = 0; i < count; i++)
    {
        const clone = serialization.deserialize(serialization.serialize(source)) as Object3D;
        const r_clone = reactive(clone as object as Record<string, unknown>);
        r_clone.name = count > 1 ? `${baseName}${i + 1}` : baseName;
        r_clone.position = params.position !== undefined
            ? cloneValue(params.position)
            : { x: baseX + (step * (i + 1)), y: baseY, z: baseZ };

        childrenOf(parent).push(clone);
        created.push(clone);
    }

    const detachAll = () =>
    {
        const children = childrenOf(parent);
        for (const clone of created)
        {
            const index = children.findIndex((child) => toRaw(child) === toRaw(clone));
            if (index >= 0) children.splice(index, 1);
        }
    };

    pushCommand({
        label: `duplicate ${objectId} x${count}`,
        undo: detachAll,
        redo: () =>
        {
            for (const clone of created) childrenOf(parent).push(clone);
        },
    });

    return { created: created.map((clone) => getObjectId(clone)), count, parentId: getObjectId(parent) };
}

/**
 * 删除对象（可撤销）。
 *
 * 支持一次删多个（`objectIds`）：**先全部解析校验、再统一删除**，任何一项不合格都在删除前
 * 抛出，不会删一半留下残局；撤销时按原 index 升序插回，同一父级下多个对象能恢复原顺序。
 *
 * 撤销时直接插回**原对象**（而不是 `deserialize` 出来的副本）。这一点很关键：副本会改变引用，
 * 导致更早的 `add` 命令按引用找不到它、撤销失效——实测 `add → remove → undo(remove) → undo(add)`
 * 序列下最后一次撤销无效、对象残留。复用原引用后两个命令能正确互操作。
 */
