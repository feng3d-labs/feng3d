import { Behaviour, createBehaviour } from '../component/Behaviour';
import { RunEnvironment } from './RunEnvironment';
import type { Script } from './Script';

import './scriptComponentLogic';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        ScriptComponent: ScriptComponent;
    }
}

/**
 * ScriptComponent（纯数据接口）。
 */
export interface ScriptComponent extends Behaviour
{
    readonly __type__: 'ScriptComponent';
    readonly runEnvironment: any;
    readonly scriptName: string;
    readonly scriptInstance: Script;
}

/**
 * 创建 ScriptComponent 实例。
 */
export function createScriptComponent(): ScriptComponent
{
    return {
        ...createBehaviour(), __type__: 'ScriptComponent',
        runEnvironment: RunEnvironment.feng3d,
        scriptName: null as any,
        scriptInstance: null as any,
    };
}
