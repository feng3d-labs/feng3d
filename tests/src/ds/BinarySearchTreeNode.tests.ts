QUnit.module('BinarySearchTreeNode', () =>
{
    QUnit.test('should create binary search tree', (assert) =>
    {
        const bstNode = new ds.BinarySearchTreeNode(2);

        assert.deepEqual(bstNode.value, 2);
        assert.deepEqual(bstNode.left, null);
        assert.deepEqual(bstNode.right, null);
    });

    QUnit.test('should insert in itself if it is empty', (assert) =>
    {
        const bstNode = new ds.BinarySearchTreeNode();
        bstNode.insert(1);

        assert.deepEqual(bstNode.value, 1);
        assert.deepEqual(bstNode.left, null);
        assert.deepEqual(bstNode.right, null);
    });

    QUnit.test('should insert nodes in correct order', (assert) =>
    {
        const bstNode = new ds.BinarySearchTreeNode(2);
        const insertedNode1 = bstNode.insert(1);

        assert.deepEqual(insertedNode1.value, 1);
        assert.deepEqual(bstNode.toString(), '1,2');
        assert.deepEqual(bstNode.contains(1), true);
        assert.deepEqual(bstNode.contains(3), false);

        const insertedNode2 = bstNode.insert(3);

        assert.deepEqual(insertedNode2.value, 3);
        assert.deepEqual(bstNode.toString(), '1,2,3');
        assert.deepEqual(bstNode.contains(3), true);
        assert.deepEqual(bstNode.contains(4), false);

        bstNode.insert(7);

        assert.deepEqual(bstNode.toString(), '1,2,3,7');
        assert.deepEqual(bstNode.contains(7), true);
        assert.deepEqual(bstNode.contains(8), false);

        bstNode.insert(4);

        assert.deepEqual(bstNode.toString(), '1,2,3,4,7');
        assert.deepEqual(bstNode.contains(4), true);
        assert.deepEqual(bstNode.contains(8), false);

        bstNode.insert(6);

        assert.deepEqual(bstNode.toString(), '1,2,3,4,6,7');
        assert.deepEqual(bstNode.contains(6), true);
        assert.deepEqual(bstNode.contains(8), false);
    });

    QUnit.test('should not insert duplicates', (assert) =>
    {
        const bstNode = new ds.BinarySearchTreeNode(2);
        bstNode.insert(1);

        assert.deepEqual(bstNode.toString(), '1,2');
        assert.deepEqual(bstNode.contains(1), true);
        assert.deepEqual(bstNode.contains(3), false);

        bstNode.insert(1);

        assert.deepEqual(bstNode.toString(), '1,2');
        assert.deepEqual(bstNode.contains(1), true);
        assert.deepEqual(bstNode.contains(3), false);
    });

    QUnit.test('should find min node', (assert) =>
    {
        const node = new ds.BinarySearchTreeNode(10);

        node.insert(20);
        node.insert(30);
        node.insert(5);
        node.insert(40);
        node.insert(1);

        assert.deepEqual(node.findMin() != null, true);
        assert.deepEqual(node.findMin().value, 1);
    });

    QUnit.test('should be possible to attach meta information to binary search tree nodes', (assert) =>
    {
        const node = new ds.BinarySearchTreeNode(10);

        node.insert(20);
        const node1 = node.insert(30);
        node.insert(5);
        node.insert(40);
        const node2 = node.insert(1);

        node.meta.set('color', 'red');
        node1.meta.set('color', 'black');
        node2.meta.set('color', 'white');

        assert.deepEqual(node.meta.get('color'), 'red');

        assert.deepEqual(node.findMin() != null, true);
        assert.deepEqual(node.findMin().value, 1);
        assert.deepEqual(node.findMin().meta.get('color'), 'white');
        assert.deepEqual(node.find(30).meta.get('color'), 'black');
    });

    QUnit.test('should find node', (assert) =>
    {
        const node = new ds.BinarySearchTreeNode(10);

        node.insert(20);
        node.insert(30);
        node.insert(5);
        node.insert(40);
        node.insert(1);

        assert.deepEqual(node.find(6), null);
        assert.deepEqual(node.find(5) != null, true);
        assert.deepEqual(node.find(5).value, 5);
    });

    QUnit.test('should remove leaf nodes', (assert) =>
    {
        const bstRootNode = new ds.BinarySearchTreeNode();

        bstRootNode.insert(10);
        bstRootNode.insert(20);
        bstRootNode.insert(5);

        assert.deepEqual(bstRootNode.toString(), '5,10,20');

        const removed1 = bstRootNode.remove(5);
        assert.deepEqual(bstRootNode.toString(), '10,20');
        assert.deepEqual(removed1, true);

        const removed2 = bstRootNode.remove(20);
        assert.deepEqual(bstRootNode.toString(), '10');
        assert.deepEqual(removed2, true);
    });

    QUnit.test('should remove nodes with one child', (assert) =>
    {
        const bstRootNode = new ds.BinarySearchTreeNode();

        bstRootNode.insert(10);
        bstRootNode.insert(20);
        bstRootNode.insert(5);
        bstRootNode.insert(30);

        assert.deepEqual(bstRootNode.toString(), '5,10,20,30');

        bstRootNode.remove(20);
        assert.deepEqual(bstRootNode.toString(), '5,10,30');

        bstRootNode.insert(1);
        assert.deepEqual(bstRootNode.toString(), '1,5,10,30');

        bstRootNode.remove(5);
        assert.deepEqual(bstRootNode.toString(), '1,10,30');
    });

    QUnit.test('should remove nodes with two children', (assert) =>
    {
        const bstRootNode = new ds.BinarySearchTreeNode();

        bstRootNode.insert(10);
        bstRootNode.insert(20);
        bstRootNode.insert(5);
        bstRootNode.insert(30);
        bstRootNode.insert(15);
        bstRootNode.insert(25);

        assert.deepEqual(bstRootNode.toString(), '5,10,15,20,25,30');
        assert.deepEqual(bstRootNode.find(20).left.value, 15);
        assert.deepEqual(bstRootNode.find(20).right.value, 30);

        bstRootNode.remove(20);
        assert.deepEqual(bstRootNode.toString(), '5,10,15,25,30');

        bstRootNode.remove(15);
        assert.deepEqual(bstRootNode.toString(), '5,10,25,30');

        bstRootNode.remove(10);
        assert.deepEqual(bstRootNode.toString(), '5,25,30');
        assert.deepEqual(bstRootNode.value, 25);

        bstRootNode.remove(25);
        assert.deepEqual(bstRootNode.toString(), '5,30');

        bstRootNode.remove(5);
        assert.deepEqual(bstRootNode.toString(), '30');
    });

    QUnit.test('should remove node with no parent', (assert) =>
    {
        const bstRootNode = new ds.BinarySearchTreeNode();
        assert.deepEqual(bstRootNode.toString(), '');

        bstRootNode.insert(1);
        bstRootNode.insert(2);
        assert.deepEqual(bstRootNode.toString(), '1,2');

        bstRootNode.remove(1);
        assert.deepEqual(bstRootNode.toString(), '2');

        bstRootNode.remove(2);
        assert.deepEqual(bstRootNode.toString(), '');
    });

    QUnit.test('should throw error when trying to remove not existing node', (assert) =>
    {
        const bstRootNode = new ds.BinarySearchTreeNode();

        bstRootNode.insert(10);
        bstRootNode.insert(20);

        function removeNotExistingElementFromTree()
        {
            bstRootNode.remove(30);
        }

        var error0 = false;
        try
        {
            removeNotExistingElementFromTree();
        } catch (error)
        {
            error0 = true;
        }
        assert.deepEqual(error0, true);
    });

    QUnit.test('should be possible to use objects as node values', (assert) =>
    {
        const nodeValueComparatorCallback = (a, b) =>
        {
            const normalizedA = a || { value: null };
            const normalizedB = b || { value: null };

            if (normalizedA.value === normalizedB.value)
            {
                return 0;
            }

            return normalizedA.value < normalizedB.value ? -1 : 1;
        };

        const obj1 = { key: 'obj1', value: 1, toString: () => 'obj1' };
        const obj2 = { key: 'obj2', value: 2, toString: () => 'obj2' };
        const obj3 = { key: 'obj3', value: 3, toString: () => 'obj3' };

        const bstNode = new ds.BinarySearchTreeNode(obj2, nodeValueComparatorCallback);
        bstNode.insert(obj1);

        assert.deepEqual(bstNode.toString(), 'obj1,obj2');
        assert.deepEqual(bstNode.contains(obj1), true);
        assert.deepEqual(bstNode.contains(obj3), false);

        bstNode.insert(obj3);

        assert.deepEqual(bstNode.toString(), 'obj1,obj2,obj3');
        assert.deepEqual(bstNode.contains(obj3), true);

        assert.deepEqual(bstNode.findMin().value, obj1);
    });

    QUnit.test('should abandon removed node', (assert) =>
    {
        const rootNode = new ds.BinarySearchTreeNode('foo');
        rootNode.insert('bar');
        const childNode = rootNode.find('bar');
        rootNode.remove('bar');

        assert.deepEqual(childNode.parent, null);
    });
});
