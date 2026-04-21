import { beforeEach, describe, expect, test, vi } from 'vitest';
import { computed, effect, isReactive, isRef, reactive, ref, toRaw } from '../src';

describe('响应式/reactive/数组', () =>
{
    test('应使数组变为响应式', () =>
    {
        const original = [{ foo: 1 }];
        const observed = reactive(original);

        expect(observed).not.toBe(original);
        expect(isReactive(observed)).toBe(true);
        expect(isReactive(original)).toBe(false);
        expect(isReactive(observed[0])).toBe(true);
        // get
        expect(observed[0].foo).toBe(1);
        // has
        expect(0 in observed).toBe(true);
        // ownKeys
        expect(Object.keys(observed)).toEqual(['0']);
    });

    test('克隆的响应式数组应指向观察值', () =>
    {
        const original = [{ foo: 1 }];
        const observed = reactive(original);
        const clone = observed.slice();

        expect(isReactive(clone[0])).toBe(true);
        expect(clone[0]).not.toBe(original[0]);
        expect(clone[0]).toBe(observed[0]);
    });

    test('观察值应将变更代理到原始值（数组）', () =>
    {
        const original: any[] = [{ foo: 1 }, { bar: 2 }];
        const observed = reactive(original);
        // set
        const value = { baz: 3 };
        const reactiveValue = reactive(value);

        observed[0] = value;
        expect(observed[0]).toBe(reactiveValue);
        expect(original[0]).toBe(value);
        // delete
        delete observed[0];
        expect(observed[0]).toBeUndefined();
        expect(original[0]).toBeUndefined();
        // 变更方法
        observed.push(value);
        expect(observed[2]).toBe(reactiveValue);
        expect(original[2]).toBe(value);
    });

    test('数组标识方法应与原始值一起工作', () =>
    {
        const raw = {};
        const arr = reactive([{}, {}]);

        arr.push(raw);

        expect(arr.indexOf(raw)).toBe(2);
        expect(arr.indexOf(raw, 3)).toBe(-1);
        expect(arr.includes(raw)).toBe(true);
        expect(arr.includes(raw, 3)).toBe(false);
        expect(arr.lastIndexOf(raw)).toBe(2);
        expect(arr.lastIndexOf(raw, 1)).toBe(-1);

        // 对于观察版本也应工作
        const observed = arr[2];

        expect(arr.indexOf(observed)).toBe(2);
        expect(arr.indexOf(observed, 3)).toBe(-1);
        expect(arr.includes(observed)).toBe(true);
        expect(arr.includes(observed, 3)).toBe(false);
        expect(arr.lastIndexOf(observed)).toBe(2);
        expect(arr.lastIndexOf(observed, 1)).toBe(-1);
    });

    test('原始值包含响应式对象时数组标识方法应工作', () =>
    {
        const raw: any[] = [];
        const obj = reactive({});

        raw.push(obj);
        const arr = reactive(raw);

        expect(arr.includes(obj)).toBe(true);
    });

    test('数组标识方法应是响应式的', () =>
    {
        const obj = {};
        const arr = reactive([obj, {}]);

        let index = -1;

        effect(() =>
        {
            index = arr.indexOf(obj);
        });
        expect(index).toBe(0);
        arr.reverse();
        expect(index).toBe(1);
    });

    // 只有不存在的响应式才会尝试使用其原始值搜索
    describe('数组标识方法不应调用超过必要次数', () =>
    {
        const identityMethods = ['includes', 'indexOf', 'lastIndexOf'] as const;

        function instrumentArr(rawTarget: any[])
        {
            identityMethods.forEach((key) =>
            {
                const spy = vi.fn(rawTarget[key] as any);

                rawTarget[key] = spy;
            });
        }

        function searchValue(target: any[], ...args: unknown[])
        {
            return identityMethods.map((key) => (target[key] as any)(...args));
        }

        function unInstrumentArr(rawTarget: any[])
        {
            identityMethods.forEach((key) =>
            {
                (rawTarget[key] as any).mockClear();
                // 重新链接到原型方法
                rawTarget[key] = Array.prototype[key] as any;
            });
        }

        function expectHaveBeenCalledTimes(rawTarget: any[], times: number)
        {
            identityMethods.forEach((key) =>
            {
                expect(rawTarget[key]).toHaveBeenCalledTimes(times);
            });
        }

        test('不存在的原始值应调用一次', () =>
        {
            const reactiveArr = reactive([]);

            instrumentArr(toRaw(reactiveArr));
            const searchResult = searchValue(reactiveArr, {});

            expectHaveBeenCalledTimes(toRaw(reactiveArr), 1);
            expect(searchResult).toStrictEqual([false, -1, -1]);

            unInstrumentArr(toRaw(reactiveArr));
        });

        test('存在的响应式值应调用一次', () =>
        {
            const existReactiveValue = reactive({});
            const reactiveArr = reactive([existReactiveValue, existReactiveValue]);

            instrumentArr(toRaw(reactiveArr));
            const searchResult = searchValue(reactiveArr, existReactiveValue);

            expectHaveBeenCalledTimes(toRaw(reactiveArr), 1);
            expect(searchResult).toStrictEqual([true, 0, 1]);

            unInstrumentArr(toRaw(reactiveArr));
        });

        test('不存在的响应式值应调用两次', () =>
        {
            const reactiveArr = reactive([]);

            instrumentArr(toRaw(reactiveArr));
            const searchResult = searchValue(reactiveArr, reactive({}));

            expectHaveBeenCalledTimes(toRaw(reactiveArr), 2);
            expect(searchResult).toStrictEqual([false, -1, -1]);

            unInstrumentArr(toRaw(reactiveArr));
        });

        test('不存在的响应式值但原始值存在应调用两次', () =>
        {
            const existRaw = {};
            const reactiveArr = reactive([existRaw, existRaw]);

            instrumentArr(toRaw(reactiveArr));
            const searchResult = searchValue(reactiveArr, reactive(existRaw));

            expectHaveBeenCalledTimes(toRaw(reactiveArr), 2);
            expect(searchResult).toStrictEqual([true, 0, 1]);

            unInstrumentArr(toRaw(reactiveArr));
        });
    });

    test('数组上的 delete 不应触发长度依赖', () =>
    {
        const arr = reactive([1, 2, 3]);
        const fn = vi.fn();

        effect(() =>
        {
            fn(arr.length);
        });
        expect(fn).toHaveBeenCalledTimes(1);
        delete arr[1];
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('应跟踪带索引的 hasOwnProperty 调用', () =>
    {
        const original = [1, 2, 3];
        const observed = reactive(original);

        let dummy;

        effect(() =>
        {
            dummy = observed.hasOwnProperty(0);
        });

        expect(dummy).toBe(true);

        delete observed[0];
        expect(dummy).toBe(false);
    });

    test('数组上的 shift 应只触发一次依赖', () =>
    {
        const arr = reactive([1, 2, 3]);
        const fn = vi.fn();

        effect(() =>
        {
            for (let i = 0; i < arr.length; i++)
            {
                arr[i];
            }
            fn();
        });
        expect(fn).toHaveBeenCalledTimes(1);
        arr.shift();
        expect(fn).toHaveBeenCalledTimes(2);
    });

    // #6018
    test('边缘情况：调用数组长度减少的变更方法时避免在 deleteProperty 中触发 effect', () =>
    {
        const arr = ref([1]);
        const fn1 = vi.fn();
        const fn2 = vi.fn();

        effect(() =>
        {
            fn1();
            if (arr.value.length > 0)
            {
                arr.value.slice();
                fn2();
            }
        });
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);
        arr.value.splice(0);
        expect(fn1).toHaveBeenCalledTimes(2);
        expect(fn2).toHaveBeenCalledTimes(1);
    });

    test('在数组上添加现有索引不应触发长度依赖', () =>
    {
        const array = new Array(3);
        const observed = reactive(array);
        const fn = vi.fn();

        effect(() =>
        {
            fn(observed.length);
        });
        expect(fn).toHaveBeenCalledTimes(1);
        observed[1] = 1;
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('在数组上添加非整数属性不应触发长度依赖', () =>
    {
        const array: any[] & { x?: string } = new Array(3);
        const observed = reactive(array);
        const fn = vi.fn();

        effect(() =>
        {
            fn(observed.length);
        });
        expect(fn).toHaveBeenCalledTimes(1);
        observed.x = 'x';
        expect(fn).toHaveBeenCalledTimes(1);
        observed[-1] = 'x';
        expect(fn).toHaveBeenCalledTimes(1);
        observed[NaN] = 'x';
        expect(fn).toHaveBeenCalledTimes(1);
    });

    // #2427
    test('for ... in 迭代中跟踪长度', () =>
    {
        const array = reactive([1]);
        let length = '';

        effect(() =>
        {
            length = '';
            for (const key in array)
            {
                length += key;
            }
        });
        expect(length).toBe('0');
        array.push(1);
        expect(length).toBe('01');
    });

    // #9742
    test('响应式数组的用户代理上的变更', () =>
    {
        const array = reactive<number[]>([]);
        const proxy = new Proxy(array, {});

        proxy.push(1);
        expect(array).toHaveLength(1);
        expect(proxy).toHaveLength(1);
    });

    describe('带 refs 的数组方法', () =>
    {
        let original: any[];

        beforeEach(() =>
        {
            original = reactive([1, ref(2)]);
        });

        // 读取 + 复制
        test('只读复制方法', () =>
        {
            const raw = original.concat([3, ref(4)]);

            expect(isRef(raw[1])).toBe(true);
            expect(isRef(raw[3])).toBe(true);
        });

        // 读取 + 写入
        test('读取 + 写入变更方法', () =>
        {
            const res = original.copyWithin(0, 1, 2);
            const raw = toRaw(res);

            expect(isRef(raw[0])).toBe(true);
            expect(isRef(raw[1])).toBe(true);
        });

        test('读取 + 标识', () =>
        {
            const ref = original[1];

            expect(ref).toBe(toRaw(original)[1]);
            expect(original.indexOf(ref)).toBe(1);
        });
    });

    describe('数组子类', () =>
    {
        class SubArray<T> extends Array<T>
        {
            lastPushed: undefined | T;
            lastSearched: undefined | T;

            push(item: T)
            {
                this.lastPushed = item;

                return super.push(item);
            }

            indexOf(searchElement: T, fromIndex?: number | undefined): number
            {
                this.lastSearched = searchElement;

                return super.indexOf(searchElement, fromIndex);
            }
        }

        test('在数组子类上调用正确的变更方法', () =>
        {
            const subArray = new SubArray(4, 5, 6);
            const observed = reactive(subArray);

            subArray.push(7);
            expect(subArray.lastPushed).toBe(7);
            observed.push(9);
            expect(observed.lastPushed).toBe(9);
        });

        test('在数组子类上调用正确的标识敏感方法', () =>
        {
            const subArray = new SubArray(4, 5, 6);
            const observed = reactive(subArray);
            let index;

            index = subArray.indexOf(4);
            expect(index).toBe(0);
            expect(subArray.lastSearched).toBe(4);

            index = observed.indexOf(6);
            expect(index).toBe(2);
            expect(observed.lastSearched).toBe(6);
        });
    });

    describe('优化的数组方法：', () =>
    {
        test('迭代器', () =>
        {
            const shallow = reactive([1, 2, 3, 4]);
            let result = computed(() =>
            {
                let sum = 0;

                for (const x of shallow)
                {
                    sum += x ** 2;
                }

                return sum;
            });

            expect(result.value).toBe(30);

            shallow[2] = 0;
            expect(result.value).toBe(21);

            const deep = reactive([{ val: 1 }, { val: 2 }]);

            result = computed(() =>
            {
                let sum = 0;

                for (const x of deep)
                {
                    sum += x.val ** 2;
                }

                return sum;
            });
            expect(result.value).toBe(5);

            deep[1].val = 3;
            expect(result.value).toBe(10);
        });

        test('entries', () =>
        {
            const shallow = reactive([0, 1]);
            const result1 = computed(() => Array.from(shallow.entries()));

            expect(result1.value).toStrictEqual([
                [0, 0],
                [1, 1],
            ]);

            shallow[1] = 10;
            expect(result1.value).toStrictEqual([
                [0, 0],
                [1, 10],
            ]);

            const deep = reactive([{ val: 0 }, { val: 1 }]);
            const result2 = computed(() => Array.from(deep.entries()));

            expect(result2.value).toStrictEqual([
                [0, { val: 0 }],
                [1, { val: 1 }],
            ]);
            expect(isReactive(result2.value[0][1])).toBe(true);

            deep.pop();
            expect(Array.from(result2.value)).toStrictEqual([[0, { val: 0 }]]);
        });

        test('every', () =>
        {
            const shallow = reactive([1, 2, 5]);
            let result = computed(() => shallow.every((x) => x < 5));

            expect(result.value).toBe(false);

            shallow.pop();
            expect(result.value).toBe(true);

            const deep = reactive([{ val: 1 }, { val: 5 }]);

            result = computed(() => deep.every((x) => x.val < 5));
            expect(result.value).toBe(false);

            deep[1].val = 2;
            expect(result.value).toBe(true);
        });

        test('filter', () =>
        {
            const shallow = reactive([1, 2, 3, 4]);
            const result1 = computed(() => shallow.filter((x) => x < 3));

            expect(result1.value).toStrictEqual([1, 2]);

            shallow[2] = 0;
            expect(result1.value).toStrictEqual([1, 2, 0]);

            const deep = reactive([{ val: 1 }, { val: 2 }]);
            const result2 = computed(() => deep.filter((x) => x.val < 2));

            expect(result2.value).toStrictEqual([{ val: 1 }]);
            expect(isReactive(result2.value[0])).toBe(true);

            deep[1].val = 0;
            expect(result2.value).toStrictEqual([{ val: 1 }, { val: 0 }]);
        });

        test('forEach', () =>
        {
            const shallow = reactive([1, 2, 3, 4]);
            let result = computed(() =>
            {
                let sum = 0;

                shallow.forEach((x) => (sum += x ** 2));

                return sum;
            });

            expect(result.value).toBe(30);

            shallow[2] = 0;
            expect(result.value).toBe(21);

            const deep = reactive([{ val: 1 }, { val: 2 }]);

            result = computed(() =>
            {
                let sum = 0;

                deep.forEach((x) => (sum += x.val ** 2));

                return sum;
            });
            expect(result.value).toBe(5);

            deep[1].val = 3;
            expect(result.value).toBe(10);
        });

        test('map', () =>
        {
            const shallow = reactive([1, 2, 3, 4]);
            let result = computed(() => shallow.map((x) => x ** 2));

            expect(result.value).toStrictEqual([1, 4, 9, 16]);

            shallow[2] = 0;
            expect(result.value).toStrictEqual([1, 4, 0, 16]);

            const deep = reactive([{ val: 1 }, { val: 2 }]);

            result = computed(() => deep.map((x) => x.val ** 2));
            expect(result.value).toStrictEqual([1, 4]);

            deep[1].val = 3;
            expect(result.value).toStrictEqual([1, 9]);
        });

        test('some', () =>
        {
            const shallow = reactive([1, 2, 5]);
            let result = computed(() => shallow.some((x) => x > 4));

            expect(result.value).toBe(true);

            shallow.pop();
            expect(result.value).toBe(false);

            const deep = reactive([{ val: 1 }, { val: 5 }]);

            result = computed(() => deep.some((x) => x.val > 4));
            expect(result.value).toBe(true);

            deep[1].val = 2;
            expect(result.value).toBe(false);
        });

        // Node 20+
        // @ts-expect-error tests are not limited to es2016
        test.skipIf(!Array.prototype.toReversed)('toReversed', () =>
        {
            const array = reactive([1, { val: 2 }]);
            const result = computed(() => (array as any).toReversed());

            expect(result.value).toStrictEqual([{ val: 2 }, 1]);
            expect(isReactive(result.value[0])).toBe(true);

            array.splice(1, 1, 2);
            expect(result.value).toStrictEqual([2, 1]);
        });

        // Node 20+
        // @ts-expect-error tests are not limited to es2016
        test.skipIf(!Array.prototype.toSpliced)('toSpliced', () =>
        {
            const array = reactive([1, 2, 3]);
            // @ts-expect-error
            const result = computed(() => array.toSpliced(1, 1, -2));

            expect(result.value).toStrictEqual([1, -2, 3]);

            array[0] = 0;
            expect(result.value).toStrictEqual([0, -2, 3]);
        });

        test('扩展方法', () =>
        {
            class Collection extends Array
            {
                // @ts-expect-error
                every(foo: any, bar: any, baz: any)
                {
                    expect(foo).toBe('foo');
                    expect(bar).toBe('bar');
                    expect(baz).toBe('baz');

                    return super.every((obj) => obj.id === foo);
                }

                // @ts-expect-error
                filter(foo: any, bar: any, baz: any)
                {
                    expect(foo).toBe('foo');
                    expect(bar).toBe('bar');
                    expect(baz).toBe('baz');

                    return super.filter((obj) => obj.id === foo);
                }

                // @ts-expect-error
                find(foo: any, bar: any, baz: any)
                {
                    expect(foo).toBe('foo');
                    expect(bar).toBe('bar');
                    expect(baz).toBe('baz');

                    return super.find((obj) => obj.id === foo);
                }

                // @ts-expect-error
                findIndex(foo: any, bar: any, baz: any)
                {
                    expect(foo).toBe('foo');
                    expect(bar).toBe('bar');
                    expect(baz).toBe('baz');

                    return super.findIndex((obj) => obj.id === bar);
                }

                findLast(foo: any, bar: any, baz: any)
                {
                    expect(foo).toBe('foo');
                    expect(bar).toBe('bar');
                    expect(baz).toBe('baz');
                    // @ts-expect-error our code is limited to es2016 but user code is not

                    return super.findLast((obj) => obj.id === bar);
                }

                findLastIndex(foo: any, bar: any, baz: any)
                {
                    expect(foo).toBe('foo');
                    expect(bar).toBe('bar');
                    expect(baz).toBe('baz');

                    return super.findIndex((obj) => obj.id === bar);
                }

                // @ts-expect-error
                forEach(foo: any, bar: any, baz: any)
                {
                    expect(foo).toBe('foo');
                    expect(bar).toBe('bar');
                    expect(baz).toBe('baz');
                }

                // @ts-expect-error
                map(foo: any, bar: any, baz: any)
                {
                    expect(foo).toBe('foo');
                    expect(bar).toBe('bar');
                    expect(baz).toBe('baz');

                    return super.map((obj) => obj.value);
                }

                // @ts-expect-error
                some(foo: any, bar: any, baz: any)
                {
                    expect(foo).toBe('foo');
                    expect(bar).toBe('bar');
                    expect(baz).toBe('baz');

                    return super.some((obj) => obj.id === baz);
                }
            }

            const state = reactive({
                things: new Collection(),
            });

            const foo = { id: 'foo', value: '1' };
            const bar = { id: 'bar', value: '2' };
            const baz = { id: 'baz', value: '3' };

            state.things.push(foo);
            state.things.push(bar);
            state.things.push(baz);

            expect(state.things.every('foo', 'bar', 'baz')).toBe(false);
            expect(state.things.filter('foo', 'bar', 'baz')).toEqual([foo]);

            const _foo = state.things.find('foo', 'bar', 'baz');

            expect(isReactive(_foo)).toBe(true);
            expect(foo).toStrictEqual(_foo);

            expect(state.things.findIndex('foo', 'bar', 'baz')).toBe(1);

            const _bar = state.things.findLast('foo', 'bar', 'baz');

            expect(isReactive(_bar)).toBe(true);
            expect(bar).toStrictEqual(_bar);

            expect(state.things.findLastIndex('foo', 'bar', 'baz')).toBe(1);
            expect(state.things.forEach('foo', 'bar', 'baz')).toBeUndefined();
            expect(state.things.map('foo', 'bar', 'baz')).toEqual(['1', '2', '3']);
            expect(state.things.some('foo', 'bar', 'baz')).toBe(true);

            {
                class Collection extends Array
                {
                    find(matcher: any)
                    {
                        return super.find(matcher);
                    }
                }

                const state = reactive({
                    // @ts-expect-error
                    things: new Collection({ foo: '' }),
                });

                const bar = computed(() =>
                    state.things.find((obj: any) => obj.foo === 'bar'));

                bar.value;
                state.things[0].foo = 'bar';

                expect(bar.value).toEqual({ foo: 'bar' });
            }
        });
    });
});
