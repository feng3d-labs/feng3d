import { describe, expect, it, test, vi } from 'vitest';
import { effect, isReactive, reactive, toRaw } from '../../src';

describe('响应式/集合', () =>
{
    describe('WeakMap', () =>
    {
        test('instanceof', () =>
        {
            const original = new WeakMap();
            const observed = reactive(original);

            expect(isReactive(observed)).toBe(true);
            expect(original).toBeInstanceOf(WeakMap);
            expect(observed).toBeInstanceOf(WeakMap);
        });

        it('应观察变更', () =>
        {
            let dummy;
            const key = {};
            const map = reactive(new WeakMap());

            effect(() =>
            {
                dummy = map.get(key);
            });

            expect(dummy).toBe(undefined);
            map.set(key, 'value');
            expect(dummy).toBe('value');
            map.set(key, 'value2');
            expect(dummy).toBe('value2');
            map.delete(key);
            expect(dummy).toBe(undefined);
        });

        it('应观察以观察值作为键的变更', () =>
        {
            let dummy;
            const key = reactive({});
            const value = reactive({});
            const map = reactive(new WeakMap());

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

        it('不应观察自定义属性变更', () =>
        {
            let dummy;
            const map: any = reactive(new WeakMap());

            effect(() => (dummy = map.customProp));

            expect(dummy).toBe(undefined);
            map.customProp = 'Hello World';
            expect(dummy).toBe(undefined);
        });

        it('不应观察非值变化的变更', () =>
        {
            let dummy;
            const key = {};
            const map = reactive(new WeakMap());
            const mapSpy = vi.fn(() => (dummy = map.get(key)));

            effect(mapSpy);

            expect(dummy).toBe(undefined);
            expect(mapSpy).toHaveBeenCalledTimes(1);
            // 与 @vue/reactivity 不同，map.get(key) 没有发生变化不会触发
            map.set(key, undefined);
            expect(dummy).toBe(undefined);
            expect(mapSpy).toHaveBeenCalledTimes(1);
            map.set(key, 'value');
            expect(dummy).toBe('value');
            expect(mapSpy).toHaveBeenCalledTimes(2);
            map.set(key, 'value');
            expect(dummy).toBe('value');
            expect(mapSpy).toHaveBeenCalledTimes(2);
            map.delete(key);
            expect(dummy).toBe(undefined);
            expect(mapSpy).toHaveBeenCalledTimes(3);
            map.delete(key);
            expect(dummy).toBe(undefined);
            expect(mapSpy).toHaveBeenCalledTimes(3);
        });

        it('不应观察原始数据', () =>
        {
            let dummy;
            const key = {};
            const map = reactive(new WeakMap());

            effect(() => (dummy = toRaw(map).get(key)));

            expect(dummy).toBe(undefined);
            map.set(key, 'Hello');
            expect(dummy).toBe(undefined);
            map.delete(key);
            expect(dummy).toBe(undefined);
        });

        it('不应用 Proxy 污染原始 Map', () =>
        {
            const map = new WeakMap();
            const observed = reactive(map);
            const key = {};
            const value = reactive({});

            observed.set(key, value);
            expect(map.get(key)).not.toBe(value);
            expect(map.get(key)).toBe(toRaw(value));
        });

        it('应返回包含值的可观察版本', () =>
        {
            const observed = reactive(new WeakMap());
            const key = {};
            const value = {};

            observed.set(key, value);
            const wrapped = observed.get(key);

            expect(isReactive(wrapped)).toBe(true);
            expect(toRaw(wrapped)).toBe(value);
        });

        it('应观察嵌套数据', () =>
        {
            const observed = reactive(new WeakMap());
            const key = {};

            observed.set(key, { a: 1 });
            let dummy;

            effect(() =>
            {
                dummy = observed.get(key).a;
            });
            observed.get(key).a = 2;
            expect(dummy).toBe(2);
        });

        it('新旧值都是 NaN 时不应触发', () =>
        {
            const map = new WeakMap();
            const key = {};

            map.set(key, NaN);
            const mapSpy = vi.fn(() => map.get(key));

            effect(mapSpy);
            map.set(key, NaN);
            expect(mapSpy).toHaveBeenCalledTimes(1);
        });

        it('WeakMap.set 调用应返回代理', () =>
        {
            const map = reactive(new WeakMap());
            const result = map.set({}, 'a');

            expect(result).toBe(map);
        });
    });
});
