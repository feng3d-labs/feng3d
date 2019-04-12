QUnit.module('BloomFilter', () =>
{
    let bloomFilter;
    const people = [
        'Bruce Wayne',
        'Clark Kent',
        'Barry Allen',
    ];


    QUnit.test('should have methods named "insert" and "mayContain"', (assert) =>
    {
        var bloomFilter = new feng3d.BloomFilter();

        assert.deepEqual(typeof bloomFilter.insert, 'function');
        assert.deepEqual(typeof bloomFilter.mayContain, 'function');
    });

    QUnit.test('should create a new filter store with the appropriate methods', (assert) =>
    {
        var bloomFilter = new feng3d.BloomFilter();

        const store = bloomFilter.createStore(18);
        assert.deepEqual(typeof store.getValue, 'function');
        assert.deepEqual(typeof store.setValue, 'function');
    });

    QUnit.test('should hash deterministically with all 3 hash functions', (assert) =>
    {
        var bloomFilter = new feng3d.BloomFilter();
        const str1 = 'apple';

        assert.deepEqual(bloomFilter.hash1(str1), bloomFilter.hash1(str1));
        assert.deepEqual(bloomFilter.hash2(str1), bloomFilter.hash2(str1));
        assert.deepEqual(bloomFilter.hash3(str1), bloomFilter.hash3(str1));

        assert.deepEqual(bloomFilter.hash1(str1), 14);
        assert.deepEqual(bloomFilter.hash2(str1), 43);
        assert.deepEqual(bloomFilter.hash3(str1), 10);

        const str2 = 'orange';

        assert.deepEqual(bloomFilter.hash1(str2), bloomFilter.hash1(str2));
        assert.deepEqual(bloomFilter.hash2(str2), bloomFilter.hash2(str2));
        assert.deepEqual(bloomFilter.hash3(str2), bloomFilter.hash3(str2));

        assert.deepEqual(bloomFilter.hash1(str2), 0);
        assert.deepEqual(bloomFilter.hash2(str2), 61);
        assert.deepEqual(bloomFilter.hash3(str2), 10);
    });

    QUnit.test('should create an array with 3 hash values', (assert) =>
    {
        var bloomFilter = new feng3d.BloomFilter();

        assert.deepEqual(bloomFilter.getHashValues('abc').length, 3);
        assert.deepEqual(bloomFilter.getHashValues('abc'), [66, 63, 54]);
    });

    QUnit.test('should insert strings correctly and return true when checking for inserted values', (assert) =>
    {
        var bloomFilter = new feng3d.BloomFilter();

        people.forEach(person => bloomFilter.insert(person));

        assert.deepEqual(bloomFilter.mayContain('Bruce Wayne'), true);
        assert.deepEqual(bloomFilter.mayContain('Clark Kent'), true);
        assert.deepEqual(bloomFilter.mayContain('Barry Allen'), true);

        assert.deepEqual(bloomFilter.mayContain('Tony Stark'), false);
    });
});
