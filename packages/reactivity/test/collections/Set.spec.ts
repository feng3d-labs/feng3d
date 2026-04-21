import { describe, vi, it, expect } from 'vitest';
import { effect, isReactive, reactive, toRaw } from '../../src';

describe('响应式/集合', () =>
{
    function coverCollectionFn(collection: Set<any>, fnName: string)
    {
        const spy = vi.fn();
        const proxy = reactive(collection);

        (collection as any)[fnName] = spy;

        return [proxy as any, spy];
    }

    describe('Set', () =>
    {
        it('instanceof', () =>
        {
            const original = new Set();
            const observed = reactive(original);

            expect(isReactive(observed)).toBe(true);
            expect(original).toBeInstanceOf(Set);
            expect(observed).toBeInstanceOf(Set);
        });

        it('应观察变更', () =>
        {
            let dummy;
            const set = reactive(new Set());

            effect(() => (dummy = set.has('value')));

            expect(dummy).toBe(false);
            set.add('value');
            expect(dummy).toBe(true);
            set.delete('value');
            expect(dummy).toBe(false);
        });

        it('应观察以观察值的变更', () =>
        {
            let dummy;
            const value = reactive({});
            const set = reactive(new Set());

            effect(() => (dummy = set.has(value)));

            expect(dummy).toBe(false);
            set.add(value);
            expect(dummy).toBe(true);
            set.delete(value);
            expect(dummy).toBe(false);
        });

        it('应观察 for of 迭代', () =>
        {
            let dummy;
            const set = reactive(new Set() as Set<number>);

            effect(() =>
            {
                dummy = 0;
                for (const num of set)
                {
                    dummy += num;
                }
            });

            expect(dummy).toBe(0);
            set.add(2);
            set.add(1);
            expect(dummy).toBe(3);
            set.delete(2);
            expect(dummy).toBe(1);
            set.clear();
            expect(dummy).toBe(0);
        });

        it('应观察 forEach 迭代', () =>
        {
            let dummy: any;
            const set = reactive(new Set());

            effect(() =>
            {
                dummy = 0;
                set.forEach((num) => (dummy += num));
            });

            expect(dummy).toBe(0);
            set.add(2);
            set.add(1);
            expect(dummy).toBe(3);
            set.delete(2);
            expect(dummy).toBe(1);
            set.clear();
            expect(dummy).toBe(0);
        });

        it('应观察 values 迭代', () =>
        {
            let dummy;
            const set = reactive(new Set() as Set<number>);

            effect(() =>
            {
                dummy = 0;
                for (const num of set.values())
                {
                    dummy += num;
                }
            });

            expect(dummy).toBe(0);
            set.add(2);
            set.add(1);
            expect(dummy).toBe(3);
            set.delete(2);
            expect(dummy).toBe(1);
            set.clear();
            expect(dummy).toBe(0);
        });

        it('应观察 keys 迭代', () =>
        {
            let dummy;
            const set = reactive(new Set() as Set<number>);

            effect(() =>
            {
                dummy = 0;
                for (const num of set.keys())
                {
                    dummy += num;
                }
            });

            expect(dummy).toBe(0);
            set.add(2);
            set.add(1);
            expect(dummy).toBe(3);
            set.delete(2);
            expect(dummy).toBe(1);
            set.clear();
            expect(dummy).toBe(0);
        });

        it('应观察 entries 迭代', () =>
        {
            let dummy;
            const set = reactive(new Set<number>());

            effect(() =>
            {
                dummy = 0;
                for (const [key, num] of set.entries())
                {
                    key;
                    dummy += num;
                }
            });

            expect(dummy).toBe(0);
            set.add(2);
            set.add(1);
            expect(dummy).toBe(3);
            set.delete(2);
            expect(dummy).toBe(1);
            set.clear();
            expect(dummy).toBe(0);
        });

        it('应被 clear 触发', () =>
        {
            let dummy;
            const set = reactive(new Set());

            effect(() => (dummy = set.has('key')));

            expect(dummy).toBe(false);
            set.add('key');
            expect(dummy).toBe(true);
            set.clear();
            expect(dummy).toBe(false);
        });

        it('不应观察自定义属性变更', () =>
        {
            let dummy;
            const set: any = reactive(new Set());

            effect(() => (dummy = set.customProp));

            expect(dummy).toBe(undefined);
            set.customProp = 'Hello World';
            expect(dummy).toBe(undefined);
        });

        it('应观察 size 变更', () =>
        {
            let dummy;
            const set = reactive(new Set());

            effect(() => (dummy = set.size));

            expect(dummy).toBe(0);
            set.add('value');
            set.add('value2');
            expect(dummy).toBe(2);
            set.delete('value');
            expect(dummy).toBe(1);
            set.clear();
            expect(dummy).toBe(0);
        });

        it('不应观察非值变化的变更', () =>
        {
            let dummy;
            const set = reactive(new Set());
            const setSpy = vi.fn(() => (dummy = set.has('value')));

            effect(setSpy);

            expect(dummy).toBe(false);
            expect(setSpy).toHaveBeenCalledTimes(1);
            set.add('value');
            expect(dummy).toBe(true);
            expect(setSpy).toHaveBeenCalledTimes(2);
            set.add('value');
            expect(dummy).toBe(true);
            expect(setSpy).toHaveBeenCalledTimes(2);
            set.delete('value');
            expect(dummy).toBe(false);
            expect(setSpy).toHaveBeenCalledTimes(3);
            set.delete('value');
            expect(dummy).toBe(false);
            expect(setSpy).toHaveBeenCalledTimes(3);
            set.clear();
            expect(dummy).toBe(false);
            expect(setSpy).toHaveBeenCalledTimes(3);
        });

        it('不应观察原始数据', () =>
        {
            let dummy;
            const set = reactive(new Set());

            effect(() => (dummy = toRaw(set).has('value')));

            expect(dummy).toBe(false);
            set.add('value');
            expect(dummy).toBe(false);
        });

        it('不应观察原始迭代', () =>
        {
            let dummy = 0;
            const set = reactive(new Set<number>());

            effect(() =>
            {
                dummy = 0;
                for (const [num] of toRaw(set).entries())
                {
                    dummy += num;
                }
                for (const num of toRaw(set).keys())
                {
                    dummy += num;
                }
                for (const num of toRaw(set).values())
                {
                    dummy += num;
                }
                toRaw(set).forEach((num) =>
                {
                    dummy += num;
                });
                for (const num of toRaw(set))
                {
                    dummy += num;
                }
            });

            expect(dummy).toBe(0);
            set.add(2);
            set.add(3);
            expect(dummy).toBe(0);
            set.delete(2);
            expect(dummy).toBe(0);
        });

        it('不应被原始变更触发', () =>
        {
            let dummy;
            const set = reactive(new Set());

            effect(() => (dummy = set.has('value')));

            expect(dummy).toBe(false);
            toRaw(set).add('value');
            expect(dummy).toBe(false);
            dummy = true;
            toRaw(set).delete('value');
            expect(dummy).toBe(true);
            toRaw(set).clear();
            expect(dummy).toBe(true);
        });

        it('不应观察原始 size 变更', () =>
        {
            let dummy;
            const set = reactive(new Set());

            effect(() => (dummy = toRaw(set).size));

            expect(dummy).toBe(0);
            set.add('value');
            expect(dummy).toBe(0);
        });

        it('不应被原始 size 变更触发', () =>
        {
            let dummy;
            const set = reactive(new Set());

            effect(() => (dummy = set.size));

            expect(dummy).toBe(0);
            toRaw(set).add('value');
            expect(dummy).toBe(0);
        });

        it('应支持对象作为键', () =>
        {
            let dummy;
            const key = {};
            const set = reactive(new Set());
            const setSpy = vi.fn(() => (dummy = set.has(key)));

            effect(setSpy);

            expect(dummy).toBe(false);
            expect(setSpy).toHaveBeenCalledTimes(1);

            set.add({});
            expect(dummy).toBe(false);
            expect(setSpy).toHaveBeenCalledTimes(1);

            set.add(key);
            expect(dummy).toBe(true);
            expect(setSpy).toHaveBeenCalledTimes(2);
        });

        it('不应用 Proxy 污染原始 Set', () =>
        {
            const set = new Set();
            const observed = reactive(set);
            const value = reactive({});

            observed.add(value);
            expect(observed.has(value)).toBe(true);
            expect(set.has(value)).toBe(false);
        });

        it('应在迭代中观察嵌套值（forEach）', () =>
        {
            const set = reactive(new Set([{ foo: 1 }]));
            let dummy: any;

            effect(() =>
            {
                dummy = 0;
                set.forEach((value) =>
                {
                    expect(isReactive(value)).toBe(true);
                    dummy += value.foo;
                });
            });
            expect(dummy).toBe(1);
            set.forEach((value) =>
            {
                value.foo++;
            });
            expect(dummy).toBe(2);
        });

        it('应在迭代中观察嵌套值（values）', () =>
        {
            const set = reactive(new Set([{ foo: 1 }]));
            let dummy: any;

            effect(() =>
            {
                dummy = 0;
                for (const value of set.values())
                {
                    expect(isReactive(value)).toBe(true);
                    dummy += value.foo;
                }
            });
            expect(dummy).toBe(1);
            set.forEach((value) =>
            {
                value.foo++;
            });
            expect(dummy).toBe(2);
        });

        it('应在迭代中观察嵌套值（entries）', () =>
        {
            const set = reactive(new Set([{ foo: 1 }]));
            let dummy: any;

            effect(() =>
            {
                dummy = 0;
                for (const [key, value] of set.entries())
                {
                    expect(isReactive(key)).toBe(true);
                    expect(isReactive(value)).toBe(true);
                    dummy += value.foo;
                }
            });
            expect(dummy).toBe(1);
            set.forEach((value) =>
            {
                value.foo++;
            });
            expect(dummy).toBe(2);
        });

        it('应在迭代中观察嵌套值（for...of）', () =>
        {
            const set = reactive(new Set([{ foo: 1 }]));
            let dummy: any;

            effect(() =>
            {
                dummy = 0;
                for (const value of set)
                {
                    expect(isReactive(value)).toBe(true);
                    dummy += value.foo;
                }
            });
            expect(dummy).toBe(1);
            set.forEach((value) =>
            {
                value.foo++;
            });
            expect(dummy).toBe(2);
        });

        it('原始 set 中的响应式条目应工作', () =>
        {
            const raw = new Set();
            const entry = reactive({});

            raw.add(entry);
            const set = reactive(raw);

            expect(set.has(entry)).toBe(true);

            expect(set.delete(entry)).toBe(true);
            expect(set.has(entry)).toBe(false);
        });

        it('原始 set 中的响应式条目删除应跟踪', () =>
        {
            const raw = new Set();
            const entry = reactive({});

            raw.add(entry);
            const set = reactive(raw);

            let dummy;

            effect(() =>
            {
                dummy = set.has(entry);
            });
            expect(dummy).toBe(true);

            set.delete(entry);
            expect(dummy).toBe(false);
        });

        it('set 同时包含同一对象的原始版本和响应式版本时应警告', () =>
        {
            const raw = new Set();
            const rawKey = {};
            const key = reactive(rawKey);

            raw.add(rawKey);
            raw.add(key);
            const set = reactive(raw);

            set.delete(key);
        });

        it('thisArg', () =>
        {
            const raw = new Set(['value']);
            const proxy = reactive(raw);
            const thisArg = {};
            let count = 0;

            proxy.forEach(function (this: {}, value, _, set)
            {
                ++count;
                expect(this).toBe(thisArg);
                expect(value).toBe('value');
                expect(set).toBe(proxy);
            }, thisArg);
            expect(count).toBe(1);
        });

        it('非响应式键只应触发 Set.has 一次', () =>
        {
            const [proxy, spy] = coverCollectionFn(new Set(), 'has');

            proxy.has('foo');
            expect(spy).toBeCalledTimes(1);
        });

        it('非响应式键只应触发 Set.add 一次', () =>
        {
            const [proxy, spy] = coverCollectionFn(new Set(), 'add');

            proxy.add('foo');
            expect(spy).toBeCalledTimes(1);
        });

        it('非响应式键只应触发 Set.delete 一次', () =>
        {
            const [proxy, spy] = coverCollectionFn(new Set(), 'delete');

            proxy.delete('foo');
            expect(spy).toBeCalledTimes(1);
        });

        it('非响应式键只应触发 Set.clear 一次', () =>
        {
            const [proxy, spy] = coverCollectionFn(new Set(), 'clear');

            proxy.clear();
            expect(spy).toBeCalledTimes(1);
        });

        it('Set.add 调用应返回代理', () =>
        {
            const set = reactive(new Set());
            const result = set.add('a');

            expect(result).toBe(set);
        });
    });
});
