import { Component3D, Component3DLogic, ComponentLogicState, createComponentLogicBase, Object3D, registerComponentType } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { Body, Particle } from 'cannon-es';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        SPHParticle: SPHParticle;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SPHParticle: SPHParticleLogic;
    }
}

/**
 * SPH 粒子（纯数据接口）：把所在对象的初始位置当作粒子位置，交给 SPH 求解器。
 *
 * 与 Rigidbody 的分工：粒子**不要**再挂 Rigidbody——它的刚体由本组件自己创建
 * （形状是 cannon-es 的 `Particle`），由 PhysicsWorld 在注册时生成、每帧把位置写回对象。
 *
 * 所以一个 SPH 粒子的典型形态是：`MeshRenderer` + `SPHParticle`（没有 Collider、没有 Rigidbody）。
 */
export interface SPHParticle extends Component3D
{
    readonly __type__: 'SPHParticle';

    /** 粒子质量（缺失时 1） */
    readonly mass?: number;

    /** 粒子半径（缺失时 0.1） */
    readonly radius?: number;

    /** 线性阻尼（缺失时 0.9——SPH 粒子靠它稳下来） */
    readonly linearDamping?: number;

    /** 材质名（缺失时不设材质；原版 sph.html 给流体粒子与容器共用同一个材质） */
    readonly materialName?: string;
}

/**
 * SPH 粒子 logic 接口。
 */
export interface SPHParticleLogic extends Component3DLogic
{
    /** 创建粒子刚体（位置由 PhysicsWorld 从所属对象读入；子类无需处理） */
    readonly createBody: (() => Body) | null;

    /** 该粒子声明的材质名（未声明时 undefined） */
    readonly materialName: string | undefined;
}

/**
 * SPH 粒子 logic 的内部状态。
 */
export interface SPHParticleLogicState extends ComponentLogicState
{
    /** 粒子刚体工厂（工厂装配） */
    createBody: (() => Body) | null;
}

/**
 * 工厂函数：SPHParticleLogic 的唯一创建入口。
 *
 * @param data SPH 粒子数据（raw）
 */
export function sphParticleLogic(data: SPHParticle): SPHParticleLogic
{
    // 构造参数字段可选，默认值由工厂补（写在 raw 数据上）
    const writable = data as UnReadonly<SPHParticle>;
    if (writable.mass === undefined) writable.mass = 1;
    if (writable.radius === undefined) writable.radius = 0.1;
    if (writable.linearDamping === undefined) writable.linearDamping = 0.9;

    const { state: componentState, members: componentMembers } = createComponentLogicBase(data);
    const state = componentState as SPHParticleLogicState;

    state.createBody = () => new Body({
        mass: data.mass,
        shape: new Particle(),
        linearDamping: data.linearDamping,
    });

    const logic: SPHParticleLogic = {
        get component() { return componentMembers.component; },
        get entity() { return state.entity as Object3D | null; },
        get createBody() { return state.createBody; },
        get materialName() { return data.materialName; },
        init(object3D) { componentMembers.init(object3D); },
        beforeRender(renderObject) { componentMembers.beforeRender(renderObject); },
        get isLoaded() { return componentMembers.isLoaded; },
        dispose() { componentMembers.dispose(); },
    };

    return logic;
}

registerLogic('SPHParticle', sphParticleLogic);
registerComponentType('SPHParticle', { baseTypes: ['Component3D'] });
