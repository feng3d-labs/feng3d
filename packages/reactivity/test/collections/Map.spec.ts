import { describe, expect, it, test, vi } from 'vitest';
import { effect, isReactive, reactive, toRaw } from '../../src';

describe('响应式/集合', () =>
{
    function coverCollectionFn(collection: Map<any, any>, fnName: string)
    {
        const spy = vi.fn();
        const proxy = reactive(collection)

      ; (collection as any)[fnName] = spy;

        return [proxy as any, spy];
    }

    describe('Map', () =>
    {
        test('instanceof', () =>
        {
            const original = new Map();
            const observed = reactive(original);

            expect(isReactive(observed)).toBe(true);
            expect(original).toBeInstanceOf(Map);
            expect(observed).toBeInstanceOf(Map);
        });

        it('应观察变更', () =>
        {
            let dummy;
            const map = reactive(new Map());

            effect(() =>
            {
                dummy = map.get('key');
            });

            expect(dummy).toBe(undefined);
            map.set('key', 'value');
            expect(dummy).toBe('value');
            map.set('key', 'value2');
            expect(dummy).toBe('value2');
            map.delete('key');
            expect(dummy).toBe(undefined);
        });

        it('应观察以观察值作为键的变更', () =>
        {
            let dummy;
            const key = reactive({});
            const value = reactive({});
            const map = reactive(new Map());

            effect(() =>
            {
                dummy = map.get(key);
            });

            expect(dummy).toBe(undefined);
            map.set(key, value);
            expect(dummy).toBe(value);
            map.delete(key);
            expect(dummy).toBe(undefined);
        });

        it('应观察 size 变更', () =>
        {
            let dummy;
            const map = reactive(new Map());

            effect(() => (dummy = map.size));

            expect(dummy).toBe(0);
            map.set('key1', 'value');
            map.set('key2', 'value2');
            expect(dummy).toBe(2);
            map.delete('key1');
            expect(dummy).toBe(1);
            map.clear();
            expect(dummy).toBe(0);
        });

        it('应观察 for of 迭代', () =>
        {
            let dummy;
            const map = reactive(new Map());

            effect(() =>
            {
                dummy = 0;
                for (const [key, num] of map)
                {
                    key;
                    dummy += num;
                }
            });

            expect(dummy).toBe(0);
            map.set('key1', 3);
            expect(dummy).toBe(3);
            map.set('key2', 2);
            expect(dummy).toBe(5);
            // 迭代应跟踪现有条目的变更（#709）
            map.set('key1', 4);
            expect(dummy).toBe(6);
            map.delete('key1');
            expect(dummy).toBe(2);
            map.clear();
            expect(dummy).toBe(0);
        });

        it('应观察 forEach 迭代', () =>
        {
            let dummy: any;
            const map = reactive(new Map());

            effect(() =>
            {
                dummy = 0;
                map.forEach((num: any) => (dummy += num));
            });

            expect(dummy).toBe(0);
            map.set('key1', 3);
            expect(dummy).toBe(3);
            map.set('key2', 2);
            expect(dummy).toBe(5);
            // 迭代应跟踪现有条目的变更（#709）
            map.set('key1', 4);
            expect(dummy).toBe(6);
            map.delete('key1');
            expect(dummy).toBe(2);
            map.clear();
            expect(dummy).toBe(0);
        });

        it('应观察 keys 迭代', () =>
        {
            let dummy;
            const map = reactive(new Map());

            effect(() =>
            {
                dummy = 0;
                for (const key of map.keys())
                {
                    dummy += key;
                }
            });

            expect(dummy).toBe(0);
            map.set(3, 3);
            expect(dummy).toBe(3);
            map.set(2, 2);
            expect(dummy).toBe(5);
            map.delete(3);
            expect(dummy).toBe(2);
            map.clear();
            expect(dummy).toBe(0);
        });

        it('应观察 values 迭代', () =>
        {
            let dummy;
            const map = reactive(new Map());

            effect(() =>
            {
                dummy = 0;
                for (const num of map.values())
                {
                    dummy += num;
                }
            });

            expect(dummy).toBe(0);
            map.set('key1', 3);
            expect(dummy).toBe(3);
            map.set('key2', 2);
            expect(dummy).toBe(5);
            // 迭代应跟踪现有条目的变更（#709）
            map.set('key1', 4);
            expect(dummy).toBe(6);
            map.delete('key1');
            expect(dummy).toBe(2);
            map.clear();
            expect(dummy).toBe(0);
        });

        it('应观察 entries 迭代', () =>
        {
            let dummy;
            let dummy2;
            const map = reactive(new Map());

            effect(() =>
            {
                dummy = '';
                dummy2 = 0;
                for (const [key, num] of map.entries())
                {
                    dummy += key;
                    dummy2 += num;
                }
            });

            expect(dummy).toBe('');
            expect(dummy2).toBe(0);
            map.set('key1', 3);
            expect(dummy).toBe('key1');
            expect(dummy2).toBe(3);
            map.set('key2', 2);
            expect(dummy).toBe('key1key2');
            expect(dummy2).toBe(5);
            // 迭代应跟踪现有条目的变更（#709）
            map.set('key1', 4);
            expect(dummy).toBe('key1key2');
            expect(dummy2).toBe(6);
            map.delete('key1');
            expect(dummy).toBe('key2');
            expect(dummy2).toBe(2);
            map.clear();
            expect(dummy).toBe('');
            expect(dummy2).toBe(0);
        });

        it('应被 clear 触发', () =>
        {
            let dummy;
            const map = reactive(new Map());

            effect(() => (dummy = map.get('key')));

            expect(dummy).toBe(undefined);
            map.set('key', 3);
            expect(dummy).toBe(3);
            map.clear();
            expect(dummy).toBe(undefined);
        });

        it('不应观察自定义属性变更', () =>
        {
            let dummy;
            const map: any = reactive(new Map());

            effect(() => (dummy = map.customProp));

            expect(dummy).toBe(undefined);
            map.customProp = 'Hello World';
            expect(dummy).toBe(undefined);
        });

        it('不应观察非值变化的变更', () =>
        {
            let dummy;
            const map = reactive(new Map());
            const mapSpy = vi.fn(() => (dummy = map.get('key')));

            effect(mapSpy);

            expect(dummy).toBe(undefined);
            expect(mapSpy).toHaveBeenCalledTimes(1);
            // map.get('key') 没有发生变化，不用触发（此处与 @vue/reactivity 不同，值没有发生变化，不用触发）
            map.set('key', undefined);
            expect(dummy).toBe(undefined);
            expect(mapSpy).toHaveBeenCalledTimes(1);
            map.set('key', 'value');
            expect(dummy).toBe('value');
            expect(mapSpy).toHaveBeenCalledTimes(2);
            map.set('key', 'value');
            expect(dummy).toBe('value');
            expect(mapSpy).toHaveBeenCalledTimes(2);
            map.delete('key');
            expect(dummy).toBe(undefined);
            expect(mapSpy).toHaveBeenCalledTimes(3);
            map.delete('key');
            expect(dummy).toBe(undefined);
            expect(mapSpy).toHaveBeenCalledTimes(3);
            map.clear();
            expect(dummy).toBe(undefined);
            expect(mapSpy).toHaveBeenCalledTimes(3);
        });

        it('不应观察原始数据', () =>
        {
            let dummy;
            const map = reactive(new Map());

            effect(() => (dummy = toRaw(map).get('key')));

            expect(dummy).toBe(undefined);
            map.set('key', 'Hello');
            expect(dummy).toBe(undefined);
            map.delete('key');
            expect(dummy).toBe(undefined);
        });

        it('不应用 Proxy 污染原始 Map', () =>
        {
            const map = new Map();
            const observed = reactive(map);
            const value = reactive({});

            observed.set('key', value);
            expect(map.get('key')).not.toBe(value);
            expect(map.get('key')).toBe(toRaw(value));
        });

        it('应返回包含值的可观察版本', () =>
        {
            const observed = reactive(new Map());
            const value = {};

            observed.set('key', value);
            const wrapped = observed.get('key');

            expect(isReactive(wrapped)).toBe(true);
            expect(toRaw(wrapped)).toBe(value);
        });

        it('应观察嵌套数据', () =>
        {
            const observed = reactive(new Map());

            observed.set('key', { a: 1 });
            let dummy;

            effect(() =>
            {
                dummy = observed.get('key').a;
            });
            observed.get('key').a = 2;
            expect(dummy).toBe(2);
        });

        it('应在迭代中观察嵌套值（forEach）', () =>
        {
            const map = reactive(new Map([[1, { foo: 1 }]]));
            let dummy: any;

            effect(() =>
            {
                dummy = 0;
                map.forEach((value) =>
                {
                    expect(isReactive(value)).toBe(true);
                    dummy += value.foo;
                });
            });
            expect(dummy).toBe(1);
      map.get(1)!.foo++;
      expect(dummy).toBe(2);
        });

        it('应在迭代中观察嵌套值（values）', () =>
        {
            const map = reactive(new Map([[1, { foo: 1 }]]));
            let dummy: any;

            effect(() =>
            {
                dummy = 0;
                for (const value of map.values())
                {
                    expect(isReactive(value)).toBe(true);
                    dummy += value.foo;
                }
            });
            expect(dummy).toBe(1);
      map.get(1)!.foo++;
      expect(dummy).toBe(2);
        });

        it('应在迭代中观察嵌套值（entries）', () =>
        {
            const key = {};
            const map = reactive(new Map([[key, { foo: 1 }]]));
            let dummy: any;

            effect(() =>
            {
                dummy = 0;
                for (const [key, value] of map.entries())
                {
                    key;
                    expect(isReactive(key)).toBe(true);
                    expect(isReactive(value)).toBe(true);
                    dummy += value.foo;
                }
            });
            expect(dummy).toBe(1);
      map.get(key)!.foo++;
      expect(dummy).toBe(2);
        });

        it('应在迭代中观察嵌套值（for...of）', () =>
        {
            const key = {};
            const map = reactive(new Map([[key, { foo: 1 }]]));
            let dummy: any;

            effect(() =>
            {
                dummy = 0;
                for (const [key, value] of map)
                {
                    key;
                    expect(isReactive(key)).toBe(true);
                    expect(isReactive(value)).toBe(true);
                    dummy += value.foo;
                }
            });
            expect(dummy).toBe(1);
      map.get(key)!.foo++;
      expect(dummy).toBe(2);
        });

        it('新旧值都是 NaN 时不应触发', () =>
        {
            const map = reactive(new Map([['foo', NaN]]));
            const mapSpy = vi.fn(() => map.get('foo'));

            effect(mapSpy);
            map.set('foo', NaN);
            expect(mapSpy).toHaveBeenCalledTimes(1);
        });

        it('原始 map 中的响应式键应工作', () =>
        {
            const raw = new Map();
            const key = reactive({});

            raw.set(key, 1);
            const map = reactive(raw);

            expect(map.has(key)).toBe(true);
            expect(map.get(key)).toBe(1);

            expect(map.delete(key)).toBe(true);
            expect(map.has(key)).toBe(false);
            expect(map.get(key)).toBeUndefined();
        });

        it('原始 map 中的响应式键 set 应跟踪', () =>
        {
            const raw = new Map();
            const key = reactive({});

            raw.set(key, 1);
            const map = reactive(raw);

            let dummy;

            effect(() =>
            {
                dummy = map.get(key);
            });
            expect(dummy).toBe(1);

            map.set(key, 2);
            expect(dummy).toBe(2);
        });

        it('原始 map 中的响应式键删除应跟踪', () =>
        {
            const raw = new Map();
            const key = reactive({});

            raw.set(key, 1);
            const map = reactive(raw);

            let dummy;

            effect(() =>
            {
                dummy = map.has(key);
            });
            expect(dummy).toBe(true);

            map.delete(key);
            expect(dummy).toBe(false);
        });

        // #877
        it('设置现有键时不应触发键迭代', () =>
        {
            const map = reactive(new Map());
            const spy = vi.fn();

            effect(() =>
            {
                const keys: any[] = [];

                for (const key of map.keys())
                {
                    keys.push(key);
                }
                spy(keys);
            });

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toMatchObject([]);

            map.set('a', 0);
            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy.mock.calls[1][0]).toMatchObject(['a']);

            map.set('b', 0);
            expect(spy).toHaveBeenCalledTimes(3);
            expect(spy.mock.calls[2][0]).toMatchObject(['a', 'b']);

            // 键没有改变，不应触发
            map.set('b', 1);
            expect(spy).toHaveBeenCalledTimes(3);
        });

        it('非响应式键只应触发 Map.has 一次', () =>
        {
            const [proxy, spy] = coverCollectionFn(new Map(), 'has');

            proxy.has('k');
            expect(spy).toBeCalledTimes(1);
        });

        it('非响应式键只应触发 Map.set 一次', () =>
        {
            const [proxy, spy] = coverCollectionFn(new Map(), 'set');

            proxy.set('k', 'v');
            expect(spy).toBeCalledTimes(1);
        });

        it('非响应式键只应触发 Map.delete 一次', () =>
        {
            const [proxy, spy] = coverCollectionFn(new Map(), 'delete');

            proxy.delete('foo');
            expect(spy).toBeCalledTimes(1);
        });

        it('非响应式键只应触发 Map.clear 一次', () =>
        {
            const [proxy, spy] = coverCollectionFn(new Map(), 'clear');

            proxy.clear();
            expect(spy).toBeCalledTimes(1);
        });

        it('Map.set 调用应返回代理', () =>
        {
            const map = reactive(new Map());
            const result = map.set('a', 'a');

            expect(result).toBe(map);
        });
    });
});
