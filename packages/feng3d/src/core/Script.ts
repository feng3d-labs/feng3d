import { Behaviour, BehaviourLogic, createBehaviourLogicBase } from '../component/Behaviour';
import { registerLogic } from '@feng3d/reactivity';

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
 * 子类定义自己的纯数据接口 + logic（issue #674 工厂函数范式，闭包字面量形态）：
 * ```ts
 * interface ScriptDemo extends Script { readonly __type__: 'ScriptDemo'; }
 * interface ScriptDemoLogic extends ScriptLogic
 * {
 * }
 * function scriptDemoLogic(data: ScriptDemo): ScriptDemoLogic
 * {
 *     const { members } = createBehaviourLogicBase(data);
 *
 *     const logic: ScriptDemoLogic = {
 *         get component() { return members.component; },
 *         get entity() { return members.entity; },
 *         get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
 *         init(object3D) { members.init(object3D); },
 *         beforeRender(renderObject) { members.beforeRender(renderObject); },
 *         update(interval) { members.update(interval); },
 *         get isLoaded() { return members.isLoaded; },
 *         dispose() { members.dispose(); },
 *         // ...自身成员
 *     };
 *
 *     return logic;
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

/**
 * 工厂函数：ScriptLogic 的唯一创建入口（Script 默认行为与 Behaviour 一致，
 * 仅作为类型层级的中间基类）。
 *
 * @param data 脚本数据（raw）
 */
export function scriptLogic(data: Script): ScriptLogic
{
    const { members } = createBehaviourLogicBase(data);

    const logic: ScriptLogic = {
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

// 注册到分发表
registerLogic('Script', scriptLogic);
