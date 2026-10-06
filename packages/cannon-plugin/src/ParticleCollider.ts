import { Object3D, registerComponentType } from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
// 别名导入：避免与其它同名概念混淆（也是 R3 判据的已知同名误报来源）。
import { Particle as CannonParticle } from 'cannon-es';
import { Collider, ColliderLogic, createColliderLogicBase } from './Collider';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        ParticleCollider: ParticleCollider;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ParticleCollider: ParticleColliderLogic;
    }
}

/**
 * 粒子形状碰撞体（纯数据接口）。
 *
 * 对应 cannon-es 的 `Particle`：一个**没有体积**的点状形状，只参与碰撞检测、不产生接触响应。
 * 原版 `shapes.html` 用它演示"各种形状"里最简单的一种；SPH 流体也基于它
 * （那是 {@link SPHParticle} 的事，走的是另一条路）。
 */
export interface ParticleCollider extends Collider
{
    readonly __type__: 'ParticleCollider';
}

/**
 * 粒子形状碰撞体 logic 接口。
 */
export interface ParticleColliderLogic extends ColliderLogic
{
}

/**
 * 工厂函数：ParticleColliderLogic 的唯一创建入口。
 *
 * @param data 粒子形状碰撞体数据（raw）
 */
export function particleColliderLogic(data: ParticleCollider): ParticleColliderLogic
{
    const { state, members } = createColliderLogicBase(data);
    state.shapeFactory = () => new CannonParticle();

    const logic: ParticleColliderLogic = {
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

registerLogic('ParticleCollider', particleColliderLogic);
registerComponentType('ParticleCollider', { baseTypes: ['Collider'] });
