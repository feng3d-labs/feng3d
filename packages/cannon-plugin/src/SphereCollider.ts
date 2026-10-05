import { Object3D, registerComponentType } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
// 别名导入：cannon-es 的 Sphere 与 @feng3d/math 的纯数据类 Sphere 同名，
// 而 check-imperative-construction.mjs 的判据只看名字、不看导入来源（已知局限），
// 直接写 new Sphere() 会被判为「对纯数据类的 new」。
import { Sphere as CannonSphere } from 'cannon-es';
import { Collider, ColliderLogic, createColliderLogicBase } from './Collider';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        SphereCollider: SphereCollider;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SphereCollider: SphereColliderLogic;
    }
}

/**
 * 球形碰撞体（纯数据接口）。
 */
export interface SphereCollider extends Collider
{
    readonly __type__: 'SphereCollider';

    /** 半径（缺失时默认 0.5） */
    readonly radius?: number;
}

/**
 * 球形碰撞体 logic 接口。
 */
export interface SphereColliderLogic extends ColliderLogic
{
}

/**
 * 工厂函数：SphereColliderLogic 的唯一创建入口。
 *
 * @param data 球形碰撞体数据（raw）
 */
export function sphereColliderLogic(data: SphereCollider): SphereColliderLogic
{
    const writable = data as UnReadonly<SphereCollider>;
    if (writable.radius === undefined) writable.radius = 0.5;

    const { state, members } = createColliderLogicBase(data);
    state.shapeFactory = () => new CannonSphere(data.radius ?? 0.5);

    const logic: SphereColliderLogic = {
        get component() { return members.component; },
        get entity() { return state.entity as Object3D | null; },
        get shape() { return members.shape; },
        init(object3D) { members.init(object3D); },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        get isLoaded() { return members.isLoaded; },
        dispose() { members.dispose(); },
    };

    return logic;
}

registerLogic('SphereCollider', sphereColliderLogic);
registerComponentType('SphereCollider', { baseTypes: ['Collider'] });
