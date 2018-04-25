namespace feng3d
{
    /**
     * 3d对象脚本
     * @author feng 2017-03-11
     */
    export class ScriptComponent extends Behaviour
    {
        /**
         * 脚本对象
         */
        private _script: Script;

        @serialize()
        scriptData: Object;

        /**
         * 脚本路径
         */
        @oav({ componentParam: { dragparam: { accepttype: "file_script" }, textEnabled: false } })
        @serialize()
        get url()
        {
            return this._url;
        }
        set url(value)
        {
            if (this._url == value)
                return;
            this._url = value;
            this.initScript();
        }
        private _url = "";

        init(gameObject: GameObject)
        {
            super.init(gameObject);
            this.initScript();
            this.enabled = this.enabled;
        }

        private initScript()
        {
            if (this._url && this.gameObject && runEnvironment == RunEnvironment.feng3d)
            {
                addScript(this._url, (scriptClass) =>
                {
                    this._script = new scriptClass(this);
                    var scriptData = this.scriptData = this.scriptData || {};
                    for (const key in scriptData)
                    {
                        if (scriptData.hasOwnProperty(key))
                        {
                            this._script[key] = scriptData[key];
                        }
                    }
                    this._script.init();
                });
            }
        }

        /**
         * 每帧执行
         */
        update()
        {
            this._script && this._script.update();
        }

        /**
         * 销毁
         */
        dispose()
        {
            this.enabled = false;
            this._script && this._script.dispose();
            this._script = null;
            super.dispose();
        }

        static addScript: (scriptPath: string, callback?: (scriptClass: new (component?: ScriptComponent) => Script) => void) => void = addScript;
    }

    var resultScriptCache: { [path: string]: { className: string, script: HTMLScriptElement } } = {};

    function addScript(scriptPath: string, callback?: (scriptClass: new (component?: ScriptComponent) => Script) => void)
    {
        var jspath = scriptPath.replace(/\.ts\b/, ".js");
        loadJs(jspath, (resultScript) =>
        {
            var windowEval = eval.bind(window);

            var cls = windowEval(resultScript.className);
            callback && callback(cls);
        });
    }

    function removeScript(gameObject: GameObject, script: string | ScriptComponent)
    {
        if (script instanceof ScriptComponent)
        {
            script.enabled = false;
            gameObject.removeComponent(script);
        } else
        {
            var scripts = gameObject.getComponents(ScriptComponent);
            while (scripts.length > 0)
            {
                var scriptComponent = scripts[scripts.length - 1];
                scripts.pop();
                if (scriptComponent.url == script)
                {
                    removeScript(gameObject, scriptComponent);
                }
            }
        }
    }

    function reloadJS(scriptPath)
    {
        delete resultScriptCache[scriptPath];
        loadJs(scriptPath);
    }

    function loadJs(scriptPath, onload?: (resultScript: { className: string, script: HTMLScriptElement }) => void)
    {
        if (resultScriptCache[scriptPath] && runEnvironment != RunEnvironment.editor)
        {
            onload && onload(resultScriptCache[scriptPath]);
            return;
        }

        var resultScript: { className: string, script: HTMLScriptElement } = <any>{};
        if (fstype == FSType.http)
        {
            var loadPath = scriptPath + `?version=${Math.random()}`;
            Loader.loadText(loadPath, (content) =>
            {
                // var reg = /var ([a-zA-Z0-9_$]+) = \/\*\* @class \*\//;
                var reg = new RegExp("var ([a-zA-Z0-9_$]+) = \\/\\*\\* @class \\*\\/");
                var result = content.match(reg);
                assert(result && !!result[1], "脚本中找不到类定义！");
                var classname = result[1];
                //处理类定义放在 namespace 中 /([a-zA-Z0-9_$.]+Test)\s*=\s*Test/
                reg = new RegExp(`([a-zA-Z0-9_$.]+${classname})\\s*=\\s*${classname}`);
                result = content.match(reg);
                if (result)
                    classname = result[1];
                resultScript.className = classname;

                var scriptTag = document.getElementById(scriptPath);
                var head = document.getElementsByTagName('head').item(0)
                if (scriptTag) head.removeChild(scriptTag);
                var script = document.createElement('script');
                script.onload = (e) =>
                {
                    resultScript.script = script;
                    resultScriptCache[scriptPath] = resultScript;
                    onload && onload(resultScript);
                }
                script.src = loadPath;
                script.type = 'text/javascript';
                script.id = scriptPath;
                head.appendChild(script)
            });
        } else if (fstype == FSType.indexedDB)
        {
            storage.get(DBname, projectname, scriptPath, (err, data) =>
            {
                var content: string = data.data;
                // var reg = /var ([a-zA-Z0-9_$]+) = \/\*\* @class \*\//;
                var reg = new RegExp("var ([a-zA-Z0-9_$]+) = \\/\\*\\* @class \\*\\/");
                var result = content.match(reg);
                assert(result && !!result[1], "脚本中找不到类定义！");
                var classname = result[1];
                //处理类定义放在 namespace 中 /([a-zA-Z0-9_$.]+Test)\s*=\s*Test/
                reg = new RegExp(`([a-zA-Z0-9_$.]+${classname})\\s*=\\s*${classname}`);
                result = content.match(reg);
                if (result)
                    classname = result[1];
                resultScript.className = classname;
                //
                var windowEval = eval.bind(window);
                windowEval(content);

                //
                resultScriptCache[scriptPath] = resultScript;
                onload && onload(resultScript);
            });
        }

    }
}