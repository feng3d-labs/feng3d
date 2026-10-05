import { Object3D, registerComponentType, type Geometrys } from 'feng3d';
import { logic as getLogic, registerLogic } from '@feng3d/reactivity';
import { ConvexPolyhedron, Vec3 } from 'cannon-es';
import { Collider, ColliderLogic, createColliderLogicBase } from './Collider';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        ConvexCollider: ConvexCollider;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ConvexCollider: ConvexColliderLogic;
    }
}

/**
 * 凸包碰撞体（纯数据接口）：用几何体的顶点与三角面构成一个**凸**多面体。
 *
 * 与 Trimesh 的分工：凸体能用在对**动态**刚体上（有体积、有惯性），而且比 Trimesh 快得多；
 * 但它要求形状确实是凸的——凹的几何体只会得到它的凸包，凹进去的部分会被填平。
 *
 * 面直接取几何体的三角形（每 3 个索引一个面），法线由 cannon-es 按顶点绕向算出，
 * 因此要求几何体的三角形绕向是朝外的（渲染用几何体通常满足）。
 */
export interface ConvexCollider extends Collider
{
    readonly __type__: 'ConvexCollider';

    /** 用于生成凸包的几何数据（取其 a_position 顶点与 vertexIndices 三角面） */
    readonly geometry: Geometrys;
}

/**
 * 凸包碰撞体 logic 接口。
 */
export interface ConvexColliderLogic extends ColliderLogic
{
}

/**
 * 工厂函数：ConvexColliderLogic 的唯一创建入口。
 *
 * @param data 凸包碰撞体数据（raw）
 */
export function convexColliderLogic(data: ConvexCollider): ConvexColliderLogic
{
    const { state, members } = createColliderLogicBase(data);
    state.shapeFactory = () =>
    {
        const geometryLogic = getLogic(data.geometry);
        if (geometryLogic === null) throw new Error('该 geometry 不是已注册的几何类型，无法生成凸包');

        const position = geometryLogic.vertices.a_position;
        if (position === undefined || position.data.length === 0)
        {
            throw new Error('该 geometry 没有 a_position 顶点数据，无法生成凸包');
        }

        const vertices: Vec3[] = [];
        for (let i = 0; i + 2 < position.data.length; i += 3)
        {
            vertices.push(new Vec3(position.data[i], position.data[i + 1], position.data[i + 2]));
        }

        // 每 3 个索引构成一个三角形面
        const indices = geometryLogic.vertexIndices;
        const faces: number[][] = [];
        for (let i = 0; i + 2 < indices.length; i += 3) faces.push([indices[i], indices[i + 1], indices[i + 2]]);

        return new ConvexPolyhedron({ vertices, faces });
    };

    const logic: ConvexColliderLogic = {
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

registerLogic('ConvexCollider', convexColliderLogic);
registerComponentType('ConvexCollider', { baseTypes: ['Collider'] });
