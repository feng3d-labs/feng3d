import { computed, Computed, reactive } from '@feng3d/reactivity';
import { ComponentLogic, registerComponentLogic } from './componentLogic';
import { Behaviour } from './Behaviour';

/**
 * Behaviour 逻辑处理输出。
 *
 * Behaviour 是可开关的组件基类。其 logic 提供：
 * - isVisibleAndEnabled: computed<boolean>（enabled && object3D.activeSelf）
 * - update: 空默认实现（子类 logic 覆盖）
 * - dispose: 写入 enabled=false（触发依赖 enabled 的子 logic 清理）
 *
 * 子类 logic（如 animationLogic）应组合本 logic 后再叠加自身行为。
 */
export interface BehaviourLogic extends ComponentLogic
{
    /** 是否可见且启用 */
    readonly isVisibleAndEnabled: Computed<boolean>;
    /** 每帧更新（默认空，子类覆盖） */
    update(interval: number): void;
}

const behaviourLogicMap = new WeakMap<Behaviour, BehaviourLogic>();

/**
 * 获取 Behaviour 的 logic。
 *
 * 子类 logic 可调用本函数拿到基类 logic 后叠加自身行为。
 */
export function behaviourLogic(behaviour: Behaviour): BehaviourLogic
{
    let logic = behaviourLogicMap.get(behaviour);
    if (logic) return logic;

    logic = createBehaviourLogic(behaviour);
    behaviourLogicMap.set(behaviour, logic);

    return logic;
}

function createBehaviourLogic(behaviour: Behaviour): BehaviourLogic
{
    let _inited = false;

    const isVisibleAndEnabled = computed<boolean>(() =>
    {
        const r_behaviour = reactive(behaviour);
        const enabled = r_behaviour.enabled;
        // object3D 可能在 init 前为 null
        if (!logic.object3D) return false;

        return enabled && reactive(logic.object3D).activeSelf;
    });

    const logic: BehaviourLogic = {
        object3D: null as any,
        isVisibleAndEnabled,
        init()
        {
            if (_inited) return;
            _inited = true;
            // 基类无额外初始化；子类 logic 在组合时追加自身 init
        },
        beforeRender(_renderObject?: any, _scene?: any, _camera?: any) { /* no-op */ },
        update(_interval: number) { /* 默认空，子类覆盖 */ },
        dispose()
        {
            // 写入 enabled=false，触发依赖 enabled 的子 logic（如音频 gain 断开）清理
            reactive(behaviour).enabled = false;
            logic.object3D = null as any;
        },
    };

    return logic;
}

// 注册到 componentLogic 分发表（Behaviour 自身也可作为组件使用）
registerComponentLogic('Behaviour', (component) =>
{
    return behaviourLogic(component as Behaviour);
});
