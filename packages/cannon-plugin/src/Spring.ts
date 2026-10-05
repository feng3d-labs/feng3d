import { Component3D, Component3DLogic, ComponentLogicState, createComponentLogicBase, Object3D, registerComponentType } from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
import type { Vector3Like } from '@feng3d/math';
import { Spring as CannonSpring, Vec3, type Body } from 'cannon-es';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        Spring: Spring;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Spring: SpringLogic;
    }
}

/**
 * 弹簧（纯数据接口）：在两个刚体之间产生一对与「长度偏离静止长度」成正比的拉力/推力。
 *
 * **它不是一个 Constraint**——cannon-es 的 `Spring` 不参与约束求解，而是每帧自己算一次力、
 * 必须在 `world.step()` **之前**调用 `applyForce()` 才生效。所以 PhysicsWorld 里为它专门留了
 * 一个「步进前钩子」（见那边的注释）。
 *
 * 与约束一样，另一头用 {@link Spring.targetName} 按名字引用。
 */
export interface Spring extends Component3D
{
    readonly __type__: 'Spring';

    /** 另一端的 Object3D 名称（在同一个 PhysicsWorld 子树内按名字查找） */
    readonly targetName: string;

    /** 静止长度（缺失时取两端当前距离） */
    readonly restLength?: number;

    /** 劲度系数（越大越硬） */
    readonly stiffness?: number;

    /** 阻尼（越大越快停下） */
    readonly damping?: number;

    /** A 端锚点（相对刚体 A 质心的局部坐标） */
    readonly localAnchorA?: Vector3Like;

    /** B 端锚点（相对刚体 B 质心的局部坐标） */
    readonly localAnchorB?: Vector3Like;
}

/**
 * 弹簧 logic 接口。
 */
export interface SpringLogic extends Component3DLogic
{
    /** 另一端的 Object3D 名称 */
    readonly targetName: string;

    /** 用两端刚体创建 cannon-es 弹簧（由 PhysicsWorld 调用；基座为 null，工厂装配） */
    readonly createSpring: ((bodyA: Body, bodyB: Body) => CannonSpring) | null;
}

/**
 * 弹簧 logic 的内部状态（不进公开接口，工厂闭包持有）。
 */
export interface SpringLogicState extends ComponentLogicState
{
    /** 弹簧工厂（工厂装配） */
    createSpring: ((bodyA: Body, bodyB: Body) => CannonSpring) | null;
}

/**
 * 工厂函数：SpringLogic 的唯一创建入口。
 *
 * @param data 弹簧数据（raw）
 */
export function springLogic(data: Spring): SpringLogic
{
    const { state: componentState, members: componentMembers } = createComponentLogicBase(data);
    const state = componentState as SpringLogicState;

    const toVec3 = (v: Vector3Like | undefined) => (v === undefined ? undefined : new Vec3(v.x, v.y, v.z));
    state.createSpring = (bodyA, bodyB) => new CannonSpring(bodyA, bodyB, {
        restLength: data.restLength,
        stiffness: data.stiffness,
        damping: data.damping,
        localAnchorA: toVec3(data.localAnchorA),
        localAnchorB: toVec3(data.localAnchorB),
    });

    const logic: SpringLogic = {
        get component() { return componentMembers.component; },
        get entity() { return state.entity as Object3D | null; },
        get targetName() { return data.targetName; },
        get createSpring() { return state.createSpring; },
        init(object3D) { componentMembers.init(object3D); },
        beforeRender(renderObject) { componentMembers.beforeRender(renderObject); },
        get isLoaded() { return componentMembers.isLoaded; },
        dispose() { componentMembers.dispose(); },
    };

    return logic;
}

registerLogic('Spring', springLogic);
registerComponentType('Spring', { baseTypes: ['Component3D'] });
