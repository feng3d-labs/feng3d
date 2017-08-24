var feng3d;
(function (feng3d) {
    var ArrayList = (function () {
        function ArrayList(source) {
            if (source === void 0) { source = null; }
            this._source = source || [];
            this._eventDispatcher = new feng3d.Event();
        }
        Object.defineProperty(ArrayList.prototype, "length", {
            /**
             * 此集合中的项目数。
             */
            get: function () {
                return this._source.length;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 向列表末尾添加指定项目。
         */
        ArrayList.prototype.addItem = function (item) {
            this.addItemAt(item, this._source.length);
        };
        /**
         * 在指定的索引处添加项目。
         */
        ArrayList.prototype.addItemAt = function (item, index) {
            if (item instanceof Array) {
                for (var i = item.length - 1; i >= 0; i--) {
                    this.addItemAt(item[i], index);
                }
            }
            else {
                this._source.splice(index, 0, item);
                if (item instanceof feng3d.Event) {
                    var _listenermap = feng3d.Event["listenermap"][this._eventDispatcher["uuid"]];
                    for (var type in _listenermap) {
                        var listenerVOs = _listenermap[type];
                        for (var i = 0; i < listenerVOs.length; i++) {
                            var element = listenerVOs[i];
                            item.on(type, element.listener, element.thisObject, element.priority);
                        }
                    }
                }
            }
        };
        /**
         * 获取指定索引处的项目。
         */
        ArrayList.prototype.getItemAt = function (index) {
            return this._source[index];
        };
        /**
         * 如果项目位于列表中（这样的话 getItemAt(index) == item），则返回该项目的索引。
         */
        ArrayList.prototype.getItemIndex = function (item) {
            return this._source.indexOf(item);
        };
        /**
         * 删除列表中的所有项目。
         */
        ArrayList.prototype.removeAll = function () {
            while (this._source.length > 0) {
                this.removeItemAt(this._source.length - 1);
            }
        };
        /**
         * 删除指定项目。
         */
        ArrayList.prototype.removeItem = function (item) {
            if (item instanceof Array) {
                for (var i = item.length - 1; i >= 0; i--) {
                    this.removeItem(item[i]);
                }
            }
            else {
                var index = this.getItemIndex(item);
                if (index > -1)
                    this.removeItemAt(index);
            }
        };
        /**
         * 删除指定索引处的项目并返回该项目。
         */
        ArrayList.prototype.removeItemAt = function (index) {
            var item = this._source.splice(index, 1)[0];
            if (item instanceof feng3d.Event) {
                var _listenermap = feng3d.Event["listenermap"][this._eventDispatcher["uuid"]];
                for (var type in _listenermap) {
                    var listenerVOs = _listenermap[type];
                    for (var i = 0; i < listenerVOs.length; i++) {
                        var element = listenerVOs[i];
                        item.off(type, element.listener, element.thisObject);
                    }
                }
            }
            return item;
        };
        /**
         * 在指定的索引处放置项目。
         */
        ArrayList.prototype.setItemAt = function (item, index) {
            var deleteItem = this.removeItemAt(index);
            this.addItemAt(item, index);
            return deleteItem;
        };
        /**
         * 返回与 IList 实现的填充顺序相同的 Array。
         */
        ArrayList.prototype.toArray = function () {
            return this._source.concat();
        };
        /**
         * 添加项事件
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        ArrayList.prototype.addItemEventListener = function (type, listener, thisObject, priority) {
            if (priority === void 0) { priority = 0; }
            this._eventDispatcher.on(type, listener, thisObject, priority);
            for (var i = 0; i < this._source.length; i++) {
                var item = this._source[i];
                if (item instanceof feng3d.Event) {
                    item.on(type, listener, thisObject, priority);
                }
            }
        };
        /**
         * 移除项事件
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        ArrayList.prototype.removeItemEventListener = function (type, listener, thisObject) {
            this._eventDispatcher.off(type, listener, thisObject);
            for (var i = 0; i < this._source.length; i++) {
                var item = this._source[i];
                if (item instanceof feng3d.Event) {
                    item.off(type, listener, thisObject);
                }
            }
        };
        return ArrayList;
    }());
    feng3d.ArrayList = ArrayList;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=ArrayList.js.map