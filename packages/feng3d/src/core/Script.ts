import { Behaviour, BehaviourLogic } from '../component/Behaviour';
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
 * 子类定义自己的纯数据接口 + logic：
 * ```ts
 * interface ScriptDemo extends Script { readonly __type__: 'ScriptDemo'; }
 * class ScriptDemoLogic extends ScriptLogic { update(interval) { ... } }
 * registerLogic('ScriptDemo', ScriptDemoLogic as never);
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
 * Script 逻辑类。
 *
 * 继承 BehaviourLogic（共享 enabled / isVisibleAndEnabled / update），
 * 通过 `entity` 获取所属 Object3D。`init` / `update` / `dispose` 供子类覆盖。
 */
export class ScriptLogic extends BehaviourLogic
{
    protected constructor(data: Script)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: Script): ScriptLogic
    {
        return new ScriptLogic(data);
    }
}

/**
 * 组合函数：创建 ScriptLogic 实例（Script 默认行为与 Behaviour 一致，
 * 仅作为类型层级的中间基类）。
 */
export function scriptLogic(data: Script): ScriptLogic
{
    return ScriptLogic.create(data);
}

// 注册到分发表
registerLogic('Script', ScriptLogic as unknown as new (data: Script) => ScriptLogic);
