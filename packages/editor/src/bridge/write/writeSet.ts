import { logic as getLogic } from 'feng3d';
import { getObjectId, resolveObjectId } from '../EditorBridge';
import { requireWriteEnabled, pushCommand, redoStack, undoStack } from './writeCore';
import { isFiniteF32 } from './writePure';
import { revertSet, commitSet, prepareSet } from './writeGuards';
import { assertNoDuplicateObjects } from './writeGeometry';

/** 写入对象字段（可撤销） */
export function sceneSet(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const objectId = String(params.objectId ?? '');
    const path = String(params.path ?? '');
    if (!objectId || !path) throw new Error('需要 objectId 与 path，例如 { objectId: "/Untitled/Cube", path: "position.y", value: 1 }');

    const outcome = prepareSet(objectId, path, params.value, params.create === true);
    commitSet(outcome);

    pushCommand({
        label: `set ${objectId}.${path}`,
        undo: () => revertSet(outcome),
        redo: () => commitSet(outcome),
    });

    return {
        objectId,
        path,
        before: outcome.hadKey ? outcome.before : null,
        after: outcome.after,
        history: { undoCount: undoStack.length, redoCount: redoStack.length },
    };
}

/**
 * 对**多个对象**写入同一字段（一次撤销）。
 *
 * 用途：AI 常要对一组对象做同一修改（"这些球都变蓝"、"整体上移 1 单位"）。
 * 逐个调 `scene.set` 既慢、又会留下 N 个撤销步，中途失败还会留下半成品；
 * 这里**先全部校验、再统一落笔**，因此要么全改、要么一个都不改，撤销也只需一步。
 */
export function sceneSetMany(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const rawIds = params.objectIds;
    if (!Array.isArray(rawIds) || rawIds.length === 0) throw new Error('需要非空的 objectIds 数组');
    const path = String(params.path ?? '');
    if (!path) throw new Error('需要 path');
    if (rawIds.length > 200) throw new Error(`一次最多 200 个对象（收到 ${rawIds.length}）`);
    assertNoDuplicateObjects(rawIds);

    const create = params.create === true;
    // 先全部校验：任一项不合格都会在此抛出，此时还没有任何写入
    const outcomes = rawIds.map((id) => prepareSet(String(id), path, params.value, create));

    for (const outcome of outcomes) commitSet(outcome);

    pushCommand({
        label: `setMany ${outcomes.length} x ${path}`,
        undo: () => { for (const outcome of outcomes) revertSet(outcome); },
        redo: () => { for (const outcome of outcomes) commitSet(outcome); },
    });

    return {
        updated: outcomes.length,
        path,
        after: outcomes[0].after,
        objects: outcomes.map((outcome) => outcome.objectId),
        history: { undoCount: undoStack.length, redoCount: redoStack.length },
    };
}

