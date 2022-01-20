import { AssetType, regExps, setAssetTypeClass } from "@feng3d/core";
import { watch } from "@feng3d/watcher";
import { TextAsset } from "./TextAsset";

/**
 * 脚本资源
 */
export class ScriptAsset extends TextAsset
{
    static extenson = ".ts";

    assetType = AssetType.script

    @watch("_invalidate")
    textContent: string;

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

    initAsset()
    {
        this.textContent = this.textContent || "";
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
            this._scriptName = "";
            return;
        }

        // 获取脚本类名称
        var result = regExps.classReg.exec(this.textContent);
        console.assert(result != null, `在脚本 ${this.assetPath} 中没有找到 脚本类定义`);
        var script = result[3];
        if (result[5])
        {
            this._parentScriptName = result[5].split(".").pop();
        }
        // 获取导出类命名空间
        if (result[1])
        {
            result = regExps.namespace.exec(this.textContent);
            console.assert(result != null, `获取脚本 ${this.assetPath} 命名空间失败`);
            script = result[1] + "." + script;
        }

        this._scriptName = script;
    }

}

setAssetTypeClass("script", ScriptAsset);
