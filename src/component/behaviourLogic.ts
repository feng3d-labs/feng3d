import { computed, Computed, reactive, toRaw } from '@feng3d/reactivity';
import { ComponentLogic, registerComponentLogic } from './componentLogic';
import { Behaviour } from './Behaviour';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Behaviour: BehaviourLogic;
    }
}

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
    // 用 toRaw 统一 key：getComponentsInChildren 可能返回响应式代理，与 initComponent
    // 使用的原始对象是不同 WeakMap key，会导致拿到未初始化的 logic（object3D 为 null）。
    const raw = toRaw(behaviour);
    let logic = behaviourLogicMap.get(raw);
    if (logic) return logic as any;

    logic = createBehaviourLogic(raw);
    behaviourLogicMap.set(raw, logic);

    return logic as any;
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

    const logic = {
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

    return logic as any;
}

// 注册到 componentLogic 分发表（Behaviour 自身也可作为组件使用）
registerComponentLogic('Behaviour', (component) =>
{
    return createBehaviourLogic(component as Behaviour);
});
