namespace feng3d
{
    /**
     * 并查集
     * 
     * 并查集是一种树型的数据结构，用于处理一些不交集（Disjoint Sets）的合并及查询问题。
     * 
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/disjoint-set/DisjointSet.js
     * @see https://en.wikipedia.org/wiki/Disjoint-set_data_structure
     * @see https://www.youtube.com/watch?v=wU6udHRIkcc&index=14&t=0s&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8
     */
    export class DisjointSet<T>
    {

        private items: { [key: string]: DisjointSetNode<T> };

        /**
         * 计算键值函数
         */
        private keyCallback: (value: T) => string;

        /**
         * 构建 并查集
         * @param keyCallback 计算键值函数
         */
        constructor(keyCallback?: (value: T) => string)
        {
            this.keyCallback = keyCallback;
            this.items = {};
        }

        /**
         * 创建集合
         * 
         * @param nodeValue 结点值 
         */
        makeSet(nodeValue: T)
        {
            const disjointSetItem = new DisjointSetNode(nodeValue, this.keyCallback);

            if (!this.items[disjointSetItem.getKey()])
            {
                this.items[disjointSetItem.getKey()] = disjointSetItem;
            }

            return this;
        }

        /**
         * 查找给出值所在集合根结点键值
         * 
         * @param nodeValue 结点值
         */
        find(nodeValue: T)
        {
            const templateDisjointItem = new DisjointSetNode(nodeValue, this.keyCallback);

            const requiredDisjointItem = this.items[templateDisjointItem.getKey()];

            if (!requiredDisjointItem)
            {
                return null;
            }

            return requiredDisjointItem.getRoot().getKey();
        }

        /**
         * 合并两个值所在的集合
         * 
         * @param valueA 值a
         * @param valueB 值b
         */
        union(valueA: T, valueB: T)
        {
            const rootKeyA = this.find(valueA);
            const rootKeyB = this.find(valueB);

            if (rootKeyA === null || rootKeyB === null)
            {
                throw new Error('给出值不全在集合内');
            }

            if (rootKeyA === rootKeyB)
            {
                return this;
            }

            const rootA = this.items[rootKeyA];
            const rootB = this.items[rootKeyB];

            // 小集合合并到大集合中
            if (rootA.getRank() < rootB.getRank())
            {
                rootB.addChild(rootA);

                return this;
            }

            rootA.addChild(rootB);

            return this;
        }

        /**
         * 判断两个值是否在相同集合中
         * 
         * @param valueA 值A
         * @param valueB 值B
         */
        inSameSet(valueA: T, valueB: T)
        {
            const rootKeyA = this.find(valueA);
            const rootKeyB = this.find(valueB);

            if (rootKeyA === null || rootKeyB === null)
            {
                throw new Error('给出的值不全在集合内');
            }

            return rootKeyA === rootKeyB;
        }
    }

    /**
     * 并查集结点
     */
    export class DisjointSetNode<T>
    {
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
        // children: { [key: string]: DisjointSetNode<T> };
        children: any;

        /**
         * 构建 并查集 项
         * 
         * @param value 值
         * @param keyCallback 计算键值函数
         */
        constructor(value: T, keyCallback?: (value: T) => string)
        {
            this.value = value;
            this.keyCallback = keyCallback;
            this.parent = null;
            this.children = {};
        }

        /**
         * 获取键值
         */
        getKey()
        {
            if (this.keyCallback)
            {
                return this.keyCallback(this.value);
            }
            return <string><any>this.value;
        }

        /**
         * 获取根结点
         */
        getRoot(): DisjointSetNode<T>
        {
            return this.isRoot() ? this : this.parent.getRoot();
        }

        /**
         * 是否为根结点
         */
        isRoot()
        {
            return this.parent === null;
        }

        /**
         * 获取所有子孙结点数量
         */
        getRank()
        {
            if (this.getChildren().length === 0)
            {
                return 0;
            }

            let rank = 0;

            this.getChildren().forEach((child) =>
            {
                rank += 1;
                rank += child.getRank();
            });

            return rank;
        }

        /**
         * 获取子结点列表
         */
        getChildren()
        {
            var values = Object.keys(this.children).map(key => this.children[key]);
            return values;
        }

        /**
         * 设置父结点
         * @param parentNode 父结点
         */
        setParent(parentNode: DisjointSetNode<T>)
        {
            this.parent = parentNode;
            this.parent.children[this.getKey()] = this;
            return this;
        }

        /**
         * 添加子结点
         * @param childNode 子结点
         */
        addChild(childNode: DisjointSetNode<T>)
        {
            this.children[childNode.getKey()] = childNode;
            childNode.parent = this;
            return this;
        }
    }


}