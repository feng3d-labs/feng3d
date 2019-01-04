namespace ds
{
    /**
     * 二叉查找树
     * 
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/tree/binary-search-tree/BinarySearchTree.js
     */
    export class BinarySearchTree<T>
    {
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
        constructor(nodeValueCompareFunction?: CompareFunction<T>)
        {
            this.root = new BinarySearchTreeNode(null, nodeValueCompareFunction);

            // 从根节点中窃取节点比较器。
            this.nodeComparator = this.root.nodeComparator;
        }

        /**
         * 插入值
         * 
         * @param value 值
         */
        insert(value: T)
        {
            return this.root.insert(value);
        }

        /**
         * 是否包含指定值
         * 
         * @param value 值
         */
        contains(value: T)
        {
            return this.root.contains(value);
        }

        /**
         * 移除指定值
         * 
         * @param value 值
         */
        remove(value: T)
        {
            return this.root.remove(value);
        }

        /**
         * 转换为字符串
         */
        toString()
        {
            return this.root.toString();
        }
    }

}