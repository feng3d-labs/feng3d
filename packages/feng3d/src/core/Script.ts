import { Behaviour, BehaviourLogic, behaviourLogicProto, setupBehaviourLogicState, type BehaviourLogicState } from '../component/Behaviour';
import { createLogicProto, registerLogic } from '@feng3d/reactivity';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        Script: Script;
    }
}

/**
 * Script（纯数据接口）。
 *
 * 用户脚本基类，直接作为 Object3D 的组件使用（与 Camera、MeshRenderer 同级）。
 * 继承 Behaviour，每帧由 SceneLogic 调用 `logic(script).update`。
 *
 * 子类定义自己的纯数据接口 + logic（issue #674 工厂函数范式）：
 * ```ts
 * interface ScriptDemo extends Script { readonly __type__: 'ScriptDemo'; }
 * interface ScriptDemoLogic extends ScriptLogic
 * {
 * }
 * function scriptDemoLogic(data: ScriptDemo): ScriptDemoLogic
 * {
 *     const base = scriptLogic(data);
 *
 *     return Object.assign(base, {
 *         update(interval: number): void { ... },
 *     }) as unknown as ScriptDemoLogic;
 * }
 * registerLogic('ScriptDemo', scriptDemoLogic);
 * ```
 */
export interface Script extends Behaviour
{
    readonly __type__: string;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Script: ScriptLogic;
    }
}

/**
 * Script 逻辑接口。
 *
 * 继承 BehaviourLogic（共享 enabled / isVisibleAndEnabled / update），
 * 通过 `entity` 获取所属 Object3D。`init` / `update` / `dispose` 供子类覆盖。
 */
export interface ScriptLogic extends BehaviourLogic
{
}

/** ScriptLogic 实例的内部状态（与 BehaviourLogicState 一致） */
interface ScriptLogicState extends BehaviourLogicState
{
}

/** ScriptLogic 的共享原型：继承 Behaviour 基类实现（本层不新增覆写） */
const scriptLogicProto = createLogicProto<ScriptLogic>(behaviourLogicProto, {});

/**
 * 工厂函数：ScriptLogic 的唯一创建入口（Script 默认行为与 Behaviour 一致，
 * 仅作为类型层级的中间基类）。
 */
export function scriptLogic(data: Script): ScriptLogic
{
    return setupBehaviourLogicState(Object.create(scriptLogicProto) as ScriptLogic & ScriptLogicState, data);
}

// 注册到分发表
registerLogic('Script', scriptLogic);
