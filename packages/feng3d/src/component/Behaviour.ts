import { RunEnvironment } from '../core/RunEnvironment';
import type { Component3D } from './Component';
import { ComponentLogicBase } from './Component';
import type { Object3D } from '../core/Object3D';
import { registerLogic, logic, computed, Computed, reactive } from '@feng3d/reactivity';

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
 * Behaviour 逻辑类（AGENTS 第 3 章 class 模板）。
 *
 * Behaviour 是可开关的组件基类。其 logic 提供：
 * - isVisibleAndEnabled: Computed<boolean>（enabled && object3D.activeSelf）
 * - update: 空默认实现（子类覆盖）
 * - dispose: 写入 enabled=false（触发依赖 enabled 的子 logic 清理）
 *
 * 子类 logic（Animation/FPSController 等）经 {@link behaviourLogic} 组合函数
 * 获取实例后 Object.assign 叠加自身行为（与 class 实例兼容）。
 */
export class BehaviourLogic extends ComponentLogicBase
{
    #data: Behaviour;
    #isVisibleAndEnabled: Computed<boolean>;
    #entity: Object3D | null = null;
    #inited = false;

    protected constructor(data: Behaviour)
    {
        super(data);
        this.#data = data;

        const r_behaviour = reactive(data);
        this.#isVisibleAndEnabled = computed<boolean>(() =>
        {
            if (!this.#entity) return false;

            const enabled = r_behaviour.enabled ?? true;

            return enabled !== false && logic(this.#entity).activeSelf;
        });
    }

    /** 内部创建入口（protected constructor 的唯一出口，供组合函数与子类使用） */
    static create(data: Behaviour): BehaviourLogic
    {
        return new BehaviourLogic(data);
    }

    get entity(): Object3D | null
    {
        return this.#entity;
    }

    /** 是否可见且启用 */
    get isVisibleAndEnabled(): Computed<boolean>
    {
        return this.#isVisibleAndEnabled;
    }

    init(object3D?: Object3D): void
    {
        if (this.#inited) return;
        this.#inited = true;
        if (object3D) this.#entity = object3D;
    }

    beforeRender(_renderObject: never): void { /* 默认空 */ }

    update(_interval: number): void { /* 默认空，子类覆盖 */ }

    dispose(): void
    {
        reactive(this.#data).enabled = false;
        this.#entity = null;
    }
}

/**
 * 组合函数：创建 BehaviourLogic 实例（子类工厂的组合入口）。
 */
export function behaviourLogic(data: Behaviour): BehaviourLogic
{
    return BehaviourLogic.create(data);
}

// 注册到 logic 分发表（Behaviour 自身也可作为组件使用）
registerLogic('Behaviour', BehaviourLogic as unknown as new (data: Behaviour) => BehaviourLogic);
