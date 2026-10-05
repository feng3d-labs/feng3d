import { RunEnvironment } from '../core/RunEnvironment';
import type { Component3D, Components } from './Component';
import { componentLogicProto, setupComponentLogicState, type Component3DLogic, type ComponentLogicState } from './Component';
import type { Object3D } from '../core/Object3D';
import { registerLogic, logic as getLogic, computed, reactive, createLogicProto, type Computed } from '@feng3d/reactivity';

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
 * 子类 logic（Animation/FPSController 等）经 {@link behaviourLogic} 组合函数
 * 获取实例后叠加自身行为。
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

/** BehaviourLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
export interface BehaviourLogicState extends ComponentLogicState
{
    /** 关联的行为数据（raw） */
    _data: Behaviour;

    /** 是否可见且启用（enabled && object3D.activeSelf） */
    _isVisibleAndEnabled: Computed<boolean>;

    /** 所属 Object3D（由 init 注入；覆写基类状态的 Entity 类型） */
    _entity: Object3D | null;

    /** 是否已 init（幂等保护） */
    _inited: boolean;
}

/**
 * BehaviourLogic 的共享原型：继承 Component 基类实现，覆写 entity / init / beforeRender /
 * update / dispose。
 */
export const behaviourLogicProto = createLogicProto<BehaviourLogic>(componentLogicProto, {
    /** 所属 Object3D（覆写基类 getter，把 entity 收窄为 Object3D） */
    entity: {
        get: function (this: BehaviourLogic & BehaviourLogicState): Object3D | null { return this._entity; },
    },
    /** 是否可见且启用 */
    isVisibleAndEnabled: {
        get: function (this: BehaviourLogic & BehaviourLogicState): Computed<boolean> { return this._isVisibleAndEnabled; },
    },
    /** 初始化：注入所属 Object3D（幂等） */
    init: {
        value: function (this: BehaviourLogic & BehaviourLogicState, object3D?: Object3D): void
        {
            if (this._inited) return;
            this._inited = true;
            if (object3D) this._entity = object3D;
        },
    },
    beforeRender: {
        value: function (this: BehaviourLogic & BehaviourLogicState, _renderObject: never): void { /* 默认空 */ },
    },
    update: {
        value: function (this: BehaviourLogic & BehaviourLogicState, _interval: number): void { /* 默认空，子类覆盖 */ },
    },
    dispose: {
        value: function (this: BehaviourLogic & BehaviourLogicState): void
        {
            reactive(this._data).enabled = false;
            this._entity = null;
        },
    },
});

/**
 * 装配 Behaviour 系 Logic 的**基类状态**（供子类工厂组合调用）。
 *
 * 工厂版本（issue #674）下子类工厂不再 `extends`，而是「接口继承 + 组合调用基类工厂」：
 * 子类先 `Object.create(xxxLogicProto)`，再用本函数装配基类状态，最后装配自身状态。
 *
 * @param logic 已 `Object.create` 出、原型已是目标 proto 的实例
 * @param data 行为数据（raw）
 * @returns 同一实例（便于链式装配）
 */
export function setupBehaviourLogicState<T extends BehaviourLogic & BehaviourLogicState>(logic: T, data: Behaviour): T
{
    // Behaviour 是抽象基接口，不在 Components 联合里；strictNullChecks 下需显式断言
    setupComponentLogicState(logic, data as Components);
    logic._data = data;
    logic._inited = false;

    const r_behaviour = reactive(data);
    logic._isVisibleAndEnabled = computed<boolean>(() =>
    {
        if (!logic._entity) return false;

        const enabled = r_behaviour.enabled ?? true;

        return enabled !== false && getLogic(logic._entity).activeSelf;
    });

    return logic;
}

/**
 * 工厂函数：BehaviourLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 行为数据（raw）
 */
export function behaviourLogic(data: Behaviour): BehaviourLogic
{
    return setupBehaviourLogicState(Object.create(behaviourLogicProto) as BehaviourLogic & BehaviourLogicState, data);
}

// 注册到 logic 分发表（Behaviour 自身也可作为组件使用）
registerLogic('Behaviour', behaviourLogic);
