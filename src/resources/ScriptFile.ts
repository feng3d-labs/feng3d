namespace feng3d
{
    export class ScriptFile extends StringFile
    {
        assetType = AssetExtension.script

        @oav({ editable: false, priority: -1 })
        name: string;

        @watch("onTextContentChanged")
        textContent: string = "";

        /**
         * 脚本父类名称
         */
        parentScriptName: string;

        /**
         * 脚本类定义
         */
        scriptName: string;

        private onTextContentChanged()
        {
            if (!this.textContent)
            {
                this.scriptName = "";
                this.name = "";
                return;
            }

            // 获取脚本类名称
            var result = regExps.classReg.exec(this.textContent);
            var assetsPath = assetsIDPathMap.getPath(this.assetsId);
            feng3d.assert(result != null, `在脚本 ${assetsPath} 中没有找到 脚本类定义`);
            var script = result[3];
            if (result[5])
            {
                this.parentScriptName = result[5].split(".").pop();
            }
            // 获取导出类命名空间
            if (result[1])
            {
                result = regExps.namespace.exec(this.textContent);
                feng3d.assert(result != null, `获取脚本 ${assetsPath} 命名空间失败`);
                script = result[1] + "." + script;
            }

            this.scriptName = script;
            this.name = script;
        }

    }
}