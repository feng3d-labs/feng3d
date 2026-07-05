import { logic } from './logic';
import { globalEmitter } from '@feng3d/event';
import { classUtils } from '@feng3d/polyfill';
import { effect, reactive } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { BehaviourLogic, behaviourLogic } from '../component/behaviourLogic';
import { registerComponentLogic } from '../component/componentLogic';
import { ScriptComponent } from './ScriptComponent';
import { Script } from './Script';

/**
 * ScriptComponent 逻辑处理输出。
 *
 * 组合 behaviourLogic，额外：
 * - effect 监听 scriptName 变化时重建脚本实例
 * - init: 订阅 globalEmitter asset.scriptChanged 事件
 * - update: 延迟初始化脚本实例并每帧调用 script.update
 * - dispose: 销毁脚本实例、取消订阅
 */
export interface ScriptComponentLogic extends BehaviourLogic
{
    scriptInstance: Script;
}


/**
 * 获取 ScriptComponent 的 logic。
 */
export function scriptComponentLogic(scriptComponent: ScriptComponent): ScriptComponentLogic

{
    return logic<ScriptComponentLogic>(scriptComponent);
}

function createScriptComponentLogic(scriptComponent: ScriptComponent): ScriptComponentLogic
{
    const base = behaviourLogic(scriptComponent);
    let _scriptInstance: Script | null = null;
    let _invalid = true;
    let _scriptInit = false;
    let _inited = false;

    function _updateScriptInstance(): void
    {
        const oldInstance = _scriptInstance;
        _scriptInstance = null;
        if (!scriptComponent.scriptName) return;

        const Cls = classUtils.getDefinitionByName(scriptComponent.scriptName);

        if (Cls) _scriptInstance = new Cls();
        else console.warn(`无法初始化脚本 ${scriptComponent.scriptName}`);

        _scriptInit = false;

        // 移除旧实例
        if (oldInstance)
        {
            // 如果两个类定义名称相同，则保留上个对象数据
            if (classUtils.getQualifiedClassName(oldInstance) === scriptComponent.scriptName)
            {
                serialization.setValue(_scriptInstance, oldInstance as any);
            }
            oldInstance.component = null;
            oldInstance.dispose();
        }
        _invalid = false;
    }

    function _invalidateScriptInstance(): void
    {
        _invalid = true;
    }

    function getScriptInstance(): Script | null
    {
        if (_invalid) _updateScriptInstance();

        return _scriptInstance;
    }

    const logic: ScriptComponentLogic = {
        object3D: null as any,
        get isVisibleAndEnabled() { return base.isVisibleAndEnabled; },
        get scriptInstance() { return getScriptInstance(); },
        set scriptInstance(v) { _scriptInstance = v; },
        init()
        {
            if (_inited) return;
            _inited = true;
            base.init();

            // effect 监听 scriptName 变化时重建脚本实例
            effect(() =>
            {
                reactive(scriptComponent).scriptName;
                _invalidateScriptInstance();
            });

            globalEmitter.on('asset.scriptChanged', _invalidateScriptInstance, logic);
        },
        beforeRender(ro, scene, camera) { base.beforeRender(ro, scene, camera); },
        update()
        {
            base.update(0);
            const instance = getScriptInstance();
            if (instance && !_scriptInit)
            {
                instance.component = scriptComponent;
                instance.init();
                _scriptInit = true;
            }
            if (instance)
            {
                instance.update();
            }
        },
        dispose()
        {
            reactive(scriptComponent).enabled = false;

            if (_scriptInstance)
            {
                _scriptInstance.component = null;
                _scriptInstance.dispose();
                _scriptInstance = null;
            }
            base.dispose();

            globalEmitter.off('asset.scriptChanged', _invalidateScriptInstance, logic);
                    },
    };

    return logic;
}

// 注册到 componentLogic 分发表
registerComponentLogic('ScriptComponent', (component) =>
{
    return scriptComponentLogic(component as ScriptComponent);
});
