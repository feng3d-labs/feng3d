import { Object3D, registerComponentType } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { Heightfield } from 'cannon-es';
import { Collider, ColliderLogic, createColliderLogicBase } from './Collider';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        HeightfieldCollider: HeightfieldCollider;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        HeightfieldCollider: HeightfieldColliderLogic;
    }
}

/**
 * 高度场碰撞体（纯数据接口）：一片由二维高度矩阵描述的起伏地形。
 *
 * 适合坡地、丘陵这种"每格一个高度"的地面——数据量比三角网格小得多，
 * 而且 cannon-es 会按需只生成用得到的柱子（pillar），比 Trimesh 省。
 *
 * 高度矩阵按 `heights[x][y]` 给出，格子边长由 elementSize 控制（缺失时 1）。
 */
export interface HeightfieldCollider extends Collider
{
    readonly __type__: 'HeightfieldCollider';

    /** 高度矩阵（heights[x][y]） */
    readonly heights: readonly (readonly number[])[];

    /** 每个格子的边长（缺失时 1） */
    readonly elementSize?: number;
}

/**
 * 高度场碰撞体 logic 接口。
 */
export interface HeightfieldColliderLogic extends ColliderLogic
{
}

/**
 * 工厂函数：HeightfieldColliderLogic 的唯一创建入口。
 *
 * @param data 高度场碰撞体数据（raw）
 */
export function heightfieldColliderLogic(data: HeightfieldCollider): HeightfieldColliderLogic
{
    const writable = data as UnReadonly<HeightfieldCollider>;
    if (writable.elementSize === undefined) writable.elementSize = 1;

    const { state, members } = createColliderLogicBase(data);
    state.shapeFactory = () =>
    {
        // cannon-es 会原地改动 data，所以复制一份，不把响应式数据交给它
        const heights = data.heights.map((row) => row.slice());

        return new Heightfield(heights, { elementSize: data.elementSize });
    };

    const logic: HeightfieldColliderLogic = {
        get component() { return members.component; },
        get entity() { return state.entity as Object3D | null; },
        get shape() { return members.shape; },
        get offset() { return members.offset; },
        init(object3D) { members.init(object3D); },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        get isLoaded() { return members.isLoaded; },
        dispose() { members.dispose(); },
    };

    return logic;
}

registerLogic('HeightfieldCollider', heightfieldColliderLogic);
registerComponentType('HeightfieldCollider', { baseTypes: ['Collider'] });
