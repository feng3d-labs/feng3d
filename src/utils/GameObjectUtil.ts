module feng3d
{
    export var GameObjectUtil = {
        addScript: addScript,
        removeScript: removeScript,
        reloadJS: reloadJS,
        loadJs: loadJs,
    }

    var resultScriptCache: { [path: string]: { className: string, script: HTMLScriptElement } } = {};

    function addScript(gameObject: GameObject, scriptPath: string, callback?: (scriptcomponent: Component) => void)
    {
        loadJs(scriptPath, (resultScript) =>
        {
            removeScript(gameObject, scriptPath);

            var windowEval = eval.bind(window);

            var componentClass = windowEval(resultScript.className);
            var scriptcomponent = <Script>gameObject.addComponent(componentClass);
            scriptcomponent["_url"] = scriptPath;
            scriptcomponent.enabled = true;
            callback && callback(scriptcomponent);
        });
    }

    function removeScript(gameObject: GameObject, script: string | Script)
    {
        if (script instanceof Script)
        {
            script.enabled = false;
            gameObject.removeComponent(script);
        } else
        {
            var scripts = gameObject.getComponents(Script);
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
        var loadPath = scriptPath + `?version=${Math.random()}`;
        Loader.loadText(loadPath, (content) =>
        {
            var reg = /(feng3d.(\w+)) = (\w+);/;
            var result = content.match(reg);
            if (result)
                resultScript.className = result[1];

            //
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
    }
}