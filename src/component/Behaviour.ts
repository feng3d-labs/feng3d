import { RunEnvironment } from '../core/RunEnvironment';
import { Component, ComponentLogic } from './Component';
import { registerDefaults, registerLogic, computed, Computed, reactive, toRaw } from '@feng3d/reactivity';

// 触发 behaviourLogic 注册到 logic 分发表
import './Behaviour';

/**
 * 行为（纯数据接口）。
 *
 * 可以控制开关的组件。每帧由 sceneLogic 调用 logic(behaviour).update。
 */
export interface Behaviour extends Component
{
    /** 是否启用 update 方法（缺失时由 registerDefaults 自动填充） */
    readonly enabled?: boolean;
    /** 可运行环境（缺失时由 registerDefaults 自动填充） */
    readonly runEnvironment?: RunEnvironment;
}

/**
 * Behaviour 默认值模板。
 */
const behaviourDefaults = {
    __type__: 'Behaviour',
    enabled: true,
    runEnvironment: RunEnvironment.all,
};

registerDefaults('Behaviour', behaviourDefaults);

/**
 * 创建 Behaviour 实例。
 */
export function createBehaviour(): Behaviour
{
    return { ...behaviourDefaults };
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
export class BehaviourLogic extends ComponentLogic
{
    /** init 去重标志（同一 component 只初始化一次） */
    private _inited = false;

    /** 是否可见且启用（enabled && object3D.activeSelf） */
    readonly _isVisibleAndEnabled: Computed<boolean>;

    constructor(behaviour: Behaviour)
    {
        super(behaviour);

        const self = this;
        this._isVisibleAndEnabled = computed<boolean>(() =>
        {
            const enabled = reactive(self.component as Behaviour).enabled;
            // object3D 可能在 init 前为 null
            if (!self.object3D) return false;

            return enabled && reactive(self.object3D).activeSelf;
        });
    }

    /** 是否可见且启用 */
    get isVisibleAndEnabled(): Computed<boolean>
    {
        return this._isVisibleAndEnabled;
    }

    /**
     * 初始化：调用 super.init 注入 object3D（去重，同一 component 只初始化一次）。
     * 子类 logic 在组合时追加自身 init。
     */
    init(object3D?: import('../core/Object3D').Object3D): void
    {
        if (this._inited) return;
        this._inited = true;
        super.init(object3D);
    }

    /** 每帧更新（默认空，子类覆盖） */
    update(_interval: number): void { /* 默认空，子类覆盖 */ }

    /**
     * 释放：写入 enabled=false，触发依赖 enabled 的子 logic（如音频 gain 断开）清理。
     */
    dispose(): void
    {
        reactive(this.component as Behaviour).enabled = false;
        this.object3D = null;
    }
}

const behaviourLogicMap = new WeakMap<Behaviour, BehaviourLogic>();

/**
 * 获取 Behaviour 的 logic。
 *
 * 子类 logic 可调用本函数拿到基类 logic 后叠加自身行为。
 */
export function behaviourLogic(behaviour: Behaviour): BehaviourLogic
{
    // 用 toRaw 统一 key：getComponentsInChildren 可能返回响应式代理，与 initComponent
    // 使用的原始对象是不同 WeakMap key，会导致拿到未初始化的 logic（object3D 为 null）。
    const raw = toRaw(behaviour);
    let logic = behaviourLogicMap.get(raw);
    if (logic) return logic;

    logic = new BehaviourLogic(raw);
    behaviourLogicMap.set(raw, logic);

    return logic;
}

// 注册到 componentLogic 分发表（Behaviour 自身也可作为组件使用）
registerLogic('Behaviour', (component) =>
{
    return new BehaviourLogic(component as Behaviour);
});
