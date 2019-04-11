QUnit.module('DisjointSet', () =>
{
    QUnit.test('should throw error when trying to union and check not existing sets', (assert) =>
    {
        function mergeNotExistingSets()
        {
            const disjointSet = new ds.DisjointSet();

            disjointSet.union('A', 'B');
        }

        function checkNotExistingSets()
        {
            const disjointSet = new ds.DisjointSet();

            disjointSet.inSameSet('A', 'B');
        }

        var error0 = false, error1 = false;
        try
        {
            mergeNotExistingSets();
        } catch (error)
        {
            error0 = true;
        }
        try
        {
            checkNotExistingSets();
        } catch (error)
        {
            error1 = true;
        }

        assert.deepEqual(error0, true);
        assert.deepEqual(error1, true);
    });

    QUnit.test('should do basic manipulations on disjoint set', (assert) =>
    {
        const disjointSet = new ds.DisjointSet();

        assert.deepEqual(disjointSet.find('A'), null);
        assert.deepEqual(disjointSet.find('B'), null);

        disjointSet.makeSet('A');

        assert.deepEqual(disjointSet.find('A'), 'A');
        assert.deepEqual(disjointSet.find('B'), null);

        disjointSet.makeSet('B');

        assert.deepEqual(disjointSet.find('A'), 'A');
        assert.deepEqual(disjointSet.find('B'), 'B');

        disjointSet.makeSet('C');

        assert.deepEqual(disjointSet.inSameSet('A', 'B'), false);

        disjointSet.union('A', 'B');

        assert.deepEqual(disjointSet.find('A'), 'A');
        assert.deepEqual(disjointSet.find('B'), 'A');
        assert.deepEqual(disjointSet.inSameSet('A', 'B'), true);
        assert.deepEqual(disjointSet.inSameSet('B', 'A'), true);
        assert.deepEqual(disjointSet.inSameSet('A', 'C'), false);

        disjointSet.union('A', 'A');

        disjointSet.union('B', 'C');

        assert.deepEqual(disjointSet.find('A'), 'A');
        assert.deepEqual(disjointSet.find('B'), 'A');
        assert.deepEqual(disjointSet.find('C'), 'A');

        assert.deepEqual(disjointSet.inSameSet('A', 'B'), true);
        assert.deepEqual(disjointSet.inSameSet('B', 'C'), true);
        assert.deepEqual(disjointSet.inSameSet('A', 'C'), true);

        disjointSet
            .makeSet('E')
            .makeSet('F')
            .makeSet('G')
            .makeSet('H')
            .makeSet('I');

        disjointSet
            .union('E', 'F')
            .union('F', 'G')
            .union('G', 'H')
            .union('H', 'I');

        assert.deepEqual(disjointSet.inSameSet('A', 'I'), false);
        assert.deepEqual(disjointSet.inSameSet('E', 'I'), true);

        disjointSet.union('I', 'C');

        assert.deepEqual(disjointSet.find('I'), 'E');
        assert.deepEqual(disjointSet.inSameSet('A', 'I'), true);
    });

    QUnit.test('should union smaller set with bigger one making bigger one to be new root', (assert) =>
    {
        const disjointSet = new ds.DisjointSet();

        disjointSet
            .makeSet('A')
            .makeSet('B')
            .makeSet('C')
            .union('B', 'C')
            .union('A', 'C');

        assert.deepEqual(disjointSet.find('A'), 'B');
    });

    QUnit.test('should do basic manipulations on disjoint set with custom key extractor', (assert) =>
    {
        const keyExtractor = value => value.key;

        const disjointSet = new ds.DisjointSet(keyExtractor);

        const itemA = { key: 'A', value: 1 };
        const itemB = { key: 'B', value: 2 };
        const itemC = { key: 'C', value: 3 };

        assert.deepEqual(disjointSet.find(itemA), null);
        assert.deepEqual(disjointSet.find(itemB), null);

        disjointSet.makeSet(itemA);

        assert.deepEqual(disjointSet.find(itemA), 'A');
        assert.deepEqual(disjointSet.find(itemB), null);

        disjointSet.makeSet(itemB);

        assert.deepEqual(disjointSet.find(itemA), 'A');
        assert.deepEqual(disjointSet.find(itemB), 'B');

        disjointSet.makeSet(itemC);

        assert.deepEqual(disjointSet.inSameSet(itemA, itemB), false);

        disjointSet.union(itemA, itemB);

        assert.deepEqual(disjointSet.find(itemA), 'A');
        assert.deepEqual(disjointSet.find(itemB), 'A');
        assert.deepEqual(disjointSet.inSameSet(itemA, itemB), true);
        assert.deepEqual(disjointSet.inSameSet(itemB, itemA), true);
        assert.deepEqual(disjointSet.inSameSet(itemA, itemC), false);

        disjointSet.union(itemA, itemC);

        assert.deepEqual(disjointSet.find(itemA), 'A');
        assert.deepEqual(disjointSet.find(itemB), 'A');
        assert.deepEqual(disjointSet.find(itemC), 'A');

        assert.deepEqual(disjointSet.inSameSet(itemA, itemB), true);
        assert.deepEqual(disjointSet.inSameSet(itemB, itemC), true);
        assert.deepEqual(disjointSet.inSameSet(itemA, itemC), true);
    });
});

