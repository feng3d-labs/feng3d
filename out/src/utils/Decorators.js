var feng3d;
(function (feng3d) {
    /**
     * 观察装饰器，观察被装饰属性的变化
     *
     * *对使用watch修饰的属性赋值比未使用的性能差距100倍左右*
     * @param onChange 属性变化回调
     */
    function watch(onChange) {
        return function (target, propertyKey) {
            console.assert(target[onChange], "\u5BF9\u8C61 " + target + " \u4E2D\u672A\u627E\u5230\u65B9\u6CD5 " + onChange);
            var key = "_" + propertyKey;
            Object.defineProperty(target, propertyKey, {
                get: function () {
                    return this[key];
                },
                set: function (value) {
                    if (this[key] === value) {
                        return;
                    }
                    var oldValue = this[key];
                    var newValue = this[key] = value;
                    target[onChange].apply(this, [propertyKey, oldValue, newValue]);
                },
                enumerable: true,
                configurable: true
            });
        };
    }
    feng3d.watch = watch;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=Decorators.js.map