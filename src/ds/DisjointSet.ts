namespace ds
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

        private items: { [key: string]: DisjointSetItem<T> };
        private keyCallback

        /**
         * @param {function(value: *)} [keyCallback]
         */
        constructor(keyCallback?)
        {
            this.keyCallback = keyCallback;
            this.items = {};
        }

        /**
         * @param {*} itemValue
         * @return {DisjointSet}
         */
        makeSet(itemValue)
        {
            const disjointSetItem = new DisjointSetItem(itemValue, this.keyCallback);

            if (!this.items[disjointSetItem.getKey()])
            {
                // Add new item only in case if it not presented yet.
                this.items[disjointSetItem.getKey()] = disjointSetItem;
            }

            return this;
        }

        /**
         * Find set representation node.
         *
         * @param {*} itemValue
         * @return {(string|null)}
         */
        find(itemValue)
        {
            const templateDisjointItem = new DisjointSetItem(itemValue, this.keyCallback);

            // Try to find item itself;
            const requiredDisjointItem = this.items[templateDisjointItem.getKey()];

            if (!requiredDisjointItem)
            {
                return null;
            }

            return requiredDisjointItem.getRoot().getKey();
        }

        /**
         * Union by rank.
         *
         * @param {*} valueA
         * @param {*} valueB
         * @return {DisjointSet}
         */
        union(valueA, valueB)
        {
            const rootKeyA = this.find(valueA);
            const rootKeyB = this.find(valueB);

            if (rootKeyA === null || rootKeyB === null)
            {
                throw new Error('One or two values are not in sets');
            }

            if (rootKeyA === rootKeyB)
            {
                // In case if both elements are already in the same set then just return its key.
                return this;
            }

            const rootA = this.items[rootKeyA];
            const rootB = this.items[rootKeyB];

            if (rootA.getRank() < rootB.getRank())
            {
                // If rootB's tree is bigger then make rootB to be a new root.
                rootB.addChild(rootA);

                return this;
            }

            // If rootA's tree is bigger then make rootA to be a new root.
            rootA.addChild(rootB);

            return this;
        }

        /**
         * @param {*} valueA
         * @param {*} valueB
         * @return {boolean}
         */
        inSameSet(valueA, valueB)
        {
            const rootKeyA = this.find(valueA);
            const rootKeyB = this.find(valueB);

            if (rootKeyA === null || rootKeyB === null)
            {
                throw new Error('One or two values are not in sets');
            }

            return rootKeyA === rootKeyB;
        }
    }

    export class DisjointSetItem<T>
    {
        value: T;
        keyCallback

        parent: DisjointSetItem<T>;
        children: {};

        /**
         * @param {*} value
         * @param {function(value: *)} [keyCallback]
         */
        constructor(value: T, keyCallback?)
        {
            this.value = value;
            this.keyCallback = keyCallback;
            /** @var {DisjointSetItem} this.parent */
            this.parent = null;
            this.children = {};
        }

        /**
         * @return {*}
         */
        getKey()
        {
            // Allow user to define custom key generator.
            if (this.keyCallback)
            {
                return this.keyCallback(this.value);
            }

            // Otherwise use value as a key by default.
            return this.value;
        }

        /**
         * @return {DisjointSetItem}
         */
        getRoot()
        {
            return this.isRoot() ? this : this.parent.getRoot();
        }

        /**
         * @return {boolean}
         */
        isRoot()
        {
            return this.parent === null;
        }

        /**
         * Rank basically means the number of all ancestors.
         *
         * @return {number}
         */
        getRank()
        {
            if (this.getChildren().length === 0)
            {
                return 0;
            }

            let rank = 0;

            /** @var {DisjointSetItem} child */
            this.getChildren().forEach((child) =>
            {
                // Count child itself.
                rank += 1;

                // Also add all children of current child.
                rank += child.getRank();
            });

            return rank;
        }

        /**
         * @return {DisjointSetItem[]}
         */
        getChildren()
        {
            var values = Object.keys(this.children).map(key => this.children[key]);
            return values;
        }

        /**
         * @param {DisjointSetItem} parentItem
         * @param {boolean} forceSettingParentChild
         * @return {DisjointSetItem}
         */
        setParent(parentItem, forceSettingParentChild = true)
        {
            this.parent = parentItem;
            if (forceSettingParentChild)
            {
                parentItem.addChild(this);
            }

            return this;
        }

        /**
         * @param {DisjointSetItem} childItem
         * @return {DisjointSetItem}
         */
        addChild(childItem)
        {
            this.children[childItem.getKey()] = childItem;
            childItem.setParent(this, false);

            return this;
        }
    }


}