QUnit.module('AvlTree', () =>
{
    QUnit.test('should do simple left-left rotation', (assert) =>
    {
        const tree = new feng3d.AvlTree();

        tree.insert(4);
        tree.insert(3);
        tree.insert(2);

        assert.deepEqual(tree.toString(), '2,3,4');
        assert.deepEqual(tree.root.value, 3);
        assert.deepEqual(tree.root.height, 1);

        tree.insert(1);

        assert.deepEqual(tree.toString(), '1,2,3,4');
        assert.deepEqual(tree.root.value, 3);
        assert.deepEqual(tree.root.height, 2);

        tree.insert(0);

        assert.deepEqual(tree.toString(), '0,1,2,3,4');
        assert.deepEqual(tree.root.value, 3);
        assert.deepEqual(tree.root.left.value, 1);
        assert.deepEqual(tree.root.height, 2);
    });

    QUnit.test('should do complex left-left rotation', (assert) =>
    {
        const tree = new feng3d.AvlTree();

        tree.insert(30);
        tree.insert(20);
        tree.insert(40);
        tree.insert(10);

        assert.deepEqual(tree.root.value, 30);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '10,20,30,40');

        tree.insert(25);
        assert.deepEqual(tree.root.value, 30);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '10,20,25,30,40');

        tree.insert(5);
        assert.deepEqual(tree.root.value, 20);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '5,10,20,25,30,40');
    });

    QUnit.test('should do simple right-right rotation', (assert) =>
    {
        const tree = new feng3d.AvlTree();

        tree.insert(2);
        tree.insert(3);
        tree.insert(4);

        assert.deepEqual(tree.toString(), '2,3,4');
        assert.deepEqual(tree.root.value, 3);
        assert.deepEqual(tree.root.height, 1);

        tree.insert(5);

        assert.deepEqual(tree.toString(), '2,3,4,5');
        assert.deepEqual(tree.root.value, 3);
        assert.deepEqual(tree.root.height, 2);

        tree.insert(6);

        assert.deepEqual(tree.toString(), '2,3,4,5,6');
        assert.deepEqual(tree.root.value, 3);
        assert.deepEqual(tree.root.right.value, 5);
        assert.deepEqual(tree.root.height, 2);
    });

    QUnit.test('should do complex right-right rotation', (assert) =>
    {
        const tree = new feng3d.AvlTree();

        tree.insert(30);
        tree.insert(20);
        tree.insert(40);
        tree.insert(50);

        assert.deepEqual(tree.root.value, 30);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '20,30,40,50');

        tree.insert(35);
        assert.deepEqual(tree.root.value, 30);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '20,30,35,40,50');

        tree.insert(55);
        assert.deepEqual(tree.root.value, 40);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '20,30,35,40,50,55');
    });

    QUnit.test('should do left-right rotation', (assert) =>
    {
        const tree = new feng3d.AvlTree();

        tree.insert(30);
        tree.insert(20);
        tree.insert(25);

        assert.deepEqual(tree.root.height, 1);
        assert.deepEqual(tree.root.value, 25);
        assert.deepEqual(tree.toString(), '20,25,30');
    });

    QUnit.test('should do right-left rotation', (assert) =>
    {
        const tree = new feng3d.AvlTree();

        tree.insert(30);
        tree.insert(40);
        tree.insert(35);

        assert.deepEqual(tree.root.height, 1);
        assert.deepEqual(tree.root.value, 35);
        assert.deepEqual(tree.toString(), '30,35,40');
    });

    QUnit.test('should create balanced tree: case #1', (assert) =>
    {
        // @see: https://www.youtube.com/watch?v=rbg7Qf8GkQ4&t=839s
        const tree = new feng3d.AvlTree();

        tree.insert(1);
        tree.insert(2);
        tree.insert(3);

        assert.deepEqual(tree.root.value, 2);
        assert.deepEqual(tree.root.height, 1);
        assert.deepEqual(tree.toString(), '1,2,3');

        tree.insert(6);

        assert.deepEqual(tree.root.value, 2);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '1,2,3,6');

        tree.insert(15);

        assert.deepEqual(tree.root.value, 2);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '1,2,3,6,15');

        tree.insert(-2);

        assert.deepEqual(tree.root.value, 2);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '-2,1,2,3,6,15');

        tree.insert(-5);

        assert.deepEqual(tree.root.value, 2);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '-5,-2,1,2,3,6,15');

        tree.insert(-8);

        assert.deepEqual(tree.root.value, 2);
        assert.deepEqual(tree.root.height, 3);
        assert.deepEqual(tree.toString(), '-8,-5,-2,1,2,3,6,15');
    });

    QUnit.test('should create balanced tree: case #2', (assert) =>
    {
        // @see https://www.youtube.com/watch?v=7m94k2Qhg68
        const tree = new feng3d.AvlTree();

        tree.insert(43);
        tree.insert(18);
        tree.insert(22);
        tree.insert(9);
        tree.insert(21);
        tree.insert(6);

        assert.deepEqual(tree.root.value, 18);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '6,9,18,21,22,43');

        tree.insert(8);

        assert.deepEqual(tree.root.value, 18);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '6,8,9,18,21,22,43');
    });

    QUnit.test('should do left right rotation and keeping left right node safe', (assert) =>
    {
        const tree = new feng3d.AvlTree();

        tree.insert(30);
        tree.insert(15);
        tree.insert(40);
        tree.insert(10);
        tree.insert(18);
        tree.insert(35);
        tree.insert(45);
        tree.insert(5);
        tree.insert(12);

        assert.deepEqual(tree.toString(), '5,10,12,15,18,30,35,40,45');
        assert.deepEqual(tree.root.height, 3);

        tree.insert(11);

        assert.deepEqual(tree.toString(), '5,10,11,12,15,18,30,35,40,45');
        assert.deepEqual(tree.root.height, 3);
    });

    QUnit.test('should do left right rotation and keeping left right node safe', (assert) =>
    {
        const tree = new feng3d.AvlTree();

        tree.insert(30);
        tree.insert(15);
        tree.insert(40);
        tree.insert(10);
        tree.insert(18);
        tree.insert(35);
        tree.insert(45);
        tree.insert(42);
        tree.insert(47);

        assert.deepEqual(tree.toString(), '10,15,18,30,35,40,42,45,47');
        assert.deepEqual(tree.root.height, 3);

        tree.insert(43);

        assert.deepEqual(tree.toString(), '10,15,18,30,35,40,42,43,45,47');
        assert.deepEqual(tree.root.height, 3);
    });

    QUnit.test('should remove values from the tree with right-right rotation', (assert) =>
    {
        const tree = new feng3d.AvlTree();

        tree.insert(10);
        tree.insert(20);
        tree.insert(30);
        tree.insert(40);

        assert.deepEqual(tree.toString(), '10,20,30,40');

        tree.remove(10);

        assert.deepEqual(tree.toString(), '20,30,40');
        assert.deepEqual(tree.root.value, 30);
        assert.deepEqual(tree.root.left.value, 20);
        assert.deepEqual(tree.root.right.value, 40);
        assert.deepEqual(tree.root.balanceFactor, 0);
    });

    QUnit.test('should remove values from the tree with left-left rotation', (assert) =>
    {
        const tree = new feng3d.AvlTree();

        tree.insert(10);
        tree.insert(20);
        tree.insert(30);
        tree.insert(5);

        assert.deepEqual(tree.toString(), '5,10,20,30');

        tree.remove(30);

        assert.deepEqual(tree.toString(), '5,10,20');
        assert.deepEqual(tree.root.value, 10);
        assert.deepEqual(tree.root.left.value, 5);
        assert.deepEqual(tree.root.right.value, 20);
        assert.deepEqual(tree.root.balanceFactor, 0);
    });

    QUnit.test('should keep balance after removal', (assert) =>
    {
        const tree = new feng3d.AvlTree();

        tree.insert(1);
        tree.insert(2);
        tree.insert(3);
        tree.insert(4);
        tree.insert(5);
        tree.insert(6);
        tree.insert(7);
        tree.insert(8);
        tree.insert(9);

        assert.deepEqual(tree.toString(), '1,2,3,4,5,6,7,8,9');
        assert.deepEqual(tree.root.value, 4);
        assert.deepEqual(tree.root.height, 3);
        assert.deepEqual(tree.root.balanceFactor, -1);

        tree.remove(8);

        assert.deepEqual(tree.root.value, 4);
        assert.deepEqual(tree.root.balanceFactor, -1);

        tree.remove(9);

        assert.deepEqual(tree.contains(8), false);
        assert.deepEqual(tree.contains(9), false);
        assert.deepEqual(tree.toString(), '1,2,3,4,5,6,7');
        assert.deepEqual(tree.root.value, 4);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.root.balanceFactor, 0);
    });
});
