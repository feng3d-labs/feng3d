namespace feng3d
{
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