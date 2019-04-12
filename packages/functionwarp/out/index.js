var feng3d;
(function (feng3d) {
    /**
     * 函数经
     *
     * 包装函数，以及对应的拆包
     */
    var FunctionWarp = /** @class */ (function () {
        function FunctionWarp() {
        }
        /**
         * 包装函数
         *
         * 一般用于调试
         * 使用场景示例：
         * 1. 在函数执行前后记录时间来计算函数执行时间。
         * 1. 在console.error调用前使用 debugger 进行断点调试。
         *
         * @param space 函数所属对象或者原型
         * @param funcName 函数名称
         * @param pf 在函数执行前执行的函数
         * @param nf 在函数执行后执行的函数
         */
        FunctionWarp.prototype.wrap = function (space, funcName, pf, nf) {
            if (pf == undefined && nf == undefined)
                return;
            var oldlog = space[funcName];
            space[funcName] = function () {
                pf && pf(this, arguments);
                oldlog.apply(this, arguments);
                nf && nf(this, arguments);
            };
        };
        return FunctionWarp;
    }());
    feng3d.FunctionWarp = FunctionWarp;
    feng3d.functionwarp = new FunctionWarp();
})(feng3d || (feng3d = {}));
//# sourceMappingURL=index.js.map
(function universalModuleDefinition(root, factory)
{
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define([], factory);
    else if (typeof exports === 'object')
        exports["@feng3d/functionwarp"] = factory();
    else
        root["@feng3d/functionwarp"] = factory();
    
    var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
    globalObject["feng3d"] = factory();
})(this, function ()
{
    return feng3d;
});
