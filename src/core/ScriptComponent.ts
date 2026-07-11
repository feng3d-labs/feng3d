import { Behaviour, createBehaviour } from '../component/Behaviour';
import { RunEnvironment } from './RunEnvironment';
import type { Script } from './Script';
import { registerLogic, logic as getLogic, effect, reactive } from "@feng3d/reactivity";
import { globalEmitter } from '@feng3d/event';
import { classUtils } from '@feng3d/polyfill';
import { serialization } from '@feng3d/serialization';
import { BehaviourLogic } from '../component/Behaviour';

import './ScriptComponent';

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

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ScriptComponent: ScriptComponentLogic;
    }
}

/**
 * ScriptComponent 逻辑处理输出。
 *
 * 组合 behaviourLogic，额外：
 * - effect 监听 scriptName 变化时重建脚本实例
 * - init: 订阅 globalEmitter asset.scriptChanged 事件
 * - update: 延迟初始化脚本实例并每帧调用 script.update
 * - dispose: 销毁脚本实例、取消订阅
 */
export class ScriptComponentLogic extends BehaviourLogic
{
    /** 脚本实例缓存（null 表示尚未创建） */
    private _scriptInstance: Script | null = null;
    /** 脚本实例失效标记（scriptName 变化时置 true，下次访问时重建） */
    private _invalid = true;
    /** 脚本是否已调用 init */
    private _scriptInit = false;
    /** init 去重标志（同一 component 只初始化一次） */
    private _subInited = false;

    constructor(scriptComponent: ScriptComponent)
    {
        super(scriptComponent);
    }

    /** 当前脚本实例（失效时惰性重建） */
    get scriptInstance(): Script | null
    {
        if (this._invalid) this._updateScriptInstance();

        return this._scriptInstance;
    }

    set scriptInstance(v: Script | null)
    {
        this._scriptInstance = v;
    }

    /** 根据 scriptName 重建脚本实例 */
    private _updateScriptInstance(): void
    {
        const scriptComponent = this.component as ScriptComponent;
        const oldInstance = this._scriptInstance;
        this._scriptInstance = null;
        if (!scriptComponent.scriptName) return;

        const Cls = classUtils.getDefinitionByName(scriptComponent.scriptName);

        if (Cls) this._scriptInstance = new Cls();
        else console.warn(`无法初始化脚本 ${scriptComponent.scriptName}`);

        this._scriptInit = false;

        // 移除旧实例
        if (oldInstance)
        {
            // 如果两个类定义名称相同，则保留上个对象数据
            if (classUtils.getQualifiedClassName(oldInstance) === scriptComponent.scriptName)
            {
                serialization.setValue(this._scriptInstance, oldInstance as any);
            }
            oldInstance.component = null;
            oldInstance.dispose();
        }
        this._invalid = false;
    }

    /** 标记脚本实例失效（下次访问时重建） */
    private _invalidateScriptInstance = (): void =>
    {
        this._invalid = true;
    };

    init(object3D?: import('./Object3D').Object3D): void
    {
        if (this._subInited) return;
        this._subInited = true;
        super.init(object3D);

        const scriptComponent = this.component as ScriptComponent;

        // effect 监听 scriptName 变化时重建脚本实例
        effect(() =>
        {
            reactive(scriptComponent).scriptName;
            this._invalidateScriptInstance();
        });

        globalEmitter.on('asset.scriptChanged', this._invalidateScriptInstance, this);
    }

    update(_interval: number): void
    {
        super.update(0);
        const instance = this.scriptInstance;
        if (instance && !this._scriptInit)
        {
            const scriptComponent = this.component as ScriptComponent;
            instance.component = scriptComponent;
            instance.init();
            this._scriptInit = true;
        }
        if (instance)
        {
            instance.update();
        }
    }

    dispose(): void
    {
        const scriptComponent = this.component as ScriptComponent;
        reactive(scriptComponent).enabled = false;

        if (this._scriptInstance)
        {
            this._scriptInstance.component = null;
            this._scriptInstance.dispose();
            this._scriptInstance = null;
        }
        super.dispose();

        globalEmitter.off('asset.scriptChanged', this._invalidateScriptInstance, this);
    }
}
// 注册到 componentLogic 分发表
registerLogic('ScriptComponent', (component) =>
{
    return new ScriptComponentLogic(component as ScriptComponent);
});
