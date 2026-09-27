import { AssetType, regExps } from 'feng3d';
import { setAssetTypeClass } from '../FileAsset';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { watcher } from '@feng3d/watcher';
import { TextAsset } from './TextAsset';

declare global
{
    export interface MixinsAssetTypeClassMap
    {
        'script': new () => ScriptAsset;
    }
}

/**
 * 脚本资源
 */
@decoratorRegisterClass()
export class ScriptAsset extends TextAsset
{
    static extenson = '.ts';

    assetType = AssetType.script;

    /**
     * 脚本父类名称
     */
    get parentScriptName()
    {
        this._update();

        return this._parentScriptName;
    }
    private _parentScriptName: string;

    /**
     * 脚本类定义
     */
    get scriptName()
    {
        this._update();

        return this._scriptName;
    }
    private _scriptName: string;

    private _invalid = true;

    constructor()
    {
        super();
        watcher.watch(this as ScriptAsset, 'textContent', this._invalidate, this);
    }

    initAsset()
    {
        this.textContent = this.textContent || '';
    }

    private _invalidate()
    {
        this._invalid = true;
    }

    private _update()
    {
        if (!this._invalid) return;
        this._invalid = false;

        if (!this.textContent)
        {
            this._scriptName = '';

            return;
        }

        // 获取脚本类名称
        const matched = regExps.classReg.exec(this.textContent);

        console.assert(matched !== null, `在脚本 ${this.assetPath} 中没有找到 脚本类定义`);
        // 断言失败时原实现会在下一行读 null[3] 抛 TypeError，这里保持同样语义（不静默跳过）
        const result = matched!;
        let script = result[3];
        if (result[5])
        {
            // split('.') 的结果至少有一个元素，pop 必有值
            this._parentScriptName = result[5].split('.').pop()!;
        }
        // 获取导出类命名空间
        if (result[1])
        {
            const namespaceMatched = regExps.namespace.exec(this.textContent);

            console.assert(namespaceMatched !== null, `获取脚本 ${this.assetPath} 命名空间失败`);
            // 同 classReg：断言失败时原实现会在下一行读 null[1] 抛 TypeError
            script = `${namespaceMatched![1]}.${script}`;
        }

        this._scriptName = script;
    }
}

setAssetTypeClass('script', ScriptAsset);
