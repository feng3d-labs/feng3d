QUnit.module('MinHeap', (assert) =>
{
    QUnit.test('should create an empty min heap', (assert) =>
    {
        const minHeap = new ds.MinHeap();

        assert.deepEqual(minHeap.peek(), null);
        assert.deepEqual(minHeap.isEmpty(), true);
    });

    QUnit.test('should add items to the heap and heapify it up', (assert) =>
    {
        const minHeap = new ds.MinHeap();

        minHeap.add(5);
        assert.deepEqual(minHeap.isEmpty(), false);
        assert.deepEqual(minHeap.peek(), 5);
        assert.deepEqual(minHeap.toString(), '5');

        minHeap.add(3);
        assert.deepEqual(minHeap.peek(), 3);
        assert.deepEqual(minHeap.toString(), '3,5');

        minHeap.add(10);
        assert.deepEqual(minHeap.peek(), 3);
        assert.deepEqual(minHeap.toString(), '3,5,10');

        minHeap.add(1);
        assert.deepEqual(minHeap.peek(), 1);
        assert.deepEqual(minHeap.toString(), '1,3,10,5');

        minHeap.add(1);
        assert.deepEqual(minHeap.peek(), 1);
        assert.deepEqual(minHeap.toString(), '1,1,10,5,3');

        assert.deepEqual(minHeap.poll(), 1);
        assert.deepEqual(minHeap.toString(), '1,3,10,5');

        assert.deepEqual(minHeap.poll(), 1);
        assert.deepEqual(minHeap.toString(), '3,5,10');

        assert.deepEqual(minHeap.poll(), 3);
        assert.deepEqual(minHeap.toString(), '5,10');
    });

    QUnit.test('should poll items from the heap and heapify it down', (assert) =>
    {
        const minHeap = new ds.MinHeap();

        minHeap.add(5);
        minHeap.add(3);
        minHeap.add(10);
        minHeap.add(11);
        minHeap.add(1);

        assert.deepEqual(minHeap.toString(), '1,3,10,11,5');

        assert.deepEqual(minHeap.poll(), 1);
        assert.deepEqual(minHeap.toString(), '3,5,10,11');

        assert.deepEqual(minHeap.poll(), 3);
        assert.deepEqual(minHeap.toString(), '5,11,10');

        assert.deepEqual(minHeap.poll(), 5);
        assert.deepEqual(minHeap.toString(), '10,11');

        assert.deepEqual(minHeap.poll(), 10);
        assert.deepEqual(minHeap.toString(), '11');

        assert.deepEqual(minHeap.poll(), 11);
        assert.deepEqual(minHeap.toString(), '');

        assert.deepEqual(minHeap.poll(), null);
        assert.deepEqual(minHeap.toString(), '');
    });

    QUnit.test('should heapify down through the right branch as well', (assert) =>
    {
        const minHeap = new ds.MinHeap();

        minHeap.add(3);
        minHeap.add(12);
        minHeap.add(10);

        assert.deepEqual(minHeap.toString(), '3,12,10');

        minHeap.add(11);
        assert.deepEqual(minHeap.toString(), '3,11,10,12');

        assert.deepEqual(minHeap.poll(), 3);
        assert.deepEqual(minHeap.toString(), '10,11,12');
    });

    QUnit.test('should be possible to find item indices in heap', (assert) =>
    {
        const minHeap = new ds.MinHeap();

        minHeap.add(3);
        minHeap.add(12);
        minHeap.add(10);
        minHeap.add(11);
        minHeap.add(11);

        assert.deepEqual(minHeap.toString(), '3,11,10,12,11');

        assert.deepEqual(minHeap.find(5), []);
        assert.deepEqual(minHeap.find(3), [0]);
        assert.deepEqual(minHeap.find(11), [1, 4]);
    });

    QUnit.test('should be possible to remove items from heap with heapify down', (assert) =>
    {
        const minHeap = new ds.MinHeap();

        minHeap.add(3);
        minHeap.add(12);
        minHeap.add(10);
        minHeap.add(11);
        minHeap.add(11);

        assert.deepEqual(minHeap.toString(), '3,11,10,12,11');

        assert.deepEqual(minHeap.remove(3).toString(), '10,11,11,12');
        assert.deepEqual(minHeap.remove(3).peek(), 10);
        assert.deepEqual(minHeap.remove(11).toString(), '10,12');
        assert.deepEqual(minHeap.remove(3).peek(), 10);
    });

    QUnit.test('should be possible to remove items from heap with heapify up', (assert) =>
    {
        const minHeap = new ds.MinHeap();

        minHeap.add(3);
        minHeap.add(10);
        minHeap.add(5);
        minHeap.add(6);
        minHeap.add(7);
        minHeap.add(4);
        minHeap.add(6);
        minHeap.add(8);
        minHeap.add(2);
        minHeap.add(1);

        assert.deepEqual(minHeap.toString(), '1,2,4,6,3,5,6,10,8,7');
        assert.deepEqual(minHeap.remove(8).toString(), '1,2,4,6,3,5,6,10,7');
        assert.deepEqual(minHeap.remove(7).toString(), '1,2,4,6,3,5,6,10');
        assert.deepEqual(minHeap.remove(1).toString(), '2,3,4,6,10,5,6');
        assert.deepEqual(minHeap.remove(2).toString(), '3,6,4,6,10,5');
        assert.deepEqual(minHeap.remove(6).toString(), '3,5,4,10');
        assert.deepEqual(minHeap.remove(10).toString(), '3,5,4');
        assert.deepEqual(minHeap.remove(5).toString(), '3,4');
        assert.deepEqual(minHeap.remove(3).toString(), '4');
        assert.deepEqual(minHeap.remove(4).toString(), '');
    });

    QUnit.test('should be possible to remove items from heap with custom finding comparator', (assert) =>
    {
        const minHeap = new ds.MinHeap();
        minHeap.add('dddd');
        minHeap.add('ccc');
        minHeap.add('bb');
        minHeap.add('a');

        assert.deepEqual(minHeap.toString(), 'a,bb,ccc,dddd');

        const comparator = new ds.Comparator((a: string, b: string) =>
        {
            if (a.length === b.length)
            {
                return 0;
            }

            return a.length < b.length ? -1 : 1;
        });

        minHeap.remove('hey', comparator);
        assert.deepEqual(minHeap.toString(), 'a,bb,dddd');
    });

    QUnit.test('should remove values from heap and correctly re-order the tree', (assert) =>
    {
        const minHeap = new ds.MinHeap();

        minHeap.add(1);
        minHeap.add(2);
        minHeap.add(3);
        minHeap.add(4);
        minHeap.add(5);
        minHeap.add(6);
        minHeap.add(7);
        minHeap.add(8);
        minHeap.add(9);

        assert.deepEqual(minHeap.toString(), '1,2,3,4,5,6,7,8,9');

        minHeap.remove(2);
        assert.deepEqual(minHeap.toString(), '1,4,3,8,5,6,7,9');

        minHeap.remove(4);
        assert.deepEqual(minHeap.toString(), '1,5,3,8,9,6,7');
    });
});
