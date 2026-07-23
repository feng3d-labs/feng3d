import { Behaviour, BehaviourLogic, behaviourLogic } from '../component/Behaviour';
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
 * 子类定义自己的纯数据接口 + logic 工厂：
 * ```ts
 * interface ScriptDemo extends Script { readonly __type__: 'ScriptDemo'; }
 * function scriptDemoLogic(script: ScriptDemo): ScriptDemoLogic { const base = scriptLogic(script); ... }
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
 * Script 逻辑处理接口。
 *
 * 继承 BehaviourLogic（共享 enabled / runEnvironment 默认值），通过 `entity`
 * 获取所属 Object3D。`init` / `update` / `dispose` 供子类工厂覆盖。
 */
export interface ScriptLogic extends BehaviourLogic
{
}

/**
 * 创建 ScriptLogic 实例（工厂函数，组合 behaviourLogic 全部行为）。
 *
 * Script 默认行为与 Behaviour 一致（update 为空），子类工厂通过
 * `const base = scriptLogic(data)` 组合复用后再叠加自身行为。
 */
export function scriptLogic(script: Script): ScriptLogic
{
    // 组合 Behaviour 全部行为（component/entity/init/beforeRender/dispose/
    // isVisibleAndEnabled/update），Script 仅作为类型层级的中间基类。
    return behaviourLogic(script) as unknown as ScriptLogic;
}

// 注册到分发表
registerLogic('Script', scriptLogic);