/** 取向量在指定轴上的分量（缺字段时按 0） */
function axisValue(vector: unknown, axis: string): number
{
    if (vector === null || vector === undefined) return 0;
    const value = (vector as Record<string, unknown>)[axis];

    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** 圆周分布时：圆所在平面的法线轴 → 平面上的两个轴 */
const CIRCLE_PLANE: Record<string, readonly [string, string]> = {
    x: ['y', 'z'],
    y: ['x', 'z'],
    z: ['x', 'y'],
};

/**
 * 排列一组对象：沿某个轴**对齐**、**等间距排开**或**围成一圈**（一次撤销）。
 *
 * 为什么要在通道里做：AI 想"把这几个球排成一行 / 围一圈"时只能自己读每个对象的包围盒、
 * 算坐标，再逐个 `scene.set`——既容易算错（对象尺寸不同就叠在一起），又会留下 N 个撤销步。
 *
 * - `mode: 'line'`（默认）：以**第一个对象的中心**为起点，按 `spacing` 沿轴等间距排开；
 *   `spacing` 省略时取这批对象在该轴上的最大尺寸 × 1.2（保证不重叠）
 * - `mode: 'align'`：把每个对象在轴上的**中心**对齐到这批对象的中心平均值
 *   （不用某一个对象作基准，避免整体偏移）
 * - `mode: 'circle'`：以这批对象的中心为圆心，在**垂直于 `axis`** 的平面上均匀分布
 *   （`axis` 默认 `y`，即水平圆）；`radius` 省略时取最大尺寸 × 1.5
 * - `mode: 'grid'`：在垂直于 `axis` 的平面上按 `columns` 列铺成网格（默认 `ceil(√n)` 列），
 *   整体以这批对象的中心为中心；步长默认按各方向最大尺寸 × 1.2
 *
 * @param params.objectIds 至少 2 个对象的路径式 id
 * @param params.axis `x` / `y` / `z`（circle 与 grid 模式下表示平面的法线方向）
 * @param params.mode `line`（默认）/ `align` / `circle` / `grid`
 * @param params.spacing 仅 `line` / `grid` 模式：间距
 * @param params.radius 仅 `circle` 模式：半径
 * @param params.columns 仅 `grid` 模式：列数
 */
export function sceneArrange(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const rawIds = params.objectIds;
    if (!Array.isArray(rawIds) || rawIds.length < 2) throw new Error('需要至少 2 个对象的 objectIds 数组');
    if (rawIds.length > 200) throw new Error(`一次最多 200 个对象（收到 ${rawIds.length}）`);
    assertNoDuplicateObjects(rawIds);

    const mode = String(params.mode ?? 'line');
    if (mode !== 'line' && mode !== 'align' && mode !== 'circle' && mode !== 'grid')
    {
        throw new Error(`mode 只能是 line / align / circle / grid，收到：${mode}`);
    }
    const axis = String(params.axis ?? (mode === 'circle' ? 'y' : 'x'));
    if (axis !== 'x' && axis !== 'y' && axis !== 'z') throw new Error(`axis 只能是 x / y / z，收到：${axis}`);

    // 距离参数一旦溢出 f32，写进去的 position 就是 Infinity：矩阵立刻变 NaN、对象从画面上消失
    for (const field of ['spacing', 'radius'])
    {
        if (params[field] === undefined) continue;
        if (!isFiniteF32(Number(params[field])))
        {
            throw new Error(`${field} 需要有限数字（且不超出 f32 范围），收到：${JSON.stringify(params[field])}`);
        }
    }
    if (params.columns !== undefined)
    {
        const columns = Number(params.columns);
        if (!Number.isInteger(columns) || columns < 1 || columns > 1000)
        {
            throw new Error(`columns 需要 1~1000 的整数，收到：${JSON.stringify(params.columns)}`);
        }
    }

    // 必须用世界包围盒：对象若挂在有位移的父级下，本地 position 并不等于它在场景中的位置
    const infos = rawIds.map((id) =>
    {
        const object = resolveObjectId(String(id));
        const bounds = getLogic(object).boundingBox.worldBounds;

        return {
            objectId: getObjectId(object),
            center: bounds.getCenter() as { x: number, y: number, z: number },
            size: bounds.getSize() as { x: number, y: number, z: number },
            position: object.position,
        };
    });

    // 先算出"每个对象在某轴上要落到哪个坐标"，再统一换算成 position 的写入
    // （换算要减掉"中心与 position 的偏移"：对象挂在有位移的父级下时两者不等）
    const moves: { objectId: string, path: string, value: number }[] = [];
    const pushCenter = (info: typeof infos[number], targetAxis: string, targetCenter: number) =>
    {
        moves.push({
            objectId: info.objectId,
            path: `position.${targetAxis}`,
            value: axisValue(info.position, targetAxis) + (targetCenter - axisValue(info.center, targetAxis)),
        });
    };
    const sumOf = (pick: (info: typeof infos[number]) => number) => infos.reduce((sum, info) => sum + pick(info), 0);

    if (mode === 'align')
    {
        const anchor = sumOf((info) => axisValue(info.center, axis)) / infos.length;
        for (const info of infos) pushCenter(info, axis, anchor);
    }
    else if (mode === 'line')
    {
        const maxSize = Math.max(...infos.map((info) => axisValue(info.size, axis)));
        const spacing = params.spacing === undefined ? (maxSize > 0.001 ? maxSize * 1.2 : 1) : Number(params.spacing);
        const startCenter = axisValue(infos[0].center, axis);
        infos.forEach((info, index) => pushCenter(info, axis, startCenter + (spacing * index)));
    }
    else if (mode === 'grid')
    {
        // 网格排布：在垂直于 axis 的平面上按 columns 列铺开，整体以这批对象的中心为中心
        const [axisA, axisB] = CIRCLE_PLANE[axis];
        const maxA = Math.max(...infos.map((info) => axisValue(info.size, axisA)));
        const maxB = Math.max(...infos.map((info) => axisValue(info.size, axisB)));
        const stepA = params.spacing === undefined ? (maxA > 0.001 ? maxA * 1.2 : 1) : Number(params.spacing);
        const stepB = params.spacing === undefined ? (maxB > 0.001 ? maxB * 1.2 : stepA) : Number(params.spacing);
        const columns = Math.max(1, params.columns === undefined
            ? Math.ceil(Math.sqrt(infos.length))
            : Number(params.columns));
        const rows = Math.ceil(infos.length / columns);

        const centerA = sumOf((info) => axisValue(info.center, axisA)) / infos.length;
        const centerB = sumOf((info) => axisValue(info.center, axisB)) / infos.length;
        const centerAxis = sumOf((info) => axisValue(info.center, axis)) / infos.length;

        infos.forEach((info, index) =>
        {
            const column = index % columns;
            const row = Math.floor(index / columns);
            pushCenter(info, axisA, centerA + ((column - ((columns - 1) / 2)) * stepA));
            pushCenter(info, axisB, centerB + ((row - ((rows - 1) / 2)) * stepB));
            pushCenter(info, axis, centerAxis);
        });
    }
    else
    {
        const [axisA, axisB] = CIRCLE_PLANE[axis];
        // 圆心：默认取这批对象中心的平均值；也可显式指定——「围绕某个对象摆一圈」时用
        // centerObjectId 指向那个中心对象，否则会以被排列对象自己的重心为圆心，不是想要的
        let centerA = sumOf((info) => axisValue(info.center, axisA)) / infos.length;
        let centerB = sumOf((info) => axisValue(info.center, axisB)) / infos.length;
        let centerAxis = sumOf((info) => axisValue(info.center, axis)) / infos.length;

        const explicitCenter = params.centerObjectId !== undefined
            ? getLogic(resolveObjectId(String(params.centerObjectId))).boundingBox.worldBounds.getCenter()
            : params.center;

        if (explicitCenter !== undefined)
        {
            centerA = axisValue(explicitCenter, axisA);
            centerB = axisValue(explicitCenter, axisB);
            centerAxis = axisValue(explicitCenter, axis);
        }

        const maxSize = Math.max(...infos.map((info) => Math.max(axisValue(info.size, axisA), axisValue(info.size, axisB))));
        const radius = params.radius === undefined ? (maxSize > 0.001 ? maxSize * 1.5 : 2) : Number(params.radius);

        infos.forEach((info, index) =>
        {
            const angle = (index / infos.length) * Math.PI * 2;
            pushCenter(info, axisA, centerA + (Math.cos(angle) * radius));
            pushCenter(info, axisB, centerB + (Math.sin(angle) * radius));
            // 法线方向也对齐到圆心：否则各对象高低不一，就组不成一个平面上的圆
            pushCenter(info, axis, centerAxis);
        });
    }

    // 先全部校验（含类型防呆）再统一落笔：要么全动、要么一个都不动
    const outcomes = moves.map((move) => prepareSet(move.objectId, move.path, move.value, true));

    for (const outcome of outcomes) commitSet(outcome);

    pushCommand({
        label: `arrange ${mode} ${axis} x${infos.length}`,
        undo: () => { for (const outcome of outcomes) revertSet(outcome); },
        redo: () => { for (const outcome of outcomes) commitSet(outcome); },
    });

    return {
        mode,
        axis,
        moved: infos.length,
        // line / align 每个对象一个值；circle 是「x 与 z 两个分量」依次排列
        values: outcomes.map((outcome) => Number((outcome.after as number).toFixed(4))),
        objects: infos.map((info) => info.objectId),
        history: { undoCount: undoStack.length, redoCount: redoStack.length },
    };
}
