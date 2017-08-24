var feng3d;
(function (feng3d) {
    feng3d.GameObjectUtil = {
        addScript: addScript,
        removeScript: removeScript,
        reloadJS: reloadJS,
        loadJs: loadJs,
    };
    var resultScriptCache = {};
    function addScript(gameObject, scriptPath) {
        var _this = this;
        this.loadJs(scriptPath, function (resultScript) {
            _this.removeScript(gameObject, scriptPath);
            var windowEval = eval.bind(window);
            var componentClass = windowEval(resultScript.className);
            var scriptDemo = gameObject.addComponent(componentClass);
            scriptDemo.url = scriptPath;
            scriptDemo.enabled = true;
        });
    }
    function removeScript(gameObject, script) {
        if (script instanceof feng3d.Script) {
            script.enabled = false;
            gameObject.removeComponent(script);
        }
        else {
            var scripts = gameObject.getComponents(feng3d.Script);
            while (scripts.length > 0) {
                var scriptComponent = scripts.pop();
                if (scriptComponent.url == script) {
                    this.removeScript(gameObject, scriptComponent);
                }
            }
        }
    }
    function reloadJS(scriptPath) {
        delete resultScriptCache[scriptPath];
        this.loadJs(scriptPath);
    }
    function loadJs(scriptPath, onload) {
        if (onload === void 0) { onload = null; }
        if (resultScriptCache[scriptPath]) {
            onload(resultScriptCache[scriptPath]);
            return;
        }
        var resultScript = {};
        var loadPath = scriptPath + ("?version=" + Math.random());
        feng3d.Loader.loadText(loadPath, function (content) {
            var reg = /(feng3d.(\w+)) = (\w+);/;
            var result = content.match(reg);
            resultScript.className = result[1];
            //
            var scriptTag = document.getElementById(scriptPath);
            var head = document.getElementsByTagName('head').item(0);
            if (scriptTag)
                head.removeChild(scriptTag);
            var script = document.createElement('script');
            script.onload = function (e) {
                resultScript.script = script;
                resultScriptCache[scriptPath] = resultScript;
                onload && onload(resultScript);
            };
            script.src = loadPath;
            script.type = 'text/javascript';
            script.id = scriptPath;
            head.appendChild(script);
        });
    }
})(feng3d || (feng3d = {}));
//# sourceMappingURL=GameObjectUtil.js.map