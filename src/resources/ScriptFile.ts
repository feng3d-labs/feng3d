namespace feng3d
{
    export class ScriptFile extends StringFile
    {
        assetType = AssetExtension.script

        /**
         * 脚本父类名称
         */
        parentScriptName: string;

        /**
         * 脚本类定义
         */
        scriptName: string;

        /**
         * 读取文件
         * @param readAssets 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(readAssets: ReadAssets, callback?: (err: Error) => void)
        {
            super.readFile(readAssets, (err) =>
            {
                var code = this.textContent;

                // 获取脚本类名称
                var result = regExps.classReg.exec(code);
                feng3d.assert(result != null, `在脚本 ${this.filePath} 中没有找到 脚本类定义`);
                var script = result[3];
                if (result[5])
                {
                    this.parentScriptName = result[5].split(".").pop();
                }
                // 获取导出类命名空间
                if (result[1])
                {
                    result = regExps.namespace.exec(code);
                    feng3d.assert(result != null, `获取脚本 ${this.filePath} 命名空间失败`);
                    script = result[1] + "." + script;
                }

                this.scriptName = script;

                callback && callback(err);
            });
        }


    }
}