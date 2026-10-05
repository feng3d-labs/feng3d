import { Component3D, Component3DLogic, ComponentLogicState, createComponentLogicBase, Object3D, registerComponentType } from 'feng3d';
import type { Shape } from 'cannon-es';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        Collider: Collider;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Collider: ColliderLogic;
    }
}

/**
 * 碰撞体（纯数据接口，抽象基接口）。
 *
 * 与 Rigidbody 挂在同一个 Object3D 上，由 Rigidbody 的 logic 在初始化时收集物理形状。
 * 具体形状由子接口（BoxCollider / SphereCollider 等）声明，形状的创建在各自的 logic 工厂里惰性完成。
 */
export interface Collider extends Component3D
{
    readonly __type__: string;
}

/**
 * 碰撞体 logic 接口。
 */
export interface ColliderLogic extends Component3DLogic
{
    /** 物理形状（惰性创建；由子类工厂装配 shapeFactory 提供） */
    readonly shape: Shape | null;
}

/**
 * 碰撞体 logic 的内部状态（不进公开接口，工厂闭包持有）。
 */
export interface ColliderLogicState extends ComponentLogicState
{
    /**
     * 形状工厂（子类工厂装配）。
     *
     * 惰性调用：形状可能只该在真正需要时创建（避免构造纯数据阶段就产生物理对象）。
     */
    shapeFactory: (() => Shape) | null;
}

/**
 * 创建碰撞体系 logic 的基类状态与成员（供子类工厂组合调用）。
 *
 * 形态：工厂闭包直接返回对象字面量（无共享 proto、无 this）。子类工厂的用法：
 * 先 createColliderLogicBase(data)，再往 state.shapeFactory 写入形状工厂，
 * 最后按子接口逐项委托 members。
 *
 * @param data 碰撞体数据（raw）
 * @returns 碰撞体系 logic 的基类状态与成员
 */
export function createColliderLogicBase(data: Collider): { state: ColliderLogicState; members: ColliderLogic }
{
    const { state: componentState, members: componentMembers } = createComponentLogicBase(data);
    const state = componentState as ColliderLogicState;
    state.shapeFactory = null;

    let shape: Shape | null = null;

    const members: ColliderLogic = {
        /** 关联的组件数据（raw） */
        get component() { return componentMembers.component; },
        /** 所属 Object3D */
        get entity() { return state.entity as Object3D | null; },
        /** 物理形状（首次访问时经 shapeFactory 创建，之后复用） */
        get shape()
        {
            if (shape === null && state.shapeFactory !== null) shape = state.shapeFactory();

            return shape;
        },
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

// 登记组件类型：Collider 是 Component3D 的子类型，具体碰撞体再登记为它的子类型。
registerComponentType('Collider', { baseTypes: ['Component3D'] });
