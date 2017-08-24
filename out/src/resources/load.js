var feng3d;
(function (feng3d) {
    feng3d.loadjs = {
        load: load,
        ready: ready,
    };
    /**
     * 加载文件
     * @param params.paths          加载路径
     * @param params.bundleId       加载包编号
     * @param params.success        成功回调
     * @param params.error          错误回调
     * @param params.async          是否异步加载
     * @param params.numRetries     加载失败尝试次数
     * @param params.before         加载前回调
     * @param params.onitemload     单条文件加载完成回调
     */
    function load(params) {
        // throw error if bundle is already defined
        if (params.bundleId) {
            if (params.bundleId in bundleIdCache) {
                throw "LoadJS";
            }
            else {
                bundleIdCache[params.bundleId] = true;
            }
        }
        var paths = getPaths(params.paths);
        // load scripts
        loadFiles(paths, function (pathsNotFound) {
            // success and error callbacks
            if (pathsNotFound.length)
                (params.error || devnull)(pathsNotFound);
            else
                (params.success || devnull)();
            // publish bundle load event
            publish(params.bundleId, pathsNotFound);
        }, params);
    }
    /**
     * 准备依赖包
     * @param params.depends        依赖包编号
     * @param params.success        成功回调
     * @param params.error          错误回调
     */
    function ready(params) {
        // subscribe to bundle load event
        subscribe(params.depends, function (depsNotFound) {
            // execute callbacks
            if (depsNotFound.length)
                (params.error || devnull)(depsNotFound);
            else
                (params.success || devnull)();
        });
        return this;
    }
    /**
     * 完成下载包
     * @param bundleId 下载包编号
     */
    function done(bundleId) {
        publish(bundleId, []);
    }
    /**
     * 重置下载包依赖状态
     */
    function reset() {
        bundleIdCache = {};
        bundleResultCache = {};
        bundleCallbackQueue = {};
    }
    /**
     * 是否定义下载包
     * @param {string} bundleId 包编号
     */
    function isDefined(bundleId) {
        return bundleId in bundleIdCache;
    }
    var devnull = function () { }, bundleIdCache = {}, bundleResultCache = {}, bundleCallbackQueue = {};
    /**
     * 订阅包加载事件
     * @param bundleIds              包编号
     * @param callbackFn             完成回调
     */
    function subscribe(bundleIds, callbackFn) {
        var depsNotFound = [];
        // listify
        if (bundleIds instanceof String) {
            bundleIds = [bundleIds];
        }
        // define callback function
        var numWaiting = bundleIds.length;
        var fn = function (bundleId, pathsNotFound) {
            if (pathsNotFound.length)
                depsNotFound.push(bundleId);
            numWaiting--;
            if (!numWaiting)
                callbackFn(depsNotFound);
        };
        // register callback
        var i = bundleIds.length;
        while (i--) {
            var bundleId = bundleIds[i];
            // execute callback if in result cache
            var r = bundleResultCache[bundleId];
            if (r) {
                fn(bundleId, r);
                continue;
            }
            // add to callback queue
            var q = bundleCallbackQueue[bundleId] = bundleCallbackQueue[bundleId] || [];
            q.push(fn);
        }
    }
    /**
     * 派发加载包完成事件
     * @param bundleId                  加载包编号
     * @param pathsNotFound             加载失败包
     */
    function publish(bundleId, pathsNotFound) {
        // exit if id isn't defined
        if (!bundleId)
            return;
        var q = bundleCallbackQueue[bundleId];
        // cache result
        bundleResultCache[bundleId] = pathsNotFound;
        // exit if queue is empty
        if (!q)
            return;
        // empty callback queue
        while (q.length) {
            q[0](bundleId, pathsNotFound);
            q.splice(0, 1);
        }
    }
    /**
     * 加载单个文件
     * @param path                          文件路径
     * @param callbackFn                    加载完成回调
     * @param args                          加载参数
     * @param args.async                    是否异步加载
     * @param args.numRetries               尝试加载次数
     * @param args.before                   加载前回调
     * @param numTries                      当前尝试次数
     */
    function loadFile(path, callbackFn, args, numTries) {
        var loaderFun = loaders[path.type] || loadTxt;
        loaderFun(path, callbackFn, args, numTries);
    }
    /**
     * 加载单个Image文件
     * @param path                          文件路径
     * @param callbackFn                    加载完成回调
     * @param args                          加载参数
     * @param args.async                    是否异步加载
     * @param args.numRetries               尝试加载次数
     * @param args.before                   加载前回调
     * @param numTries                      当前尝试次数
     */
    function loadImage(path, callbackFn, args, numTries) {
        var image = new Image();
        image.crossOrigin = "Anonymous";
        image.onload = image.onerror = function (ev) {
            var result = ev.type;
            // handle retries in case of load failure
            if (result == 'error') {
                // increment counter
                numTries = ~~numTries + 1;
                // exit function and try again
                if (numTries < ~~args.numRetries + 1) {
                    return loadImage(path, callbackFn, args, numTries);
                }
                image.src = "data:image/jpg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QBmRXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAAExAAIAAAAQAAAATgAAAAAAAABgAAAAAQAAAGAAAAABcGFpbnQubmV0IDQuMC41AP/bAEMABAIDAwMCBAMDAwQEBAQFCQYFBQUFCwgIBgkNCw0NDQsMDA4QFBEODxMPDAwSGBITFRYXFxcOERkbGRYaFBYXFv/bAEMBBAQEBQUFCgYGChYPDA8WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFv/AABEIAQABAAMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APH6KKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76P//Z";
            }
            // execute callback
            callbackFn(path, result, ev.defaultPrevented, image);
        };
        //
        var beforeCallbackFn = args.before || (function () { return true; });
        if (beforeCallbackFn(path, image) !== false)
            image.src = path.url;
    }
    /**
     * 加载单个txt文件
     * @param path                          文件路径
     * @param callbackFn                    加载完成回调
     * @param args                          加载参数
     * @param args.async                    是否异步加载
     * @param args.numRetries               尝试加载次数
     * @param args.before                   加载前回调
     * @param numTries                      当前尝试次数
     */
    function loadTxt(path, callbackFn, args, numTries) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function (ev) {
            var result = ev.type;
            if (request.readyState == 4) {
                request.onreadystatechange = null;
                // handle retries in case of load failure
                if (request.status < 200 || request.status > 300) {
                    // increment counter
                    numTries = ~~numTries + 1;
                    // exit function and try again
                    if (numTries < ~~args.numRetries + 1) {
                        return loadTxt(path, callbackFn, args, numTries);
                    }
                }
                // execute callback
                callbackFn(path, result, ev.defaultPrevented, request.responseText);
            }
        };
        request.open('Get', path.url, true);
        //
        var beforeCallbackFn = args.before || (function () { return true; });
        if (beforeCallbackFn(path, request) !== false)
            request.send();
    }
    /**
     * 加载单个js或者css文件
     * @param path                          文件路径
     * @param callbackFn                    加载完成回调
     * @param args                          加载参数
     * @param args.async                    是否异步加载
     * @param args.numRetries               尝试加载次数
     * @param args.before                   加载前回调
     * @param numTries                      当前尝试次数
     */
    function loadJsCss(path, callbackFn, args, numTries) {
        var doc = document, isCss, e;
        if (/(^css!|\.css$)/.test(path.url)) {
            isCss = true;
            // css
            e = doc.createElement('link');
            e.rel = 'stylesheet';
            e.href = path.url.replace(/^css!/, ''); // remove "css!" prefix
        }
        else {
            // javascript
            e = doc.createElement('script');
            e.src = path.url;
            e.async = !!args.async;
        }
        e.onload = e.onerror = e.onbeforeload = function (ev) {
            var result = ev.type;
            // Note: The following code isolates IE using `hideFocus` and treats empty
            // stylesheets as failures to get around lack of onerror support
            if (isCss && 'hideFocus' in e) {
                try {
                    if (!e.sheet.cssText.length)
                        result = 'error';
                }
                catch (x) {
                    // sheets objects created from load errors don't allow access to
                    // `cssText`
                    result = 'error';
                }
            }
            // handle retries in case of load failure
            if (result == 'error') {
                // increment counter
                numTries = ~~numTries + 1;
                // exit function and try again
                if (numTries < ~~args.numRetries + 1) {
                    return loadJsCss(path, callbackFn, args, numTries);
                }
            }
            // execute callback
            callbackFn(path, result, ev.defaultPrevented, e);
        };
        // add to document (unless callback returns `false`)
        var beforeCallbackFn = args.before || (function () { return true; });
        if (beforeCallbackFn(path, e) !== false)
            doc.head.appendChild(e);
    }
    /**
     * 加载多文件
     * @param paths         文件路径
     * @param callbackFn    加载完成回调
     */
    function loadFiles(paths, callbackFn, args) {
        var notLoadFiles = paths.concat();
        var loadingFiles = [];
        var pathsNotFound = [];
        // define callback function
        var fn = function (path, result, defaultPrevented, content) {
            // handle error
            if (result == 'error')
                pathsNotFound.push(path);
            // handle beforeload event. If defaultPrevented then that means the load
            // will be blocked (ex. Ghostery/ABP on Safari)
            if (result[0] == 'b') {
                if (defaultPrevented)
                    pathsNotFound.push(path);
                else
                    return;
            }
            var index = loadingFiles.indexOf(path);
            loadingFiles.splice(index, 1);
            args.onitemload && args.onitemload(path.url, content);
            if (loadingFiles.length == 0 && notLoadFiles.length == 0)
                callbackFn(pathsNotFound);
            if (notLoadFiles.length) {
                var file = notLoadFiles.shift();
                loadingFiles.push(file);
                loadFile(file, fn, args);
            }
        };
        // load scripts
        var file;
        if (!!args.async) {
            for (var i = 0, x = notLoadFiles.length; i < x; i++) {
                file = notLoadFiles[i];
                loadingFiles.push(file);
                loadFile(file, fn, args);
            }
            notLoadFiles.length = 0;
        }
        else {
            file = notLoadFiles.shift();
            loadingFiles.push(file);
            loadFile(file, fn, args);
        }
    }
    /**
     * 获取路径以及类型
     * @param pathUrls 路径
     */
    function getPaths(pathUrls) {
        var paths = [];
        if (typeof pathUrls == "string") {
            pathUrls = [pathUrls];
        }
        if (!(pathUrls instanceof Array)) {
            pathUrls = [pathUrls];
        }
        for (var i = 0; i < pathUrls.length; i++) {
            var pathurl = pathUrls[i];
            if (typeof pathurl == "string") {
                paths[i] = { url: pathurl, type: getPathType(pathurl) };
            }
            else {
                paths[i] = pathurl;
            }
        }
        return paths;
    }
    /**
     * 获取路径类型
     * @param path 路径
     */
    function getPathType(path) {
        var type = "txt";
        for (var i = 0; i < typeRegExps.length; i++) {
            var element = typeRegExps[i];
            if (element.reg.test(path))
                type = element.type;
        }
        return type;
    }
    /**
     * 资源类型
     */
    var types = { js: "js", css: "css", txt: "txt", image: "image" };
    /**
     * 加载函数
     */
    var loaders = {
        txt: loadTxt,
        js: loadJsCss,
        css: loadJsCss,
        image: loadImage,
    };
    var typeRegExps = [
        { reg: /(^css!|\.css$)/i, type: types.css },
        { reg: /(\.js\b)/i, type: types.js },
        { reg: /(\.png\b)/i, type: types.image },
        { reg: /(\.jpg\b)/i, type: types.image },
    ];
})(feng3d || (feng3d = {}));
//# sourceMappingURL=load.js.map