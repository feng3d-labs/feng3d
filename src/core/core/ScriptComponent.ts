import { globalEmitter } from '../../event/GlobalEmitter';
import { oav } from '../../objectview/ObjectView';
import { getClassName } from '../../serialization/getClassName';
import { getInstance } from '../../serialization/getInstance';
import { Serializable } from '../../serialization/Serializable';
import { serialization } from '../../serialization/Serialization';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { Behaviour } from '../component/Behaviour';
import { RegisterComponent } from '../component/Component';
import { AddComponentMenu } from '../Menu';
import { RunEnvironment } from './RunEnvironment';
import { Script } from './Script';

declare global
{
    export interface MixinsComponentMap
    {
        ScriptComponent: ScriptComponent;
    }
}

/**
 * 3d对象脚本
 */
@AddComponentMenu('Script/Script')
@RegisterComponent()
@Serializable()
export class ScriptComponent extends Behaviour
{
    runEnvironment = RunEnvironment.feng3d;

    @SerializeProperty
    @oav({ component: 'OAVPick', componentParam: { accepttype: 'file_script' } })
    scriptName: string;

    /**
     * 脚本对象
     */
    @SerializeProperty
    get scriptInstance()
    {
        if (this._invalid) this._updateScriptInstance();

        return this._scriptInstance;
    }
    set scriptInstance(v)
    {
        this._scriptInstance = v;
    }
    private _scriptInstance: Script;

    private _invalid = true;

    private scriptInit = false;

    constructor()
    {
        super();
        watcher.watch(this as ScriptComponent, 'scriptName', this._invalidateScriptInstance, this);
    }

    init()
    {
        super.init();
        globalEmitter.on('asset.scriptChanged', this._invalidateScriptInstance, this);
    }

    private _updateScriptInstance()
    {
        const oldInstance = this._scriptInstance;
        this._scriptInstance = null;
        if (!this.scriptName) return;

        this._scriptInstance = getInstance(this.scriptName as any);

        this.scriptInit = false;

        // 移除旧实例
        if (oldInstance)
        {
            // 如果两个类定义名称相同，则保留上个对象数据
            if (getClassName(oldInstance) === this.scriptName)
            {
                serialization.setValue(this._scriptInstance, <any>oldInstance);
            }
            oldInstance.component = null;
            oldInstance.dispose();
        }
        this._invalid = false;
    }

    private _invalidateScriptInstance()
    {
        this._invalid = true;
    }

    /**
     * 每帧执行
     */
    update()
    {
        if (this.scriptInstance && !this.scriptInit)
        {
            this.scriptInstance.component = this;
            this.scriptInstance.init();
            this.scriptInit = true;
        }
        this.scriptInstance && this.scriptInstance.update();
    }

    /**
     * 销毁
     */
    dispose()
    {
        this.enabled = false;

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
