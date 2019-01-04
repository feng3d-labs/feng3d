
QUnit.module('HashTable', (assert) =>
{
    QUnit.test('should create hash table of certain size', (assert) =>
    {
        const defaultHashTable = new ds.HashTable();
        assert.deepEqual(defaultHashTable.buckets.length, 32);

        const biggerHashTable = new ds.HashTable(64);
        assert.deepEqual(biggerHashTable.buckets.length, 64);
    });

    QUnit.test('should generate proper hash for specified keys', (assert) =>
    {
        const hashTable = new ds.HashTable();

        assert.deepEqual(hashTable.hash('a'), 1);
        assert.deepEqual(hashTable.hash('b'), 2);
        assert.deepEqual(hashTable.hash('abc'), 6);
    });

    QUnit.test('should set, read and delete data with collisions', (assert) =>
    {
        const hashTable = new ds.HashTable(3);

        assert.deepEqual(hashTable.hash('a'), 1);
        assert.deepEqual(hashTable.hash('b'), 2);
        assert.deepEqual(hashTable.hash('c'), 0);
        assert.deepEqual(hashTable.hash('d'), 1);

        hashTable.set('a', 'sky-old');
        hashTable.set('a', 'sky');
        hashTable.set('b', 'sea');
        hashTable.set('c', 'earth');
        hashTable.set('d', 'ocean');

        assert.deepEqual(hashTable.has('x'), false);
        assert.deepEqual(hashTable.has('b'), true);
        assert.deepEqual(hashTable.has('c'), true);

        const stringifier = value => `${value.key}:${value.value}`;

        assert.deepEqual(hashTable.buckets[0].toString(stringifier), 'c:earth');
        assert.deepEqual(hashTable.buckets[1].toString(stringifier), 'a:sky,d:ocean');
        assert.deepEqual(hashTable.buckets[2].toString(stringifier), 'b:sea');

        assert.deepEqual(hashTable.get('a'), 'sky');
        assert.deepEqual(hashTable.get('d'), 'ocean');
        assert.deepEqual(hashTable.get('x'), undefined);

        hashTable.delete('a');

        assert.deepEqual(hashTable.delete('not-existing'), null);

        assert.deepEqual(hashTable.get('a'), undefined);
        assert.deepEqual(hashTable.get('d'), 'ocean');

        hashTable.set('d', 'ocean-new');
        assert.deepEqual(hashTable.get('d'), 'ocean-new');
    });

    QUnit.test('should be possible to add objects to hash table', (assert) =>
    {
        const hashTable = new ds.HashTable();

        hashTable.set('objectKey', { prop1: 'a', prop2: 'b' });

        const object = hashTable.get('objectKey');
        assert.deepEqual(object.prop1, 'a');
        assert.deepEqual(object.prop2, 'b');
    });

    QUnit.test('should track actual keys', (assert) =>
    {
        const hashTable = new ds.HashTable(3);

        hashTable.set('a', 'sky-old');
        hashTable.set('a', 'sky');
        hashTable.set('b', 'sea');
        hashTable.set('c', 'earth');
        hashTable.set('d', 'ocean');

        assert.deepEqual(hashTable.getKeys(), ['a', 'b', 'c', 'd']);
        assert.deepEqual(hashTable.has('a'), true);
        assert.deepEqual(hashTable.has('x'), false);

        hashTable.delete('a');

        assert.deepEqual(hashTable.has('a'), false);
        assert.deepEqual(hashTable.has('b'), true);
        assert.deepEqual(hashTable.has('x'), false);
    });
});
