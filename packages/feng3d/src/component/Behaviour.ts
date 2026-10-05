import { RunEnvironment } from '../core/RunEnvironment';
import type { Component3D, Components } from './Component';
import { createComponentLogicBase, type Component3DLogic, type ComponentLogicState } from './Component';
import type { Object3D } from '../core/Object3D';
import { registerLogic, logic as getLogic, computed, reactive, type Computed } from '@feng3d/reactivity';

/**
 * 行为（纯数据接口）。
 *
 * 可以控制开关的组件。每帧由 sceneLogic 调用 logic(behaviour).update。
 */
export interface Behaviour extends Component3D
{
    /** 组件类型名（由具体子接口收窄为字面量类型） */
    readonly __type__: string;
    /** 是否启用 update 方法（缺失时由 registerLogic 自动填充） */
    readonly enabled?: boolean;
    /** 可运行环境（缺失时由 registerLogic 自动填充） */
    readonly runEnvironment?: RunEnvironment;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Behaviour: BehaviourLogic;
    }
}

/**
 * Behaviour 逻辑接口（issue #674 工厂函数范式）。
 *
 * Behaviour 是可开关的组件基类。其 logic 提供：
 * - isVisibleAndEnabled: Computed<boolean>（enabled && object3D.activeSelf）
 * - update: 空默认实现（子类覆盖）
 * - dispose: 写入 enabled=false（触发依赖 enabled 的子 logic 清理）
 *
 * 子类 logic（Animation/FPSController 等）经 {@link createBehaviourLogicBase}
 * 组合函数获取实例后叠加自身行为。
 */
export interface BehaviourLogic extends Component3DLogic
{
    /** 是否可见且启用 */
    readonly isVisibleAndEnabled: Computed<boolean>;

    /** 初始化：注入所属 Object3D（幂等） */
    init(object3D?: Object3D): void;

    /** 每帧更新（空默认实现，子类覆盖） */
    update(interval: number): void;
}

/**
 * Behaviour 系 Logic 的内部状态（不进公开接口，工厂闭包持有）。
 */
export interface BehaviourLogicState extends ComponentLogicState
{
    /** 关联的行为数据（raw） */
    data: Behaviour;

    /** 是否可见且启用（enabled && object3D.activeSelf） */
    isVisibleAndEnabled: Computed<boolean>;

    /** 是否已 init（幂等保护） */
    inited: boolean;
}

/**
 * 创建 Behaviour 系 Logic 的**基类状态与成员**（供子类工厂组合调用）。
 *
 * 形态：工厂闭包直接返回对象字面量（无共享 proto、无 this）。子类工厂的用法：
 * ```ts
 * const { state, members } = createBehaviourLogicBase(data);
 * const logic: XxxLogic = {
 *     get component() { return members.component; },
 *     get entity() { return members.entity; },
 *     get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
 *     init(object3D) { members.init(object3D); },
 *     // ...自身成员
 * };
 * ```
 *
 * @param data 行为数据（raw）
 * @returns Behaviour 系 Logic 的基类状态与成员（同一份 state 与 Component 基座共享）
 */
export function createBehaviourLogicBase(data: Behaviour): { state: BehaviourLogicState; members: BehaviourLogic }
{
    // Behaviour 是抽象基接口，不在 Components 联合里；strictNullChecks 下需显式断言
    const { state: componentState, members: componentMembers } = createComponentLogicBase(data as Components);

    // 与 Component 基座复用同一份 state（entity / component 是同一组字段）
    const state = componentState as BehaviourLogicState;
    state.data = data;
    state.inited = false;

    const r_behaviour = reactive(data);
    state.isVisibleAndEnabled = computed<boolean>(() =>
    {
        if (!state.entity) return false;

        const enabled = r_behaviour.enabled ?? true;

        return enabled !== false && getLogic(state.entity as Object3D).activeSelf;
    });

    const members: BehaviourLogic = {
        /** 关联的组件数据（raw） */
        get component() { return componentMembers.component; },
        /** 所属 Object3D（覆写基类 getter，把 entity 收窄为 Object3D） */
        get entity() { return state.entity as Object3D | null; },
        /** 是否可见且启用 */
        get isVisibleAndEnabled() { return state.isVisibleAndEnabled; },
        /** 初始化：注入所属 Object3D（幂等） */
        init(object3D)
        {
            if (state.inited) return;
            state.inited = true;
            if (object3D) state.entity = object3D;
        },
        /** 渲染前回调（默认空） */
        beforeRender(_renderObject) { /* 默认空 */ },
        /** 每帧更新（默认空，子类覆盖） */
        update(_interval) { /* 默认空，子类覆盖 */ },
        /** 是否加载完成（继承 Component 基类） */
        get isLoaded() { return componentMembers.isLoaded; },
        /** 释放：写入 enabled=false（触发依赖 enabled 的子 logic 清理） */
        dispose()
        {
            reactive(state.data).enabled = false;
            state.entity = null;
        },
    };

    return { state, members };
}

/**
 * 工厂函数：BehaviourLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 行为数据（raw）
 */
export function behaviourLogic(data: Behaviour): BehaviourLogic
{
    const { members } = createBehaviourLogicBase(data);

    const logic: BehaviourLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        init(object3D) { members.init(object3D); },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        update(interval) { members.update(interval); },
        get isLoaded() { return members.isLoaded; },
        dispose() { members.dispose(); },
    };

    return logic;
}

// 注册到 logic 分发表（Behaviour 自身也可作为组件使用）
registerLogic('Behaviour', behaviourLogic);
