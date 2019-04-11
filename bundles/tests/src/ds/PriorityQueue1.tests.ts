
QUnit.module('PriorityQueue1', () =>
{
    QUnit.test('should create default priority queue', (assert) =>
    {
        const priorityQueue = new ds.PriorityQueue1();

        assert.deepEqual(priorityQueue != null, true);
    });

    QUnit.test('should insert items to the queue and respect priorities', (assert) =>
    {
        const priorityQueue = new ds.PriorityQueue1();

        priorityQueue.add(10, 1);
        assert.deepEqual(priorityQueue.peek(), 10);

        priorityQueue.add(5, 2);
        assert.deepEqual(priorityQueue.peek(), 10);

        priorityQueue.add(100, 0);
        assert.deepEqual(priorityQueue.peek(), 100);
    });

    QUnit.test('should poll from queue with respect to priorities', (assert) =>
    {
        const priorityQueue = new ds.PriorityQueue1();

        priorityQueue.add(10, 1);
        priorityQueue.add(5, 2);
        priorityQueue.add(100, 0);
        priorityQueue.add(200, 0);

        assert.deepEqual(priorityQueue.poll(), 100);
        assert.deepEqual(priorityQueue.poll(), 200);
        assert.deepEqual(priorityQueue.poll(), 10);
        assert.deepEqual(priorityQueue.poll(), 5);
    });

    QUnit.test('should be possible to change priority of internal nodes', (assert) =>
    {
        const priorityQueue = new ds.PriorityQueue1();

        priorityQueue.add(10, 1);
        priorityQueue.add(5, 2);
        priorityQueue.add(100, 0);
        priorityQueue.add(200, 0);

        priorityQueue.changePriority(100, 10);
        priorityQueue.changePriority(10, 20);

        assert.deepEqual(priorityQueue.poll(), 200);
        assert.deepEqual(priorityQueue.poll(), 5);
        assert.deepEqual(priorityQueue.poll(), 100);
        assert.deepEqual(priorityQueue.poll(), 10);
    });

    QUnit.test('should be possible to change priority of head node', (assert) =>
    {
        const priorityQueue = new ds.PriorityQueue1();

        priorityQueue.add(10, 1);
        priorityQueue.add(5, 2);
        priorityQueue.add(100, 0);
        priorityQueue.add(200, 0);

        priorityQueue.changePriority(200, 10);
        priorityQueue.changePriority(10, 20);

        assert.deepEqual(priorityQueue.poll(), 100);
        assert.deepEqual(priorityQueue.poll(), 5);
        assert.deepEqual(priorityQueue.poll(), 200);
        assert.deepEqual(priorityQueue.poll(), 10);
    });

    QUnit.test('should be possible to change priority along with node addition', (assert) =>
    {
        const priorityQueue = new ds.PriorityQueue1();

        priorityQueue.add(10, 1);
        priorityQueue.add(5, 2);
        priorityQueue.add(100, 0);
        priorityQueue.add(200, 0);

        priorityQueue.changePriority(200, 10);
        priorityQueue.changePriority(10, 20);

        priorityQueue.add(15, 15);

        assert.deepEqual(priorityQueue.poll(), 100);
        assert.deepEqual(priorityQueue.poll(), 5);
        assert.deepEqual(priorityQueue.poll(), 200);
        assert.deepEqual(priorityQueue.poll(), 15);
        assert.deepEqual(priorityQueue.poll(), 10);
    });

    QUnit.test('should be possible to search in priority queue by value', (assert) =>
    {
        const priorityQueue = new ds.PriorityQueue1();

        priorityQueue.add(10, 1);
        priorityQueue.add(5, 2);
        priorityQueue.add(100, 0);
        priorityQueue.add(200, 0);
        priorityQueue.add(15, 15);

        assert.deepEqual(priorityQueue.hasValue(70), false);
        assert.deepEqual(priorityQueue.hasValue(15), true);
    });
});
