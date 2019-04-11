declare module '@feng3d/ds' {
    export = feng3d;
}
declare namespace feng3d {
    type CompareFunction<T> = (a: T, b: T) => number;
    /**
     * 比较器
     */
    class Comparator<T> {
        /**
         * 默认比较函数。只能处理 a和b 同为string或number的比较。
         *
         * @param a 比较值a
         * @param b 比较值b
         */
        static defaultCompareFunction(a: string | number, b: string | number): 0 | 1 | -1;
        private compare;
        /**
         * 构建比较器
         * @param compareFunction 比较函数
         */
        constructor(compareFunction?: CompareFunction<T>);
        /**
         * 检查 a 是否等于 b 。
         *
         * @param a 值a
         * @param b 值b
         */
        equal(a: T, b: T): boolean;
        /**
         * 检查 a 是否小于 b 。
         *
         * @param a 值a
         * @param b 值b
         */
        lessThan(a: T, b: T): boolean;
        /**
         * 检查 a 是否大于 b 。
         *
         * @param a 值a
         * @param b 值b
         */
        greaterThan(a: T, b: T): boolean;
        /**
         * 检查 a 是否小于等于 b 。
         *
         * @param a 值a
         * @param b 值b
         */
        lessThanOrEqual(a: T, b: T): boolean;
        /**
         * 检查 a 是否大于等于 b 。
         *
         * @param a 值a
         * @param b 值b
         */
        greaterThanOrEqual(a: T, b: T): boolean;
        /**
         * 反转比较函数。
         */
        reverse(): void;
    }
}
declare namespace feng3d {
    /**
     * 工具
     */
    var utils: Utils;
    /**
     * 工具
     */
    class Utils {
        /**
         * 初始化数组
         * @param arraylike 类数组
         */
        arrayFrom<T>(arraylike: ArrayLike<T>): T[];
        /**
         * 使数组元素变得唯一,除去相同值
         * @param equalFn 比较函数
         */
        arrayUnique<T>(arr: T[], equal?: (a: T, b: T) => boolean): this;
        /**
         * 数组元素是否唯一
         * @param equalFn 比较函数
         */
        arrayIsUnique<T>(array: T[], equalFn?: (a: T, b: T) => boolean): boolean;
        /**
         * 创建数组
         * @param length 长度
         * @param itemFunc 创建元素方法
         */
        createArray<T>(length: number, itemFunc: (index: number) => T): T[];
        /**
         * 二分查找,如果有多个则返回第一个
         * @param   array   数组
         * @param	target	寻找的目标
         * @param	compare	比较函数
         * @param   start   起始位置
         * @param   end     结束位置
         * @return          查找到目标时返回所在位置，否则返回-1
         */
        binarySearch<T>(array: T[], target: T, compare: (a: T, b: T) => number, start?: number, end?: number): number;
        /**
         * 二分查找插入位置,如果有多个则返回第一个
         * @param   array   数组
         * @param	target	寻找的目标
         * @param	compare	比较函数
         * @param   start   起始位置
         * @param   end     结束位置
         * @return          目标所在位置（如果该位置上不是目标对象，则该索引为该目标可插入的位置）
         */
        binarySearchInsert<T>(array: T[], target: T, compare: (a: T, b: T) => number, start?: number, end?: number): number;
    }
}
declare namespace feng3d {
    /**
     * 链表
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/linked-list/LinkedList.js
     */
    class LinkedList<T> {
        /**
         * 表头
         */
        private head;
        /**
         * 表尾
         */
        private tail;
        /**
         * 比较器
         */
        private compare;
        /**
         * 构建双向链表
         *
         * @param comparatorFunction 比较函数
         */
        constructor(comparatorFunction?: CompareFunction<T>);
        /**
         * 是否为空
         */
        isEmpty(): boolean;
        /**
         * 清空
         */
        empty(): void;
        /**
         * 获取表头值
         */
        getHeadValue(): T;
        /**
         * 添加新结点到表头
         *
         * @param value 结点数据
         */
        addHead(value: T): this;
        /**
         * 添加新结点到表尾
         *
         * @param value 结点数据
         */
        addTail(value: T): this;
        /**
         * 删除链表中第一个与指定值相等的结点
         *
         * @param value 结点值
         */
        delete(value: T): LinkedListNode<T>;
        /**
         * 删除链表中所有与指定值相等的结点
         *
         * @param value 结点值
         */
        deleteAll(value: T): LinkedListNode<T>;
        /**
         * 查找与结点值相等的结点
         *
         * @param value 结点值
         */
        find(value: T): LinkedListNode<T>;
        /**
         * 查找与结点值相等的结点
         *
         * @param callback 判断是否为查找的元素
         */
        findByFunc(callback: (value: T) => Boolean): LinkedListNode<T>;
        /**
         * 删除表头
         *
         * 删除链表前面的元素(链表的头)并返回元素值。如果队列为空，则返回null。
         */
        deleteHead(): T;
        /**
         * 删除表尾
         */
        deleteTail(): T;
        /**
         * 从数组中初始化链表
         *
         * @param values 结点值列表
         */
        fromArray(values: T[]): this;
        /**
         * 转换为数组
         */
        toArray(): T[];
        /**
         * 转换为字符串
         *
         * @param valueToString 值输出为字符串函数
         */
        toString(valueToString?: (value: T) => string): string;
        /**
         * 反转链表
         */
        reverse(): this;
        /**
         * 核查结构是否正确
         */
        checkStructure(): boolean;
    }
    /**
     * 链表结点
     */
    interface LinkedListNode<T> {
        /**
         * 值
         */
        value: T;
        /**
         * 下一个结点
         */
        next: LinkedListNode<T>;
    }
}
declare namespace feng3d {
    /**
     * 双向链表
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/doubly-linked-list/DoublyLinkedList.js
     */
    class DoublyLinkedList<T> {
        /**
         * 表头
         */
        private head;
        /**
         * 表尾
         */
        private tail;
        /**
         * 比较器
         */
        private compare;
        /**
         * 构建双向链表
         *
         * @param comparatorFunction 比较函数
         */
        constructor(comparatorFunction?: CompareFunction<T>);
        /**
         * 是否为空
         */
        isEmpty(): boolean;
        /**
         * 清空
         */
        empty(): void;
        /**
         * 添加新结点到表头
         *
         * @param value 结点数据
         */
        addHead(value: T): this;
        /**
         * 添加新结点到表尾
         *
         * @param value 结点数据
         */
        addTail(value: T): this;
        /**
         * 删除链表中第一个与指定值相等的结点
         *
         * @param value 结点值
         */
        delete(value: T): DoublyLinkedListNode<T>;
        /**
         * 删除链表中所有与指定值相等的结点
         *
         * @param value 结点值
         */
        deleteAll(value: T): DoublyLinkedListNode<T>;
        /**
         * 查找与结点值相等的结点
         *
         * @param value 结点值
         */
        find(value: T): DoublyLinkedListNode<T>;
        /**
         * 查找与结点值相等的结点
         *
         * @param callback 判断是否为查找的元素
         */
        findByFunc(callback: (value: T) => Boolean): DoublyLinkedListNode<T>;
        /**
         * 删除表头
         */
        deleteHead(): T;
        /**
         * 删除表尾
         */
        deleteTail(): T;
        /**
         * 从数组中初始化链表
         *
         * @param values 结点值列表
         */
        fromArray(values: T[]): this;
        /**
         * 转换为数组
         */
        toArray(): T[];
        /**
         * 转换为字符串
         * @param valueToString 值输出为字符串函数
         */
        toString(valueToString?: (value: T) => string): string;
        /**
         * 反转链表
         */
        reverse(): this;
        /**
         * 核查结构是否正确
         */
        checkStructure(): boolean;
    }
    /**
     * 双向链接结点
     */
    interface DoublyLinkedListNode<T> {
        /**
         * 值
         */
        value: T;
        /**
         * 上一个结点
         */
        previous: DoublyLinkedListNode<T>;
        /**
         * 下一个结点
         */
        next: DoublyLinkedListNode<T>;
    }
}
declare namespace feng3d {
    /**
     * 队列，只能从后面进，前面出
     * 使用单向链表实现
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/queue/Queue.js
     */
    class Queue<T> {
        private linkedList;
        /**
         * 构建队列
         *
         * @param comparatorFunction 比较函数
         */
        constructor();
        /**
         * 是否为空
         */
        isEmpty(): boolean;
        /**
         * 清空
         */
        empty(): void;
        /**
         * 读取队列前面的元素，但不删除它。
         */
        peek(): T;
        /**
         * 入队
         *
         * 在队列的末尾(链表的尾部)添加一个新元素。
         * 这个元素将在它前面的所有元素之后被处理。
         *
         * @param value 元素值
         */
        enqueue(value: T): this;
        /**
         * 出队
         *
         * 删除队列前面的元素(链表的头)。如果队列为空，则返回null。
         */
        dequeue(): T;
        /**
         * 转换为字符串
         *
         * @param valueToString 值输出为字符串函数
         */
        toString(valueToString?: (value: T) => string): string;
    }
}
declare namespace feng3d {
    /**
     * 栈
     *
     * 后进先出
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/stack/Stack.js
     */
    class Stack<T> {
        private linkedList;
        /**
         * 是否为空
         */
        isEmpty(): boolean;
        /**
         * 查看第一个元素值
         */
        peek(): T;
        /**
         * 入栈
         *
         * @param value 元素值
         */
        push(value: T): this;
        /**
         * 出栈
         */
        pop(): T;
        /**
         * 转换为数组
         */
        toArray(): T[];
        /**
         * 转换为字符串
         *
         * @param valueToString 值输出为字符串函数
         */
        toString(valueToString?: (value: T) => string): string;
    }
}
declare namespace feng3d {
    /**
     * 堆
     *
     * 最小和最大堆的父类。
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/heap/Heap.js
     */
    abstract class Heap<T> {
        /**
         * 堆的数组表示。
         */
        private heapContainer;
        /**
         * 比较器
         */
        protected compare: Comparator<T>;
        /**
         * 构建链表
         *
         * @param comparatorFunction 比较函数
         */
        constructor(comparatorFunction?: CompareFunction<T>);
        /**
         * 获取左边子结点索引
         *
         * @param parentIndex 父结点索引
         */
        getLeftChildIndex(parentIndex: number): number;
        /**
         * 获取右边子结点索引
         *
         * @param parentIndex 父结点索引
         */
        getRightChildIndex(parentIndex: number): number;
        /**
         * 获取父结点索引
         *
         * @param childIndex 子结点索引
         */
        getParentIndex(childIndex: number): number;
        /**
         * 是否有父结点
         *
         * @param childIndex 子结点索引
         */
        hasParent(childIndex: number): boolean;
        /**
         * 是否有左结点
         *
         * @param parentIndex 父结点索引
         */
        hasLeftChild(parentIndex: number): boolean;
        /**
         * 是否有右结点
         *
         * @param parentIndex 父结点索引
         */
        hasRightChild(parentIndex: number): boolean;
        /**
         * 获取左结点
         *
         * @param parentIndex 父结点索引
         */
        leftChild(parentIndex: number): T;
        /**
         * 获取右结点
         *
         * @param parentIndex 父结点索引
         */
        rightChild(parentIndex: number): T;
        /**
         * 获取父结点
         *
         * @param childIndex 子结点索引
         */
        parent(childIndex: number): T;
        /**
         * 交换两个结点数据
         *
         * @param index1 索引1
         * @param index2 索引2
         */
        swap(index1: number, index2: number): void;
        /**
         * 查看堆顶数据
         */
        peek(): T;
        /**
         * 出堆
         *
         * 取出堆顶元素
         */
        poll(): T;
        /**
         * 新增元素
         *
         * @param item 元素
         */
        add(item: T): this;
        /**
         * 移除所有指定元素
         *
         * @param item 元素
         * @param comparator 比较器
         */
        remove(item: T, comparator?: Comparator<T>): this;
        /**
         * 查找元素所在所有索引
         *
         * @param item 查找的元素
         * @param comparator 比较器
         */
        find(item: T, comparator?: Comparator<T>): number[];
        /**
         * 是否为空
         */
        isEmpty(): boolean;
        /**
         * 转换为字符串
         */
        toString(): string;
        /**
         * 堆冒泡
         *
         * @param startIndex 堆冒泡起始索引
         */
        heapifyUp(startIndex?: number): void;
        /**
         * 堆下沉
         *
         * @param startIndex 堆下沉起始索引
         */
        heapifyDown(startIndex?: number): void;
        /**
         * 检查堆元素对的顺序是否正确。
         * 对于MinHeap，第一个元素必须总是小于等于。
         * 对于MaxHeap，第一个元素必须总是大于或等于。
         *
         * @param firstElement 第一个元素
         * @param secondElement 第二个元素
         */
        abstract pairIsInCorrectOrder(firstElement: T, secondElement: T): boolean;
    }
}
declare namespace feng3d {
    /**
     * 最大堆
     *
     * 所有父结点都大于子结点
     */
    class MaxHeap<T> extends Heap<T> {
        /**
         * 检查堆元素对的顺序是否正确。
         * 对于MinHeap，第一个元素必须总是小于等于。
         * 对于MaxHeap，第一个元素必须总是大于或等于。
         *
         * @param firstElement 第一个元素
         * @param secondElement 第二个元素
         */
        pairIsInCorrectOrder(firstElement: T, secondElement: T): boolean;
    }
}
declare namespace feng3d {
    /**
     * 最小堆
     *
     * 所有父结点都小于子结点
     */
    class MinHeap<T> extends Heap<T> {
        /**
         * 检查堆元素对的顺序是否正确。
         * 对于MinHeap，第一个元素必须总是小于等于。
         * 对于MaxHeap，第一个元素必须总是大于或等于。
         *
         * @param firstElement 第一个元素
         * @param secondElement 第二个元素
         */
        pairIsInCorrectOrder(firstElement: T, secondElement: T): boolean;
    }
}
declare namespace feng3d {
    /**
     * 哈希表（散列表）
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/hash-table/HashTable.js
     */
    class HashTable {
        private keys;
        buckets: LinkedList<{
            key: string;
            value: any;
        }>[];
        /**
         * 构建哈希表
         * @param hashTableSize 哈希表尺寸
         */
        constructor(hashTableSize?: number);
        /**
         * 将字符串键转换为哈希数。
         *
         * @param key 字符串键
         */
        hash(key: string): number;
        /**
         * 设置值
         *
         * @param key 键
         * @param value 值
         */
        set(key: string, value: any): void;
        /**
         * 删除指定键以及对于值
         *
         * @param key 键
         */
        delete(key: string): LinkedListNode<{
            key: string;
            value: any;
        }>;
        /**
         * 获取与键对应的值
         *
         * @param key 键
         */
        get(key: string): any;
        /**
         * 是否拥有键
         *
         * @param key 键
         */
        has(key: string): any;
        /**
         * 获取键列表
         */
        getKeys(): string[];
    }
}
declare namespace feng3d {
    /**
     * 优先队列
     *
     * 所有元素按优先级排序
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/priority-queue/PriorityQueue.js
     */
    class PriorityQueue<T> {
        private items;
        /**
         * 队列长度
         */
        readonly length: number;
        /**
         * 比较函数
         */
        compare: (a: T, b: T) => number;
        private _compare;
        /**
         * 构建优先数组
         * @param   compare     比较函数
         */
        constructor(compare: (a: T, b: T) => number);
        /**
         * 尾部添加元素（进队）
         * @param items 元素列表
         * @returns 长度
         */
        push(...items: T[]): number;
        /**
         * 头部移除元素（出队）
         */
        shift(): T;
        /**
         * 转换为数组
         */
        toArray(): T[];
        /**
         * 从数组初始化链表
         */
        fromArray(array: T[]): void;
    }
}
declare namespace feng3d {
    /**
     * 优先队列
     *
     * 与最小堆相同，只是与元素比较时不同
     * 我们考虑的不是元素的值，而是它的优先级。
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/priority-queue/PriorityQueue.js
     */
    class PriorityQueue1<T> extends MinHeap<T> {
        private priorities;
        constructor();
        /**
         * 新增元素
         *
         * @param item 元素
         * @param priority 优先级
         */
        add(item: T, priority?: number): this;
        /**
         * 移除元素
         *
         * @param item 元素
         * @param customFindingComparator 自定义查找比较器
         */
        remove(item: T, customFindingComparator?: Comparator<T>): this;
        /**
         * 改变元素优先级
         *
         * @param item 元素
         * @param priority 优先级
         */
        changePriority(item: T, priority: number): this;
        /**
         * 查找元素所在索引
         *
         * @param item 元素
         */
        findByValue(item: T): number[];
        /**
         * 是否拥有元素
         *
         * @param item 元素
         */
        hasValue(item: T): boolean;
        /**
         * 比较两个元素优先级
         *
         * @param a 元素a
         * @param b 元素b
         */
        comparePriority(a: T, b: T): 0 | 1 | -1;
        /**
         * 比较两个元素大小
         *
         * @param a 元素a
         * @param b 元素b
         */
        compareValue(a: T, b: T): 0 | 1 | -1;
    }
}
declare namespace feng3d {
    /**
     * 布隆过滤器 （ 在 JavaScript中 该类可由Object对象代替）
     *
     * 用于判断某元素是否可能插入
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/bloom-filter/BloomFilter.js
     * @see https://baike.baidu.com/item/%E5%B8%83%E9%9A%86%E8%BF%87%E6%BB%A4%E5%99%A8
     */
    class BloomFilter {
        private size;
        private storage;
        /**
         *
         * @param size 尺寸
         */
        constructor(size?: number);
        /**
         * 插入
         *
         * @param item 元素
         */
        insert(item: string): void;
        /**
         * 可能包含
         *
         * @param item 元素
         */
        mayContain(item: string): boolean;
        /**
         * 创建存储器
         * @param size 尺寸
         */
        createStore(size: number): {
            getValue(index: any): any;
            setValue(index: any): void;
        };
        /**
         * 计算哈希值1
         *
         * @param item 元素
         */
        hash1(item: string): number;
        /**
         * 计算哈希值2
         *
         * @param item 元素
         */
        hash2(item: string): number;
        /**
         * 计算哈希值3
         *
         * @param item 元素
         */
        hash3(item: string): number;
        /**
         * 获取3个哈希值组成的数组
         */
        getHashValues(item: string): number[];
    }
}
declare namespace feng3d {
    /**
     * 并查集
     *
     * 并查集是一种树型的数据结构，用于处理一些不交集（Disjoint Sets）的合并及查询问题。
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/disjoint-set/DisjointSet.js
     * @see https://en.wikipedia.org/wiki/Disjoint-set_data_structure
     * @see https://www.youtube.com/watch?v=wU6udHRIkcc&index=14&t=0s&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8
     */
    class DisjointSet<T> {
        private items;
        /**
         * 计算键值函数
         */
        private keyCallback;
        /**
         * 构建 并查集
         * @param keyCallback 计算键值函数
         */
        constructor(keyCallback?: (value: T) => string);
        /**
         * 创建集合
         *
         * @param nodeValue 结点值
         */
        makeSet(nodeValue: T): this;
        /**
         * 查找给出值所在集合根结点键值
         *
         * @param nodeValue 结点值
         */
        find(nodeValue: T): string;
        /**
         * 合并两个值所在的集合
         *
         * @param valueA 值a
         * @param valueB 值b
         */
        union(valueA: T, valueB: T): this;
        /**
         * 判断两个值是否在相同集合中
         *
         * @param valueA 值A
         * @param valueB 值B
         */
        inSameSet(valueA: T, valueB: T): boolean;
    }
    /**
     * 并查集结点
     */
    class DisjointSetNode<T> {
        /**
         * 值
         */
        value: T;
        /**
         * 计算键值函数
         */
        keyCallback: (value: T) => string;
        /**
         * 父结点
         */
        parent: DisjointSetNode<T>;
        /**
         * 子结点
         */
        children: any;
        /**
         * 构建 并查集 项
         *
         * @param value 值
         * @param keyCallback 计算键值函数
         */
        constructor(value: T, keyCallback?: (value: T) => string);
        /**
         * 获取键值
         */
        getKey(): string;
        /**
         * 获取根结点
         */
        getRoot(): DisjointSetNode<T>;
        /**
         * 是否为根结点
         */
        isRoot(): boolean;
        /**
         * 获取所有子孙结点数量
         */
        getRank(): number;
        /**
         * 获取子结点列表
         */
        getChildren(): any[];
        /**
         * 设置父结点
         * @param parentNode 父结点
         */
        setParent(parentNode: DisjointSetNode<T>): this;
        /**
         * 添加子结点
         * @param childNode 子结点
         */
        addChild(childNode: DisjointSetNode<T>): this;
    }
}
declare namespace feng3d {
    /**
     * 图
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/graph/Graph.js
     * @see https://en.wikipedia.org/wiki/Graph_(abstract_data_type)
     * @see https://www.youtube.com/watch?v=gXgEDyodOJU&index=9&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8
     * @see https://www.youtube.com/watch?v=k1wraWzqtvQ&index=10&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8
     */
    class Graph<T> {
        /**
         * 顶点列表
         */
        vertices: {
            [key: string]: GraphVertex<T>;
        };
        /**
         * 边列表
         */
        edges: {
            [key: string]: GraphEdge<T>;
        };
        /**
         * 是否有向
         */
        isDirected: boolean;
        /**
         * 构建图
         *
         * @param isDirected 是否有向
         */
        constructor(isDirected?: boolean);
        /**
         * 新增顶点
         *
         * @param newVertex 新顶点
         */
        addVertex(newVertex: GraphVertex<T>): this;
        /**
         * 获取顶点
         *
         * @param vertexKey 顶点键值
         */
        getVertexByKey(vertexKey: string): GraphVertex<T>;
        /**
         * 获取相邻点
         *
         * @param vertex 顶点
         */
        getNeighbors(vertex: GraphVertex<T>): GraphVertex<T>[];
        /**
         * 获取所有顶点
         */
        getAllVertices(): GraphVertex<T>[];
        /**
         * 获取所有边
         */
        getAllEdges(): GraphEdge<T>[];
        /**
         * 新增边
         *
         * @param edge 边
         */
        addEdge(edge: GraphEdge<T>): this;
        /**
         * 删除边
         *
         * @param edge 边
         */
        deleteEdge(edge: GraphEdge<T>): void;
        /**
         * 查找边
         *
         * @param startVertex 起始顶点
         * @param endVertex 结束顶点
         */
        findEdge(startVertex: GraphVertex<T>, endVertex: GraphVertex<T>): GraphEdge<T>;
        /**
         * 获取权重
         */
        getWeight(): number;
        /**
         * 反转
         */
        reverse(): this;
        /**
         * 获取所有顶点索引
         */
        getVerticesIndices(): {};
        /**
         * 获取邻接矩阵
         */
        getAdjacencyMatrix(): any[];
        /**
         * 转换为字符串
         */
        toString(): string;
    }
    /**
     * 图边
     */
    class GraphEdge<T> {
        /**
         * 起始顶点
         */
        startVertex: GraphVertex<T>;
        /**
         * 结束顶点
         */
        endVertex: GraphVertex<T>;
        /**
         * 权重
         */
        weight: number;
        /**
         * 构建图边
         * @param startVertex 起始顶点
         * @param endVertex 结束顶点
         * @param weight 权重
         */
        constructor(startVertex: GraphVertex<T>, endVertex: GraphVertex<T>, weight?: number);
        /**
         * 获取键值
         */
        getKey(): string;
        /**
         * 反转
         */
        reverse(): this;
        /**
         * 转换为字符串
         */
        toString(): string;
    }
    /**
     * 图顶点
     */
    class GraphVertex<T> {
        /**
         * 值
         */
        value: T;
        /**
         * 边列表
         */
        edges: LinkedList<GraphEdge<T>>;
        /**
         * 构建图顶点
         *
         * @param value 值
         */
        constructor(value: T);
        /**
         * 新增边
         *
         * @param edge 边
         */
        addEdge(edge: GraphEdge<T>): this;
        /**
         * 删除边
         *
         * @param edge 边
         */
        deleteEdge(edge: GraphEdge<T>): void;
        /**
         * 获取相邻顶点
         */
        getNeighbors(): GraphVertex<T>[];
        /**
         * 获取边列表
         */
        getEdges(): GraphEdge<T>[];
        /**
         * 获取边的数量
         */
        getDegree(): number;
        /**
         * 是否存在指定边
         *
         * @param requiredEdge 边
         */
        hasEdge(requiredEdge: GraphEdge<T>): boolean;
        /**
         * 是否有相邻顶点
         *
         * @param vertex 顶点
         */
        hasNeighbor(vertex: GraphVertex<T>): boolean;
        /**
         * 查找边
         *
         * @param vertex 顶点
         */
        findEdge(vertex: GraphVertex<T>): GraphEdge<T>;
        /**
         * 获取键值
         */
        getKey(): string;
        /**
         * 删除所有边
         */
        deleteAllEdges(): this;
        /**
         * 转换为字符串
         *
         * @param callback 转换为字符串函数
         */
        toString(callback?: (value: T) => string): string;
    }
}
declare namespace feng3d {
    /**
     * 二叉树结点
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/tree/BinaryTreeNode.js
     */
    class BinaryTreeNode<T> {
        /**
         * 左结点
         */
        left: BinaryTreeNode<T>;
        /**
         * 右结点
         */
        right: BinaryTreeNode<T>;
        /**
         * 父结点
         */
        parent: BinaryTreeNode<T>;
        /**
         * 结点值
         */
        value: T;
        /**
         * 结点比较器
         */
        nodeComparator: Comparator<BinaryTreeNode<T>>;
        meta: HashTable;
        /**
         * 构建二叉树结点
         *
         * @param value 结点值
         */
        constructor(value?: T);
        /**
         * 左结点高度
         */
        readonly leftHeight: any;
        /**
         * 右结点高度
         */
        readonly rightHeight: any;
        /**
         * 高度
         */
        readonly height: number;
        /**
         * 平衡系数
         */
        readonly balanceFactor: number;
        /**
         * 获取叔伯结点
         */
        readonly uncle: BinaryTreeNode<T>;
        /**
         * 设置结点值
         *
         * @param value 值
         */
        setValue(value: T): this;
        /**
         * 设置左结点
         *
         * @param node 结点
         */
        setLeft(node: BinaryTreeNode<T> | null): this;
        /**
         * 设置右结点
         *
         * @param node 结点
         */
        setRight(node: BinaryTreeNode<T> | null): this;
        /**
         * 移除子结点
         *
         * @param nodeToRemove 子结点
         */
        removeChild(nodeToRemove: BinaryTreeNode<T>): boolean;
        /**
         * 替换节点
         *
         * @param nodeToReplace 被替换的节点
         * @param replacementNode 替换后的节点
         */
        replaceChild(nodeToReplace: BinaryTreeNode<T>, replacementNode: BinaryTreeNode<T>): boolean;
        /**
         * 拷贝节点
         *
         * @param sourceNode 源节点
         * @param targetNode 目标节点
         */
        static copyNode<T>(sourceNode: BinaryTreeNode<T>, targetNode: BinaryTreeNode<T>): void;
        /**
         * 左序深度遍历
         */
        traverseInOrder(): any[];
        /**
         * 转换为字符串
         */
        toString(): string;
    }
}
declare namespace feng3d {
    /**
     * 二叉查找树结点
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/tree/binary-search-tree/BinarySearchTreeNode.js
     */
    class BinarySearchTreeNode<T> extends BinaryTreeNode<T> {
        /**
         * 左结点
         */
        left: BinarySearchTreeNode<T>;
        /**
         * 右结点
         */
        right: BinarySearchTreeNode<T>;
        /**
         * 父结点
         */
        parent: BinarySearchTreeNode<T>;
        /**
         * 比较函数
         */
        private compareFunction;
        /**
         * 结点值比较器
         */
        private nodeValueComparator;
        /**
         * 构建二叉查找树结点
         *
         * @param value 结点值
         * @param compareFunction 比较函数
         */
        constructor(value?: T, compareFunction?: CompareFunction<T>);
        /**
         * 插入值
         *
         * @param value 值
         */
        insert(value: T): any;
        /**
         * 查找结点
         *
         * @param value 值
         */
        find(value: T): BinarySearchTreeNode<T>;
        /**
         * 是否包含指定值
         *
         * @param value 结点值
         */
        contains(value: T): boolean;
        /**
         * 移除指定值
         *
         * @param value 结点值
         */
        remove(value: T): boolean;
        /**
         * 查找最小值
         */
        findMin(): BinarySearchTreeNode<T>;
    }
}
declare namespace feng3d {
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
    class BinarySearchTree<T> {
        /**
         * 根结点
         */
        root: BinarySearchTreeNode<T>;
        /**
         * 结点比较器
         */
        nodeComparator: Comparator<BinaryTreeNode<T>>;
        /**
         * 构建 二叉查找树
         *
         * @param nodeValueCompareFunction 结点值比较器
         */
        constructor(nodeValueCompareFunction?: CompareFunction<T>);
        /**
         * 插入值
         *
         * @param value 值
         */
        insert(value: T): any;
        /**
         * 是否包含指定值
         *
         * @param value 值
         */
        contains(value: T): boolean;
        /**
         * 移除指定值
         *
         * @param value 值
         */
        remove(value: T): boolean;
        /**
         * 转换为字符串
         */
        toString(): string;
    }
}
declare namespace feng3d {
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
    class AvlTree<T> extends BinarySearchTree<T> {
        /**
         * @param {*} value
         */
        insert(value: T): void;
        /**
         * @param {*} value
         * @return {boolean}
         */
        remove(value: T): boolean;
        /**
         * @param {BinarySearchTreeNode} node
         */
        balance(node: BinarySearchTreeNode<T>): void;
        /**
         * @param {BinarySearchTreeNode} rootNode
         */
        rotateLeftLeft(rootNode: BinarySearchTreeNode<T>): void;
        /**
         * @param {BinarySearchTreeNode} rootNode
         */
        rotateLeftRight(rootNode: BinarySearchTreeNode<T>): void;
        /**
         * @param {BinarySearchTreeNode} rootNode
         */
        rotateRightLeft(rootNode: BinarySearchTreeNode<T>): void;
        /**
         * @param {BinarySearchTreeNode} rootNode
         */
        rotateRightRight(rootNode: BinarySearchTreeNode<T>): void;
    }
}
//# sourceMappingURL=index.d.ts.map