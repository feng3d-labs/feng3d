import { describe, expect, test } from 'vitest';
import { computed, effect, isProxy, isReactive, isRef, reactive, ref, toRaw } from '../src';

describe('响应式/reactive', () =>
{
    test('对象', () =>
    {
        const original = { foo: 1 };
        const observed = reactive(original);

        expect(observed).not.toBe(original);
        expect(isReactive(observed)).toBe(true);
        expect(isReactive(original)).toBe(false);
        // get
        expect(observed.foo).toBe(1);
        // has
        expect('foo' in observed).toBe(true);
        // ownKeys
        expect(Object.keys(observed)).toEqual(['foo']);
    });

    test('原型', () =>
    {
        const obj = {};
        const reactiveObj = reactive(obj);

        expect(isReactive(reactiveObj)).toBe(true);
        // 读取 reactiveObject 的属性会使 reactiveObj[prop] 变为响应式
        const prototype = reactiveObj['__proto__'];
        const otherObj = { data: ['a'] };

        expect(isReactive(otherObj)).toBe(false);
        const reactiveOther = reactive(otherObj);

        expect(isReactive(reactiveOther)).toBe(true);
        expect(reactiveOther.data[0]).toBe('a');
    });

    test('嵌套响应式', () =>
    {
        const original = {
            nested: {
                foo: 1,
            },
            array: [{ bar: 2 }],
        };
        const observed = reactive(original);

        expect(isReactive(observed.nested)).toBe(true);
        expect(isReactive(observed.array)).toBe(true);
        expect(isReactive(observed.array[0])).toBe(true);
    });

    test('观察可迭代集合子类型（Map, Set）', () =>
    {
        // Map 的子类型
        class CustomMap extends Map
        { }
        const cmap = reactive(new CustomMap());

        expect(cmap).toBeInstanceOf(Map);
        expect(isReactive(cmap)).toBe(true);

        cmap.set('key', {});
        expect(isReactive(cmap.get('key'))).toBe(true);

        // Set 的子类型
        class CustomSet extends Set
        { }
        const cset = reactive(new CustomSet());

        expect(cset).toBeInstanceOf(Set);
        expect(isReactive(cset)).toBe(true);

        let dummy;

        effect(() => (dummy = cset.has('value')));
        expect(dummy).toBe(false);
        cset.add('value');
        expect(dummy).toBe(true);
        cset.delete('value');
        expect(dummy).toBe(false);
    });

    test('观察弱集合子类型（WeakMap, WeakSet）', () =>
    {
        // WeakMap 的子类型
        class CustomMap extends WeakMap
        { }
        const cmap = reactive(new CustomMap());

        expect(cmap).toBeInstanceOf(WeakMap);
        expect(isReactive(cmap)).toBe(true);

        const key = {};

        cmap.set(key, {});
        expect(isReactive(cmap.get(key))).toBe(true);

        // WeakSet 的子类型
        class CustomSet extends WeakSet
        { }
        const cset = reactive(new CustomSet());

        expect(cset).toBeInstanceOf(WeakSet);
        expect(isReactive(cset)).toBe(true);

        let dummy;

        effect(() => (dummy = cset.has(key)));
        expect(dummy).toBe(false);
        cset.add(key);
        expect(dummy).toBe(true);
        cset.delete(key);
        expect(dummy).toBe(false);
    });

    test('观察值应将变更代理到原始对象（对象）', () =>
    {
        const original: any = { foo: 1 };
        const observed = reactive(original);

        // set
        observed.bar = 1;
        expect(observed.bar).toBe(1);
        expect(original.bar).toBe(1);
        // delete
        delete observed.foo;
        expect('foo' in observed).toBe(false);
        expect('foo' in original).toBe(false);
    });

    test('原始值变更应反映在观察值中（对象）', () =>
    {
        const original: any = { foo: 1 };
        const observed = reactive(original);

        // set
        original.bar = 1;
        expect(original.bar).toBe(1);
        expect(observed.bar).toBe(1);
        // delete
        delete original.foo;
        expect('foo' in original).toBe(false);
        expect('foo' in observed).toBe(false);
    });

    test('设置未观察值的属性应用 reactive 包装', () =>
    {
        const observed = reactive<{ foo?: object }>({});
        const raw = {};

        observed.foo = raw;
        expect(observed.foo).not.toBe(raw);
        expect(isReactive(observed.foo)).toBe(true);
    });

    test('观察已观察的值应返回相同的 Proxy', () =>
    {
        const original = { foo: 1 };
        const observed = reactive(original);
        const observed2 = reactive(observed);

        expect(observed2).toBe(observed);
    });

    test('多次观察相同值应返回相同的 Proxy', () =>
    {
        const original = { foo: 1 };
        const observed = reactive(original);
        const observed2 = reactive(original);

        expect(observed2).toBe(observed);
    });

    test('多次观察相同值应返回相同的 Proxy', () =>
    {
        const original = { foo: 1 };
        const observed = reactive(original);
        const observed2 = reactive(original);

        expect(observed2).toBe(observed);
    });

    test('不应用 Proxy 污染原始对象', () =>
    {
        const original: any = { foo: 1 };
        const original2 = { bar: 2 };
        const observed = reactive(original);
        const observed2 = reactive(original2);

        observed.bar = observed2;
        expect(observed.bar).toBe(observed2);
        expect(original.bar).toBe(original2);
    });

    // #1246
    test('使用 reactive 作为原型的对象上的变更不应触发', () =>
    {
        const observed = reactive({ foo: 1 });
        const original = Object.create(observed);
        let dummy;

        effect(() => (dummy = original.foo));
        expect(dummy).toBe(1);
        observed.foo = 2;
        expect(dummy).toBe(2);
        original.foo = 3;
        expect(dummy).toBe(2);
        original.foo = 4;
        expect(dummy).toBe(2);
    });

    test('toRaw', () =>
    {
        const original = { foo: 1 };
        const observed = reactive(original);

        expect(toRaw(observed)).toBe(original);
        expect(toRaw(original)).toBe(original);
    });

    test('使用 reactive 作为原型的对象上的 toRaw', () =>
    {
        const original = { foo: 1 };
        const observed = reactive(original);
        const inherted = Object.create(observed);

        expect(toRaw(inherted)).toBe(inherted);
    });

    test('用户 Proxy 包装 reactive 上的 toRaw', () =>
    {
        const original = {};
        const re = reactive(original);
        const obj = new Proxy(re, {});
        const raw = toRaw(obj);

        expect(raw).toBe(original);
    });

    test('不应解包 Ref<T>', () =>
    {
        const observedNumberRef = reactive(ref(1));
        const observedObjectRef = reactive(ref({ foo: 1 }));

        expect(isRef(observedNumberRef)).toBe(true);
        expect(isRef(observedObjectRef)).toBe(true);
    });

    test('应解包 computed refs', () =>
    {
        // readonly
        const a = computed(() => 1);
        // writable
        const b = computed(() => 1);
        const obj = reactive({ a, b });

        // 检查类型
        obj.a + 1;
        obj.b + 1;
        expect(typeof obj.a).toBe(`number`);
        expect(typeof obj.b).toBe(`number`);
    });

    test('应允许将属性从一个 ref 设置为另一个 ref', () =>
    {
        const foo = ref(0);
        const bar = ref(1);
        const observed = reactive({ a: foo });
        const dummy = computed(() => observed.a);

        expect(dummy.value).toBe(0);

        observed.a = bar;
        expect(dummy.value).toBe(1);

        bar.value++;
        expect(dummy.value).toBe(2);
    });

    test('不应观察不可扩展对象', () =>
    {
        const obj = reactive({
            foo: Object.preventExtensions({ a: 1 }),
            // 密封或冻结的对象也被认为是不可扩展的
            bar: Object.freeze({ a: 1 }),
            baz: Object.seal({ a: 1 }),
        });

        expect(isReactive(obj.foo)).toBe(false);
        expect(isReactive(obj.bar)).toBe(false);
        expect(isReactive(obj.baz)).toBe(false);
    });

    test('hasOwnProperty 边缘情况：Symbol 值', () =>
    {
        const key = Symbol();
        const obj = reactive({ [key]: 1 }) as { [key]?: 1 };
        let dummy;

        effect(() =>
        {
            dummy = obj.hasOwnProperty(key);
        });
        expect(dummy).toBe(true);

        delete obj[key];
        expect(dummy).toBe(false);
    });

    test('hasOwnProperty 边缘情况：非字符串值', () =>
    {
        const key = {};
        const obj = reactive({ '[object Object]': 1 }) as { '[object Object]'?: 1 };
        let dummy;

        effect(() =>
        {
            // @ts-expect-error
            dummy = obj.hasOwnProperty(key);
        });
        expect(dummy).toBe(true);

        // @ts-expect-error
        delete obj[key];
        expect(dummy).toBe(false);
    });

    test('isProxy', () =>
    {
        const foo = {};

        expect(isProxy(foo)).toBe(false);

        const fooRe = reactive(foo);

        expect(isProxy(fooRe)).toBe(true);

        const c = computed(() =>
        { });

        expect(isProxy(c)).toBe(false);
    });

    // #11696
    test('refs 的 set handler 应使用正确的 receiver', () =>
    {
        const a = reactive(ref(1));

        effect(() => a.value);
        expect(() =>
        {
            a.value++;
        }).not.toThrow();
    });

    test('Map 键为 undefined 时应触发响应式', () =>
    {
        const map = reactive(new Map());
        const c = computed(() => map.get(undefined));

        expect(c.value).toBe(undefined);

        map.set(undefined, 1);
        expect(c.value).toBe(1);
    });
});
