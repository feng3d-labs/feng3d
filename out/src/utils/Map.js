var feng3d;
(function (feng3d) {
    /**
     * 构建Map类代替Dictionary
     * @author feng 2017-01-03
     */
    var Map = (function () {
        function Map() {
            this.kv = [];
        }
        /**
         * 删除
         */
        Map.prototype.delete = function (k) {
            for (var i = this.kv.length - 1; i >= 0; i--) {
                if (k == this.kv[i].k) {
                    this.kv.splice(i, 1);
                }
            }
        };
        /**
         * 添加映射
         */
        Map.prototype.push = function (k, v) {
            this.delete(k);
            this.kv.push({ k: k, v: v });
        };
        /**
         * 通过key获取value
         */
        Map.prototype.get = function (k) {
            var v;
            this.kv.forEach(function (element) {
                if (element.k == k)
                    v = element.v;
            });
            return v;
        };
        /**
         * 获取键列表
         */
        Map.prototype.getKeys = function () {
            var keys = [];
            this.kv.forEach(function (element) {
                keys.push(element.k);
            });
            return keys;
        };
        /**
         * 清理字典
         */
        Map.prototype.clear = function () {
            this.kv.length = 0;
        };
        return Map;
    }());
    feng3d.Map = Map;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=Map.js.map