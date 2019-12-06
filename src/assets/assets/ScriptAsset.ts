namespace feng3d
{
    /**
     * 脚本资源
     */
    export class ScriptAsset extends StringAsset
    {
        static extenson = ".ts";

        assetType = AssetType.script

        get textContent()
        {
            return this._textContent;
        }
        set textContent(v)
        {
            if (this._textContent == v) return;
            this._textContent = v;
            this.onTextContentChanged();
        }
        private _textContent: string;

        /**
         * 脚本父类名称
         */
        parentScriptName: string;

        /**
         * 脚本类定义
         */
        scriptName: string;

        initAsset()
        {
            this.textContent = this.textContent || "";
        }

        private onTextContentChanged()
        {
            if (!this.textContent)
            {
                this.scriptName = "";
                return;
            }

            // 获取脚本类名称
            var result = regExps.classReg.exec(this.textContent);
            console.assert(result != null, `在脚本 ${this.assetPath} 中没有找到 脚本类定义`);
            var script = result[3];
            if (result[5])
            {
                this.parentScriptName = result[5].split(".").pop();
            }
            // 获取导出类命名空间
            if (result[1])
            {
                result = regExps.namespace.exec(this.textContent);
                console.assert(result != null, `获取脚本 ${this.assetPath} 命名空间失败`);
                script = result[1] + "." + script;
            }

            this.scriptName = script;
        }

    }
}