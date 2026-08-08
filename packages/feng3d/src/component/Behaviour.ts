import { RunEnvironment } from '../core/RunEnvironment';
import type { Component3D } from './Component';
import type { Component3DLogic } from './Component';
import type { Object3D } from '../core/Object3D';
import { registerLogic, logic, computed, Computed, reactive, UnReadonly } from '@feng3d/reactivity';

// 触发 behaviourLogic 注册到 logic 分发表

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
 * Behaviour 逻辑处理类。
 *
 * Behaviour 是可开关的组件基类。其 logic 提供：
 * - isVisibleAndEnabled: computed<boolean>（enabled && object3D.activeSelf）
 * - update: 空默认实现（子类 logic 覆盖）
 * - dispose: 写入 enabled=false（触发依赖 enabled 的子 logic 清理）
 *
 * 子类 logic（如 animationLogic）应组合本 logic 后再叠加自身行为。
 */
export interface BehaviourLogic extends Component3DLogic
{
    /** 是否可见且启用 */
    get isVisibleAndEnabled(): Computed<boolean>;
    /** 每帧更新 */
    update(interval: number): void;
}

/**
 * 创建 BehaviourLogic 实例（工厂函数，组合 componentLogic 基础行为）。
 *
 * 子类工厂通过 `const base = behaviourLogic(data)` 组合复用全部 Behaviour 行为。
 */
export function behaviourLogic(behaviour: Behaviour): BehaviourLogic
{
    // 默认值（缺失字段单独赋值；所有 Behaviour 子类共享）
    const writable = behaviour as UnReadonly<Behaviour>;
    if (behaviour.enabled === undefined) writable.enabled = true;
    if (behaviour.runEnvironment === undefined) writable.runEnvironment = RunEnvironment.all;

    let _entity: Object3D | null = null;
    let _inited = false;

    const _isVisibleAndEnabled = computed<boolean>(() =>
    {
        const enabled = reactive(behaviour).enabled;
        if (!_entity) return false;

        return enabled !== false && logic(_entity).activeSelf;
    });

    const base = {
        get component() { return behaviour; },
        get entity() { return _entity; },
        init(object3D?: Object3D)
        {
            if (_inited) return;
            _inited = true;
            if (object3D) _entity = object3D;
        },
        beforeRender() { },
        dispose()
        {
            reactive(behaviour).enabled = false;
            _entity = null;
        },
        get isVisibleAndEnabled() { return _isVisibleAndEnabled; },
        update(_interval: number) { /* 默认空，子类覆盖 */ },
    };

    return base as unknown as BehaviourLogic;
}
// 注册到 componentLogic 分发表（Behaviour 自身也可作为组件使用）
registerLogic('Behaviour', behaviourLogic);
