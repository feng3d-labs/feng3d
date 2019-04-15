var feng3d;
(function (feng3d) {
    /**
     * 是否开启调试
     */
    feng3d.debuger = true;
    /**
     * 调试工具
     */
    var Debug = /** @class */ (function () {
        function Debug() {
            // 断言失败前进入断点调试
            feng3d.functionwarp.wrap(console, "assert", function (test) { if (!test)
                debugger; });
            // 输出错误前进入断点调试
            feng3d.functionwarp.wrap(console, "error", function () { debugger; });
        }
        /**
         * 测试代码运行时间
         * @param fn 被测试的方法
         * @param labal 标签
         */
        Debug.prototype.time = function (fn, labal) {
            labal = labal || fn["name"] || "Anonymous function " + Math.random();
            console.time(labal);
            fn();
            console.timeEnd(labal);
        };
        return Debug;
    }());
    feng3d.Debug = Debug;
    feng3d.debug = new Debug();
})(feng3d || (feng3d = {}));
//# sourceMappingURL=index.js.map
console.log("@feng3d/debug-0.0.2");
(function universalModuleDefinition(root, factory)
{
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define([], factory);
    else if (typeof exports === 'object')
        exports["@feng3d/debug"] = factory();
    else
        root["@feng3d/debug"] = factory();
    
    var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
    globalObject["feng3d"] = factory();
})(this, function ()
{
    return feng3d;
});
