QUnit.module("MaxHeap", () =>
{
    QUnit.test("MaxHeap", (assert) =>
    {
        const maxHeap = new feng3d.MaxHeap();

        assert.deepEqual(maxHeap.peek(), null);
        assert.deepEqual(maxHeap.isEmpty(), true);
    });

    QUnit.test("should add items to the heap and heapify it up", (assert) =>
    {
        const maxHeap = new feng3d.MaxHeap();

        maxHeap.add(5);
        assert.deepEqual(maxHeap.isEmpty(), false);
        assert.deepEqual(maxHeap.peek(), 5);
        assert.deepEqual(maxHeap.toString(), '5');

        maxHeap.add(3);
        assert.deepEqual(maxHeap.peek(), 5);
        assert.deepEqual(maxHeap.toString(), '5,3');

        maxHeap.add(10);
        assert.deepEqual(maxHeap.peek(), 10);
        assert.deepEqual(maxHeap.toString(), '10,3,5');

        maxHeap.add(1);
        assert.deepEqual(maxHeap.peek(), 10);
        assert.deepEqual(maxHeap.toString(), '10,3,5,1');

        maxHeap.add(1);
        assert.deepEqual(maxHeap.peek(), 10);
        assert.deepEqual(maxHeap.toString(), '10,3,5,1,1');

        assert.deepEqual(maxHeap.poll(), 10);
        assert.deepEqual(maxHeap.toString(), '5,3,1,1');

        assert.deepEqual(maxHeap.poll(), 5);
        assert.deepEqual(maxHeap.toString(), '3,1,1');

        assert.deepEqual(maxHeap.poll(), 3);
        assert.deepEqual(maxHeap.toString(), '1,1');
    });

    QUnit.test('should poll items from the heap and heapify it down', (assert) =>
    {
        const maxHeap = new feng3d.MaxHeap();

        maxHeap.add(5);
        maxHeap.add(3);
        maxHeap.add(10);
        maxHeap.add(11);
        maxHeap.add(1);

        assert.deepEqual(maxHeap.toString(), '11,10,5,3,1');

        assert.deepEqual(maxHeap.poll(), 11);
        assert.deepEqual(maxHeap.toString(), '10,3,5,1');

        assert.deepEqual(maxHeap.poll(), 10);
        assert.deepEqual(maxHeap.toString(), '5,3,1');

        assert.deepEqual(maxHeap.poll(), 5);
        assert.deepEqual(maxHeap.toString(), '3,1');

        assert.deepEqual(maxHeap.poll(), 3);
        assert.deepEqual(maxHeap.toString(), '1');

        assert.deepEqual(maxHeap.poll(), 1);
        assert.deepEqual(maxHeap.toString(), '');

        assert.deepEqual(maxHeap.poll(), null);
        assert.deepEqual(maxHeap.toString(), '');
    });

    QUnit.test('should heapify down through the right branch as well', (assert) =>
    {
        const maxHeap = new feng3d.MaxHeap();

        maxHeap.add(3);
        maxHeap.add(12);
        maxHeap.add(10);

        assert.deepEqual(maxHeap.toString(), '12,3,10');

        maxHeap.add(11);
        assert.deepEqual(maxHeap.toString(), '12,11,10,3');

        assert.deepEqual(maxHeap.poll(), 12);
        assert.deepEqual(maxHeap.toString(), '11,3,10');
    });

    QUnit.test('should be possible to find item indices in heap', (assert) =>
    {
        const maxHeap = new feng3d.MaxHeap();

        maxHeap.add(3);
        maxHeap.add(12);
        maxHeap.add(10);
        maxHeap.add(11);
        maxHeap.add(11);

        assert.deepEqual(maxHeap.toString(), '12,11,10,3,11');

        assert.deepEqual(maxHeap.find(5), []);
        assert.deepEqual(maxHeap.find(12), [0]);
        assert.deepEqual(maxHeap.find(11), [1, 4]);
    });

    QUnit.test('should be possible to remove items from heap with heapify down', (assert) =>
    {
        const maxHeap = new feng3d.MaxHeap();

        maxHeap.add(3);
        maxHeap.add(12);
        maxHeap.add(10);
        maxHeap.add(11);
        maxHeap.add(11);

        assert.deepEqual(maxHeap.toString(), '12,11,10,3,11');

        assert.deepEqual(maxHeap.remove(12).toString(), '11,11,10,3');
        assert.deepEqual(maxHeap.remove(12).peek(), 11);
        assert.deepEqual(maxHeap.remove(11).toString(), '10,3');
        assert.deepEqual(maxHeap.remove(10).peek(), 3);
    });

    QUnit.test('should be possible to remove items from heap with heapify up', (assert) =>
    {
        const maxHeap = new feng3d.MaxHeap();

        maxHeap.add(3);
        maxHeap.add(10);
        maxHeap.add(5);
        maxHeap.add(6);
        maxHeap.add(7);
        maxHeap.add(4);
        maxHeap.add(6);
        maxHeap.add(8);
        maxHeap.add(2);
        maxHeap.add(1);

        assert.deepEqual(maxHeap.toString(), '10,8,6,7,6,4,5,3,2,1');
        assert.deepEqual(maxHeap.remove(4).toString(), '10,8,6,7,6,1,5,3,2');
        assert.deepEqual(maxHeap.remove(3).toString(), '10,8,6,7,6,1,5,2');
        assert.deepEqual(maxHeap.remove(5).toString(), '10,8,6,7,6,1,2');
        assert.deepEqual(maxHeap.remove(10).toString(), '8,7,6,2,6,1');
        assert.deepEqual(maxHeap.remove(6).toString(), '8,7,1,2');
        assert.deepEqual(maxHeap.remove(2).toString(), '8,7,1');
        assert.deepEqual(maxHeap.remove(1).toString(), '8,7');
        assert.deepEqual(maxHeap.remove(7).toString(), '8');
        assert.deepEqual(maxHeap.remove(8).toString(), '');
    });

    QUnit.test('should be possible to remove items from heap with custom finding comparator', (assert) =>
    {
        const maxHeap = new feng3d.MaxHeap();
        maxHeap.add('a');
        maxHeap.add('bb');
        maxHeap.add('ccc');
        maxHeap.add('dddd');

        assert.deepEqual(maxHeap.toString(), 'dddd,ccc,bb,a');

        const comparator = new feng3d.Comparator((a: string, b: string) =>
        {
            if (a.length === b.length)
            {
                return 0;
            }

            return a.length < b.length ? -1 : 1;
        });

        maxHeap.remove('hey', comparator);
        assert.deepEqual(maxHeap.toString(), 'dddd,a,bb');
    });
});