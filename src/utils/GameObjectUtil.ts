namespace feng3d
{
    export var GameObjectUtil = {
        addScript: addScript,
        removeScript: removeScript,
        reloadJS: reloadJS,
        loadJs: loadJs,
    }

    var resultScriptCache: { [path: string]: { className: string, script: HTMLScriptElement } } = {};

    function addScript(gameObject: GameObject, scriptPath: string, callback?: (scriptClass: new (scriptComponent: ScriptComponent) => Script) => void)
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
        if (resultScriptCache[scriptPath])
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
                var reg = /(feng3d.(\w+)) = (\w+);/;
                var result = content.match(reg);
                if (result)
                    resultScript.className = result[1];

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
                var content = data.data;
                // var reg = /var ([a-zA-Z0-9_$]+) = \/\*\* @class \*\//;
                var reg = new RegExp("var ([a-zA-Z0-9_$]+) = \\/\\*\\* @class \\*\\/");
                var result = content.match(reg);
                assert(result && result[1], "脚本中找不到类定义！");
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