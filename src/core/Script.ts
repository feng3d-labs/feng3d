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
 * 子类定义自己的纯数据接口 + Logic 类：
 * ```ts
 * interface ScriptDemo extends Script { readonly __type__: 'ScriptDemo'; }
 * class ScriptDemoLogic extends ScriptLogic { init() {...} update() {...} }
 * registerLogic('ScriptDemo', ScriptDemoLogic);
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
 * Script 逻辑处理基类。
 *
 * 继承 BehaviourLogic（共享 enabled / runEnvironment 默认值），通过 `this.entity`
 * 获取所属 Object3D。`init` / `update` / `dispose` 供子类覆盖。
 */
export class ScriptLogic extends BehaviourLogic
{
    constructor(script: Script)
    {
        super(script);
    }

    /** 每帧更新（子类覆盖） */
    update(_interval: number): void { /* 默认空 */ }
}

// 注册到分发表
registerLogic('Script', ScriptLogic);
