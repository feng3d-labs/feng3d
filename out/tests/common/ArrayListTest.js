var feng3d;
(function (feng3d) {
    var ArrayListTest = (function () {
        function ArrayListTest() {
            this.testLength();
            this.testAddItem();
            this.testAddItemAt();
            this.testGetItemAt();
            this.testGetItemIndex();
            this.testRemoveAll();
            this.testRemoveItem();
            this.testRemoveItemAt();
            this.testSetItemAt();
            this.testToArray();
            this.testAddItemEventListener();
            this.testRemoveItemEventListener();
        }
        /**
         * 此集合中的项目数。
         */
        ArrayListTest.prototype.testLength = function () {
            var arr = [1, 2];
            var arrayList = new feng3d.ArrayList(arr);
            console.assert(arr.length == arrayList.length);
        };
        /**
         * 向列表末尾添加指定项目。
         */
        ArrayListTest.prototype.testAddItem = function () {
            var arr = [1, 2];
            var arrayList = new feng3d.ArrayList();
            arrayList.addItem(1);
            arrayList.addItem(arr);
            console.assert(arrayList.length == arr.length + 1);
        };
        /**
         * 在指定的索引处添加项目。
         */
        ArrayListTest.prototype.testAddItemAt = function () {
            var arrayList = new feng3d.ArrayList();
            var arr = [];
            for (var i = 0; i < 10; i++) {
                arrayList.addItemAt(i, i);
            }
            for (var i = 0; i < 10; i++) {
                console.assert(arrayList.getItemAt(i) == i);
            }
        };
        /**
         * 获取指定索引处的项目。
         */
        ArrayListTest.prototype.testGetItemAt = function () {
            var arrayList = new feng3d.ArrayList();
            var arr = [];
            for (var i = 0; i < 10; i++) {
                arrayList.addItemAt(i, i);
            }
            for (var i = 0; i < 10; i++) {
                console.assert(arrayList.getItemAt(i) == i);
            }
        };
        /**
         * 如果项目位于列表中（这样的话 getItemAt(index) == item），则返回该项目的索引。
         */
        ArrayListTest.prototype.testGetItemIndex = function () {
            var arrayList = new feng3d.ArrayList();
            var arr = [];
            for (var i = 0; i < 10; i++) {
                arrayList.addItemAt(i, i);
            }
            for (var i = 0; i < 10; i++) {
                console.assert(arrayList.getItemIndex(i) == i);
            }
        };
        /**
         * 删除列表中的所有项目。
         */
        ArrayListTest.prototype.testRemoveAll = function () {
            var arr = [1, 2, 1, 4];
            var arrayList = new feng3d.ArrayList(arr);
            console.assert(arr.length == arrayList.length);
            arrayList.removeAll();
            console.assert(0 == arrayList.length);
        };
        /**
         * 删除指定项目。
         */
        ArrayListTest.prototype.testRemoveItem = function () {
            var arr = [1, 2, 1, 4];
            var arrayList = new feng3d.ArrayList(arr.concat());
            for (var i = 0; i < arr.length; i++) {
                var element = arr[i];
                arrayList.removeItem(element);
            }
            console.assert(0 == arrayList.length);
        };
        /**
         * 删除指定索引处的项目并返回该项目。
         */
        ArrayListTest.prototype.testRemoveItemAt = function () {
            var arr = [1, 2, 1, 4];
            var arrayList = new feng3d.ArrayList(arr.concat());
            for (var i = arr.length - 1; i >= 0; i--) {
                arrayList.removeItemAt(i);
            }
            console.assert(0 == arrayList.length);
        };
        /**
         * 在指定的索引处放置项目。
         */
        ArrayListTest.prototype.testSetItemAt = function () {
            var arr = [1, 2, 1, 4];
            var arrayList = new feng3d.ArrayList(arr.concat());
            for (var i = arr.length - 1; i >= 0; i--) {
                arrayList.setItemAt(0, i);
            }
            for (var i = arr.length - 1; i >= 0; i--) {
                console.assert(0 == arrayList.getItemAt(i));
            }
        };
        /**
         * 返回与 IList 实现的填充顺序相同的 Array。
         */
        ArrayListTest.prototype.testToArray = function () {
            var arr = [1, 2, 1, 4];
            var arrayList = new feng3d.ArrayList(arr.concat());
            var arr1 = arrayList.toArray();
            for (var i = arr.length - 1; i >= 0; i--) {
                console.assert(arr1[i] == arr[i]);
            }
        };
        /**
         * 添加项事件
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        ArrayListTest.prototype.testAddItemEventListener = function () {
            var arrayList = new feng3d.ArrayList();
            var changeItem;
            arrayList.addItemEventListener("change", function (event) {
                changeItem = event.target;
            }, null);
            var eventDispatcher = new feng3d.Event();
            arrayList.addItem(eventDispatcher);
            eventDispatcher.dispatch("change");
            console.assert(eventDispatcher == changeItem);
        };
        /**
         * 移除项事件
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        ArrayListTest.prototype.testRemoveItemEventListener = function () {
            var arrayList = new feng3d.ArrayList();
            var changeItem;
            var onChange = function (event) {
                changeItem = event.target;
            };
            arrayList.addItemEventListener("change", onChange, null);
            var eventDispatcher = new feng3d.Event();
            arrayList.addItem(eventDispatcher);
            eventDispatcher.dispatch("change");
            console.assert(eventDispatcher == changeItem);
            changeItem = null;
            arrayList.removeItemEventListener("change", onChange, null);
            eventDispatcher.dispatch("change");
            console.assert(null === changeItem);
        };
        return ArrayListTest;
    }());
    feng3d.ArrayListTest = ArrayListTest;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=ArrayListTest.js.map