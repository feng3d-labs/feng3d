import { Component3D, Component3DLogic, ComponentLogicState, createComponentLogicBase, Object3D, registerComponentType } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
// 别名导入：避免与其它同名概念混淆。
import { SPHSystem as CannonSPHSystem } from 'cannon-es';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        SPHSystem: SPHSystem;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SPHSystem: SPHSystemLogic;
    }
}

/**
 * 光滑粒子流体（纯数据接口）：给物理世界加一套 SPH 求解器。
 *
 * 粒子本身是 {@link SPHParticle} 组件（每个粒子一个带 MeshRenderer 的对象），
 * SPHSystem 只描述**求解参数**——同一时刻只用子树里的第一个。
 *
 * 接入方式：cannon-es 0.20 的 `World` 没有 `addSystem`，但 `step()` 会遍历
 * `world.subsystems` 逐个 `update()`，所以 PhysicsWorld 直接把求解器推进那个数组。
 */
export interface SPHSystem extends Component3D
{
    readonly __type__: 'SPHSystem';

    /** 密度（缺失时 1） */
    readonly density?: number;

    /** 光滑半径（缺失时 1） */
    readonly smoothingRadius?: number;

    /** 声速（越大越"硬"，缺失时 10） */
    readonly speedOfSound?: number;

    /** 粘性（缺失时 0.01） */
    readonly viscosity?: number;
}

/**
 * 光滑粒子流体 logic 接口。
 */
export interface SPHSystemLogic extends Component3DLogic
{
    /** 创建 cannon-es 求解器（由 PhysicsWorld 调用；基座为 null，工厂装配） */
    readonly createSystem: (() => CannonSPHSystem) | null;
}

/**
 * 光滑粒子流体 logic 的内部状态。
 */
export interface SPHSystemLogicState extends ComponentLogicState
{
    /** 求解器工厂（工厂装配） */
    createSystem: (() => CannonSPHSystem) | null;
}

/**
 * 工厂函数：SPHSystemLogic 的唯一创建入口。
 *
 * @param data 光滑粒子流体数据（raw）
 */
export function sphSystemLogic(data: SPHSystem): SPHSystemLogic
{
    // 构造参数字段可选，默认值由工厂补（写在 raw 数据上）
    const writable = data as UnReadonly<SPHSystem>;
    if (writable.density === undefined) writable.density = 1;
    if (writable.smoothingRadius === undefined) writable.smoothingRadius = 1;
    if (writable.speedOfSound === undefined) writable.speedOfSound = 10;
    if (writable.viscosity === undefined) writable.viscosity = 0.01;

    const { state: componentState, members: componentMembers } = createComponentLogicBase(data);
    const state = componentState as SPHSystemLogicState;

    state.createSystem = () =>
    {
        const system = new CannonSPHSystem();
        system.density = data.density ?? 1;
        system.smoothingRadius = data.smoothingRadius ?? 1;
        system.speedOfSound = data.speedOfSound ?? 10;
        system.viscosity = data.viscosity ?? 0.01;

        return system;
    };

    const logic: SPHSystemLogic = {
        get component() { return componentMembers.component; },
        get entity() { return state.entity as Object3D | null; },
        get createSystem() { return state.createSystem; },
        init(object3D) { componentMembers.init(object3D); },
        beforeRender(renderObject) { componentMembers.beforeRender(renderObject); },
        get isLoaded() { return componentMembers.isLoaded; },
        dispose() { componentMembers.dispose(); },
    };

    return logic;
}

registerLogic('SPHSystem', sphSystemLogic);
registerComponentType('SPHSystem', { baseTypes: ['Component3D'] });