QUnit.module('DisjointSetNode', () =>
{
    QUnit.test('should do basic manipulation with disjoint set item', (assert) =>
    {
        const itemA = new ds.DisjointSetNode('A');
        const itemB = new ds.DisjointSetNode('B');
        const itemC = new ds.DisjointSetNode('C');
        const itemD = new ds.DisjointSetNode('D');

        assert.deepEqual(itemA.getRank(), 0);
        assert.deepEqual(itemA.getChildren(), []);
        assert.deepEqual(itemA.getKey(), 'A');
        assert.deepEqual(itemA.getRoot(), itemA);
        assert.deepEqual(itemA.isRoot(), true);
        assert.deepEqual(itemB.isRoot(), true);

        itemA.addChild(itemB);
        itemD.setParent(itemC);

        assert.deepEqual(itemA.getRank(), 1);
        assert.deepEqual(itemC.getRank(), 1);

        assert.deepEqual(itemB.getRank(), 0);
        assert.deepEqual(itemD.getRank(), 0);

        assert.deepEqual(itemA.getChildren().length, 1);
        assert.deepEqual(itemC.getChildren().length, 1);

        assert.deepEqual(itemA.getChildren()[0], itemB);
        assert.deepEqual(itemC.getChildren()[0], itemD);

        assert.deepEqual(itemB.getChildren().length, 0);
        assert.deepEqual(itemD.getChildren().length, 0);

        assert.deepEqual(itemA.getRoot(), itemA);
        assert.deepEqual(itemB.getRoot(), itemA);

        assert.deepEqual(itemC.getRoot(), itemC);
        assert.deepEqual(itemD.getRoot(), itemC);

        assert.deepEqual(itemA.isRoot(), true);
        assert.deepEqual(itemB.isRoot(), false);
        assert.deepEqual(itemC.isRoot(), true);
        assert.deepEqual(itemD.isRoot(), false);

        itemA.addChild(itemC);

        assert.deepEqual(itemA.isRoot(), true);
        assert.deepEqual(itemB.isRoot(), false);
        assert.deepEqual(itemC.isRoot(), false);
        assert.deepEqual(itemD.isRoot(), false);

        assert.deepEqual(itemA.getRank(), 3);
        assert.deepEqual(itemB.getRank(), 0);
        assert.deepEqual(itemC.getRank(), 1);
    });

    QUnit.test('should do basic manipulation with disjoint set item with custom key extractor', (assert) =>
    {
        const keyExtractor = (value) =>
        {
            return value.key;
        };

        const itemA = new ds.DisjointSetNode({ key: 'A', value: 1 }, keyExtractor);
        const itemB = new ds.DisjointSetNode({ key: 'B', value: 2 }, keyExtractor);
        const itemC = new ds.DisjointSetNode({ key: 'C', value: 3 }, keyExtractor);
        const itemD = new ds.DisjointSetNode({ key: 'D', value: 4 }, keyExtractor);

        assert.deepEqual(itemA.getRank(), 0);
        assert.deepEqual(itemA.getChildren(), []);
        assert.deepEqual(itemA.getKey(), 'A');
        assert.deepEqual(itemA.getRoot(), itemA);
        assert.deepEqual(itemA.isRoot(), true);
        assert.deepEqual(itemB.isRoot(), true);

        itemA.addChild(itemB);
        itemD.setParent(itemC);

        assert.deepEqual(itemA.getRank(), 1);
        assert.deepEqual(itemC.getRank(), 1);

        assert.deepEqual(itemB.getRank(), 0);
        assert.deepEqual(itemD.getRank(), 0);

        assert.deepEqual(itemA.getChildren().length, 1);
        assert.deepEqual(itemC.getChildren().length, 1);

        assert.deepEqual(itemA.getChildren()[0], itemB);
        assert.deepEqual(itemC.getChildren()[0], itemD);

        assert.deepEqual(itemB.getChildren().length, 0);
        assert.deepEqual(itemD.getChildren().length, 0);

        assert.deepEqual(itemA.getRoot(), itemA);
        assert.deepEqual(itemB.getRoot(), itemA);

        assert.deepEqual(itemC.getRoot(), itemC);
        assert.deepEqual(itemD.getRoot(), itemC);

        assert.deepEqual(itemA.isRoot(), true);
        assert.deepEqual(itemB.isRoot(), false);
        assert.deepEqual(itemC.isRoot(), true);
        assert.deepEqual(itemD.isRoot(), false);

        itemA.addChild(itemC);

        assert.deepEqual(itemA.isRoot(), true);
        assert.deepEqual(itemB.isRoot(), false);
        assert.deepEqual(itemC.isRoot(), false);
        assert.deepEqual(itemD.isRoot(), false);

        assert.deepEqual(itemA.getRank(), 3);
        assert.deepEqual(itemB.getRank(), 0);
        assert.deepEqual(itemC.getRank(), 1);
    });
});