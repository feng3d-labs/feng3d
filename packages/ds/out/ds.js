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
    /**
     * 比较器
     */
    var Comparator = /** @class */ (function () {
        /**
         * 构建比较器
         * @param compareFunction 比较函数
         */
        function Comparator(compareFunction) {
            this.compare = compareFunction || Comparator.defaultCompareFunction;
        }
        /**
         * 默认比较函数。只能处理 a和b 同为string或number的比较。
         *
         * @param a 比较值a
         * @param b 比较值b
         */
        Comparator.defaultCompareFunction = function (a, b) {
            if (a === b)
                return 0;
            return a < b ? -1 : 1;
        };
        /**
         * 检查 a 是否等于 b 。
         *
         * @param a 值a
         * @param b 值b
         */
        Comparator.prototype.equal = function (a, b) {
            return this.compare(a, b) === 0;
        };
        /**
         * 检查 a 是否小于 b 。
         *
         * @param a 值a
         * @param b 值b
         */
        Comparator.prototype.lessThan = function (a, b) {
            return this.compare(a, b) < 0;
        };
        /**
         * 检查 a 是否大于 b 。
         *
         * @param a 值a
         * @param b 值b
         */
        Comparator.prototype.greaterThan = function (a, b) {
            return this.compare(a, b) > 0;
        };
        /**
         * 检查 a 是否小于等于 b 。
         *
         * @param a 值a
         * @param b 值b
         */
        Comparator.prototype.lessThanOrEqual = function (a, b) {
            return this.lessThan(a, b) || this.equal(a, b);
        };
        /**
         * 检查 a 是否大于等于 b 。
         *
         * @param a 值a
         * @param b 值b
         */
        Comparator.prototype.greaterThanOrEqual = function (a, b) {
            return this.greaterThan(a, b) || this.equal(a, b);
        };
        /**
         * 反转比较函数。
         */
        Comparator.prototype.reverse = function () {
            var compareOriginal = this.compare;
            this.compare = function (a, b) { return compareOriginal(b, a); };
        };
        return Comparator;
    }());
    feng3d.Comparator = Comparator;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 链表
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/linked-list/LinkedList.js
     */
    var LinkedList = /** @class */ (function () {
        /**
         * 构建双向链表
         *
         * @param comparatorFunction 比较函数
         */
        function LinkedList(comparatorFunction) {
            this.head = null;
            this.tail = null;
            this.compare = new feng3d.Comparator(comparatorFunction);
        }
        /**
         * 是否为空
         */
        LinkedList.prototype.isEmpty = function () {
            return !this.head;
        };
        /**
         * 清空
         */
        LinkedList.prototype.empty = function () {
            this.head = null;
            this.tail = null;
        };
        /**
         * 获取表头值
         */
        LinkedList.prototype.getHeadValue = function () {
            return this.head && this.head.value;
        };
        /**
         * 添加新结点到表头
         *
         * @param value 结点数据
         */
        LinkedList.prototype.addHead = function (value) {
            var newNode = { value: value, next: this.head };
            this.head = newNode;
            if (!this.tail)
                this.tail = newNode;
            return this;
        };
        /**
         * 添加新结点到表尾
         *
         * @param value 结点数据
         */
        LinkedList.prototype.addTail = function (value) {
            var newNode = { value: value, next: null };
            if (this.tail)
                this.tail.next = newNode;
            this.tail = newNode;
            if (!this.head)
                this.head = newNode;
            return this;
        };
        /**
         * 删除链表中第一个与指定值相等的结点
         *
         * @param value 结点值
         */
        LinkedList.prototype.delete = function (value) {
            if (!this.head)
                return null;
            var deletedNode = null;
            // 从表头删除结点
            while (this.head && !deletedNode && this.compare.equal(this.head.value, value)) {
                deletedNode = this.head;
                this.head = this.head.next;
            }
            var currentNode = this.head;
            if (!deletedNode && currentNode) {
                // 删除相等的下一个结点
                while (!deletedNode && currentNode.next) {
                    if (this.compare.equal(currentNode.next.value, value)) {
                        deletedNode = currentNode.next;
                        currentNode.next = currentNode.next.next;
                    }
                    else {
                        currentNode = currentNode.next;
                    }
                }
            }
            // currentNode 是否为表尾
            if (currentNode == null || currentNode.next == null) {
                this.tail = currentNode;
            }
            return deletedNode;
        };
        /**
         * 删除链表中所有与指定值相等的结点
         *
         * @param value 结点值
         */
        LinkedList.prototype.deleteAll = function (value) {
            if (!this.head)
                return null;
            var deletedNode = null;
            // 从表头删除结点
            while (this.head && this.compare.equal(this.head.value, value)) {
                deletedNode = this.head;
                this.head = this.head.next;
            }
            var currentNode = this.head;
            if (currentNode !== null) {
                // 删除相等的下一个结点
                while (currentNode.next) {
                    if (this.compare.equal(currentNode.next.value, value)) {
                        deletedNode = currentNode.next;
                        currentNode.next = currentNode.next.next;
                    }
                    else {
                        currentNode = currentNode.next;
                    }
                }
            }
            // currentNode 是否为表尾
            if (currentNode == null || currentNode.next == null) {
                this.tail = currentNode;
            }
            return deletedNode;
        };
        /**
         * 查找与结点值相等的结点
         *
         * @param value 结点值
         */
        LinkedList.prototype.find = function (value) {
            if (!this.head)
                return null;
            var currentNode = this.head;
            while (currentNode) {
                if (this.compare.equal(currentNode.value, value))
                    return currentNode;
                currentNode = currentNode.next;
            }
            return null;
        };
        /**
         * 查找与结点值相等的结点
         *
         * @param callback 判断是否为查找的元素
         */
        LinkedList.prototype.findByFunc = function (callback) {
            if (!this.head)
                return null;
            var currentNode = this.head;
            while (currentNode) {
                if (callback(currentNode.value))
                    return currentNode;
                currentNode = currentNode.next;
            }
            return null;
        };
        /**
         * 删除表头
         *
         * 删除链表前面的元素(链表的头)并返回元素值。如果队列为空，则返回null。
         */
        LinkedList.prototype.deleteHead = function () {
            if (!this.head)
                return null;
            var deletedHead = this.head;
            if (this.head.next) {
                this.head = this.head.next;
            }
            else {
                this.head = null;
                this.tail = null;
            }
            return deletedHead.value;
        };
        /**
         * 删除表尾
         */
        LinkedList.prototype.deleteTail = function () {
            if (!this.tail)
                return null;
            var deletedTail = this.tail;
            if (this.head === this.tail) {
                this.head = null;
                this.tail = null;
                return deletedTail.value;
            }
            // 遍历链表删除表尾
            var currentNode = this.head;
            while (currentNode.next) {
                if (!currentNode.next.next) {
                    currentNode.next = null;
                }
                else {
                    currentNode = currentNode.next;
                }
            }
            this.tail = currentNode;
            return deletedTail.value;
        };
        /**
         * 从数组中初始化链表
         *
         * @param values 结点值列表
         */
        LinkedList.prototype.fromArray = function (values) {
            var _this = this;
            this.empty();
            values.forEach(function (value) { return _this.addTail(value); });
            return this;
        };
        /**
         * 转换为数组
         */
        LinkedList.prototype.toArray = function () {
            var values = [];
            var currentNode = this.head;
            while (currentNode) {
                values.push(currentNode.value);
                currentNode = currentNode.next;
            }
            return values;
        };
        /**
         * 转换为字符串
         *
         * @param valueToString 值输出为字符串函数
         */
        LinkedList.prototype.toString = function (valueToString) {
            return this.toArray().map(function (value) { return valueToString ? valueToString(value) : "" + value; }).toString();
        };
        /**
         * 反转链表
         */
        LinkedList.prototype.reverse = function () {
            var currNode = this.head;
            var prevNode = null;
            var nextNode = null;
            while (currNode) {
                // 存储下一个结点
                nextNode = currNode.next;
                // 反转结点的next指向
                currNode.next = prevNode;
                // 存储上一个节点
                prevNode = currNode;
                // 遍历指针向后移动
                currNode = nextNode;
            }
            // 重置表头与表尾
            this.tail = this.head;
            this.head = prevNode;
            return this;
        };
        /**
         * 核查结构是否正确
         */
        LinkedList.prototype.checkStructure = function () {
            if (this.head) {
                var currNode = this.head;
                while (currNode.next) {
                    currNode = currNode.next;
                }
                return this.tail == currNode;
            }
            return !this.tail;
        };
        return LinkedList;
    }());
    feng3d.LinkedList = LinkedList;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 双向链表
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/doubly-linked-list/DoublyLinkedList.js
     */
    var DoublyLinkedList = /** @class */ (function () {
        /**
         * 构建双向链表
         *
         * @param comparatorFunction 比较函数
         */
        function DoublyLinkedList(comparatorFunction) {
            this.head = null;
            this.tail = null;
            this.compare = new feng3d.Comparator(comparatorFunction);
        }
        /**
         * 是否为空
         */
        DoublyLinkedList.prototype.isEmpty = function () {
            return !this.head;
        };
        /**
         * 清空
         */
        DoublyLinkedList.prototype.empty = function () {
            this.head = null;
            this.tail = null;
        };
        /**
         * 添加新结点到表头
         *
         * @param value 结点数据
         */
        DoublyLinkedList.prototype.addHead = function (value) {
            var newNode = { value: value, previous: null, next: this.head };
            if (this.head)
                this.head.previous = newNode;
            this.head = newNode;
            if (!this.tail)
                this.tail = newNode;
            return this;
        };
        /**
         * 添加新结点到表尾
         *
         * @param value 结点数据
         */
        DoublyLinkedList.prototype.addTail = function (value) {
            var newNode = { value: value, previous: this.tail, next: null };
            if (this.tail)
                this.tail.next = newNode;
            this.tail = newNode;
            if (!this.head)
                this.head = newNode;
            return this;
        };
        /**
         * 删除链表中第一个与指定值相等的结点
         *
         * @param value 结点值
         */
        DoublyLinkedList.prototype.delete = function (value) {
            if (!this.head)
                return null;
            var deletedNode = null;
            // 从表头删除结点
            while (this.head && !deletedNode && this.compare.equal(this.head.value, value)) {
                deletedNode = this.head;
                this.head = this.head.next;
                this.head.previous = null;
            }
            var currentNode = this.head;
            if (!deletedNode && currentNode) {
                // 删除相等的下一个结点
                while (!deletedNode && currentNode.next) {
                    if (this.compare.equal(currentNode.next.value, value)) {
                        deletedNode = currentNode.next;
                        currentNode.next = currentNode.next.next;
                        if (currentNode.next)
                            currentNode.next.previous = currentNode;
                    }
                    else {
                        currentNode = currentNode.next;
                    }
                }
            }
            // currentNode 是否为表尾
            if (currentNode == null || currentNode.next == null) {
                this.tail = currentNode;
            }
            return deletedNode;
        };
        /**
         * 删除链表中所有与指定值相等的结点
         *
         * @param value 结点值
         */
        DoublyLinkedList.prototype.deleteAll = function (value) {
            if (!this.head)
                return null;
            var deletedNode = null;
            // 从表头删除结点
            while (this.head && this.compare.equal(this.head.value, value)) {
                deletedNode = this.head;
                this.head = this.head.next;
                this.head.previous = null;
            }
            var currentNode = this.head;
            if (currentNode !== null) {
                // 删除相等的下一个结点
                while (currentNode.next) {
                    if (this.compare.equal(currentNode.next.value, value)) {
                        deletedNode = currentNode.next;
                        currentNode.next = currentNode.next.next;
                        if (currentNode.next)
                            currentNode.next.previous = currentNode;
                    }
                    else {
                        currentNode = currentNode.next;
                    }
                }
            }
            // currentNode 是否为表尾
            if (currentNode == null || currentNode.next == null) {
                this.tail = currentNode;
            }
            return deletedNode;
        };
        /**
         * 查找与结点值相等的结点
         *
         * @param value 结点值
         */
        DoublyLinkedList.prototype.find = function (value) {
            if (!this.head)
                return null;
            var currentNode = this.head;
            while (currentNode) {
                if (this.compare.equal(currentNode.value, value))
                    return currentNode;
                currentNode = currentNode.next;
            }
            return null;
        };
        /**
         * 查找与结点值相等的结点
         *
         * @param callback 判断是否为查找的元素
         */
        DoublyLinkedList.prototype.findByFunc = function (callback) {
            if (!this.head)
                return null;
            var currentNode = this.head;
            while (currentNode) {
                if (callback(currentNode.value))
                    return currentNode;
                currentNode = currentNode.next;
            }
            return null;
        };
        /**
         * 删除表头
         */
        DoublyLinkedList.prototype.deleteHead = function () {
            if (!this.head)
                return undefined;
            var deletedHead = this.head;
            if (this.head.next) {
                this.head = this.head.next;
                this.head.previous = null;
            }
            else {
                this.head = null;
                this.tail = null;
            }
            return deletedHead.value;
        };
        /**
         * 删除表尾
         */
        DoublyLinkedList.prototype.deleteTail = function () {
            if (!this.tail)
                return undefined;
            var deletedTail = this.tail;
            if (this.head === this.tail) {
                this.head = null;
                this.tail = null;
                return deletedTail.value;
            }
            this.tail = this.tail.previous;
            this.tail.next = null;
            return deletedTail.value;
        };
        /**
         * 从数组中初始化链表
         *
         * @param values 结点值列表
         */
        DoublyLinkedList.prototype.fromArray = function (values) {
            var _this = this;
            this.empty();
            values.forEach(function (value) { return _this.addTail(value); });
            return this;
        };
        /**
         * 转换为数组
         */
        DoublyLinkedList.prototype.toArray = function () {
            var values = [];
            var currentNode = this.head;
            while (currentNode) {
                values.push(currentNode.value);
                currentNode = currentNode.next;
            }
            return values;
        };
        /**
         * 转换为字符串
         * @param valueToString 值输出为字符串函数
         */
        DoublyLinkedList.prototype.toString = function (valueToString) {
            return this.toArray().map(function (value) { return valueToString ? valueToString(value) : "" + value; }).toString();
        };
        /**
         * 反转链表
         */
        DoublyLinkedList.prototype.reverse = function () {
            var currNode = this.head;
            var prevNode = null;
            var nextNode = null;
            while (currNode) {
                // 存储当前结点的next与previous指向
                nextNode = currNode.next;
                prevNode = currNode.previous;
                // 反转结点的next与previous指向
                currNode.next = prevNode;
                currNode.previous = nextNode;
                // 存储上一个节点
                prevNode = currNode;
                // 遍历指针向后移动
                currNode = nextNode;
            }
            // 重置表头与表尾
            this.tail = this.head;
            this.head = prevNode;
            return this;
        };
        /**
         * 核查结构是否正确
         */
        DoublyLinkedList.prototype.checkStructure = function () {
            if (this.head) {
                // 核查正向链表
                var currNode = this.head;
                while (currNode.next) {
                    currNode = currNode.next;
                }
                if (this.tail !== currNode)
                    return false;
                // 核查逆向链表
                currNode = this.tail;
                while (currNode.previous) {
                    currNode = currNode.previous;
                }
                return this.head == currNode;
            }
            return !this.tail;
        };
        return DoublyLinkedList;
    }());
    feng3d.DoublyLinkedList = DoublyLinkedList;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 队列，只能从后面进，前面出
     * 使用单向链表实现
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/queue/Queue.js
     */
    var Queue = /** @class */ (function () {
        /**
         * 构建队列
         *
         * @param comparatorFunction 比较函数
         */
        function Queue() {
            this.linkedList = new feng3d.LinkedList();
        }
        /**
         * 是否为空
         */
        Queue.prototype.isEmpty = function () {
            return this.linkedList.isEmpty();
        };
        /**
         * 清空
         */
        Queue.prototype.empty = function () {
            this.linkedList.empty();
        };
        /**
         * 读取队列前面的元素，但不删除它。
         */
        Queue.prototype.peek = function () {
            return this.linkedList.getHeadValue();
        };
        /**
         * 入队
         *
         * 在队列的末尾(链表的尾部)添加一个新元素。
         * 这个元素将在它前面的所有元素之后被处理。
         *
         * @param value 元素值
         */
        Queue.prototype.enqueue = function (value) {
            this.linkedList.addTail(value);
            return this;
        };
        /**
         * 出队
         *
         * 删除队列前面的元素(链表的头)。如果队列为空，则返回null。
         */
        Queue.prototype.dequeue = function () {
            var removedValue = this.linkedList.deleteHead();
            return removedValue;
        };
        /**
         * 转换为字符串
         *
         * @param valueToString 值输出为字符串函数
         */
        Queue.prototype.toString = function (valueToString) {
            return this.linkedList.toString(valueToString);
        };
        return Queue;
    }());
    feng3d.Queue = Queue;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 栈
     *
     * 后进先出
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/stack/Stack.js
     */
    var Stack = /** @class */ (function () {
        function Stack() {
            this.linkedList = new feng3d.LinkedList();
        }
        /**
         * 是否为空
         */
        Stack.prototype.isEmpty = function () {
            return this.linkedList.isEmpty();
        };
        /**
         * 查看第一个元素值
         */
        Stack.prototype.peek = function () {
            return this.linkedList.getHeadValue();
        };
        /**
         * 入栈
         *
         * @param value 元素值
         */
        Stack.prototype.push = function (value) {
            this.linkedList.addHead(value);
            return this;
        };
        /**
         * 出栈
         */
        Stack.prototype.pop = function () {
            return this.linkedList.deleteHead();
        };
        /**
         * 转换为数组
         */
        Stack.prototype.toArray = function () {
            return this.linkedList.toArray();
        };
        /**
         * 转换为字符串
         *
         * @param valueToString 值输出为字符串函数
         */
        Stack.prototype.toString = function (valueToString) {
            return this.linkedList.toString(valueToString);
        };
        return Stack;
    }());
    feng3d.Stack = Stack;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 堆
     *
     * 最小和最大堆的父类。
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/heap/Heap.js
     */
    var Heap = /** @class */ (function () {
        /**
         * 构建链表
         *
         * @param comparatorFunction 比较函数
         */
        function Heap(comparatorFunction) {
            var _newTarget = this.constructor;
            if (_newTarget === Heap) {
                throw new TypeError('无法直接构造堆实例');
            }
            this.heapContainer = [];
            this.compare = new feng3d.Comparator(comparatorFunction);
        }
        /**
         * 获取左边子结点索引
         *
         * @param parentIndex 父结点索引
         */
        Heap.prototype.getLeftChildIndex = function (parentIndex) {
            return (2 * parentIndex) + 1;
        };
        /**
         * 获取右边子结点索引
         *
         * @param parentIndex 父结点索引
         */
        Heap.prototype.getRightChildIndex = function (parentIndex) {
            return (2 * parentIndex) + 2;
        };
        /**
         * 获取父结点索引
         *
         * @param childIndex 子结点索引
         */
        Heap.prototype.getParentIndex = function (childIndex) {
            return Math.floor((childIndex - 1) / 2);
        };
        /**
         * 是否有父结点
         *
         * @param childIndex 子结点索引
         */
        Heap.prototype.hasParent = function (childIndex) {
            return this.getParentIndex(childIndex) >= 0;
        };
        /**
         * 是否有左结点
         *
         * @param parentIndex 父结点索引
         */
        Heap.prototype.hasLeftChild = function (parentIndex) {
            return this.getLeftChildIndex(parentIndex) < this.heapContainer.length;
        };
        /**
         * 是否有右结点
         *
         * @param parentIndex 父结点索引
         */
        Heap.prototype.hasRightChild = function (parentIndex) {
            return this.getRightChildIndex(parentIndex) < this.heapContainer.length;
        };
        /**
         * 获取左结点
         *
         * @param parentIndex 父结点索引
         */
        Heap.prototype.leftChild = function (parentIndex) {
            return this.heapContainer[this.getLeftChildIndex(parentIndex)];
        };
        /**
         * 获取右结点
         *
         * @param parentIndex 父结点索引
         */
        Heap.prototype.rightChild = function (parentIndex) {
            return this.heapContainer[this.getRightChildIndex(parentIndex)];
        };
        /**
         * 获取父结点
         *
         * @param childIndex 子结点索引
         */
        Heap.prototype.parent = function (childIndex) {
            return this.heapContainer[this.getParentIndex(childIndex)];
        };
        /**
         * 交换两个结点数据
         *
         * @param index1 索引1
         * @param index2 索引2
         */
        Heap.prototype.swap = function (index1, index2) {
            var tmp = this.heapContainer[index2];
            this.heapContainer[index2] = this.heapContainer[index1];
            this.heapContainer[index1] = tmp;
        };
        /**
         * 查看堆顶数据
         */
        Heap.prototype.peek = function () {
            if (this.heapContainer.length === 0)
                return null;
            return this.heapContainer[0];
        };
        /**
         * 出堆
         *
         * 取出堆顶元素
         */
        Heap.prototype.poll = function () {
            if (this.heapContainer.length === 0)
                return null;
            if (this.heapContainer.length === 1)
                return this.heapContainer.pop();
            var item = this.heapContainer[0];
            // 将最后一个元素从末尾移动到堆顶。
            this.heapContainer[0] = this.heapContainer.pop();
            this.heapifyDown();
            return item;
        };
        /**
         * 新增元素
         *
         * @param item 元素
         */
        Heap.prototype.add = function (item) {
            this.heapContainer.push(item);
            this.heapifyUp();
            return this;
        };
        /**
         * 移除所有指定元素
         *
         * @param item 元素
         * @param comparator 比较器
         */
        Heap.prototype.remove = function (item, comparator) {
            if (comparator === void 0) { comparator = this.compare; }
            // 找到要删除的项的数量。
            var numberOfItemsToRemove = this.find(item, comparator).length;
            for (var iteration = 0; iteration < numberOfItemsToRemove; iteration += 1) {
                // 获取一个删除元素索引
                var indexToRemove = this.find(item, comparator).pop();
                // 删除元素为最后一个索引时
                if (indexToRemove === (this.heapContainer.length - 1)) {
                    this.heapContainer.pop();
                }
                else {
                    // 把数组最后元素移动到删除位置
                    this.heapContainer[indexToRemove] = this.heapContainer.pop();
                    var parentItem = this.parent(indexToRemove);
                    if (this.hasLeftChild(indexToRemove)
                        && (!parentItem
                            || this.pairIsInCorrectOrder(parentItem, this.heapContainer[indexToRemove]))) {
                        this.heapifyDown(indexToRemove);
                    }
                    else {
                        this.heapifyUp(indexToRemove);
                    }
                }
            }
            return this;
        };
        /**
         * 查找元素所在所有索引
         *
         * @param item 查找的元素
         * @param comparator 比较器
         */
        Heap.prototype.find = function (item, comparator) {
            if (comparator === void 0) { comparator = this.compare; }
            var foundItemIndices = [];
            for (var itemIndex = 0; itemIndex < this.heapContainer.length; itemIndex += 1) {
                if (comparator.equal(item, this.heapContainer[itemIndex])) {
                    foundItemIndices.push(itemIndex);
                }
            }
            return foundItemIndices;
        };
        /**
         * 是否为空
         */
        Heap.prototype.isEmpty = function () {
            return !this.heapContainer.length;
        };
        /**
         * 转换为字符串
         */
        Heap.prototype.toString = function () {
            return this.heapContainer.toString();
        };
        /**
         * 堆冒泡
         *
         * @param startIndex 堆冒泡起始索引
         */
        Heap.prototype.heapifyUp = function (startIndex) {
            var currentIndex = startIndex || this.heapContainer.length - 1;
            while (this.hasParent(currentIndex)
                && !this.pairIsInCorrectOrder(this.parent(currentIndex), this.heapContainer[currentIndex])) {
                this.swap(currentIndex, this.getParentIndex(currentIndex));
                currentIndex = this.getParentIndex(currentIndex);
            }
        };
        /**
         * 堆下沉
         *
         * @param startIndex 堆下沉起始索引
         */
        Heap.prototype.heapifyDown = function (startIndex) {
            if (startIndex === void 0) { startIndex = 0; }
            var currentIndex = startIndex;
            var nextIndex = null;
            while (this.hasLeftChild(currentIndex)) {
                if (this.hasRightChild(currentIndex)
                    && this.pairIsInCorrectOrder(this.rightChild(currentIndex), this.leftChild(currentIndex))) {
                    nextIndex = this.getRightChildIndex(currentIndex);
                }
                else {
                    nextIndex = this.getLeftChildIndex(currentIndex);
                }
                if (this.pairIsInCorrectOrder(this.heapContainer[currentIndex], this.heapContainer[nextIndex])) {
                    break;
                }
                this.swap(currentIndex, nextIndex);
                currentIndex = nextIndex;
            }
        };
        return Heap;
    }());
    feng3d.Heap = Heap;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 最大堆
     *
     * 所有父结点都大于子结点
     */
    var MaxHeap = /** @class */ (function (_super) {
        __extends(MaxHeap, _super);
        function MaxHeap() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * 检查堆元素对的顺序是否正确。
         * 对于MinHeap，第一个元素必须总是小于等于。
         * 对于MaxHeap，第一个元素必须总是大于或等于。
         *
         * @param firstElement 第一个元素
         * @param secondElement 第二个元素
         */
        MaxHeap.prototype.pairIsInCorrectOrder = function (firstElement, secondElement) {
            return this.compare.greaterThanOrEqual(firstElement, secondElement);
        };
        return MaxHeap;
    }(feng3d.Heap));
    feng3d.MaxHeap = MaxHeap;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 最小堆
     *
     * 所有父结点都小于子结点
     */
    var MinHeap = /** @class */ (function (_super) {
        __extends(MinHeap, _super);
        function MinHeap() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * 检查堆元素对的顺序是否正确。
         * 对于MinHeap，第一个元素必须总是小于等于。
         * 对于MaxHeap，第一个元素必须总是大于或等于。
         *
         * @param firstElement 第一个元素
         * @param secondElement 第二个元素
         */
        MinHeap.prototype.pairIsInCorrectOrder = function (firstElement, secondElement) {
            return this.compare.lessThanOrEqual(firstElement, secondElement);
        };
        return MinHeap;
    }(feng3d.Heap));
    feng3d.MinHeap = MinHeap;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 默认哈希表 （建议使用Object代替）
     *
     * 哈希表的大小直接影响冲突的次数。
     * 哈希表的大小越大，冲突就越少。
     */
    var defaultHashTableSize = 32;
    /**
     * 哈希表（散列表）
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/hash-table/HashTable.js
     */
    var HashTable = /** @class */ (function () {
        /**
         * 构建哈希表
         * @param hashTableSize 哈希表尺寸
         */
        function HashTable(hashTableSize) {
            if (hashTableSize === void 0) { hashTableSize = defaultHashTableSize; }
            this.buckets = [];
            for (var i = 0; i < hashTableSize; i++) {
                this.buckets.push(new feng3d.LinkedList());
            }
            this.keys = {};
        }
        /**
         * 将字符串键转换为哈希数。
         *
         * @param key 字符串键
         */
        HashTable.prototype.hash = function (key) {
            var hash = key.split("").reduce(function (hashAccumulator, char) { return (hashAccumulator + char.charCodeAt(0)); }, 0);
            return hash % this.buckets.length;
        };
        /**
         * 设置值
         *
         * @param key 键
         * @param value 值
         */
        HashTable.prototype.set = function (key, value) {
            var keyValue = { key: key, value: value };
            var keyHash = this.hash(key);
            this.keys[key] = keyHash;
            var bucketLinkedList = this.buckets[keyHash];
            var node = bucketLinkedList.findByFunc(function (v) { return v.key === key; });
            if (!node) {
                bucketLinkedList.addTail(keyValue);
            }
            else {
                node.value.value = value;
            }
        };
        /**
         * 删除指定键以及对于值
         *
         * @param key 键
         */
        HashTable.prototype.delete = function (key) {
            var keyHash = this.hash(key);
            delete this.keys[key];
            var bucketLinkedList = this.buckets[keyHash];
            var node = bucketLinkedList.findByFunc(function (v) { return v.key === key; });
            if (node) {
                return bucketLinkedList.deleteAll(node.value);
            }
            return null;
        };
        /**
         * 获取与键对应的值
         *
         * @param key 键
         */
        HashTable.prototype.get = function (key) {
            var bucketLinkedList = this.buckets[this.hash(key)];
            var node = bucketLinkedList.findByFunc(function (v) { return v.key === key; });
            return node ? node.value.value : undefined;
        };
        /**
         * 是否拥有键
         *
         * @param key 键
         */
        HashTable.prototype.has = function (key) {
            return Object.hasOwnProperty.call(this.keys, key);
        };
        /**
         * 获取键列表
         */
        HashTable.prototype.getKeys = function () {
            return Object.keys(this.keys);
        };
        return HashTable;
    }());
    feng3d.HashTable = HashTable;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 优先队列
     *
     * 所有元素按优先级排序
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/priority-queue/PriorityQueue.js
     */
    var PriorityQueue = /** @class */ (function () {
        /**
         * 构建优先数组
         * @param   compare     比较函数
         */
        function PriorityQueue(compare) {
            this.items = [];
            this.compare = compare;
        }
        Object.defineProperty(PriorityQueue.prototype, "length", {
            /**
             * 队列长度
             */
            get: function () {
                return this.items.length;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(PriorityQueue.prototype, "compare", {
            /**
             * 比较函数
             */
            get: function () {
                return this._compare;
            },
            set: function (v) {
                this._compare = v;
                this.items.sort(this._compare);
            },
            enumerable: false,
            configurable: true
        });
        /**
         * 尾部添加元素（进队）
         * @param items 元素列表
         * @returns 长度
         */
        PriorityQueue.prototype.push = function () {
            var _this = this;
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            items.forEach(function (item) {
                var insert = Array.binarySearchInsert(_this.items, item, _this._compare);
                _this.items.splice(insert, 0, item);
            });
            return this.items.length;
        };
        /**
         * 头部移除元素（出队）
         */
        PriorityQueue.prototype.shift = function () {
            return this.items.shift();
        };
        /**
         * 转换为数组
         */
        PriorityQueue.prototype.toArray = function () {
            return this.items.concat();
        };
        /**
         * 从数组初始化链表
         */
        PriorityQueue.prototype.fromArray = function (array) {
            this.items = array.concat();
            this.items.sort(this._compare);
        };
        return PriorityQueue;
    }());
    feng3d.PriorityQueue = PriorityQueue;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 优先队列
     *
     * 与最小堆相同，只是与元素比较时不同
     * 我们考虑的不是元素的值，而是它的优先级。
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/priority-queue/PriorityQueue.js
     */
    var PriorityQueue1 = /** @class */ (function (_super) {
        __extends(PriorityQueue1, _super);
        function PriorityQueue1() {
            var _this = _super.call(this) || this;
            _this.priorities = {};
            _this.compare = new feng3d.Comparator(_this.comparePriority.bind(_this));
            return _this;
        }
        /**
         * 新增元素
         *
         * @param item 元素
         * @param priority 优先级
         */
        PriorityQueue1.prototype.add = function (item, priority) {
            if (priority === void 0) { priority = 0; }
            this.priorities[item] = priority;
            _super.prototype.add.call(this, item);
            return this;
        };
        /**
         * 移除元素
         *
         * @param item 元素
         * @param customFindingComparator 自定义查找比较器
         */
        PriorityQueue1.prototype.remove = function (item, customFindingComparator) {
            if (customFindingComparator === void 0) { customFindingComparator = this.compare; }
            _super.prototype.remove.call(this, item, customFindingComparator);
            delete this.priorities[item];
            return this;
        };
        /**
         * 改变元素优先级
         *
         * @param item 元素
         * @param priority 优先级
         */
        PriorityQueue1.prototype.changePriority = function (item, priority) {
            this.remove(item, new feng3d.Comparator(this.compareValue));
            this.add(item, priority);
            return this;
        };
        /**
         * 查找元素所在索引
         *
         * @param item 元素
         */
        PriorityQueue1.prototype.findByValue = function (item) {
            return this.find(item, new feng3d.Comparator(this.compareValue));
        };
        /**
         * 是否拥有元素
         *
         * @param item 元素
         */
        PriorityQueue1.prototype.hasValue = function (item) {
            return this.findByValue(item).length > 0;
        };
        /**
         * 比较两个元素优先级
         *
         * @param a 元素a
         * @param b 元素b
         */
        PriorityQueue1.prototype.comparePriority = function (a, b) {
            if (this.priorities[a] === this.priorities[b]) {
                return 0;
            }
            return this.priorities[a] < this.priorities[b] ? -1 : 1;
        };
        /**
         * 比较两个元素大小
         *
         * @param a 元素a
         * @param b 元素b
         */
        PriorityQueue1.prototype.compareValue = function (a, b) {
            if (a === b) {
                return 0;
            }
            return a < b ? -1 : 1;
        };
        return PriorityQueue1;
    }(feng3d.MinHeap));
    feng3d.PriorityQueue1 = PriorityQueue1;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 布隆过滤器 （ 在 JavaScript中 该类可由Object对象代替）
     *
     * 用于判断某元素是否可能插入
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/bloom-filter/BloomFilter.js
     * @see https://baike.baidu.com/item/%E5%B8%83%E9%9A%86%E8%BF%87%E6%BB%A4%E5%99%A8
     */
    var BloomFilter = /** @class */ (function () {
        /**
         *
         * @param size 尺寸
         */
        function BloomFilter(size) {
            if (size === void 0) { size = 100; }
            this.size = 100;
            this.size = size;
            this.storage = this.createStore(size);
        }
        /**
         * 插入
         *
         * @param item 元素
         */
        BloomFilter.prototype.insert = function (item) {
            var _this = this;
            var hashValues = this.getHashValues(item);
            hashValues.forEach(function (val) { return _this.storage.setValue(val); });
        };
        /**
         * 可能包含
         *
         * @param item 元素
         */
        BloomFilter.prototype.mayContain = function (item) {
            var hashValues = this.getHashValues(item);
            for (var hashIndex = 0; hashIndex < hashValues.length; hashIndex += 1) {
                if (!this.storage.getValue(hashValues[hashIndex])) {
                    // 我们知道项目肯定没有插入。
                    return false;
                }
            }
            // 项目可能已经插入，也可能没有插入。
            return true;
        };
        /**
         * 创建存储器
         * @param size 尺寸
         */
        BloomFilter.prototype.createStore = function (size) {
            var storage = [];
            // 初始化
            for (var storageCellIndex = 0; storageCellIndex < size; storageCellIndex += 1) {
                storage.push(false);
            }
            var storageInterface = {
                getValue: function (index) {
                    return storage[index];
                },
                setValue: function (index) {
                    storage[index] = true;
                },
            };
            return storageInterface;
        };
        /**
         * 计算哈希值1
         *
         * @param item 元素
         */
        BloomFilter.prototype.hash1 = function (item) {
            var hash = 0;
            for (var charIndex = 0; charIndex < item.length; charIndex += 1) {
                var char = item.charCodeAt(charIndex);
                hash = (hash << 5) + hash + char;
                hash &= hash; // Convert to 32bit integer
                hash = Math.abs(hash);
            }
            return hash % this.size;
        };
        /**
         * 计算哈希值2
         *
         * @param item 元素
         */
        BloomFilter.prototype.hash2 = function (item) {
            var hash = 5381;
            for (var charIndex = 0; charIndex < item.length; charIndex += 1) {
                var char = item.charCodeAt(charIndex);
                hash = (hash << 5) + hash + char; /* hash * 33 + c */
            }
            return Math.abs(hash % this.size);
        };
        /**
         * 计算哈希值3
         *
         * @param item 元素
         */
        BloomFilter.prototype.hash3 = function (item) {
            var hash = 0;
            for (var charIndex = 0; charIndex < item.length; charIndex += 1) {
                var char = item.charCodeAt(charIndex);
                hash = (hash << 5) - hash;
                hash += char;
                hash &= hash; // Convert to 32bit integer
            }
            return Math.abs(hash % this.size);
        };
        /**
         * 获取3个哈希值组成的数组
         */
        BloomFilter.prototype.getHashValues = function (item) {
            return [
                this.hash1(item),
                this.hash2(item),
                this.hash3(item),
            ];
        };
        return BloomFilter;
    }());
    feng3d.BloomFilter = BloomFilter;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 并查集
     *
     * 并查集是一种树型的数据结构，用于处理一些不交集（Disjoint Sets）的合并及查询问题。
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/disjoint-set/DisjointSet.js
     * @see https://en.wikipedia.org/wiki/Disjoint-set_data_structure
     * @see https://www.youtube.com/watch?v=wU6udHRIkcc&index=14&t=0s&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8
     */
    var DisjointSet = /** @class */ (function () {
        /**
         * 构建 并查集
         * @param keyCallback 计算键值函数
         */
        function DisjointSet(keyCallback) {
            this.keyCallback = keyCallback;
            this.items = {};
        }
        /**
         * 创建集合
         *
         * @param nodeValue 结点值
         */
        DisjointSet.prototype.makeSet = function (nodeValue) {
            var disjointSetItem = new DisjointSetNode(nodeValue, this.keyCallback);
            if (!this.items[disjointSetItem.getKey()]) {
                this.items[disjointSetItem.getKey()] = disjointSetItem;
            }
            return this;
        };
        /**
         * 查找给出值所在集合根结点键值
         *
         * @param nodeValue 结点值
         */
        DisjointSet.prototype.find = function (nodeValue) {
            var templateDisjointItem = new DisjointSetNode(nodeValue, this.keyCallback);
            var requiredDisjointItem = this.items[templateDisjointItem.getKey()];
            if (!requiredDisjointItem) {
                return null;
            }
            return requiredDisjointItem.getRoot().getKey();
        };
        /**
         * 合并两个值所在的集合
         *
         * @param valueA 值a
         * @param valueB 值b
         */
        DisjointSet.prototype.union = function (valueA, valueB) {
            var rootKeyA = this.find(valueA);
            var rootKeyB = this.find(valueB);
            if (rootKeyA === null || rootKeyB === null) {
                throw new Error('给出值不全在集合内');
            }
            if (rootKeyA === rootKeyB) {
                return this;
            }
            var rootA = this.items[rootKeyA];
            var rootB = this.items[rootKeyB];
            // 小集合合并到大集合中
            if (rootA.getRank() < rootB.getRank()) {
                rootB.addChild(rootA);
                return this;
            }
            rootA.addChild(rootB);
            return this;
        };
        /**
         * 判断两个值是否在相同集合中
         *
         * @param valueA 值A
         * @param valueB 值B
         */
        DisjointSet.prototype.inSameSet = function (valueA, valueB) {
            var rootKeyA = this.find(valueA);
            var rootKeyB = this.find(valueB);
            if (rootKeyA === null || rootKeyB === null) {
                throw new Error('给出的值不全在集合内');
            }
            return rootKeyA === rootKeyB;
        };
        return DisjointSet;
    }());
    feng3d.DisjointSet = DisjointSet;
    /**
     * 并查集结点
     */
    var DisjointSetNode = /** @class */ (function () {
        /**
         * 构建 并查集 项
         *
         * @param value 值
         * @param keyCallback 计算键值函数
         */
        function DisjointSetNode(value, keyCallback) {
            this.value = value;
            this.keyCallback = keyCallback;
            this.parent = null;
            this.children = {};
        }
        /**
         * 获取键值
         */
        DisjointSetNode.prototype.getKey = function () {
            if (this.keyCallback) {
                return this.keyCallback(this.value);
            }
            return this.value;
        };
        /**
         * 获取根结点
         */
        DisjointSetNode.prototype.getRoot = function () {
            return this.isRoot() ? this : this.parent.getRoot();
        };
        /**
         * 是否为根结点
         */
        DisjointSetNode.prototype.isRoot = function () {
            return this.parent === null;
        };
        /**
         * 获取所有子孙结点数量
         */
        DisjointSetNode.prototype.getRank = function () {
            if (this.getChildren().length === 0) {
                return 0;
            }
            var rank = 0;
            this.getChildren().forEach(function (child) {
                rank += 1;
                rank += child.getRank();
            });
            return rank;
        };
        /**
         * 获取子结点列表
         */
        DisjointSetNode.prototype.getChildren = function () {
            var _this = this;
            var values = Object.keys(this.children).map(function (key) { return _this.children[key]; });
            return values;
        };
        /**
         * 设置父结点
         * @param parentNode 父结点
         */
        DisjointSetNode.prototype.setParent = function (parentNode) {
            this.parent = parentNode;
            this.parent.children[this.getKey()] = this;
            return this;
        };
        /**
         * 添加子结点
         * @param childNode 子结点
         */
        DisjointSetNode.prototype.addChild = function (childNode) {
            this.children[childNode.getKey()] = childNode;
            childNode.parent = this;
            return this;
        };
        return DisjointSetNode;
    }());
    feng3d.DisjointSetNode = DisjointSetNode;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 图
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/graph/Graph.js
     * @see https://en.wikipedia.org/wiki/Graph_(abstract_data_type)
     * @see https://www.youtube.com/watch?v=gXgEDyodOJU&index=9&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8
     * @see https://www.youtube.com/watch?v=k1wraWzqtvQ&index=10&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8
     */
    var Graph = /** @class */ (function () {
        /**
         * 构建图
         *
         * @param isDirected 是否有向
         */
        function Graph(isDirected) {
            if (isDirected === void 0) { isDirected = false; }
            /**
             * 是否有向
             */
            this.isDirected = false;
            this.vertices = {};
            this.edges = {};
            this.isDirected = isDirected;
        }
        /**
         * 新增顶点
         *
         * @param newVertex 新顶点
         */
        Graph.prototype.addVertex = function (newVertex) {
            this.vertices[newVertex.getKey()] = newVertex;
            return this;
        };
        /**
         * 获取顶点
         *
         * @param vertexKey 顶点键值
         */
        Graph.prototype.getVertexByKey = function (vertexKey) {
            return this.vertices[vertexKey];
        };
        /**
         * 获取相邻点
         *
         * @param vertex 顶点
         */
        Graph.prototype.getNeighbors = function (vertex) {
            return vertex.getNeighbors();
        };
        /**
         * 获取所有顶点
         */
        Graph.prototype.getAllVertices = function () {
            var _this = this;
            var values = Object.keys(this.vertices).map(function (key) { return _this.vertices[key]; });
            return values;
        };
        /**
         * 获取所有边
         */
        Graph.prototype.getAllEdges = function () {
            var _this = this;
            var values = Object.keys(this.edges).map(function (key) { return _this.edges[key]; });
            return values;
        };
        /**
         * 新增边
         *
         * @param edge 边
         */
        Graph.prototype.addEdge = function (edge) {
            // 获取起点与终点
            var startVertex = this.getVertexByKey(edge.startVertex.getKey());
            var endVertex = this.getVertexByKey(edge.endVertex.getKey());
            // 新增不存在的起点
            if (!startVertex) {
                this.addVertex(edge.startVertex);
                startVertex = this.getVertexByKey(edge.startVertex.getKey());
            }
            // 新增不存在的终点
            if (!endVertex) {
                this.addVertex(edge.endVertex);
                endVertex = this.getVertexByKey(edge.endVertex.getKey());
            }
            // 新增边到边列表
            if (this.edges[edge.getKey()]) {
                throw new Error('指定边已经存在，无法再次添加');
            }
            else {
                this.edges[edge.getKey()] = edge;
            }
            // 新增边到顶点
            if (this.isDirected) {
                startVertex.addEdge(edge);
            }
            else {
                startVertex.addEdge(edge);
                endVertex.addEdge(edge);
            }
            return this;
        };
        /**
         * 删除边
         *
         * @param edge 边
         */
        Graph.prototype.deleteEdge = function (edge) {
            // 从列表中删除边
            if (this.edges[edge.getKey()]) {
                delete this.edges[edge.getKey()];
            }
            else {
                throw new Error('图中不存在指定边');
            }
            // 从起点与终点里删除边
            var startVertex = this.getVertexByKey(edge.startVertex.getKey());
            var endVertex = this.getVertexByKey(edge.endVertex.getKey());
            startVertex.deleteEdge(edge);
            endVertex.deleteEdge(edge);
        };
        /**
         * 查找边
         *
         * @param startVertex 起始顶点
         * @param endVertex 结束顶点
         */
        Graph.prototype.findEdge = function (startVertex, endVertex) {
            var vertex = this.getVertexByKey(startVertex.getKey());
            if (!vertex) {
                return null;
            }
            return vertex.findEdge(endVertex);
        };
        /**
         * 获取权重
         */
        Graph.prototype.getWeight = function () {
            return this.getAllEdges().reduce(function (weight, graphEdge) {
                return weight + graphEdge.weight;
            }, 0);
        };
        /**
         * 反转
         */
        Graph.prototype.reverse = function () {
            var _this = this;
            // 遍历边
            this.getAllEdges().forEach(function (edge) {
                // 删除边
                _this.deleteEdge(edge);
                // 反转边
                edge.reverse();
                // 新增边
                _this.addEdge(edge);
            });
            return this;
        };
        /**
         * 获取所有顶点索引
         */
        Graph.prototype.getVerticesIndices = function () {
            var verticesIndices = {};
            this.getAllVertices().forEach(function (vertex, index) {
                verticesIndices[vertex.getKey()] = index;
            });
            return verticesIndices;
        };
        /**
         * 获取邻接矩阵
         */
        Graph.prototype.getAdjacencyMatrix = function () {
            var _this = this;
            var vertices = this.getAllVertices();
            var verticesIndices = this.getVerticesIndices();
            // 初始化邻接矩阵
            var adjacencyMatrix = [];
            var n = vertices.length;
            for (var i = 0; i < n; i++) {
                adjacencyMatrix[i] = [];
                for (var j = 0; j < n; j++) {
                    adjacencyMatrix[i][j] = Infinity;
                }
            }
            // 填充邻接矩阵
            vertices.forEach(function (vertex, vertexIndex) {
                vertex.getNeighbors().forEach(function (neighbor) {
                    var neighborIndex = verticesIndices[neighbor.getKey()];
                    adjacencyMatrix[vertexIndex][neighborIndex] = _this.findEdge(vertex, neighbor).weight;
                });
            });
            return adjacencyMatrix;
        };
        /**
         * 转换为字符串
         */
        Graph.prototype.toString = function () {
            return Object.keys(this.vertices).toString();
        };
        return Graph;
    }());
    feng3d.Graph = Graph;
    /**
     * 图边
     */
    var GraphEdge = /** @class */ (function () {
        /**
         * 构建图边
         * @param startVertex 起始顶点
         * @param endVertex 结束顶点
         * @param weight 权重
         */
        function GraphEdge(startVertex, endVertex, weight) {
            if (weight === void 0) { weight = 0; }
            this.startVertex = startVertex;
            this.endVertex = endVertex;
            this.weight = weight;
        }
        /**
         * 获取键值
         */
        GraphEdge.prototype.getKey = function () {
            var startVertexKey = this.startVertex.getKey();
            var endVertexKey = this.endVertex.getKey();
            return startVertexKey + "_" + endVertexKey;
        };
        /**
         * 反转
         */
        GraphEdge.prototype.reverse = function () {
            var tmp = this.startVertex;
            this.startVertex = this.endVertex;
            this.endVertex = tmp;
            return this;
        };
        /**
         * 转换为字符串
         */
        GraphEdge.prototype.toString = function () {
            return this.getKey();
        };
        return GraphEdge;
    }());
    feng3d.GraphEdge = GraphEdge;
    /**
     * 图顶点
     */
    var GraphVertex = /** @class */ (function () {
        /**
         * 构建图顶点
         *
         * @param value 值
         */
        function GraphVertex(value) {
            var edgeComparator = function (edgeA, edgeB) {
                if (edgeA.getKey() === edgeB.getKey()) {
                    return 0;
                }
                return edgeA.getKey() < edgeB.getKey() ? -1 : 1;
            };
            this.value = value;
            this.edges = new feng3d.LinkedList(edgeComparator);
        }
        /**
         * 新增边
         *
         * @param edge 边
         */
        GraphVertex.prototype.addEdge = function (edge) {
            this.edges.addTail(edge);
            return this;
        };
        /**
         * 删除边
         *
         * @param edge 边
         */
        GraphVertex.prototype.deleteEdge = function (edge) {
            this.edges.delete(edge);
        };
        /**
         * 获取相邻顶点
         */
        GraphVertex.prototype.getNeighbors = function () {
            var _this = this;
            var edges = this.edges.toArray();
            var neighborsConverter = function (edge) {
                return edge.startVertex === _this ? edge.endVertex : edge.startVertex;
            };
            return edges.map(neighborsConverter);
        };
        /**
         * 获取边列表
         */
        GraphVertex.prototype.getEdges = function () {
            return this.edges.toArray();
        };
        /**
         * 获取边的数量
         */
        GraphVertex.prototype.getDegree = function () {
            return this.edges.toArray().length;
        };
        /**
         * 是否存在指定边
         *
         * @param requiredEdge 边
         */
        GraphVertex.prototype.hasEdge = function (requiredEdge) {
            var edgeNode = this.edges.findByFunc(function (edge) { return edge === requiredEdge; });
            return !!edgeNode;
        };
        /**
         * 是否有相邻顶点
         *
         * @param vertex 顶点
         */
        GraphVertex.prototype.hasNeighbor = function (vertex) {
            var vertexNode = this.edges.findByFunc(function (edge) { return edge.startVertex === vertex || edge.endVertex === vertex; });
            return !!vertexNode;
        };
        /**
         * 查找边
         *
         * @param vertex 顶点
         */
        GraphVertex.prototype.findEdge = function (vertex) {
            var edgeFinder = function (edge) {
                return edge.startVertex === vertex || edge.endVertex === vertex;
            };
            var edge = this.edges.findByFunc(edgeFinder);
            return edge ? edge.value : null;
        };
        /**
         * 获取键值
         */
        GraphVertex.prototype.getKey = function () {
            return this.value;
        };
        /**
         * 删除所有边
         */
        GraphVertex.prototype.deleteAllEdges = function () {
            var _this = this;
            this.getEdges().forEach(function (edge) { return _this.deleteEdge(edge); });
            return this;
        };
        /**
         * 转换为字符串
         *
         * @param callback 转换为字符串函数
         */
        GraphVertex.prototype.toString = function (callback) {
            return callback ? callback(this.value) : "" + this.value;
        };
        return GraphVertex;
    }());
    feng3d.GraphVertex = GraphVertex;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 二叉树结点
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/tree/BinaryTreeNode.js
     */
    var BinaryTreeNode = /** @class */ (function () {
        /**
         * 构建二叉树结点
         *
         * @param value 结点值
         */
        function BinaryTreeNode(value) {
            if (value === void 0) { value = null; }
            this.left = null;
            this.right = null;
            this.parent = null;
            this.value = value;
            this.meta = new feng3d.HashTable();
            this.nodeComparator = new feng3d.Comparator();
        }
        Object.defineProperty(BinaryTreeNode.prototype, "leftHeight", {
            /**
             * 左结点高度
             */
            get: function () {
                if (!this.left) {
                    return 0;
                }
                return this.left.height + 1;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BinaryTreeNode.prototype, "rightHeight", {
            /**
             * 右结点高度
             */
            get: function () {
                if (!this.right) {
                    return 0;
                }
                return this.right.height + 1;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BinaryTreeNode.prototype, "height", {
            /**
             * 高度
             */
            get: function () {
                return Math.max(this.leftHeight, this.rightHeight);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BinaryTreeNode.prototype, "balanceFactor", {
            /**
             * 平衡系数
             */
            get: function () {
                return this.leftHeight - this.rightHeight;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BinaryTreeNode.prototype, "uncle", {
            /**
             * 获取叔伯结点
             */
            get: function () {
                if (!this.parent) {
                    return undefined;
                }
                if (!this.parent.parent) {
                    return undefined;
                }
                // 判断祖父结点是否有两个子结点
                if (!(this.parent.parent.left && this.parent.parent.right)) {
                    return undefined;
                }
                // 现在我们知道当前节点有祖父结点，而这个祖父结点有两个子结点。让我们看看谁是叔叔。
                if (this.nodeComparator.equal(this.parent, this.parent.parent.left)) {
                    // 右边的是一个叔叔。
                    return this.parent.parent.right;
                }
                return this.parent.parent.left;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * 设置结点值
         *
         * @param value 值
         */
        BinaryTreeNode.prototype.setValue = function (value) {
            this.value = value;
            return this;
        };
        /**
         * 设置左结点
         *
         * @param node 结点
         */
        BinaryTreeNode.prototype.setLeft = function (node) {
            if (this.left) {
                this.left.parent = null;
            }
            this.left = node;
            if (this.left) {
                this.left.parent = this;
            }
            return this;
        };
        /**
         * 设置右结点
         *
         * @param node 结点
         */
        BinaryTreeNode.prototype.setRight = function (node) {
            if (this.right) {
                this.right.parent = null;
            }
            this.right = node;
            if (node) {
                this.right.parent = this;
            }
            return this;
        };
        /**
         * 移除子结点
         *
         * @param nodeToRemove 子结点
         */
        BinaryTreeNode.prototype.removeChild = function (nodeToRemove) {
            if (this.left && this.nodeComparator.equal(this.left, nodeToRemove)) {
                this.left = null;
                return true;
            }
            if (this.right && this.nodeComparator.equal(this.right, nodeToRemove)) {
                this.right = null;
                return true;
            }
            return false;
        };
        /**
         * 替换节点
         *
         * @param nodeToReplace 被替换的节点
         * @param replacementNode 替换后的节点
         */
        BinaryTreeNode.prototype.replaceChild = function (nodeToReplace, replacementNode) {
            if (!nodeToReplace || !replacementNode) {
                return false;
            }
            if (this.left && this.nodeComparator.equal(this.left, nodeToReplace)) {
                this.left = replacementNode;
                return true;
            }
            if (this.right && this.nodeComparator.equal(this.right, nodeToReplace)) {
                this.right = replacementNode;
                return true;
            }
            return false;
        };
        /**
         * 拷贝节点
         *
         * @param sourceNode 源节点
         * @param targetNode 目标节点
         */
        BinaryTreeNode.copyNode = function (sourceNode, targetNode) {
            targetNode.setValue(sourceNode.value);
            targetNode.setLeft(sourceNode.left);
            targetNode.setRight(sourceNode.right);
        };
        /**
         * 左序深度遍历
         */
        BinaryTreeNode.prototype.traverseInOrder = function () {
            var traverse = [];
            if (this.left) {
                traverse = traverse.concat(this.left.traverseInOrder());
            }
            traverse.push(this.value);
            if (this.right) {
                traverse = traverse.concat(this.right.traverseInOrder());
            }
            return traverse;
        };
        /**
         * 转换为字符串
         */
        BinaryTreeNode.prototype.toString = function () {
            return this.traverseInOrder().toString();
        };
        return BinaryTreeNode;
    }());
    feng3d.BinaryTreeNode = BinaryTreeNode;
})(feng3d || (feng3d = {}));
/// <reference path="./BinaryTreeNode.ts" />
var feng3d;
(function (feng3d) {
    /**
     * 二叉查找树结点
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/tree/binary-search-tree/BinarySearchTreeNode.js
     */
    var BinarySearchTreeNode = /** @class */ (function (_super) {
        __extends(BinarySearchTreeNode, _super);
        /**
         * 构建二叉查找树结点
         *
         * @param value 结点值
         * @param compareFunction 比较函数
         */
        function BinarySearchTreeNode(value, compareFunction) {
            var _this = _super.call(this, value) || this;
            _this.compareFunction = compareFunction;
            _this.nodeValueComparator = new feng3d.Comparator(compareFunction);
            return _this;
        }
        /**
         * 插入值
         *
         * @param value 值
         */
        BinarySearchTreeNode.prototype.insert = function (value) {
            if (this.nodeValueComparator.equal(this.value, null)) {
                this.value = value;
                return this;
            }
            if (this.nodeValueComparator.lessThan(value, this.value)) {
                // 插入到左结点
                if (this.left) {
                    return this.left.insert(value);
                }
                var newNode = new BinarySearchTreeNode(value, this.compareFunction);
                this.setLeft(newNode);
                return newNode;
            }
            if (this.nodeValueComparator.greaterThan(value, this.value)) {
                // 插入到右结点
                if (this.right) {
                    return this.right.insert(value);
                }
                var newNode = new BinarySearchTreeNode(value, this.compareFunction);
                this.setRight(newNode);
                return newNode;
            }
            return this;
        };
        /**
         * 查找结点
         *
         * @param value 值
         */
        BinarySearchTreeNode.prototype.find = function (value) {
            // 核查本结点是否为所查找结点
            if (this.nodeValueComparator.equal(this.value, value)) {
                return this;
            }
            if (this.nodeValueComparator.lessThan(value, this.value) && this.left) {
                // 从左结点中查找
                return this.left.find(value);
            }
            if (this.nodeValueComparator.greaterThan(value, this.value) && this.right) {
                // 从右结点中查找
                return this.right.find(value);
            }
            return null;
        };
        /**
         * 是否包含指定值
         *
         * @param value 结点值
         */
        BinarySearchTreeNode.prototype.contains = function (value) {
            return !!this.find(value);
        };
        /**
         * 移除指定值
         *
         * @param value 结点值
         */
        BinarySearchTreeNode.prototype.remove = function (value) {
            var nodeToRemove = this.find(value);
            if (!nodeToRemove) {
                throw new Error('无法查找到值对于的结点。');
            }
            var parent = nodeToRemove.parent;
            if (!nodeToRemove.left && !nodeToRemove.right) {
                // 删除叶子结点
                if (parent) {
                    parent.removeChild(nodeToRemove);
                }
                else {
                    // 节点没有父节点。只需清除当前节点值。
                    nodeToRemove.setValue(undefined);
                }
            }
            else if (nodeToRemove.left && nodeToRemove.right) {
                // 删除拥有两个子结点的结点
                // 查找下一个最大的值(右分支中的最小值)，并用下一个最大的值替换当前值节点。
                var nextBiggerNode = nodeToRemove.right.findMin();
                if (!this.nodeComparator.equal(nextBiggerNode, nodeToRemove.right)) {
                    this.remove(nextBiggerNode.value);
                    nodeToRemove.setValue(nextBiggerNode.value);
                }
                else {
                    //如果下一个右值是下一个更大的值，它没有左子节点，那么就用右节点替换要删除的节点。
                    nodeToRemove.setValue(nodeToRemove.right.value);
                    nodeToRemove.setRight(nodeToRemove.right.right);
                }
            }
            else {
                // 删除拥有一个子结点的结点
                // 使此子节点成为当前节点的父节点的一个子节点。
                var childNode = nodeToRemove.left || nodeToRemove.right;
                if (parent) {
                    parent.replaceChild(nodeToRemove, childNode);
                }
                else {
                    feng3d.BinaryTreeNode.copyNode(childNode, nodeToRemove);
                }
            }
            nodeToRemove.parent = null;
            return true;
        };
        /**
         * 查找最小值
         */
        BinarySearchTreeNode.prototype.findMin = function () {
            if (!this.left) {
                return this;
            }
            return this.left.findMin();
        };
        return BinarySearchTreeNode;
    }(feng3d.BinaryTreeNode));
    feng3d.BinarySearchTreeNode = BinarySearchTreeNode;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 二叉查找树
     *
     * 二叉查找树（英语：Binary Search Tree），也称为二叉搜索树、有序二叉树（ordered binary tree）或排序二叉树（sorted binary tree），是指一棵空树或者具有下列性质的二叉树：
     *
     * 1. 若任意节点的左子树不空，则左子树上所有节点的值均小于它的根节点的值；
     * 1. 若任意节点的右子树不空，则右子树上所有节点的值均大于它的根节点的值；
     * 1. 任意节点的左、右子树也分别为二叉查找树；
     * 1. 没有键值相等的节点。
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/tree/binary-search-tree/BinarySearchTree.js
     * @see https://en.wikipedia.org/wiki/Binary_search_tree
     * @see https://www.youtube.com/watch?v=wcIRPqTR3Kc&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8&index=9&t=0s
     */
    var BinarySearchTree = /** @class */ (function () {
        /**
         * 构建 二叉查找树
         *
         * @param nodeValueCompareFunction 结点值比较器
         */
        function BinarySearchTree(nodeValueCompareFunction) {
            this.root = new feng3d.BinarySearchTreeNode(null, nodeValueCompareFunction);
            // 从根节点中窃取节点比较器。
            this.nodeComparator = this.root.nodeComparator;
        }
        /**
         * 插入值
         *
         * @param value 值
         */
        BinarySearchTree.prototype.insert = function (value) {
            return this.root.insert(value);
        };
        /**
         * 是否包含指定值
         *
         * @param value 值
         */
        BinarySearchTree.prototype.contains = function (value) {
            return this.root.contains(value);
        };
        /**
         * 移除指定值
         *
         * @param value 值
         */
        BinarySearchTree.prototype.remove = function (value) {
            return this.root.remove(value);
        };
        /**
         * 转换为字符串
         */
        BinarySearchTree.prototype.toString = function () {
            return this.root.toString();
        };
        return BinarySearchTree;
    }());
    feng3d.BinarySearchTree = BinarySearchTree;
})(feng3d || (feng3d = {}));
/// <reference path="./BinarySearchTree.ts" />
var feng3d;
(function (feng3d) {
    /**
     * 平衡二叉树
     *
     * AVL树（以发明者Adelson-Velsky和Landis 命名）是自平衡二叉搜索树。
     *
     * @see https://github.com/trekhleb/javascript-algorithms/tree/master/src/data-structures/tree/avl-tree
     * @see https://en.wikipedia.org/wiki/AVL_tree
     * @see https://www.tutorialspoint.com/data_structures_algorithms/avl_tree_algorithm.htm
     * @see http://btechsmartclass.com/data_structures/avl-trees.html
     */
    var AvlTree = /** @class */ (function (_super) {
        __extends(AvlTree, _super);
        function AvlTree() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * @param {*} value
         */
        AvlTree.prototype.insert = function (value) {
            // Do the normal BST insert.
            _super.prototype.insert.call(this, value);
            // Let's move up to the root and check balance factors along the way.
            var currentNode = this.root.find(value);
            while (currentNode) {
                this.balance(currentNode);
                currentNode = currentNode.parent;
            }
        };
        /**
         * @param {*} value
         * @return {boolean}
         */
        AvlTree.prototype.remove = function (value) {
            // Do standard BST removal.
            var result = _super.prototype.remove.call(this, value);
            // Balance the tree starting from the root node.
            this.balance(this.root);
            return result;
        };
        /**
         * @param {BinarySearchTreeNode} node
         */
        AvlTree.prototype.balance = function (node) {
            // If balance factor is not OK then try to balance the node.
            if (node.balanceFactor > 1) {
                // Left rotation.
                if (node.left.balanceFactor > 0) {
                    // Left-Left rotation
                    this.rotateLeftLeft(node);
                }
                else if (node.left.balanceFactor < 0) {
                    // Left-Right rotation.
                    this.rotateLeftRight(node);
                }
            }
            else if (node.balanceFactor < -1) {
                // Right rotation.
                if (node.right.balanceFactor < 0) {
                    // Right-Right rotation
                    this.rotateRightRight(node);
                }
                else if (node.right.balanceFactor > 0) {
                    // Right-Left rotation.
                    this.rotateRightLeft(node);
                }
            }
        };
        /**
         * @param {BinarySearchTreeNode} rootNode
         */
        AvlTree.prototype.rotateLeftLeft = function (rootNode) {
            // Detach left node from root node.
            var leftNode = rootNode.left;
            rootNode.setLeft(null);
            // Make left node to be a child of rootNode's parent.
            if (rootNode.parent) {
                rootNode.parent.setLeft(leftNode);
            }
            else if (rootNode === this.root) {
                // If root node is root then make left node to be a new root.
                this.root = leftNode;
            }
            // If left node has a right child then detach it and
            // attach it as a left child for rootNode.
            if (leftNode.right) {
                rootNode.setLeft(leftNode.right);
            }
            // Attach rootNode to the right of leftNode.
            leftNode.setRight(rootNode);
        };
        /**
         * @param {BinarySearchTreeNode} rootNode
         */
        AvlTree.prototype.rotateLeftRight = function (rootNode) {
            // Detach left node from rootNode since it is going to be replaced.
            var leftNode = rootNode.left;
            rootNode.setLeft(null);
            // Detach right node from leftNode.
            var leftRightNode = leftNode.right;
            leftNode.setRight(null);
            // Preserve leftRightNode's left subtree.
            if (leftRightNode.left) {
                leftNode.setRight(leftRightNode.left);
                leftRightNode.setLeft(null);
            }
            // Attach leftRightNode to the rootNode.
            rootNode.setLeft(leftRightNode);
            // Attach leftNode as left node for leftRight node.
            leftRightNode.setLeft(leftNode);
            // Do left-left rotation.
            this.rotateLeftLeft(rootNode);
        };
        /**
         * @param {BinarySearchTreeNode} rootNode
         */
        AvlTree.prototype.rotateRightLeft = function (rootNode) {
            // Detach right node from rootNode since it is going to be replaced.
            var rightNode = rootNode.right;
            rootNode.setRight(null);
            // Detach left node from rightNode.
            var rightLeftNode = rightNode.left;
            rightNode.setLeft(null);
            if (rightLeftNode.right) {
                rightNode.setLeft(rightLeftNode.right);
                rightLeftNode.setRight(null);
            }
            // Attach rightLeftNode to the rootNode.
            rootNode.setRight(rightLeftNode);
            // Attach rightNode as right node for rightLeft node.
            rightLeftNode.setRight(rightNode);
            // Do right-right rotation.
            this.rotateRightRight(rootNode);
        };
        /**
         * @param {BinarySearchTreeNode} rootNode
         */
        AvlTree.prototype.rotateRightRight = function (rootNode) {
            // Detach right node from root node.
            var rightNode = rootNode.right;
            rootNode.setRight(null);
            // Make right node to be a child of rootNode's parent.
            if (rootNode.parent) {
                rootNode.parent.setRight(rightNode);
            }
            else if (rootNode === this.root) {
                // If root node is root then make right node to be a new root.
                this.root = rightNode;
            }
            // If right node has a left child then detach it and
            // attach it as a right child for rootNode.
            if (rightNode.left) {
                rootNode.setRight(rightNode.left);
            }
            // Attach rootNode to the left of rightNode.
            rightNode.setLeft(rootNode);
        };
        return AvlTree;
    }(feng3d.BinarySearchTree));
    feng3d.AvlTree = AvlTree;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=ds.js.map