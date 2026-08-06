import { describe, expect, it, test, vi } from 'vitest';
import { Computed, computed, effect, noTrack, reactive, ref } from '../src';

import { ComputedReactivity } from '../src/computed';
import { RefReactivity } from '../src/ref';

describe('reactivity/computed', () =>
{
    it('should return updated value', () =>
    {
        const value = reactive<{ foo?: number }>({});
        const cValue = computed(() => value.foo);

        expect(cValue.value).toBe(undefined);
        value.foo = 1;
        expect(cValue.value).toBe(1);
    });

    it('pass oldValue to computed getter', () =>
    {
        const count = ref(0);
        const oldValue = ref();
        const curValue = computed((pre) =>
        {
            oldValue.value = pre;

            return count.value;
        });

        expect(curValue.value).toBe(0);
        expect(oldValue.value).toBe(undefined);
        count.value++;
        expect(curValue.value).toBe(1);
        expect(oldValue.value).toBe(0);
    });

    it('should compute lazily', () =>
    {
        const value = reactive<{ foo?: number }>({});
        const getter = vi.fn(() => value.foo);
        const cValue = computed(getter);

        // lazy
        expect(getter).not.toHaveBeenCalled();

        expect(cValue.value).toBe(undefined);
        expect(getter).toHaveBeenCalledTimes(1);

        // should not compute again
        cValue.value;
        expect(getter).toHaveBeenCalledTimes(1);

        // should not compute until needed
        value.foo = 1;
        expect(getter).toHaveBeenCalledTimes(1);

        // now it should compute
        expect(cValue.value).toBe(1);
        expect(getter).toHaveBeenCalledTimes(2);

        // should not compute again
        cValue.value;
        expect(getter).toHaveBeenCalledTimes(2);
    });

    it('should trigger effect', () =>
    {
        const value = reactive<{ foo?: number }>({});
        const cValue = computed(() => value.foo);
        let dummy;

        effect(() =>
        {
            dummy = cValue.value;
        });
        expect(dummy).toBe(undefined);
        value.foo = 1;
        expect(dummy).toBe(1);
    });

    it('should work when chained', () =>
    {
        const value = reactive({ foo: 0 });
        const c1 = computed(() => value.foo);
        const c2 = computed(() => c1.value + 1);

        expect(c2.value).toBe(1);
        expect(c1.value).toBe(0);
        value.foo++;
        expect(c2.value).toBe(2);
        expect(c1.value).toBe(1);
    });

    it('should trigger effect when chained', () =>
    {
        const value = reactive({ foo: 0 });
        const getter1 = vi.fn(() => value.foo);
        const getter2 = vi.fn(() =>
            c1.value + 1);
        const c1 = computed(getter1);
        const c2 = computed(getter2);

        let dummy;

        effect(() =>
        {
            dummy = c2.value;
        });
        expect(dummy).toBe(1);
        expect(getter1).toHaveBeenCalledTimes(1);
        expect(getter2).toHaveBeenCalledTimes(1);
        value.foo++;
        expect(dummy).toBe(2);
        // should not result in duplicate calls
        expect(getter1).toHaveBeenCalledTimes(2);
        expect(getter2).toHaveBeenCalledTimes(2);
    });

    it('should trigger effect when chained (mixed invocations)', () =>
    {
        const value = reactive({ foo: 0 });
        const getter1 = vi.fn(() => value.foo);
        const getter2 = vi.fn(() =>
            c1.value + 1);
        const c1 = computed(getter1);
        const c2 = computed(getter2);

        let dummy;

        effect(() =>
        {
            dummy = c1.value + c2.value;
        });
        expect(dummy).toBe(1);

        expect(getter1).toHaveBeenCalledTimes(1);
        expect(getter2).toHaveBeenCalledTimes(1);
        value.foo++;
        expect(dummy).toBe(3);
        // should not result in duplicate calls
        expect(getter1).toHaveBeenCalledTimes(2);
        expect(getter2).toHaveBeenCalledTimes(2);
    });

    // #5720
    it('should invalidate before non-computed effects', () =>
    {
        const plusOneValues: number[] = [];
        const n = ref(0);
        const plusOne = computed(() => n.value + 1);

        effect(() =>
        {
            n.value;
            plusOneValues.push(plusOne.value);
        });
        // access plusOne, causing it to be non-dirty
        plusOne.value;
        // mutate n
        n.value++;
        // on the 2nd run, plusOne.value should have already updated.
        expect(plusOneValues).toMatchObject([1, 2]);
    });

    // https://github.com/vuejs/core/pull/5912#issuecomment-1497596875
    it('should query deps dirty sequentially', () =>
    {
        const cSpy = vi.fn();

        const a = ref({
            v: 1,
        });
        const b = computed(() =>
            a.value);
        const c = computed(() =>
        {
            cSpy();

            return b.value?.v;
        });
        const d = computed(() =>
        {
            if (b.value)
            {
                return c.value;
            }

            return 0;
        });

        d.value;
        a.value!.v = 2;
        a.value = null as any;
        d.value;
        expect(cSpy).toHaveBeenCalledTimes(2); // 采用了失效子节点的方式，此处结果不再是1，而为2。
    });

    // https://github.com/vuejs/core/pull/5912#issuecomment-1738257692
    it('chained computed dirty reallocation after querying dirty', () =>
    {
        let _msg: string | undefined;

        const items = ref<number[]>();
        const isLoaded = computed(() =>
            !!items.value);
        const msg = computed(() =>
        {
            if (isLoaded.value)
            {
                return 'The items are loaded';
            }

            return 'The items are not loaded';
        });

        effect(() =>
        {
            _msg = msg.value;
        });

        items.value = [1, 2, 3];
        items.value = [1, 2, 3];
        items.value = undefined as any;

        expect(_msg).toBe('The items are not loaded');
    });

    it('chained computed dirty reallocation after trigger computed getter', () =>
    {
        let _msg: string | undefined;

        const items = ref<number[]>();
        const isLoaded = computed(() =>
            !!items.value);
        const msg = computed(() =>
        {
            if (isLoaded.value)
            {
                return 'The items are loaded';
            }

            return 'The items are not loaded';
        });

        _msg = msg.value;
        items.value = [1, 2, 3];
        isLoaded.value; // <- trigger computed getter
        _msg = msg.value;
        items.value = undefined as any;
        _msg = msg.value;

        expect(_msg).toBe('The items are not loaded');
    });

    // https://github.com/vuejs/core/pull/5912#issuecomment-1739159832
    it('deps order should be consistent with the last time get value', () =>
    {
        const cSpy = vi.fn();

        const a = ref(0) as RefReactivity;
        const b = computed(() =>
            a.value % 3 !== 0) as ComputedReactivity;
        const c = computed(() =>
        {
            cSpy();
            if (a.value % 3 === 2)
            {
                return 'expensive';
            }

            return 'cheap';
        }) as ComputedReactivity;
        const d = computed(() =>
            a.value % 3 === 2) as ComputedReactivity;
        const e = computed(() =>
        {
            if (b.value)
            {
                if (d.value)
                {
                    return 'Avoiding expensive calculation';
                }
            }

            return c.value;
        }) as ComputedReactivity;

        e.value;
        a.value++;
        e.value;

        expect(a._parents.size === 3).toBe(true);
        expect(a._parents.has(b)).toBe(true);
        expect(a._parents.has(c)).toBe(true);
        expect(a._parents.has(d)).toBe(true);
        expect(b._parents.has(e)).toBe(true);
        expect(c._parents.has(e)).toBe(true);
        expect(d._parents.has(e)).toBe(true);

        expect(cSpy).toHaveBeenCalledTimes(2);

        a.value++;
        e.value;

        expect(cSpy).toHaveBeenCalledTimes(2);
    });

    it('should trigger by the second computed that maybe dirty', () =>
    {
        const cSpy = vi.fn();

        const src1 = ref(0);
        const src2 = ref(0);
        const c1 = computed(() => src1.value);
        const c2 = computed(() => (src1.value % 2) + src2.value);
        const c3 = computed(() =>
        {
            cSpy();
            c1.value;
            c2.value;
        });

        c3.value;
        src1.value = 2;
        c3.value;
        expect(cSpy).toHaveBeenCalledTimes(2);
        src2.value = 1;
        c3.value;
        expect(cSpy).toHaveBeenCalledTimes(3);
    });

    it('should trigger the second effect', () =>
    {
        const fnSpy = vi.fn();
        const v = ref(1);
        const c = computed(() => v.value);

        effect(() =>
        {
            c.value;
        });
        effect(() =>
        {
            c.value;
            fnSpy();
        });

        expect(fnSpy).toBeCalledTimes(1);
        v.value = 2;
        expect(fnSpy).toBeCalledTimes(2);
    });

    it('should chained recursive effects clear dirty after trigger', () =>
    {
        const v = ref(1);
        const c1 = computed(() => v.value) as Computed;
        const c2 = computed(() => c1.value) as Computed;

        c2.value;
        expect(c1['_isDirty']).toBeFalsy();
        expect(c2['_isDirty']).toBeFalsy();
    });

    it('should chained computeds dirtyLevel update with first computed effect', () =>
    {
        const v = ref(0);
        const c1 = computed(() =>
        {
            if (v.value === 0)
            {
                v.value = 1;
            }

            return v.value;
        });
        const c2 = computed(() => c1.value);
        const c3 = computed(() => c2.value);

        c3.value;
    });

    it('should work when chained(ref+computed)', () =>
    {
        const v = ref(0);
        const c1 = computed(() =>
        {
            if (v.value === 0)
            {
                v.value = 1;
            }

            return 'foo';
        });
        const c2 = computed(() => v.value + c1.value);

        expect(c2.value).toBe('0foo');
        expect(c2.value).toBe('1foo');
    });

    it('should trigger effect even computed already dirty', () =>
    {
        const fnSpy = vi.fn();
        const v = ref(0);
        const c1 = computed(() =>
        {
            if (v.value === 0)
            {
                v.value = 1;
            }

            return 'foo';
        });
        const c2 = computed(() => v.value + c1.value);

        effect(() =>
        {
            fnSpy(c2.value);
        });
        expect(fnSpy).toBeCalledTimes(1);
        expect(fnSpy.mock.calls).toMatchObject([['0foo']]);
        expect(v.value).toBe(1);
        v.value = 2;
        expect(fnSpy).toBeCalledTimes(2);
        expect(fnSpy.mock.calls).toMatchObject([['0foo'], ['2foo']]);
        expect(v.value).toBe(2);
    });

    test('should not trigger if value did not change', () =>
    {
        const src = ref(0);
        const c = computed(() => src.value % 2);
        const spy = vi.fn();

        effect(() =>
        {
            spy(c.value);
        });
        expect(spy).toHaveBeenCalledTimes(1);
        src.value = 2;

        // should not trigger
        expect(spy).toHaveBeenCalledTimes(1);

        src.value = 3;
        src.value = 5;
        // should trigger because latest value changes
        expect(spy).toHaveBeenCalledTimes(2);
    });

    test('chained computed trigger', () =>
    {
        const effectSpy = vi.fn();
        const c1Spy = vi.fn();
        const c2Spy = vi.fn();

        const src = ref(0);
        const c1 = computed(() =>
        {
            c1Spy();

            return src.value % 2;
        });
        const c2 = computed(() =>
        {
            c2Spy();

            return c1.value + 1;
        });

        effect(() =>
        {
            effectSpy(c2.value);
        });

        expect(c1Spy).toHaveBeenCalledTimes(1);
        expect(c2Spy).toHaveBeenCalledTimes(1);
        expect(effectSpy).toHaveBeenCalledTimes(1);

        src.value = 1;
        expect(c1Spy).toHaveBeenCalledTimes(2);
        expect(c2Spy).toHaveBeenCalledTimes(2);
        expect(effectSpy).toHaveBeenCalledTimes(2);
    });

    it('should be recomputed without being affected by side effects', () =>
    {
        const v = ref(0);
        const c1 = computed(() =>
        {
            v.value = 1;

            return 0;
        });
        const c2 = computed(() =>
            `${v.value},${c1.value}`);

        expect(c2.value).toBe('0,0');
        v.value = 1;
        expect(c2.value).toBe('1,0');
    });

    test('chained computed avoid re-compute', () =>
    {
        const effectSpy = vi.fn();
        const c1Spy = vi.fn();
        const c2Spy = vi.fn();

        const src = ref(0);
        const c1 = computed(() =>
        {
            c1Spy();

            return src.value % 2;
        });
        const c2 = computed(() =>
        {
            c2Spy();

            return c1.value + 1;
        });

        effect(() =>
        {
            effectSpy(c2.value);
        });

        expect(effectSpy).toHaveBeenCalledTimes(1);
        src.value = 2;
        src.value = 4;
        src.value = 6;
        expect(c1Spy).toHaveBeenCalledTimes(4);
        // c2 should not have to re-compute because c1 did not change.
        expect(c2Spy).toHaveBeenCalledTimes(1);
        // effect should not trigger because c2 did not change.
        expect(effectSpy).toHaveBeenCalledTimes(1);
    });

    test('chained computed value invalidation', () =>
    {
        const effectSpy = vi.fn();
        const c1Spy = vi.fn();
        const c2Spy = vi.fn();

        const src = ref(0);
        const c1 = computed(() =>
        {
            c1Spy();

            return src.value % 2;
        });
        const c2 = computed(() =>
        {
            c2Spy();

            return c1.value + 1;
        });

        effect(() =>
        {
            effectSpy(c2.value);
        });

        expect(effectSpy).toHaveBeenCalledTimes(1);
        expect(effectSpy).toHaveBeenCalledWith(1);
        expect(c2.value).toBe(1);

        expect(c1Spy).toHaveBeenCalledTimes(1);
        expect(c2Spy).toHaveBeenCalledTimes(1);

        src.value = 1;
        // value should be available sync
        expect(c2.value).toBe(2);
        expect(c2Spy).toHaveBeenCalledTimes(2);
    });

    test('sync access of invalidated chained computed should not prevent final effect from running', () =>
    {
        const effectSpy = vi.fn();
        const c1Spy = vi.fn();
        const c2Spy = vi.fn();

        const src = ref(0);
        const c1 = computed(() =>
        {
            c1Spy();

            return src.value % 2;
        });
        const c2 = computed(() =>
        {
            c2Spy();

            return c1.value + 1;
        });

        effect(() =>
        {
            effectSpy(c2.value);
        });
        expect(effectSpy).toHaveBeenCalledTimes(1);

        src.value = 1;
        // sync access c2
        c2.value;
        expect(effectSpy).toHaveBeenCalledTimes(2);
    });

    it('computed should force track in untracked zone', () =>
    {
        const n = ref(0);
        const spy1 = vi.fn();
        const spy2 = vi.fn();

        let c: Computed;

        effect(() =>
        {
            spy1();
            noTrack(() =>
            {
                n.value;
                c = computed(() => n.value + 1) as Computed;
                // access computed now to force refresh
                c.value;
                effect(() => spy2(c.value));
                n.value;
            });
        });

        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);

        n.value++;
        // outer effect should not trigger
        expect(spy1).toHaveBeenCalledTimes(1);
        // inner effect should trigger
        expect(spy2).toHaveBeenCalledTimes(2);
    });

    // not recommended behavior, but needed for backwards compatibility
    // used in VueUse asyncComputed
    it('computed side effect should be able trigger', () =>
    {
        const a = ref(false);
        const b = ref(false);
        const c = computed(() =>
        {
            a.value = true;

            return b.value;
        });

        effect(() =>
        {
            if (a.value)
            {
                b.value = true;
            }
        });
        expect(b.value).toBe(false);
        // accessing c triggers change
        c.value;
        expect(b.value).toBe(true);
        expect(c.value).toBe(true);
    });

    it('chained computed should work when accessed before having subs', () =>
    {
        const n = ref(0);
        const c = computed(() => n.value);
        const d = computed(() => c.value + 1);
        const spy = vi.fn();

        // access
        d.value;

        let dummy;

        effect(() =>
        {
            spy();
            dummy = d.value;
        });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(dummy).toBe(1);

        n.value++;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(dummy).toBe(2);
    });

    it('should be recomputed without being affected by side effects', () =>
    {
        const v = ref(0);
        const c1 = computed(() =>
        {
            v.value = 1;

            return 0;
        });
        const c2 = computed(() =>
            `${v.value},${c1.value}`);

        expect(c2.value).toBe('0,0');
        v.value = 1;
        expect(c2.value).toBe('1,0');
    });

    test('computed should remain live after losing all subscribers', () =>
    {
        const state = reactive({ a: 1 });
        const p = computed(() => state.a + 1);
        const e = effect(() => p.value);

        e.pause();

        expect(p.value).toBe(2);
        state.a++;
        expect(p.value).toBe(3);
    });

    // #11995
    test('computed dep cleanup should not cause property dep to be deleted', () =>
    {
        const toggle = ref(true);
        const state = reactive({ a: 1 });
        const p = computed(() =>
            (toggle.value ? state.a : 111));
        const pp = computed(() => state.a);

        effect(() => p.value);

        expect(pp.value).toBe(1);
        toggle.value = false;
        state.a++;
        expect(pp.value).toBe(2);
    });

    // #12020
    test('computed value updates correctly after dep cleanup', () =>
    {
        const obj = reactive({ foo: 1, flag: 1 });
        const c1 = computed(() => obj.foo);

        let foo;

        effect(() =>
        {
            foo = obj.flag ? (obj.foo, c1.value) : 0;
        });
        expect(foo).toBe(1);

        obj.flag = 0;
        expect(foo).toBe(0);

        obj.foo = 2;
        obj.flag = 1;
        expect(foo).toBe(2);
    });

    // #11928
    test('should not lead to exponential perf cost with deeply chained computed', () =>
    {
        const start = {
            prop1: ref(1),
            prop2: ref(2),
            prop3: ref(3),
            prop4: ref(4),
        };

        let layer = start;

        const LAYERS = 1000;

        for (let i = LAYERS; i > 0; i--)
        {
            const m = layer;
            const s = {
                prop1: computed(() => m.prop2.value),
                prop2: computed(() => m.prop1.value - m.prop3.value),
                prop3: computed(() => m.prop2.value + m.prop4.value),
                prop4: computed(() => m.prop3.value),
            };

            effect(() => s.prop1.value);
            effect(() => s.prop2.value);
            effect(() => s.prop3.value);
            effect(() => s.prop4.value);

            s.prop1.value;
            s.prop2.value;
            s.prop3.value;
            s.prop4.value;

            layer = s as any;
        }

        const t = performance.now();

        start.prop1.value = 4;
        start.prop2.value = 3;
        start.prop3.value = 2;
        start.prop4.value = 1;
        expect(performance.now() - t).toBeLessThan(100);

        const end = layer;

        expect([
            end.prop1.value,
            end.prop2.value,
            end.prop3.value,
            end.prop4.value,
        ]).toMatchObject([-2, -4, 2, 3]);
    });

    test('performance when removing dependencies from deeply nested computeds', () =>
    {
        const base = ref(1);
        const trigger = ref(true);
        const computeds: Computed<number>[] = [];

        const LAYERS = 30;

        for (let i = 0; i < LAYERS; i++)
        {
            const earlier = [...computeds];

            computeds.push(
                computed(() =>
                    base.value + earlier.reduce((sum, c) => sum + c.value, 0)) as Computed,
            );
        }

        const tail = computed(() =>
            (trigger.value ? computeds[computeds.length - 1].value : 0),
        );

        const t0 = performance.now();

        expect(tail.value).toBe(2 ** (LAYERS - 1));
        const t1 = performance.now();

        expect(t1 - t0).toBeLessThan(process.env.CI ? 100 : 30);

        trigger.value = false;
        expect(tail.value).toBe(0);
        const t2 = performance.now();

        expect(t2 - t1).toBeLessThan(process.env.CI ? 100 : 30);
    });
});
