/// <reference path="./BinaryTreeNode.ts" />

namespace feng3d
{
    /**
     * 二叉查找树结点
     * 
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/tree/binary-search-tree/BinarySearchTreeNode.js
     */
    export class BinarySearchTreeNode<T> extends BinaryTreeNode<T>
    {
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
        private compareFunction: CompareFunction<T>;

        /**
         * 结点值比较器
         */
        private nodeValueComparator: Comparator<T>;

        /**
         * 构建二叉查找树结点
         * 
         * @param value 结点值
         * @param compareFunction 比较函数
         */
        constructor(value?: T, compareFunction?: CompareFunction<T>)
        {
            super(value);

            this.compareFunction = compareFunction;
            this.nodeValueComparator = new Comparator(compareFunction);
        }

        /**
         * 插入值
         * 
         * @param value 值
         */
        insert(value: T)
        {
            if (this.nodeValueComparator.equal(this.value, null))
            {
                this.value = value;

                return this;
            }

            if (this.nodeValueComparator.lessThan(value, this.value))
            {
                // 插入到左结点
                if (this.left)
                {
                    return this.left.insert(value);
                }

                const newNode = new BinarySearchTreeNode(value, this.compareFunction);
                this.setLeft(newNode);

                return newNode;
            }

            if (this.nodeValueComparator.greaterThan(value, this.value))
            {
                // 插入到右结点
                if (this.right)
                {
                    return this.right.insert(value);
                }

                const newNode = new BinarySearchTreeNode(value, this.compareFunction);
                this.setRight(newNode);

                return newNode;
            }

            return this;
        }

        /**
         * 查找结点
         * 
         * @param value 值
         */
        find(value: T): BinarySearchTreeNode<T>
        {
            // 核查本结点是否为所查找结点
            if (this.nodeValueComparator.equal(this.value, value))
            {
                return this;
            }

            if (this.nodeValueComparator.lessThan(value, this.value) && this.left)
            {
                // 从左结点中查找
                return this.left.find(value);
            }

            if (this.nodeValueComparator.greaterThan(value, this.value) && this.right)
            {
                // 从右结点中查找
                return this.right.find(value);
            }

            return null;
        }

        /**
         * 是否包含指定值
         * 
         * @param value 结点值
         */
        contains(value: T)
        {
            return !!this.find(value);
        }

        /**
         * 移除指定值
         * 
         * @param value 结点值
         */
        remove(value: T)
        {
            const nodeToRemove = this.find(value);

            if (!nodeToRemove)
            {
                throw new Error('无法查找到值对于的结点。');
            }

            const parent = nodeToRemove.parent;

            if (!nodeToRemove.left && !nodeToRemove.right)
            {
                // 删除叶子结点
                if (parent)
                {
                    parent.removeChild(nodeToRemove);
                } else
                {
                    // 节点没有父节点。只需清除当前节点值。
                    nodeToRemove.setValue(undefined);
                }
            } else if (nodeToRemove.left && nodeToRemove.right)
            {
                // 删除拥有两个子结点的结点
                // 查找下一个最大的值(右分支中的最小值)，并用下一个最大的值替换当前值节点。
                const nextBiggerNode = nodeToRemove.right.findMin();
                if (!this.nodeComparator.equal(nextBiggerNode, nodeToRemove.right))
                {
                    this.remove(nextBiggerNode.value);
                    nodeToRemove.setValue(nextBiggerNode.value);
                } else
                {
                    //如果下一个右值是下一个更大的值，它没有左子节点，那么就用右节点替换要删除的节点。
                    nodeToRemove.setValue(nodeToRemove.right.value);
                    nodeToRemove.setRight(nodeToRemove.right.right);
                }
            } else
            {
                // 删除拥有一个子结点的结点
                // 使此子节点成为当前节点的父节点的一个子节点。
                const childNode = nodeToRemove.left || nodeToRemove.right;

                if (parent)
                {
                    parent.replaceChild(nodeToRemove, childNode);
                } else
                {
                    BinaryTreeNode.copyNode(childNode, nodeToRemove);
                }
            }

            nodeToRemove.parent = null;

            return true;
        }

        /**
         * 查找最小值
         */
        findMin(): BinarySearchTreeNode<T>
        {
            if (!this.left)
            {
                return this;
            }

            return this.left.findMin();
        }
    }

}