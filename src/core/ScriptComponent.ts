import { Behaviour, createBehaviour } from '../component/Behaviour';
import { RunEnvironment } from './RunEnvironment';
import type { Script } from './Script';

import './scriptComponentLogic';

declare global
{
    export interface MixinsComponentMap
    {
        ScriptComponent: ScriptComponent;
    }
}

/**
 * ScriptComponent（纯数据接口）。
 */
export interface ScriptComponent extends Behaviour
{
    runEnvironment: any;
    scriptName: string;
    scriptInstance: Script;
}

/**
 * 创建 ScriptComponent 实例。
 */
export function createScriptComponent(): ScriptComponent
{
    return {
        __type__: 'ScriptComponent', ...createBehaviour(),
        runEnvironment: RunEnvironment.feng3d,
        scriptName: null as any,
        scriptInstance: null as any,
    };
}
