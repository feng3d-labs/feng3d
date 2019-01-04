
QUnit.module('BinarySearchTree', () =>
{
    QUnit.test('should create binary search tree', (assert) =>
    {
        const bst = new ds.BinarySearchTree();

        assert.deepEqual(bst.root.value, null);
        assert.deepEqual(bst.root.left, null);
        assert.deepEqual(bst.root.right, null);
    });

    QUnit.test('should insert values', (assert) =>
    {
        const bst = new ds.BinarySearchTree();

        const insertedNode1 = bst.insert(10);
        const insertedNode2 = bst.insert(20);
        bst.insert(5);

        assert.deepEqual(bst.toString(), '5,10,20');
        assert.deepEqual(insertedNode1.value, 10);
        assert.deepEqual(insertedNode2.value, 20);
    });

    QUnit.test('should check if value exists', (assert) =>
    {
        const bst = new ds.BinarySearchTree();

        bst.insert(10);
        bst.insert(20);
        bst.insert(5);

        assert.deepEqual(bst.contains(20), true);
        assert.deepEqual(bst.contains(40), false);
    });

    QUnit.test('should remove nodes', (assert) =>
    {
        const bst = new ds.BinarySearchTree();

        bst.insert(10);
        bst.insert(20);
        bst.insert(5);

        assert.deepEqual(bst.toString(), '5,10,20');

        const removed1 = bst.remove(5);
        assert.deepEqual(bst.toString(), '10,20');
        assert.deepEqual(removed1, true);

        const removed2 = bst.remove(20);
        assert.deepEqual(bst.toString(), '10');
        assert.deepEqual(removed2, true);
    });

    QUnit.test('should insert object values', (assert) =>
    {
        const nodeValueCompareFunction = (a, b) =>
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

        const bst = new ds.BinarySearchTree(nodeValueCompareFunction);

        bst.insert(obj2);
        bst.insert(obj3);
        bst.insert(obj1);

        assert.deepEqual(bst.toString(), 'obj1,obj2,obj3');
    });

    QUnit.test('should be traversed to sorted array', (assert) =>
    {
        const bst = new ds.BinarySearchTree();

        bst.insert(10);
        bst.insert(-10);
        bst.insert(20);
        bst.insert(-20);
        bst.insert(25);
        bst.insert(6);

        assert.deepEqual(bst.toString(), '-20,-10,6,10,20,25');
        assert.deepEqual(bst.root.height, 2);

        bst.insert(4);

        assert.deepEqual(bst.toString(), '-20,-10,4,6,10,20,25');
        assert.deepEqual(bst.root.height, 3);
    });
});
