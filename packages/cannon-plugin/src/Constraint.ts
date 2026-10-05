import { Component3D, Component3DLogic, ComponentLogicState, createComponentLogicBase, Object3D, registerComponentType } from 'feng3d';
import type { Body, Constraint as CannonConstraint } from 'cannon-es';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        Constraint: Constraint;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Constraint: ConstraintLogic;
    }
}

/**
 * 约束（纯数据接口，抽象基接口）。
 *
 * 约束**连接两个刚体**，而组件本身只能挂在其中一个对象上，所以另一头用
 * {@link Constraint.targetName} 按**名字**引用——PhysicsWorld 会在同一个物理世界子树里查找它。
 *
 * 约束的创建由 PhysicsWorld 负责（只有它同时知道两端的 Body），
 * 子类只提供"给定两端 body 怎么建这个约束"的工厂（{@link ConstraintLogic.createConstraint}）。
 */
export interface Constraint extends Component3D
{
    readonly __type__: string;

    /** 另一端的 Object3D 名称（在同一个 PhysicsWorld 子树内按名字查找） */
    readonly targetName: string;
}

/**
 * 约束 logic 接口。
 */
export interface ConstraintLogic extends Component3DLogic
{
    /** 另一端的 Object3D 名称 */
    readonly targetName: string;

    /**
     * 用两端的物理刚体创建 cannon-es 约束（由 PhysicsWorld 调用；基座为 null，子类工厂装配）。
     */
    readonly createConstraint: ((bodyA: Body, bodyB: Body) => CannonConstraint) | null;
}

/**
 * 约束 logic 的内部状态（不进公开接口，工厂闭包持有）。
 */
export interface ConstraintLogicState extends ComponentLogicState
{
    /** 约束工厂（子类工厂装配） */
    createConstraint: ((bodyA: Body, bodyB: Body) => CannonConstraint) | null;
}

/**
 * 创建约束系 logic 的基类状态与成员（供子类工厂组合调用）。
 *
 * @param data 约束数据（raw）
 * @returns 约束系 logic 的基类状态与成员
 */
export function createConstraintLogicBase(data: Constraint): { state: ConstraintLogicState; members: ConstraintLogic }
{
    const { state: componentState, members: componentMembers } = createComponentLogicBase(data);
    const state = componentState as ConstraintLogicState;
    state.createConstraint = null;

    const members: ConstraintLogic = {
        /** 关联的组件数据（raw） */
        get component() { return componentMembers.component; },
        /** 所属 Object3D */
        get entity() { return state.entity as Object3D | null; },
        /** 另一端的对象名 */
        get targetName() { return data.targetName; },
        /** 约束工厂（子类装配；基类为 null） */
        get createConstraint() { return state.createConstraint; },
        /** 初始化：注入所属 Object3D */
        init(object3D) { componentMembers.init(object3D); },
        /** 渲染前回调（继承基类） */
        beforeRender(renderObject) { componentMembers.beforeRender(renderObject); },
        /** 是否加载完成（继承基类） */
        get isLoaded() { return componentMembers.isLoaded; },
        /** 释放（继承基类） */
        dispose() { componentMembers.dispose(); },
    };

    return { state, members };
}

// 登记组件类型：Constraint 是 Component3D 的子类型，具体约束再登记为它的子类型。
registerComponentType('Constraint', { baseTypes: ['Component3D'] });
