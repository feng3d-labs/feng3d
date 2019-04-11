namespace feng3d
{
    /**
     * 二叉树结点
     * 
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/tree/BinaryTreeNode.js
     */
    export class BinaryTreeNode<T>
    {
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
        constructor(value: T = null)
        {
            this.left = null;
            this.right = null;
            this.parent = null;
            this.value = value;

            this.meta = new HashTable();

            this.nodeComparator = new Comparator();
        }

        /**
         * 左结点高度
         */
        get leftHeight()
        {
            if (!this.left)
            {
                return 0;
            }

            return this.left.height + 1;
        }

        /**
         * 右结点高度
         */
        get rightHeight()
        {
            if (!this.right)
            {
                return 0;
            }

            return this.right.height + 1;
        }

        /**
         * 高度
         */
        get height()
        {
            return Math.max(this.leftHeight, this.rightHeight);
        }

        /**
         * 平衡系数
         */
        get balanceFactor()
        {
            return this.leftHeight - this.rightHeight;
        }

        /**
         * 获取叔伯结点
         */
        get uncle()
        {
            if (!this.parent)
            {
                return undefined;
            }

            if (!this.parent.parent)
            {
                return undefined;
            }

            // 判断祖父结点是否有两个子结点
            if (!(this.parent.parent.left && this.parent.parent.right))
            {
                return undefined;
            }

            // 现在我们知道当前节点有祖父结点，而这个祖父结点有两个子结点。让我们看看谁是叔叔。
            if (this.nodeComparator.equal(this.parent, this.parent.parent.left))
            {
                // 右边的是一个叔叔。
                return this.parent.parent.right;
            }

            return this.parent.parent.left;
        }

        /**
         * 设置结点值
         * 
         * @param value 值
         */
        setValue(value: T)
        {
            this.value = value;
            return this;
        }

        /**
         * 设置左结点
         * 
         * @param node 结点
         */
        setLeft(node: BinaryTreeNode<T> | null)
        {
            if (this.left)
            {
                this.left.parent = null;
            }

            this.left = node;

            if (this.left)
            {
                this.left.parent = this;
            }

            return this;
        }

        /**
         * 设置右结点
         * 
         * @param node 结点
         */
        setRight(node: BinaryTreeNode<T> | null)
        {
            if (this.right)
            {
                this.right.parent = null;
            }

            this.right = node;

            if (node)
            {
                this.right.parent = this;
            }

            return this;
        }

        /**
         * 移除子结点
         * 
         * @param nodeToRemove 子结点
         */
        removeChild(nodeToRemove: BinaryTreeNode<T>)
        {
            if (this.left && this.nodeComparator.equal(this.left, nodeToRemove))
            {
                this.left = null;
                return true;
            }

            if (this.right && this.nodeComparator.equal(this.right, nodeToRemove))
            {
                this.right = null;
                return true;
            }

            return false;
        }

        /**
         * 替换节点
         * 
         * @param nodeToReplace 被替换的节点
         * @param replacementNode 替换后的节点
         */
        replaceChild(nodeToReplace: BinaryTreeNode<T>, replacementNode: BinaryTreeNode<T>)
        {
            if (!nodeToReplace || !replacementNode)
            {
                return false;
            }

            if (this.left && this.nodeComparator.equal(this.left, nodeToReplace))
            {
                this.left = replacementNode;
                return true;
            }

            if (this.right && this.nodeComparator.equal(this.right, nodeToReplace))
            {
                this.right = replacementNode;
                return true;
            }

            return false;
        }

        /**
         * 拷贝节点
         * 
         * @param sourceNode 源节点
         * @param targetNode 目标节点
         */
        static copyNode<T>(sourceNode: BinaryTreeNode<T>, targetNode: BinaryTreeNode<T>)
        {
            targetNode.setValue(sourceNode.value);
            targetNode.setLeft(sourceNode.left);
            targetNode.setRight(sourceNode.right);
        }

        /**
         * 左序深度遍历
         */
        traverseInOrder()
        {
            let traverse = [];

            if (this.left)
            {
                traverse = traverse.concat(this.left.traverseInOrder());
            }

            traverse.push(this.value);

            if (this.right)
            {
                traverse = traverse.concat(this.right.traverseInOrder());
            }

            return traverse;
        }

        /**
         * 转换为字符串
         */
        toString()
        {
            return this.traverseInOrder().toString();
        }
    }

}