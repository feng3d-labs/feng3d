import { Computed, computed, effect, reactive } from '@feng3d/reactivity';
import { assert, describe, it } from 'vitest';
import { ReactiveObject } from '../src/ReactiveObject';

describe('ReactiveObject', () =>
{
    it('嵌套effect会创建新的副作用，将会执行多次', () =>
    {
        const object = { a: 1, b: 2, c: 0, d: 0 };
        const r_object = reactive(object);

        let times = 0;
        let times1 = 0;

        effect(() =>
        {
            times++;

            r_object.a;

            // 此处每次都会创建一个新的副作用，因此会执行多次执行，应避免在副作用中创建副作用
            effect(() =>
            {
                r_object.c = r_object.a + r_object.b;

                times1++;
            });

            r_object.d = r_object.c + object.a;

        });

        assert.strictEqual(times, 1);
        assert.strictEqual(times1, 1);
        assert.strictEqual(r_object.d, 4);

        times = 0;
        times1 = 0;

        r_object.a++;
        assert.strictEqual(r_object.d, 6);
        assert.strictEqual(times, 1);
        // 上一次的副作用执行完成后，会创建一个新的副作用，因此会执行两次
        assert.strictEqual(times1, 2);

        times = 0;
        times1 = 0;

        r_object.a++;

        assert.strictEqual(times, 1);
        // 前两次副作用执行完成后，会创建一个新的副作用，因此会执行三次
        assert.strictEqual(times1, 3);
        assert.strictEqual(r_object.d, 8);
    });

    it('嵌套effect即使缓存也会发生时序问题，导致重复执行', () =>
    {
        const object = { a: 1, b: 2, c: 0, d: 0 };
        const r_object = reactive(object);

        let times = 0;
        let times1 = 0;
        let init = false;

        effect(() =>
        {
            times++;

            r_object.a;

            // 缓存副作用，避免重复创建副作用
            if (!init)
            {
                init = true;

                // 存在时序问题
                effect(() =>
                {
                    r_object.c = r_object.a + r_object.b;

                    times1++;
                });
            }

            r_object.d = r_object.c + object.a;
        });

        assert.strictEqual(times, 1);
        assert.strictEqual(times1, 1);
        assert.strictEqual(r_object.d, 4);

        times = 0;
        times1 = 0;

        r_object.a++;
        assert.strictEqual(r_object.d, 6);
        // 存在时序问题，r_object.a触发执行一次，此时r_object.c还未计算。然后触发r_object.c的计算，r_object.c改变后再次触发执行一次
        assert.strictEqual(times, 2);
        assert.strictEqual(times1, 1);

        times = 0;
        times1 = 0;

        r_object.a++;

        // 存在时序问题，r_object.a触发执行一次，此时r_object.c还未计算。然后触发r_object.c的计算，r_object.c改变后再次触发执行一次
        assert.strictEqual(times, 2);
        assert.strictEqual(times1, 1);
        assert.strictEqual(r_object.d, 8);
    });

    it('effect 存在时序问题，导致重复执行', () =>
    {
        const object = { a: 1, b: 2, c: 0, d: 0 };
        const r_object = reactive(object);

        let times = 0;
        let times1 = 0;

        // 此处使用了 r_object.c ，但是 r_object.c 还未计算，因此会重复执行
        effect(() =>
        {
            times++;

            r_object.a;

            r_object.d = r_object.c + object.a;
        });

        //
        effect(() =>
        {
            r_object.c = r_object.a + r_object.b;

            times1++;
        });

        // 存在时序问题，r_object.a触发执行一次，此时r_object.c还未计算。然后触发r_object.c的计算，r_object.c改变后再次触发执行一次
        assert.strictEqual(times, 2);
        assert.strictEqual(times1, 1);
        assert.strictEqual(r_object.d, 4);

        times = 0;
        times1 = 0;

        r_object.a++;
        assert.strictEqual(r_object.d, 6);
        // 存在时序问题，r_object.a触发执行一次，此时r_object.c还未计算。然后触发r_object.c的计算，r_object.c改变后再次触发执行一次
        assert.strictEqual(times, 2);
        assert.strictEqual(times1, 1);

        times = 0;
        times1 = 0;

        r_object.a++;

        // 存在时序问题，r_object.a触发执行一次，此时r_object.c还未计算。然后触发r_object.c的计算，r_object.c改变后再次触发执行一次
        assert.strictEqual(times, 2);
        assert.strictEqual(times1, 1);
        assert.strictEqual(r_object.d, 8);
    });

    it('effect 存在时序问题，导致重复执行', () =>
    {
        const object = { a: 1, b: 2, c: 0, d: 0 };
        const r_object = reactive(object);

        let times = 0;
        let times1 = 0;

        // 此处使用了 r_object.c ，但是 r_object.c 还未计算，因此会重复执行
        effect(() =>
        {
            times++;

            r_object.a;

            // 在effect中嵌套computed也不会重复执行，同样使用 getInstance 进行缓存也不会出现重复执行与时序问题。
            const r_c = computed(() =>
            {
                times1++;

                return r_object.a + r_object.b;
            });

            r_object.d = r_c.value + object.a;
        });

        assert.strictEqual(times, 1);
        assert.strictEqual(times1, 1);
        assert.strictEqual(r_object.d, 4);

        times = 0;
        times1 = 0;

        r_object.a++;
        assert.strictEqual(r_object.d, 6);
        assert.strictEqual(times, 1);
        assert.strictEqual(times1, 1);

        times = 0;
        times1 = 0;

        r_object.a++;

        assert.strictEqual(times, 1);
        assert.strictEqual(times1, 1);
        assert.strictEqual(r_object.d, 8);
    });

    it('ReactiveObject 处理树形依赖问题，并且存在依赖时序问题', () =>
    {
        const object = { a: 1, b: 2, c: 0, d: 0 };
        const r_object = reactive(object);

        let times = 0;

        effect(() =>
        {
            r_object.a;

            // 放在 r_object.a 之后会出现时序问题
            TestClass.getInstance(object);

            r_object.d = r_object.c + object.a;

            times++;
        });

        assert.strictEqual(times, 1);
        assert.strictEqual(r_object.d, 4);

        times = 0;

        r_object.a++;
        assert.strictEqual(r_object.d, 6);
        // 存在时序问题，r_object.a触发执行一次，此时testClass.c还未计算。然后触发testClass.c的计算，testClass.c改变后再次触发执行一次
        assert.strictEqual(times, 2);

        times = 0;

        r_object.a++;

        // 存在时序问题，r_object.a触发执行一次，此时testClass.c还未计算。然后触发testClass.c的计算，testClass.c改变后再次触发执行一次
        assert.strictEqual(times, 2);
        assert.strictEqual(r_object.d, 8);
    });

    it('getInstance', () =>
    {
        const object = { a: 1, b: 2, c: 0, d: 0 };
        const r_object = reactive(object);

        let times = 0;

        effect(() =>
        {
            r_object.a;

            // 同样存在多重依赖，且存在时序问题，但使用 computed 缓存实例后不会重复执行该函数
            const c = getInstance(object);

            r_object.d = c + object.a;

            times++;
        });

        assert.strictEqual(times, 1);
        assert.strictEqual(r_object.d, 4);

        times = 0;

        r_object.a++;
        assert.strictEqual(r_object.d, 6);
        assert.strictEqual(times, 1);

        times = 0;

        r_object.a++;

        assert.strictEqual(times, 1);
        assert.strictEqual(r_object.d, 8);
    });
});

const map: { [key: string]: number } = {};

class TestClass extends ReactiveObject
{
    constructor(object: { a: number, b: number, c: number })
    {
        super();

        this._onCreate(object);
        this._onMap(object);
    }

    private _onCreate(object: { a: number, b: number, c: number })
    {
        const r_object = reactive(object);

        this.effect(() =>
        {
            r_object.c = r_object.a + r_object.b;
        });
    }

    private _onMap(object: { a: number, b: number })
    {
        TestClass.cacheMap.set(object, this);
        this.destroyCall(() =>
        {
            TestClass.cacheMap.delete(object);
        });
    }

    static getInstance(object: { a: number, b: number, c: number })
    {
        return this.cacheMap.get(object) || new TestClass(object);
    }

    static cacheMap = new WeakMap<{ a: number, b: number }, TestClass>();
}

function getInstance(object: { a: number, b: number })
{
    let result = cacheMap.get(object);

    if (result) return result.value;

    result = computed(() =>
    {
        const r_object = reactive(object);

        return r_object.a + r_object.b;
    });

    cacheMap.set(object, result);

    return result.value;
}
const cacheMap = new WeakMap<{ a: number, b: number }, Computed<number>>();
