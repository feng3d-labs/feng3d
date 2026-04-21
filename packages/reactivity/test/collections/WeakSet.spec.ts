import { describe, expect, it, vi } from 'vitest';
import { effect, isReactive, reactive, toRaw } from '../../src';

describe('响应式/集合', () =>
{
    describe('WeakSet', () =>
    {
        it('instanceof', () =>
        {
            const original = new WeakSet();
            const observed = reactive(original);

            expect(isReactive(observed)).toBe(true);
            expect(original).toBeInstanceOf(WeakSet);
            expect(observed).toBeInstanceOf(WeakSet);
        });

        it('应观察变更', () =>
        {
            let dummy;
            const value = {};
            const set = reactive(new WeakSet());

            effect(() => (dummy = set.has(value)));

            expect(dummy).toBe(false);
            set.add(value);
            expect(dummy).toBe(true);
            set.delete(value);
            expect(dummy).toBe(false);
        });

        it('应观察以观察值的变更', () =>
        {
            let dummy;
            const value = reactive({});
            const set = reactive(new WeakSet());

            effect(() => (dummy = set.has(value)));

            expect(dummy).toBe(false);
            set.add(value);
            expect(dummy).toBe(true);
            set.delete(value);
            expect(dummy).toBe(false);
        });

        it('不应观察自定义属性变更', () =>
        {
            let dummy;
            const set: any = reactive(new WeakSet());

            effect(() => (dummy = set.customProp));

            expect(dummy).toBe(undefined);
            set.customProp = 'Hello World';
            expect(dummy).toBe(undefined);
        });

        it('不应观察非值变化的变更', () =>
        {
            let dummy;
            const value = {};
            const set = reactive(new WeakSet());
            const setSpy = vi.fn(() => (dummy = set.has(value)));

            effect(setSpy);

            expect(dummy).toBe(false);
            expect(setSpy).toHaveBeenCalledTimes(1);
            set.add(value);
            expect(dummy).toBe(true);
            expect(setSpy).toHaveBeenCalledTimes(2);
            set.add(value);
            expect(dummy).toBe(true);
            expect(setSpy).toHaveBeenCalledTimes(2);
            set.delete(value);
            expect(dummy).toBe(false);
            expect(setSpy).toHaveBeenCalledTimes(3);
            set.delete(value);
            expect(dummy).toBe(false);
            expect(setSpy).toHaveBeenCalledTimes(3);
        });

        it('不应观察原始数据', () =>
        {
            const value = {};
            let dummy;
            const set = reactive(new WeakSet());

            effect(() => (dummy = toRaw(set).has(value)));

            expect(dummy).toBe(false);
            set.add(value);
            expect(dummy).toBe(false);
        });

        it('不应被原始变更触发', () =>
        {
            const value = {};
            let dummy;
            const set = reactive(new WeakSet());

            effect(() => (dummy = set.has(value)));

            expect(dummy).toBe(false);
            toRaw(set).add(value);
            expect(dummy).toBe(false);
        });

        it('不应用 Proxy 污染原始 Set', () =>
        {
            const set = new WeakSet();
            const observed = reactive(set);
            const value = reactive({});

            observed.add(value);
            expect(observed.has(value)).toBe(true);
            expect(set.has(value)).toBe(false);
        });

        it('WeakSet.add 调用应返回代理', () =>
        {
            const set = reactive(new WeakSet());
            const result = set.add({});

            expect(result).toBe(set);
        });
    });
});
