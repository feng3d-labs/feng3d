import { Object3D, registerComponentType, type Geometrys } from 'feng3d';
import { logic as getLogic, registerLogic } from '@feng3d/reactivity';
import { Trimesh } from 'cannon-es';
import { Collider, ColliderLogic, createColliderLogicBase } from './Collider';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        TrimeshCollider: TrimeshCollider;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        TrimeshCollider: TrimeshColliderLogic;
    }
}

/**
 * 三角网格碰撞体（纯数据接口）：把任意几何体的三角形直接拿来当静态碰撞形状。
 *
 * 这是唯一能表达**非凸**静态形状的碰撞体——碗、坡道、凹形地形都得靠它。
 * 它**只能用于静态刚体**（cannon-es 的 Trimesh 没有体积、不能做动态物体的惯性）。
 *
 * 顶点与索引取自 `geometry` 的 a_position 属性与 vertexIndices，
 * 所以"渲染用的几何体"与"碰撞用的网格"是同一份数据，不会对不上。
 */
export interface TrimeshCollider extends Collider
{
    readonly __type__: 'TrimeshCollider';

    /** 用于生成三角网格的几何数据（取其 a_position 顶点与 vertexIndices 索引） */
    readonly geometry: Geometrys;
}

/**
 * 三角网格碰撞体 logic 接口。
 */
export interface TrimeshColliderLogic extends ColliderLogic
{
}

/**
 * 从几何体取出「扁平顶点数组 + 索引数组」。
 *
 * @param geometry 几何数据
 * @returns 顶点（每 3 个数一个点）与索引
 */
function extractGeometry(geometry: Geometrys): { vertices: number[]; indices: number[] }
{
    const geometryLogic = getLogic(geometry);
    if (geometryLogic === null) throw new Error('该 geometry 不是已注册的几何类型，无法生成碰撞网格');

    const position = geometryLogic.vertices.a_position;
    if (position === undefined || position.data.length === 0)
    {
        throw new Error('该 geometry 没有 a_position 顶点数据，无法生成碰撞网格');
    }

    return { vertices: Array.from(position.data), indices: geometryLogic.vertexIndices.slice() };
}

/**
 * 工厂函数：TrimeshColliderLogic 的唯一创建入口。
 *
 * @param data 三角网格碰撞体数据（raw）
 */
export function trimeshColliderLogic(data: TrimeshCollider): TrimeshColliderLogic
{
    const { state, members } = createColliderLogicBase(data);
    state.shapeFactory = () =>
    {
        const { vertices, indices } = extractGeometry(data.geometry);

        return new Trimesh(vertices, indices);
    };

    const logic: TrimeshColliderLogic = {
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

registerLogic('TrimeshCollider', trimeshColliderLogic);
registerComponentType('TrimeshCollider', { baseTypes: ['Collider'] });
