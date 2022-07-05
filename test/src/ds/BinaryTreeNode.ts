QUnit.module('BinaryTreeNode', () =>
{
    QUnit.test('should create node', (assert) =>
    {
        const node = new feng3d.BinaryTreeNode();

        assert.deepEqual(node.value, null);
        assert.deepEqual(node.left, null);
        assert.deepEqual(node.right, null);

        const leftNode = new feng3d.BinaryTreeNode(1);
        const rightNode = new feng3d.BinaryTreeNode(3);
        const rootNode = new feng3d.BinaryTreeNode(2);

        rootNode
            .setLeft(leftNode)
            .setRight(rightNode);

        assert.deepEqual(rootNode.value, 2);
        assert.deepEqual(rootNode.left.value, 1);
        assert.deepEqual(rootNode.right.value, 3);
    });

    QUnit.test('should set parent', (assert) =>
    {
        const leftNode = new feng3d.BinaryTreeNode(1);
        const rightNode = new feng3d.BinaryTreeNode(3);
        const rootNode = new feng3d.BinaryTreeNode(2);

        rootNode
            .setLeft(leftNode)
            .setRight(rightNode);

        assert.deepEqual(rootNode.parent, null);
        assert.deepEqual(rootNode.left.parent.value, 2);
        assert.deepEqual(rootNode.right.parent.value, 2);
        assert.deepEqual(rootNode.right.parent, rootNode);
    });

    QUnit.test('should traverse node', (assert) =>
    {
        const leftNode = new feng3d.BinaryTreeNode(1);
        const rightNode = new feng3d.BinaryTreeNode(3);
        const rootNode = new feng3d.BinaryTreeNode(2);

        rootNode
            .setLeft(leftNode)
            .setRight(rightNode);

        assert.deepEqual(rootNode.traverseInOrder(), [1, 2, 3]);

        assert.deepEqual(rootNode.toString(), '1,2,3');
    });

    QUnit.test('should remove child node', (assert) =>
    {
        const leftNode = new feng3d.BinaryTreeNode(1);
        const rightNode = new feng3d.BinaryTreeNode(3);
        const rootNode = new feng3d.BinaryTreeNode(2);

        rootNode
            .setLeft(leftNode)
            .setRight(rightNode);

        assert.deepEqual(rootNode.traverseInOrder(), [1, 2, 3]);

        assert.deepEqual(rootNode.removeChild(rootNode.left), true);
        assert.deepEqual(rootNode.traverseInOrder(), [2, 3]);

        assert.deepEqual(rootNode.removeChild(rootNode.right), true);
        assert.deepEqual(rootNode.traverseInOrder(), [2]);

        assert.deepEqual(rootNode.removeChild(rootNode.right), false);
        assert.deepEqual(rootNode.traverseInOrder(), [2]);
    });

    QUnit.test('should replace child node', (assert) =>
    {
        const leftNode = new feng3d.BinaryTreeNode(1);
        const rightNode = new feng3d.BinaryTreeNode(3);
        const rootNode = new feng3d.BinaryTreeNode(2);

        rootNode
            .setLeft(leftNode)
            .setRight(rightNode);

        assert.deepEqual(rootNode.traverseInOrder(), [1, 2, 3]);

        const replacementNode = new feng3d.BinaryTreeNode(5);
        rightNode.setRight(replacementNode);

        assert.deepEqual(rootNode.traverseInOrder(), [1, 2, 3, 5]);

        assert.deepEqual(rootNode.replaceChild(rootNode.right, rootNode.right.right), true);
        assert.deepEqual(rootNode.right.value, 5);
        assert.deepEqual(rootNode.right.right, null);
        assert.deepEqual(rootNode.traverseInOrder(), [1, 2, 5]);

        assert.deepEqual(rootNode.replaceChild(rootNode.right, rootNode.right.right), false);
        assert.deepEqual(rootNode.traverseInOrder(), [1, 2, 5]);

        assert.deepEqual(rootNode.replaceChild(rootNode.right, replacementNode), true);
        assert.deepEqual(rootNode.traverseInOrder(), [1, 2, 5]);

        assert.deepEqual(rootNode.replaceChild(rootNode.left, replacementNode), true);
        assert.deepEqual(rootNode.traverseInOrder(), [5, 2, 5]);

        assert.deepEqual(rootNode.replaceChild(new feng3d.BinaryTreeNode(), new feng3d.BinaryTreeNode()), false);
    });

    QUnit.test('should calculate node height', (assert) =>
    {
        const root = new feng3d.BinaryTreeNode(1);
        const left = new feng3d.BinaryTreeNode(3);
        const right = new feng3d.BinaryTreeNode(2);
        const grandLeft = new feng3d.BinaryTreeNode(5);
        const grandRight = new feng3d.BinaryTreeNode(6);
        const grandGrandLeft = new feng3d.BinaryTreeNode(7);

        assert.deepEqual(root.height, 0);
        assert.deepEqual(root.balanceFactor, 0);

        root
            .setLeft(left)
            .setRight(right);

        assert.deepEqual(root.height, 1);
        assert.deepEqual(left.height, 0);
        assert.deepEqual(root.balanceFactor, 0);

        left
            .setLeft(grandLeft)
            .setRight(grandRight);

        assert.deepEqual(root.height, 2);
        assert.deepEqual(left.height, 1);
        assert.deepEqual(grandLeft.height, 0);
        assert.deepEqual(grandRight.height, 0);
        assert.deepEqual(root.balanceFactor, 1);

        grandLeft.setLeft(grandGrandLeft);

        assert.deepEqual(root.height, 3);
        assert.deepEqual(left.height, 2);
        assert.deepEqual(grandLeft.height, 1);
        assert.deepEqual(grandRight.height, 0);
        assert.deepEqual(grandGrandLeft.height, 0);
        assert.deepEqual(root.balanceFactor, 2);
    });

    QUnit.test('should calculate node height for right nodes as well', (assert) =>
    {
        const root = new feng3d.BinaryTreeNode(1);
        const right = new feng3d.BinaryTreeNode(2);

        root.setRight(right);

        assert.deepEqual(root.height, 1);
        assert.deepEqual(right.height, 0);
        assert.deepEqual(root.balanceFactor, -1);
    });

    QUnit.test('should set null for left and right node', (assert) =>
    {
        const root = new feng3d.BinaryTreeNode(2);
        const left = new feng3d.BinaryTreeNode(1);
        const right = new feng3d.BinaryTreeNode(3);

        root.setLeft(left);
        root.setRight(right);

        assert.deepEqual(root.left.value, 1);
        assert.deepEqual(root.right.value, 3);

        root.setLeft(null);
        root.setRight(null);

        assert.deepEqual(root.left, null);
        assert.deepEqual(root.right, null);
    });

    QUnit.test('should be possible to create node with object as a value', (assert) =>
    {
        const obj1 = { key: 'object_1', toString: () => 'object_1' };
        const obj2 = { key: 'object_2' };

        const node1 = new feng3d.BinaryTreeNode(obj1);
        const node2 = new feng3d.BinaryTreeNode(obj2);

        node1.setLeft(node2);

        assert.deepEqual(node1.value, obj1);
        assert.deepEqual(node2.value, obj2);
        assert.deepEqual(node1.left.value, obj2);

        node1.removeChild(node2);

        assert.deepEqual(node1.value, obj1);
        assert.deepEqual(node2.value, obj2);
        assert.deepEqual(node1.left, null);

        assert.deepEqual(node1.toString(), 'object_1');
        assert.deepEqual(node2.toString(), '[object Object]');
    });

    QUnit.test('should be possible to attach meta information to the node', (assert) =>
    {
        const redNode = new feng3d.BinaryTreeNode(1);
        const blackNode = new feng3d.BinaryTreeNode(2);

        redNode.meta.set('color', 'red');
        blackNode.meta.set('color', 'black');

        assert.deepEqual(redNode.meta.get('color'), 'red');
        assert.deepEqual(blackNode.meta.get('color'), 'black');
    });

    QUnit.test('should detect right uncle', (assert) =>
    {
        const grandParent = new feng3d.BinaryTreeNode('grand-parent');
        const parent = new feng3d.BinaryTreeNode('parent');
        const uncle = new feng3d.BinaryTreeNode('uncle');
        const child = new feng3d.BinaryTreeNode('child');

        assert.deepEqual(grandParent.uncle, undefined);
        assert.deepEqual(parent.uncle, undefined);

        grandParent.setLeft(parent);

        assert.deepEqual(parent.uncle, undefined);
        assert.deepEqual(child.uncle, undefined);

        parent.setLeft(child);

        assert.deepEqual(child.uncle, undefined);

        grandParent.setRight(uncle);

        assert.deepEqual(parent.uncle, undefined);
        assert.deepEqual(child.uncle != undefined, true);
        assert.deepEqual(child.uncle, uncle);
    });

    QUnit.test('should detect left uncle', (assert) =>
    {
        const grandParent = new feng3d.BinaryTreeNode('grand-parent');
        const parent = new feng3d.BinaryTreeNode('parent');
        const uncle = new feng3d.BinaryTreeNode('uncle');
        const child = new feng3d.BinaryTreeNode('child');

        assert.deepEqual(grandParent.uncle, undefined);
        assert.deepEqual(parent.uncle, undefined);

        grandParent.setRight(parent);

        assert.deepEqual(parent.uncle, undefined);
        assert.deepEqual(child.uncle, undefined);

        parent.setRight(child);

        assert.deepEqual(child.uncle, undefined);

        grandParent.setLeft(uncle);

        assert.deepEqual(parent.uncle, undefined);
        assert.deepEqual(child.uncle != undefined, true);
        assert.deepEqual(child.uncle, uncle);
    });

    QUnit.test('should be possible to set node values', (assert) =>
    {
        const node = new feng3d.BinaryTreeNode('initial_value');

        assert.deepEqual(node.value, 'initial_value');

        node.setValue('new_value');

        assert.deepEqual(node.value, 'new_value');
    });

    QUnit.test('should be possible to copy node', (assert) =>
    {
        const root = new feng3d.BinaryTreeNode('root');
        const left = new feng3d.BinaryTreeNode('left');
        const right = new feng3d.BinaryTreeNode('right');

        root
            .setLeft(left)
            .setRight(right);

        assert.deepEqual(root.toString(), 'left,root,right');

        const newRoot = new feng3d.BinaryTreeNode('new_root');
        const newLeft = new feng3d.BinaryTreeNode('new_left');
        const newRight = new feng3d.BinaryTreeNode('new_right');

        newRoot
            .setLeft(newLeft)
            .setRight(newRight);

        assert.deepEqual(newRoot.toString(), 'new_left,new_root,new_right');

        feng3d.BinaryTreeNode.copyNode(root, newRoot);

        assert.deepEqual(root.toString(), 'left,root,right');
        assert.deepEqual(newRoot.toString(), 'left,root,right');
    });
});
