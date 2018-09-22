namespace feng3d
{
    export class ScriptFile extends Feng3dFile
    {
        type = AssetExtension.script

        scriptContent: string;

        protected saveFile(readWriteAssets: ReadWriteAssets, callback?: (err: Error) => void)
        {
            readWriteAssets.writeString(this.filePath, this.scriptContent, callback);
        }

        /**
         * 获取脚本类名称
         * @param callback 回调函数
         */
        getScriptClassName(callback: (scriptClassName: string) => void)
        {
            var code = this.scriptContent;

            // 获取脚本类名称
            var result = regExps.scriptClass.exec(code);
            feng3d.assert(result != null, `在脚本 ${this.filePath} 中没有找到 脚本类定义`);
            var script = result[2];
            // 获取导出类命名空间
            if (result[1])
            {
                result = regExps.namespace.exec(code);
                feng3d.assert(result != null, `获取脚本 ${this.filePath} 命名空间失败`);
                script = result[1] + "." + script;
            }
            callback(script);
        }
    }
}