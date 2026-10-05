import { Object3D, registerComponentType } from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
// 别名导入：理由同 SphereCollider（cannon-es 的 Plane 与 math 的纯数据类 Plane 同名）。
import { Plane as CannonPlane } from 'cannon-es';
import { Collider, ColliderLogic, createColliderLogicBase } from './Collider';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        PlaneCollider: PlaneCollider;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        PlaneCollider: PlaneColliderLogic;
    }
}

/**
 * 平面碰撞体（纯数据接口）。
 *
 * 无限大平面（cannon-es 的 Plane 为静态半空间），常用于地面。
 */
export interface PlaneCollider extends Collider
{
    readonly __type__: 'PlaneCollider';
}

/**
 * 平面碰撞体 logic 接口。
 */
export interface PlaneColliderLogic extends ColliderLogic
{
}

/**
 * 工厂函数：PlaneColliderLogic 的唯一创建入口。
 *
 * @param data 平面碰撞体数据（raw）
 */
export function planeColliderLogic(data: PlaneCollider): PlaneColliderLogic
{
    const { state, members } = createColliderLogicBase(data);
    state.shapeFactory = () => new CannonPlane();

    const logic: PlaneColliderLogic = {
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

registerLogic('PlaneCollider', planeColliderLogic);
registerComponentType('PlaneCollider', { baseTypes: ['Collider'] });
