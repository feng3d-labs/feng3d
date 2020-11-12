var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
        if (numTries === void 0) { numTries = 0; }
        var image = new Image();
        image.crossOrigin = "Anonymous";
        image.onerror = image.onload = function (ev) {
            var result = ev.type;
            // handle retries in case of load failure
            if (result == 'error') {
                // increment counter
                numTries = ~~numTries + 1;
                // exit function and try again
                args.numRetries = args.numRetries || 0;
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
        if (numTries === void 0) { numTries = 0; }
        var request = new XMLHttpRequest();
        request.onreadystatechange = function (ev) {
            var result = ev.type;
            if (request.readyState == 4) { // 4 = "loaded"
                request.onreadystatechange = null;
                // handle retries in case of load failure
                if (request.status < 200 || request.status > 300) {
                    // increment counter
                    numTries = ~~numTries + 1;
                    // exit function and try again
                    args.numRetries = args.numRetries || 0;
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
        if (numTries === void 0) { numTries = 0; }
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
                args.numRetries = args.numRetries || 0;
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
                pathsNotFound.push(path.url);
            // handle beforeload event. If defaultPrevented then that means the load
            // will be blocked (ex. Ghostery/ABP on Safari)
            if (result[0] == 'b') {
                if (defaultPrevented)
                    pathsNotFound.push(path.url);
                else
                    return;
            }
            var index = loadingFiles.indexOf(path);
            loadingFiles.splice(index, 1);
            args.onitemload && args.onitemload(path.url, content);
            if (loadingFiles.length == 0 && notLoadFiles.length == 0)
                callbackFn(pathsNotFound);
            if (notLoadFiles.length) {
                var file = notLoadFiles[0];
                notLoadFiles.shift();
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
            file = notLoadFiles[0];
            notLoadFiles.shift();
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
        if (!Array.isArray(pathUrls)) {
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
var feng3d;
(function (feng3d) {
    var databases = {};
    /**
     *
     */
    var _IndexedDB = /** @class */ (function () {
        function _IndexedDB() {
            /**
             * 数据库状态
             */
            this._dbStatus = {};
        }
        /**
         * 是否支持 indexedDB
         */
        _IndexedDB.prototype.support = function () {
            if (typeof indexedDB == "undefined") {
                indexedDB = window.indexedDB || window["mozIndexedDB"] || window["webkitIndexedDB"] || window["msIndexedDB"];
                if (indexedDB == undefined) {
                    return false;
                }
            }
            return true;
        };
        /**
         * 获取数据库，如果不存在则新建数据库
         *
         * @param dbname 数据库名称
         * @param callback 完成回调
         */
        _IndexedDB.prototype.getDatabase = function (dbname, callback) {
            if (databases[dbname]) {
                callback(null, databases[dbname]);
                return;
            }
            this._open(dbname, callback);
        };
        /**
         * 打开或者升级数据库
         *
         * @param dbname 数据库名称
         * @param callback 完成回调
         * @param upgrade 是否升级数据库
         * @param onupgrade 升级回调
         */
        _IndexedDB.prototype._open = function (dbname, callback, upgrade, onupgrade) {
            var _this = this;
            if (upgrade === void 0) { upgrade = false; }
            if (!this._dbStatus[dbname])
                this._dbStatus[dbname] = { status: DBStatus.unOpen, onsuccessCallbacks: [], onupgradeneededCallbacks: [] };
            this._dbStatus[dbname].onsuccessCallbacks.push(callback);
            if (upgrade) {
                console.assert(!!onupgrade);
                this._dbStatus[dbname].onupgradeneededCallbacks.push(onupgrade);
            }
            if (this._dbStatus[dbname].status == DBStatus.opening || this._dbStatus[dbname].status == DBStatus.upgrading)
                return;
            var request;
            if (!upgrade) {
                request = indexedDB.open(dbname);
                this._dbStatus[dbname].status = DBStatus.opening;
            }
            else {
                var oldDatabase = databases[dbname];
                oldDatabase.close();
                delete databases[dbname];
                request = indexedDB.open(dbname, oldDatabase.version + 1);
                this._dbStatus[dbname].status = DBStatus.upgrading;
            }
            request.onupgradeneeded = function (event) {
                var newdatabase = event.target["result"];
                request.onupgradeneeded = null;
                var callbacks = _this._dbStatus[dbname].onupgradeneededCallbacks.concat();
                _this._dbStatus[dbname].onupgradeneededCallbacks.length = 0;
                callbacks.forEach(function (element) {
                    element(newdatabase);
                });
            };
            request.onsuccess = function (event) {
                databases[dbname] = event.target["result"];
                request.onsuccess = null;
                _this._dbStatus[dbname].status = DBStatus.opened;
                var callbacks = _this._dbStatus[dbname].onsuccessCallbacks.concat();
                _this._dbStatus[dbname].onsuccessCallbacks.length = 0;
                callbacks.forEach(function (element) {
                    element(null, databases[dbname]);
                });
            };
            request.onerror = function (event) {
                request.onerror = null;
                _this._dbStatus[dbname].status = DBStatus.error;
                var callbacks = _this._dbStatus[dbname].onsuccessCallbacks.concat();
                _this._dbStatus[dbname].onsuccessCallbacks.length = 0;
                callbacks.forEach(function (element) {
                    element(event, null);
                });
            };
        };
        /**
         * 删除数据库
         *
         * @param dbname 数据库名称
         * @param callback 完成回调
         */
        _IndexedDB.prototype.deleteDatabase = function (dbname, callback) {
            var request = indexedDB.deleteDatabase(dbname);
            request.onsuccess = function (event) {
                delete databases[dbname];
                callback && callback(null);
                request.onsuccess = null;
            };
            request.onerror = function (event) {
                callback && callback(event);
                request.onerror = null;
            };
        };
        /**
         * 是否存在指定的对象存储
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param callback 完成回调
         */
        _IndexedDB.prototype.hasObjectStore = function (dbname, objectStroreName, callback) {
            this.getDatabase(dbname, function (err, database) {
                callback(database.objectStoreNames.contains(objectStroreName));
            });
        };
        /**
         * 获取对象存储名称列表
         *
         * @param dbname 数据库
         * @param callback 完成回调
         */
        _IndexedDB.prototype.getObjectStoreNames = function (dbname, callback) {
            this.getDatabase(dbname, function (err, database) {
                var objectStoreNames = [];
                for (var i = 0; i < database.objectStoreNames.length; i++) {
                    objectStoreNames.push(database.objectStoreNames.item(i));
                }
                callback(null, objectStoreNames);
            });
        };
        /**
         * 创建对象存储
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param callback 完成回调
         */
        _IndexedDB.prototype.createObjectStore = function (dbname, objectStroreName, callback) {
            var _this = this;
            this.getDatabase(dbname, function (err, database) {
                if (database.objectStoreNames.contains(objectStroreName)) {
                    callback && callback(null);
                    return;
                }
                _this._open(dbname, callback, true, function (newdatabase) {
                    newdatabase.createObjectStore(objectStroreName);
                });
            });
        };
        /**
         * 删除对象存储
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param callback 完成回调
         */
        _IndexedDB.prototype.deleteObjectStore = function (dbname, objectStroreName, callback) {
            var _this = this;
            this.getDatabase(dbname, function (err, database) {
                if (!database.objectStoreNames.contains(objectStroreName)) {
                    callback && callback(null);
                    return;
                }
                _this._open(dbname, callback, true, function (newdatabase) {
                    newdatabase.deleteObjectStore(objectStroreName);
                });
            });
        };
        /**
         * 获取对象存储中所有键列表
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param callback 完成回调
         */
        _IndexedDB.prototype.getAllKeys = function (dbname, objectStroreName, callback) {
            this.getDatabase(dbname, function (err, database) {
                try {
                    var transaction = database.transaction([objectStroreName], 'readwrite');
                    var objectStore = transaction.objectStore(objectStroreName);
                    var request = objectStore.getAllKeys();
                    request.onsuccess = function (event) {
                        callback && callback(null, event.target["result"]);
                        request.onsuccess = null;
                    };
                }
                catch (error) {
                    callback && callback(error, null);
                }
            });
        };
        /**
         * 获取对象存储中指定键对应的数据
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param key 键
         * @param callback 完成回调
         */
        _IndexedDB.prototype.objectStoreGet = function (dbname, objectStroreName, key, callback) {
            this.getDatabase(dbname, function (err, database) {
                var transaction = database.transaction([objectStroreName], 'readwrite');
                var objectStore = transaction.objectStore(objectStroreName);
                var request = objectStore.get(key);
                request.onsuccess = function (event) {
                    var result = event.target["result"];
                    callback && callback(result != null ? null : new Error("\u6CA1\u6709\u627E\u5230\u8D44\u6E90 " + key), result);
                    request.onsuccess = null;
                };
            });
        };
        /**
         * 设置对象存储的键与值，如果不存在指定键则新增否则修改。
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param key 键
         * @param data 数据
         * @param callback 完成回调
         */
        _IndexedDB.prototype.objectStorePut = function (dbname, objectStroreName, key, data, callback) {
            this.getDatabase(dbname, function (err, database) {
                try {
                    var transaction = database.transaction([objectStroreName], 'readwrite');
                    var objectStore = transaction.objectStore(objectStroreName);
                    var request = objectStore.put(data, key);
                    request.onsuccess = function (event) {
                        callback && callback(null);
                        request.onsuccess = null;
                    };
                }
                catch (error) {
                    callback && callback(error);
                }
            });
        };
        /**
         * 删除对象存储中指定键以及对于数据
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param key 键
         * @param callback 完成回调
         */
        _IndexedDB.prototype.objectStoreDelete = function (dbname, objectStroreName, key, callback) {
            this.getDatabase(dbname, function (err, database) {
                try {
                    var transaction = database.transaction([objectStroreName], 'readwrite');
                    var objectStore = transaction.objectStore(objectStroreName);
                    var request = objectStore.delete(key);
                    request.onsuccess = function (event) {
                        callback && callback();
                        request.onsuccess = null;
                    };
                }
                catch (error) {
                    callback && callback(error);
                }
            });
        };
        /**
         * 清空对象存储中数据
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param callback 完成回调
         */
        _IndexedDB.prototype.objectStoreClear = function (dbname, objectStroreName, callback) {
            this.getDatabase(dbname, function (err, database) {
                try {
                    var transaction = database.transaction([objectStroreName], 'readwrite');
                    var objectStore = transaction.objectStore(objectStroreName);
                    var request = objectStore.clear();
                    request.onsuccess = function (event) {
                        callback && callback();
                        request.onsuccess = null;
                    };
                }
                catch (error) {
                    callback && callback(error);
                }
            });
        };
        return _IndexedDB;
    }());
    feng3d._IndexedDB = _IndexedDB;
    feng3d._indexedDB = new _IndexedDB();
    /**
     * 数据库状态
     */
    var DBStatus;
    (function (DBStatus) {
        /**
         * 未开启
         */
        DBStatus[DBStatus["unOpen"] = 0] = "unOpen";
        /**
         * 正在开启中
         */
        DBStatus[DBStatus["opening"] = 1] = "opening";
        /**
         * 已开启
         */
        DBStatus[DBStatus["opened"] = 2] = "opened";
        /**
         * 正在升级中
         */
        DBStatus[DBStatus["upgrading"] = 3] = "upgrading";
        /**
         * 开启或者升级失败
         */
        DBStatus[DBStatus["error"] = 4] = "error";
    })(DBStatus || (DBStatus = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 文件系统类型
     */
    var FSType;
    (function (FSType) {
        FSType["http"] = "http";
        FSType["native"] = "native";
        FSType["indexedDB"] = "indexedDB";
    })(FSType = feng3d.FSType || (feng3d.FSType = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 可读文件系统
     */
    var ReadFS = /** @class */ (function () {
        function ReadFS(fs) {
            this._images = {};
            this._state = {};
            this.fs = fs;
        }
        Object.defineProperty(ReadFS.prototype, "fs", {
            /**
             * 基础文件系统
             */
            get: function () { return this._fs || feng3d.basefs; },
            set: function (v) { this._fs = v; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ReadFS.prototype, "type", {
            /**
             * 文件系统类型
             */
            get: function () { return this.fs.type; },
            enumerable: true,
            configurable: true
        });
        /**
         * 读取文件为ArrayBuffer
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        ReadFS.prototype.readArrayBuffer = function (path, callback) {
            this.fs.readArrayBuffer(path, callback);
        };
        /**
         * 读取文件为字符串
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        ReadFS.prototype.readString = function (path, callback) {
            this.fs.readString(path, callback);
        };
        /**
         * 读取文件为Object
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        ReadFS.prototype.readObject = function (path, callback) {
            this.fs.readObject(path, callback);
        };
        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        ReadFS.prototype.readImage = function (path, callback) {
            this.fs.readImage(path, callback);
            // functionwrap.wrapF(this.fs, this.fs.readImage, [path], callback);
        };
        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         */
        ReadFS.prototype.getAbsolutePath = function (path) {
            return this.fs.getAbsolutePath(path);
        };
        /**
         * 读取文件列表为字符串列表
         *
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        ReadFS.prototype.readStrings = function (paths, callback) {
            var _this = this;
            task.parallelResults(paths, function (path, callback) {
                _this.readString(path, function (err, str) {
                    callback(err || str);
                });
            }, callback);
        };
        return ReadFS;
    }());
    feng3d.ReadFS = ReadFS;
    feng3d.fs = new ReadFS();
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 可读写文件系统
     *
     * 扩展基础可读写文件系统
     */
    var ReadWriteFS = /** @class */ (function (_super) {
        __extends(ReadWriteFS, _super);
        function ReadWriteFS(fs) {
            return _super.call(this, fs) || this;
        }
        /**
         * 文件是否存在
         * @param path 文件路径
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.exists = function (path, callback) {
            this.fs.exists(path, callback);
        };
        /**
         * 读取文件夹中文件列表
         * @param path 路径
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.readdir = function (path, callback) {
            this.fs.readdir(path, callback);
        };
        /**
         * 新建文件夹
         * @param path 文件夹路径
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.mkdir = function (path, callback) {
            var _this = this;
            path = pathUtils.normalizeDir(path);
            this.fs.exists(path, function (exists) {
                if (exists) {
                    callback && callback(null);
                    return;
                }
                _this.fs.mkdir(path, callback);
            });
        };
        /**
         * 删除文件
         * @param path 文件路径
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.deleteFile = function (path, callback) {
            this.fs.deleteFile(path, callback);
        };
        /**
         * 写(新建)文件
         * 自动根据文件类型保存为对应结构
         *
         * @param path 文件路径
         * @param arraybuffer 文件数据
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.writeFile = function (path, arraybuffer, callback) {
            var _this = this;
            var ext = feng3d.pathUtils.getExtension(path);
            ext = ext.split(".").pop();
            var fileTypedic = { "meta": "txt", "json": "object", "jpg": "arraybuffer", "png": "arraybuffer", "mp3": "arraybuffer", "js": "txt", "ts": "txt", "map": "txt", "html": "txt" };
            var type = fileTypedic[ext];
            if (path == "tsconfig.json" || path == ".vscode/settings.json")
                type = "txt";
            if (type == "txt") {
                dataTransform.arrayBufferToString(arraybuffer, function (str) {
                    _this.fs.writeString(path, str, function (err) {
                        callback(err);
                    });
                });
            }
            else if (type == "object") {
                dataTransform.arrayBufferToObject(arraybuffer, function (obj) {
                    _this.fs.writeObject(path, obj, function (err) {
                        callback(err);
                    });
                });
            }
            else if (type == "arraybuffer") {
                this.writeArrayBuffer(path, arraybuffer, function (err) {
                    callback(err);
                });
            }
            else {
                console.error("\u65E0\u6CD5\u5BFC\u5165\u6587\u4EF6 " + path);
            }
        };
        /**
         * 写ArrayBuffer(新建)文件
         * @param path 文件路径
         * @param arraybuffer 文件数据
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.writeArrayBuffer = function (path, arraybuffer, callback) {
            var _this = this;
            // 如果所属文件夹不存在则新建
            var dirpath = pathUtils.getParentPath(path);
            this.mkdir(dirpath, function (err) {
                if (err) {
                    callback && callback(err);
                    return;
                }
                _this.fs.writeArrayBuffer(path, arraybuffer, callback);
            });
        };
        /**
         * 写字符串到(新建)文件
         * @param path 文件路径
         * @param str 文件数据
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.writeString = function (path, str, callback) {
            var _this = this;
            // 如果所属文件夹不存在则新建
            var dirpath = pathUtils.getParentPath(path);
            this.mkdir(dirpath, function (err) {
                if (err) {
                    callback && callback(err);
                    return;
                }
                _this.fs.writeString(path, str, callback);
            });
        };
        /**
         * 写Object到(新建)文件
         * @param path 文件路径
         * @param object 文件数据
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.writeObject = function (path, object, callback) {
            var _this = this;
            // 如果所属文件夹不存在则新建
            var dirpath = pathUtils.getParentPath(path);
            this.mkdir(dirpath, function (err) {
                if (err) {
                    callback && callback(err);
                    return;
                }
                _this.fs.writeObject(path, object, callback);
            });
        };
        /**
         * 写图片
         * @param path 图片路径
         * @param image 图片
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.writeImage = function (path, image, callback) {
            var _this = this;
            // 如果所属文件夹不存在则新建
            var dirpath = pathUtils.getParentPath(path);
            this.mkdir(dirpath, function (err) {
                if (err) {
                    callback && callback(err);
                    return;
                }
                _this.fs.writeImage(path, image, callback);
            });
        };
        /**
         * 复制文件
         * @param src    源路径
         * @param dest    目标路径
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.copyFile = function (src, dest, callback) {
            this.fs.copyFile(src, dest, callback);
        };
        /**
         * 是否为文件夹
         *
         * @param path 文件路径
         * @param callback 完成回调
         */
        ReadWriteFS.prototype.isDirectory = function (path, callback) {
            this.fs.isDirectory(path, callback);
        };
        /**
         * 初始化项目
         * @param projectname 项目名称
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.initproject = function (projectname, callback) {
            this.fs.initproject(projectname, callback);
        };
        /**
         * 是否存在指定项目
         * @param projectname 项目名称
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.hasProject = function (projectname, callback) {
            this.fs.hasProject(projectname, callback);
        };
        /**
         * 获取指定文件下所有文件路径列表
         */
        ReadWriteFS.prototype.getAllPathsInFolder = function (dirpath, callback) {
            var _this = this;
            if (dirpath === void 0) { dirpath = ""; }
            var dirs = [dirpath];
            var result = [];
            var currentdir = "";
            // 递归获取文件
            var handle = function () {
                if (dirs.length > 0) {
                    currentdir = dirs.shift();
                    _this.readdir(currentdir, function (err, files) {
                        // 获取子文件路径
                        var getChildPath = function () {
                            if (files.length == 0) {
                                handle();
                                return;
                            }
                            var childpath = currentdir + (currentdir == "" ? "" : "/") + files.shift();
                            result.push(childpath);
                            _this.isDirectory(childpath, function (result) {
                                if (result)
                                    dirs.push(childpath);
                                getChildPath();
                            });
                        };
                        getChildPath();
                    });
                }
                else {
                    callback(null, result);
                }
            };
            handle();
        };
        /**
         * 移动文件
         * @param src 源路径
         * @param dest 目标路径
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.moveFile = function (src, dest, callback) {
            var _this = this;
            this.copyFile(src, dest, function (err) {
                if (err) {
                    callback && callback(err);
                    return;
                }
                _this.deleteFile(src, callback);
            });
        };
        /**
         * 重命名文件
         * @param oldPath 老路径
         * @param newPath 新路径
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.renameFile = function (oldPath, newPath, callback) {
            this.moveFile(oldPath, newPath, callback);
        };
        /**
         * 移动一组文件
         * @param movelists 移动列表
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.moveFiles = function (movelists, callback) {
            var _this = this;
            this.copyFiles(movelists.concat(), function (err) {
                if (err) {
                    callback && callback(err);
                    return;
                }
                var deletelists = movelists.reduce(function (value, current) { value.push(current[0]); return value; }, []);
                _this.deleteFiles(deletelists, callback);
            });
        };
        /**
         * 复制一组文件
         * @param copylists 复制列表
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.copyFiles = function (copylists, callback) {
            var _this = this;
            if (copylists.length > 0) {
                var copyitem = copylists.shift();
                this.copyFile(copyitem[0], copyitem[1], function (err) {
                    if (err) {
                        callback && callback(err);
                        return;
                    }
                    _this.copyFiles(copylists, callback);
                });
                return;
            }
            callback && callback(null);
        };
        /**
         * 删除一组文件
         * @param deletelists 删除列表
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.deleteFiles = function (deletelists, callback) {
            var _this = this;
            if (deletelists.length > 0) {
                this.deleteFile(deletelists.shift(), function (err) {
                    if (err) {
                        callback && callback(err);
                        return;
                    }
                    _this.deleteFiles(deletelists, callback);
                });
                return;
            }
            callback && callback(null);
        };
        /**
         * 重命名文件(夹)
         * @param oldPath 老路径
         * @param newPath 新路径
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.rename = function (oldPath, newPath, callback) {
            var _this = this;
            this.isDirectory(oldPath, function (result) {
                if (result) {
                    _this.getAllPathsInFolder(oldPath, function (err, filepaths) {
                        if (err) {
                            callback && callback(err);
                            return;
                        }
                        var renamelists = [[oldPath, newPath]];
                        filepaths.forEach(function (element) {
                            renamelists.push([element, element.replace(oldPath, newPath)]);
                        });
                        _this.moveFiles(renamelists, callback);
                    });
                }
                else {
                    _this.renameFile(oldPath, newPath, callback);
                }
            });
        };
        /**
         * 移动文件(夹)
         *
         * @param src 源路径
         * @param dest 目标路径
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.move = function (src, dest, callback) {
            this.rename(src, dest, callback);
        };
        /**
         * 删除文件(夹)
         * @param path 路径
         * @param callback 回调函数
         */
        ReadWriteFS.prototype.delete = function (path, callback) {
            var _this = this;
            this.isDirectory(path, function (result) {
                if (result) {
                    _this.getAllPathsInFolder(path, function (err, filepaths) {
                        if (err) {
                            callback && callback(err);
                            return;
                        }
                        var removelists = filepaths.concat(path);
                        _this.deleteFiles(removelists, callback);
                    });
                }
                else {
                    _this.deleteFile(path, callback);
                }
            });
        };
        return ReadWriteFS;
    }(feng3d.ReadFS));
    feng3d.ReadWriteFS = ReadWriteFS;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 用于是否为文件夹
     */
    var directorytoken = "!!!___directory___!!!";
    /**
     * 索引数据文件系统
     */
    var IndexedDBFS = /** @class */ (function () {
        function IndexedDBFS(DBname, projectname) {
            if (DBname === void 0) { DBname = "feng3d-editor"; }
            if (projectname === void 0) { projectname = "testproject"; }
            this.DBname = DBname;
            this.projectname = projectname;
        }
        Object.defineProperty(IndexedDBFS.prototype, "type", {
            get: function () {
                return feng3d.FSType.indexedDB;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        IndexedDBFS.prototype.readArrayBuffer = function (path, callback) {
            feng3d._indexedDB.objectStoreGet(this.DBname, this.projectname, path, function (err, data) {
                if (err) {
                    callback(err, data);
                    return;
                }
                if (data instanceof ArrayBuffer) {
                    callback(null, data);
                }
                else if (data instanceof Object) {
                    var str = JSON.stringify(data, null, '\t').replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
                    var arraybuffer = dataTransform.stringToArrayBuffer(str);
                    callback(null, arraybuffer);
                }
                else {
                    var arraybuffer = dataTransform.stringToArrayBuffer(data);
                    callback(null, arraybuffer);
                }
            });
        };
        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        IndexedDBFS.prototype.readString = function (path, callback) {
            feng3d._indexedDB.objectStoreGet(this.DBname, this.projectname, path, function (err, data) {
                if (err) {
                    callback(err, data);
                    return;
                }
                if (data instanceof ArrayBuffer) {
                    dataTransform.arrayBufferToString(data, function (str) {
                        callback(null, str);
                    });
                }
                else if (data instanceof Object) {
                    var str = JSON.stringify(data, null, '\t').replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
                    callback(null, str);
                }
                else {
                    callback(null, data);
                }
            });
        };
        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        IndexedDBFS.prototype.readObject = function (path, callback) {
            feng3d._indexedDB.objectStoreGet(this.DBname, this.projectname, path, function (err, data) {
                if (err) {
                    callback(err, data);
                    return;
                }
                if (data instanceof ArrayBuffer) {
                    dataTransform.arrayBufferToString(data, function (str) {
                        var obj = JSON.parse(str);
                        callback(null, obj);
                    });
                }
                else if (data instanceof Object) {
                    callback(null, data);
                }
                else {
                    console.assert(typeof data == "string");
                    var obj = JSON.parse(data);
                    callback(null, obj);
                }
            });
        };
        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        IndexedDBFS.prototype.readImage = function (path, callback) {
            this.readArrayBuffer(path, function (err, data) {
                if (err) {
                    callback(err, null);
                    return;
                }
                dataTransform.arrayBufferToImage(data, function (img) {
                    callback(null, img);
                });
            });
        };
        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         * @param callback 回调函数
         */
        IndexedDBFS.prototype.getAbsolutePath = function (path) {
            return path;
        };
        /**
         * 是否为文件夹
         *
         * @param path 文件路径
         * @param callback 完成回调
         */
        IndexedDBFS.prototype.isDirectory = function (path, callback) {
            this.readString(path, function (err, data) {
                callback(data == directorytoken);
            });
        };
        /**
         * 文件是否存在
         * @param path 文件路径
         * @param callback 回调函数
         */
        IndexedDBFS.prototype.exists = function (path, callback) {
            feng3d._indexedDB.objectStoreGet(this.DBname, this.projectname, path, function (err, data) {
                callback(!!data);
            });
        };
        /**
         * 读取文件夹中文件列表
         * @param path 路径
         * @param callback 回调函数
         */
        IndexedDBFS.prototype.readdir = function (path, callback) {
            feng3d._indexedDB.getAllKeys(this.DBname, this.projectname, function (err, allfilepaths) {
                if (!allfilepaths) {
                    callback(err, null);
                    return;
                }
                var subfilemap = {};
                allfilepaths.forEach(function (element) {
                    var dirp = path == "" ? path : (path + "/");
                    if (element.substr(0, dirp.length) == dirp && element != path) {
                        var result = element.substr(dirp.length);
                        var subfile = result.split("/").shift();
                        subfilemap[subfile] = 1;
                    }
                });
                var files = Object.keys(subfilemap);
                callback(null, files);
            });
        };
        /**
         * 新建文件夹
         * @param path 文件夹路径
         * @param callback 回调函数
         */
        IndexedDBFS.prototype.mkdir = function (path, callback) {
            var _this = this;
            this.exists(path, function (exists) {
                if (exists) {
                    callback(new Error("\u6587\u4EF6\u5939" + path + "\u5DF2\u5B58\u5728\u65E0\u6CD5\u65B0\u5EFA"));
                    return;
                }
                feng3d._indexedDB.objectStorePut(_this.DBname, _this.projectname, path, directorytoken, callback);
            });
        };
        /**
         * 删除文件
         * @param path 文件路径
         * @param callback 回调函数
         */
        IndexedDBFS.prototype.deleteFile = function (path, callback) {
            // 删除文件
            feng3d._indexedDB.objectStoreDelete(this.DBname, this.projectname, path, callback);
            globalDispatcher.dispatch("fs.delete", path);
        };
        /**
         * 写文件
         * @param path 文件路径
         * @param data 文件数据
         * @param callback 回调函数
         */
        IndexedDBFS.prototype.writeArrayBuffer = function (path, data, callback) {
            feng3d._indexedDB.objectStorePut(this.DBname, this.projectname, path, data, callback);
            globalDispatcher.dispatch("fs.write", path);
        };
        /**
         * 写文件
         * @param path 文件路径
         * @param data 文件数据
         * @param callback 回调函数
         */
        IndexedDBFS.prototype.writeString = function (path, data, callback) {
            feng3d._indexedDB.objectStorePut(this.DBname, this.projectname, path, data, callback);
            globalDispatcher.dispatch("fs.write", path);
        };
        /**
         * 写文件
         * @param path 文件路径
         * @param object 文件数据
         * @param callback 回调函数
         */
        IndexedDBFS.prototype.writeObject = function (path, object, callback) {
            feng3d._indexedDB.objectStorePut(this.DBname, this.projectname, path, object, callback);
            globalDispatcher.dispatch("fs.write", path);
        };
        /**
         * 写图片
         * @param path 图片路径
         * @param image 图片
         * @param callback 回调函数
         */
        IndexedDBFS.prototype.writeImage = function (path, image, callback) {
            var _this = this;
            dataTransform.imageToArrayBuffer(image, function (arraybuffer) {
                _this.writeArrayBuffer(path, arraybuffer, callback);
                globalDispatcher.dispatch("fs.write", path);
            });
        };
        /**
         * 复制文件
         * @param src    源路径
         * @param dest    目标路径
         * @param callback 回调函数
         */
        IndexedDBFS.prototype.copyFile = function (src, dest, callback) {
            var _this = this;
            feng3d._indexedDB.objectStoreGet(this.DBname, this.projectname, src, function (err, data) {
                if (err) {
                    callback(err);
                    return;
                }
                feng3d._indexedDB.objectStorePut(_this.DBname, _this.projectname, dest, data, callback);
            });
        };
        /**
         * 是否存在指定项目
         * @param projectname 项目名称
         * @param callback 回调函数
         */
        IndexedDBFS.prototype.hasProject = function (projectname, callback) {
            feng3d._indexedDB.getObjectStoreNames(this.DBname, function (err, objectStoreNames) {
                if (err) {
                    callback(false);
                    return;
                }
                callback(objectStoreNames.indexOf(projectname) != -1);
            });
        };
        /**
         * 初始化项目
         * @param projectname 项目名称
         * @param callback 回调函数
         */
        IndexedDBFS.prototype.initproject = function (projectname, callback) {
            this.projectname = projectname;
            feng3d._indexedDB.createObjectStore(this.DBname, projectname, callback);
        };
        return IndexedDBFS;
    }());
    feng3d.IndexedDBFS = IndexedDBFS;
    feng3d.indexedDBFS = new IndexedDBFS();
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Http可读文件系统
     */
    var HttpFS = /** @class */ (function () {
        function HttpFS(rootPath) {
            if (rootPath === void 0) { rootPath = ""; }
            /**
             * 根路径
             */
            this.rootPath = "";
            this.type = feng3d.FSType.http;
            this.rootPath = rootPath;
            if (this.rootPath == "") {
                if (typeof document != "undefined") {
                    this.rootPath = document.URL.substring(0, document.URL.lastIndexOf("/") + 1);
                }
            }
        }
        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        HttpFS.prototype.readArrayBuffer = function (path, callback) {
            // rootPath
            loader.loadBinary(this.getAbsolutePath(path), function (content) {
                callback(null, content);
            }, null, function (e) {
                callback(e, null);
            });
        };
        /**
         * 读取文件为字符串
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        HttpFS.prototype.readString = function (path, callback) {
            loader.loadText(this.getAbsolutePath(path), function (content) {
                callback(null, content);
            }, null, function (e) {
                callback(e, null);
            });
        };
        /**
         * 读取文件为Object
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        HttpFS.prototype.readObject = function (path, callback) {
            loader.loadText(this.getAbsolutePath(path), function (content) {
                var obj = JSON.parse(content);
                callback(null, obj);
            }, null, function (e) {
                callback(e, null);
            });
        };
        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        HttpFS.prototype.readImage = function (path, callback) {
            var img = new Image();
            img.onload = function () {
                callback(null, img);
            };
            img.onerror = function (evt) {
                callback(new Error("\u52A0\u8F7D\u56FE\u7247" + path + "\u5931\u8D25"), null);
            };
            img.src = this.getAbsolutePath(path);
        };
        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         * @param callback 回调函数
         */
        HttpFS.prototype.getAbsolutePath = function (path) {
            return this.rootPath + path;
        };
        return HttpFS;
    }());
    feng3d.HttpFS = HttpFS;
    feng3d.basefs = new HttpFS();
})(feng3d || (feng3d = {}));
//# sourceMappingURL=fs.js.map