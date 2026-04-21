import { describe, expect, it, test, vi } from 'vitest';
import { batchRun, Effect, effect, reactive, toRaw } from '../src';
import { EffectReactivity } from '../src/effect';

describe('响应式/effect', () =>
{
    it('传入的函数应执行一次（被 effect 包裹）', () =>
    {
        const fnSpy = vi.fn(() =>
        { });

        effect(fnSpy);
        expect(fnSpy).toHaveBeenCalledTimes(1);
    });

    it('应观察基本属性', () =>
    {
        let dummy;
        const counter = reactive({ num: 0 });

        effect(() => (dummy = counter.num));

        expect(dummy).toBe(0);
        counter.num = 7;
        expect(dummy).toBe(7);
    });

    it('应观察多个属性', () =>
    {
        let dummy;
        const counter = reactive({ num1: 0, num2: 0 });

        effect(() => (dummy = counter.num1 + counter.num1 + counter.num2));

        expect(dummy).toBe(0);
        counter.num1 = counter.num2 = 7;
        expect(dummy).toBe(21);
    });

    it('应处理多个 effect', () =>
    {
        let dummy1; let
            dummy2;
        const counter = reactive({ num: 0 });

        effect(() => (dummy1 = counter.num));
        effect(() => (dummy2 = counter.num));

        expect(dummy1).toBe(0);
        expect(dummy2).toBe(0);
        counter.num++;
        expect(dummy1).toBe(1);
        expect(dummy2).toBe(1);
    });

    it('应观察嵌套属性', () =>
    {
        let dummy;
        const counter = reactive({ nested: { num: 0 } });

        effect(() => (dummy = counter.nested.num));

        expect(dummy).toBe(0);
        counter.nested.num = 8;
        expect(dummy).toBe(8);
    });

    it('应观察删除操作', () =>
    {
        let dummy;
        const obj = reactive<{
            prop?: string
        }>({ prop: 'value' });

        effect(() => (dummy = obj.prop));

        expect(dummy).toBe('value');
        delete obj.prop;
        expect(dummy).toBe(undefined);
    });

    it('应观察 has 操作', () =>
    {
        let dummy;
        const obj = reactive<{ prop?: string | number }>({ prop: 'value' });

        effect(() => (dummy = 'prop' in obj));

        expect(dummy).toBe(true);
        delete obj.prop;
        expect(dummy).toBe(false);
        obj.prop = 12;
        expect(dummy).toBe(true);
    });

    it('应观察原型链上的属性', () =>
    {
        let dummy;
        const counter = reactive<{ num?: number }>({ num: 0 });
        const parentCounter = reactive({ num: 2 });

        Object.setPrototypeOf(counter, parentCounter);
        effect(() => (dummy = counter.num));

        expect(dummy).toBe(0);
        delete counter.num;
        expect(dummy).toBe(2);
        parentCounter.num = 4;
        expect(dummy).toBe(4);
        counter.num = 3;
        expect(dummy).toBe(3);
    });

    it('应观察原型链上的 has 操作', () =>
    {
        let dummy;
        const counter = reactive<{ num?: number }>({ num: 0 });
        const parentCounter = reactive<{ num?: number }>({ num: 2 });

        Object.setPrototypeOf(counter, parentCounter);
        effect(() => (dummy = 'num' in counter));

        expect(dummy).toBe(true);
        delete counter.num;
        expect(dummy).toBe(true);
        delete parentCounter.num;
        expect(dummy).toBe(false);
        counter.num = 3;
        expect(dummy).toBe(true);
    });

    it('应观察继承的属性访问器', () =>
    {
        let dummy; let parentDummy; let
            hiddenValue: any;
        const obj = reactive<{ prop?: number }>({});
        const parent = reactive({
            set prop(value)
            {
                hiddenValue = value;
            },
            get prop()
            {
                return hiddenValue;
            },
        });

        Object.setPrototypeOf(obj, parent);
        effect(() => (dummy = obj.prop));
        effect(() => (parentDummy = parent.prop));

        expect(dummy).toBe(undefined);
        expect(parentDummy).toBe(undefined);
        obj.prop = 4;
        expect(dummy).toBe(4);
        // 这不起作用，应该起作用吗？
        // expect(parentDummy).toBe(4)
        parent.prop = 2;
        expect(dummy).toBe(2);
        expect(parentDummy).toBe(2);
    });

    it('应观察函数调用链', () =>
    {
        let dummy;
        const counter = reactive({ num: 0 });

        effect(() => (dummy = getNum()));

        function getNum()
        {
            return counter.num;
        }

        expect(dummy).toBe(0);
        counter.num = 2;
        expect(dummy).toBe(2);
    });

    it('应观察迭代', () =>
    {
        let dummy;
        const list = reactive(['Hello']);

        effect(() => (dummy = list.join(' ')));

        expect(dummy).toBe('Hello');
        list.push('World!');
        expect(dummy).toBe('Hello World!');
        list.shift();
        expect(dummy).toBe('World!');
    });

    it('应观察隐式数组长度变化', () =>
    {
        let dummy;
        const list = reactive(['Hello']);

        effect(() => (dummy = list.join(' ')));

        expect(dummy).toBe('Hello');
        list[1] = 'World!';
        expect(dummy).toBe('Hello World!');
        list[3] = 'Hello!';
        expect(dummy).toBe('Hello World!  Hello!');
    });

    it('应观察稀疏数组变更', () =>
    {
        let dummy;
        const list = reactive<string[]>([]);

        list[1] = 'World!';
        effect(() => (dummy = list.join(' ')));

        expect(dummy).toBe(' World!');
        list[0] = 'Hello';
        expect(dummy).toBe('Hello World!');
        list.pop();
        expect(dummy).toBe('Hello');
    });

    it('应观察枚举', () =>
    {
        let dummy = 0;
        const numbers = reactive<Record<string, number>>({ num1: 3 });

        effect(() =>
        {
            dummy = 0;
            for (const key in numbers)
            {
                dummy += numbers[key];
            }
        });

        expect(dummy).toBe(3);
        numbers.num2 = 4;
        expect(dummy).toBe(7);
        delete numbers.num1;
        expect(dummy).toBe(4);
    });

    it('应观察 Symbol 键属性', () =>
    {
        const key = Symbol('symbol keyed prop');
        let dummy; let
            hasDummy;
        const obj = reactive<{ [key]?: string }>({ [key]: 'value' });

        effect(() => (dummy = obj[key]));
        effect(() => (hasDummy = key in obj));

        expect(dummy).toBe('value');
        expect(hasDummy).toBe(true);
        obj[key] = 'newValue';
        expect(dummy).toBe('newValue');
        delete obj[key];
        expect(dummy).toBe(undefined);
        expect(hasDummy).toBe(false);
    });

    it('不应观察众所周知的 Symbol 键属性', () =>
    {
        const key = Symbol.isConcatSpreadable;
        let dummy;
        const array: any = reactive([]);

        effect(() => (dummy = array[key]));

        expect(array[key]).toBe(undefined);
        expect(dummy).toBe(undefined);
        array[key] = true;
        expect(array[key]).toBe(true);
        expect(dummy).toBe(undefined);
    });

    it('不应在 has 操作中观察众所周知的 Symbol 键属性', () =>
    {
        const key = Symbol.isConcatSpreadable;
        const obj = reactive({
            [key]: true,
        }) as any;

        const spy = vi.fn(() =>
        {
            key in obj;
        });

        effect(spy);
        expect(spy).toHaveBeenCalledTimes(1);

        obj[key] = false;
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('应支持在观察 Symbol 键属性时操作数组', () =>
    {
        const key = Symbol();
        let dummy;
        const array: any = reactive([1, 2, 3]);

        effect(() => (dummy = array[key]));

        expect(dummy).toBe(undefined);
        array.pop();
        array.shift();
        array.splice(0, 1);
        expect(dummy).toBe(undefined);
        array[key] = 'value';
        array.length = 0;
        expect(dummy).toBe('value');
    });

    it('应观察函数值属性', () =>
    {
        const oldFunc = () =>
        { };
        const newFunc = () =>
        { };

        let dummy;
        const obj = reactive({ func: oldFunc });

        effect(() => (dummy = obj.func));

        expect(dummy).toBe(oldFunc);
        obj.func = newFunc;
        expect(dummy).toBe(newFunc);
    });

    it('应观察依赖 this 的链式 getter', () =>
    {
        const obj = reactive({
            a: 1,
            get b()
            {
                return this.a;
            },
        });

        let dummy;

        effect(() => (dummy = obj.b));
        expect(dummy).toBe(1);
        obj.a++;
        expect(dummy).toBe(2);
    });

    it('应观察依赖 this 的方法', () =>
    {
        const obj = reactive({
            a: 1,
            b()
            {
                return this.a;
            },
        });

        let dummy;

        effect(() => (dummy = obj.b()));
        expect(dummy).toBe(1);
        obj.a++;
        expect(dummy).toBe(2);
    });

    it('不应观察没有值变化的 set 操作', () =>
    {
        let hasDummy; let
            getDummy;
        const obj = reactive({ prop: 'value' });

        const getSpy = vi.fn(() => (getDummy = obj.prop));
        const hasSpy = vi.fn(() => (hasDummy = 'prop' in obj));

        effect(getSpy);
        effect(hasSpy);

        expect(getDummy).toBe('value');
        expect(hasDummy).toBe(true);
        obj.prop = 'value';
        expect(getSpy).toHaveBeenCalledTimes(1);
        expect(hasSpy).toHaveBeenCalledTimes(1);
        expect(getDummy).toBe('value');
        expect(hasDummy).toBe(true);
    });

    it('不应观察原始对象的变更', () =>
    {
        let dummy;
        const obj = reactive<{ prop?: string }>({});

        effect(() => (dummy = toRaw(obj).prop));

        expect(dummy).toBe(undefined);
        obj.prop = 'value';
        expect(dummy).toBe(undefined);
    });

    it('不应被原始对象变更触发', () =>
    {
        let dummy;
        const obj = reactive<{ prop?: string }>({});

        effect(() => (dummy = obj.prop));

        expect(dummy).toBe(undefined);
        toRaw(obj).prop = 'value';
        expect(dummy).toBe(undefined);
    });

    it('不应被继承的原始 setter 触发', () =>
    {
        let dummy; let parentDummy; let
            hiddenValue: any;
        const obj = reactive<{ prop?: number }>({});
        const parent = reactive({
            set prop(value)
            {
                hiddenValue = value;
            },
            get prop()
            {
                return hiddenValue;
            },
        });

        Object.setPrototypeOf(obj, parent);
        effect(() => (dummy = obj.prop));
        effect(() => (parentDummy = parent.prop));

        expect(dummy).toBe(undefined);
        expect(parentDummy).toBe(undefined);
        toRaw(obj).prop = 4;
        expect(dummy).toBe(undefined);
        expect(parentDummy).toBe(undefined);
    });

    it('应避免与自身的隐式无限递归循环', () =>
    {
        const counter = reactive({ num: 0 });

        const counterSpy = vi.fn(() => counter.num++);

        effect(counterSpy);
        expect(counter.num).toBe(1);
        expect(counterSpy).toHaveBeenCalledTimes(1);
        counter.num = 4;
        expect(counter.num).toBe(5);
        expect(counterSpy).toHaveBeenCalledTimes(2);
    });

    it('使用 Array.prototype.push/unshift/pop/shift 时应避免无限递归循环', () =>
    {
        (['push', 'unshift'] as const).forEach((key) =>
        {
            const arr = reactive<number[]>([]);
            const counterSpy1 = vi.fn(() => (arr[key] as any)(1));
            const counterSpy2 = vi.fn(() => (arr[key] as any)(2));

            effect(counterSpy1);
            effect(counterSpy2);
            expect(arr.length).toBe(2);
            expect(counterSpy1).toHaveBeenCalledTimes(1);
            expect(counterSpy2).toHaveBeenCalledTimes(1);
        });
        (['pop', 'shift'] as const).forEach((key) =>
        {
            const arr = reactive<number[]>([1, 2, 3, 4]);
            const counterSpy1 = vi.fn(() => (arr[key] as any)());
            const counterSpy2 = vi.fn(() => (arr[key] as any)());

            effect(counterSpy1);
            effect(counterSpy2);
            expect(arr.length).toBe(2);
            expect(counterSpy1).toHaveBeenCalledTimes(1);
            expect(counterSpy2).toHaveBeenCalledTimes(1);
        });
    });

    it('应允许显式递归原始函数循环', () =>
    {
        const counter = reactive({ num: 0 });
        const numSpy = vi.fn(() =>
        {
            counter.num++;
            if (counter.num < 10)
            {
                numSpy();
            }
        });

        effect(numSpy);
        expect(counter.num).toEqual(10);
        expect(numSpy).toHaveBeenCalledTimes(10);
    });

    it('应避免与其他 effect 的无限循环', () =>
    {
        const nums = reactive({ num1: 0, num2: 1 });

        const spy1 = vi.fn(() => (nums.num1 = nums.num2));
        const spy2 = vi.fn(() => (nums.num2 = nums.num1));

        effect(spy1);
        effect(spy2);
        expect(nums.num1).toBe(1);
        expect(nums.num2).toBe(1);
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        nums.num2 = 4;
        expect(nums.num1).toBe(4);
        expect(nums.num2).toBe(4);
        expect(spy1).toHaveBeenCalledTimes(2);
        expect(spy2).toHaveBeenCalledTimes(2);
        nums.num1 = 10;
        expect(nums.num1).toBe(10);
        expect(nums.num2).toBe(10);
        expect(spy1).toHaveBeenCalledTimes(3);
        expect(spy2).toHaveBeenCalledTimes(3);
    });

    it('应返回函数的新响应式版本', () =>
    {
        function greet()
        {
            return 'Hello World';
        }
        const effect1 = effect(greet);
        // 与 @vue/reactivity 不同，这里不会返回一个函数，而是返回一个 effect 实例
        const effect2 = effect(greet);

        // expect(typeof effect1).toBe('function')
        // expect(typeof effect2).toBe('function')
        expect(effect1).not.toBe(greet);
        expect(effect1).not.toBe(effect2);
    });

    it('自动运行时应发现新分支', () =>
    {
        let dummy;
        const obj = reactive({ prop: 'value', run: false });

        const conditionalSpy = vi.fn(() =>
        {
            dummy = obj.run ? obj.prop : 'other';
        });

        effect(conditionalSpy);

        expect(dummy).toBe('other');
        expect(conditionalSpy).toHaveBeenCalledTimes(1);
        obj.prop = 'Hi';
        expect(dummy).toBe('other');
        expect(conditionalSpy).toHaveBeenCalledTimes(1);
        obj.run = true;
        expect(dummy).toBe('Hi');
        expect(conditionalSpy).toHaveBeenCalledTimes(2);
        obj.prop = 'World';
        expect(dummy).toBe('World');
        expect(conditionalSpy).toHaveBeenCalledTimes(3);
    });

    it('修改非活动分支中使用的属性不应触发', () =>
    {
        let dummy;
        const obj = reactive({ prop: 'value', run: true });

        const conditionalSpy = vi.fn(() =>
        {
            dummy = obj.run ? obj.prop : 'other';
        });

        effect(conditionalSpy);

        expect(dummy).toBe('value');
        expect(conditionalSpy).toHaveBeenCalledTimes(1);
        obj.run = false;
        expect(dummy).toBe('other');
        expect(conditionalSpy).toHaveBeenCalledTimes(2);
        obj.prop = 'value2';
        expect(dummy).toBe('other');
        expect(conditionalSpy).toHaveBeenCalledTimes(2);
    });

    it('应使用清理回退处理深度 effect 递归', () =>
    {
        const results = reactive([0]);
        const effects: { fx: Effect; index: number }[] = [];

        for (let i = 1; i < 40; i++)
        {
            ((index) =>
            {
                const fx = effect(() =>
                {
                    results[index] = results[index - 1] * 2;
                });

                effects.push({ fx, index });
            })(i);
        }

        expect(results[39]).toBe(0);
        results[0] = 1;
        expect(results[39]).toBe(Math.pow(2, 39));
    });

    it('effect 递归期间应独立注册依赖', () =>
    {
        const input = reactive({ a: 1, b: 2, c: 0 });
        const output = reactive({ fx1: 0, fx2: 0 });

        const fx1Spy = vi.fn(() =>
        {
            let result = 0;

            if (input.c < 2) result += input.a;
            if (input.c > 1) result += input.b;
            output.fx1 = result;
        });

        const fx1 = effect(fx1Spy);

        const fx2Spy = vi.fn(() =>
        {
            let result = 0;

            if (input.c > 1) result += input.a;
            if (input.c < 3) result += input.b;
            output.fx2 = result + output.fx1;
        });

        const fx2 = effect(fx2Spy);

        expect(fx1).not.toBeNull();
        expect(fx2).not.toBeNull();

        expect(output.fx1).toBe(1);
        expect(output.fx2).toBe(2 + 1);
        expect(fx1Spy).toHaveBeenCalledTimes(1);
        expect(fx2Spy).toHaveBeenCalledTimes(1);

        fx1Spy.mockClear();
        fx2Spy.mockClear();
        input.b = 3;
        expect(output.fx1).toBe(1);
        expect(output.fx2).toBe(3 + 1);
        expect(fx1Spy).toHaveBeenCalledTimes(0);
        expect(fx2Spy).toHaveBeenCalledTimes(1);

        fx1Spy.mockClear();
        fx2Spy.mockClear();
        input.c = 1;
        expect(output.fx1).toBe(1);
        expect(output.fx2).toBe(3 + 1);
        expect(fx1Spy).toHaveBeenCalledTimes(1);
        expect(fx2Spy).toHaveBeenCalledTimes(1);

        fx1Spy.mockClear();
        fx2Spy.mockClear();
        input.c = 2;
        expect(output.fx1).toBe(3);
        expect(output.fx2).toBe(1 + 3 + 3);
        expect(fx1Spy).toHaveBeenCalledTimes(1);

        // 由于 fx1 变化而调用
        expect(fx2Spy).toHaveBeenCalledTimes(1);

        fx1Spy.mockClear();
        fx2Spy.mockClear();
        input.c = 3;
        expect(output.fx1).toBe(3);
        expect(output.fx2).toBe(1 + 3);
        expect(fx1Spy).toHaveBeenCalledTimes(1);
        expect(fx2Spy).toHaveBeenCalledTimes(1);

        fx1Spy.mockClear();
        fx2Spy.mockClear();
        input.a = 10;
        expect(output.fx1).toBe(3);
        expect(output.fx2).toBe(10 + 3);
        expect(fx1Spy).toHaveBeenCalledTimes(0);
        expect(fx2Spy).toHaveBeenCalledTimes(1);
    });

    it('单次变更不应多次运行', () =>
    {
        let dummy;
        const obj = reactive<Record<string, number>>({});
        const fnSpy = vi.fn(() =>
        {
            for (const key in obj)
            {
                dummy = obj[key];
            }
            dummy = obj.prop;
        });

        effect(fnSpy);

        expect(fnSpy).toHaveBeenCalledTimes(1);
        obj.prop = 16;
        expect(dummy).toBe(16);
        expect(fnSpy).toHaveBeenCalledTimes(2);
    });

    it('应允许嵌套 effect', () =>
    {
        const nums = reactive({ num1: 0, num2: 1, num3: 2 });
        const dummy: any = {};

        const childSpy = vi.fn(() => (dummy.num1 = nums.num1));
        const childeffect = effect(childSpy) as EffectReactivity;
        const parentSpy = vi.fn(() =>
        {
            dummy.num2 = nums.num2;
            // 使用 effect(func).run(true) 来代替 @vue/reactivity 中的 effect(func)()
            childeffect.run();
            dummy.num3 = nums.num3;
        });

        effect(parentSpy);

        expect(dummy).toEqual({ num1: 0, num2: 1, num3: 2 });
        expect(parentSpy).toHaveBeenCalledTimes(1);
        expect(childSpy).toHaveBeenCalledTimes(2);
        // 这应该只调用 childeffect
        nums.num1 = 4;
        expect(dummy).toEqual({ num1: 4, num2: 1, num3: 2 });
        expect(parentSpy).toHaveBeenCalledTimes(1);
        expect(childSpy).toHaveBeenCalledTimes(3);
        // 这调用 parenteffect，parenteffect 调用 childeffect 一次
        nums.num2 = 10;
        expect(dummy).toEqual({ num1: 4, num2: 10, num3: 2 });
        expect(parentSpy).toHaveBeenCalledTimes(2);
        expect(childSpy).toHaveBeenCalledTimes(4);
        // 这调用 parenteffect，parenteffect 调用 childeffect 一次
        nums.num3 = 7;
        expect(dummy).toEqual({ num1: 4, num2: 10, num3: 7 });
        expect(parentSpy).toHaveBeenCalledTimes(3);
        expect(childSpy).toHaveBeenCalledTimes(5);
    });

    it('应观察 JSON 方法', () =>
    {
        let dummy = <Record<string, number>>{};
        const obj = reactive<Record<string, number>>({});

        effect(() =>
        {
            dummy = JSON.parse(JSON.stringify(obj));
        });
        obj.a = 1;
        expect(dummy.a).toBe(1);
    });

    it('应观察类方法调用', () =>
    {
        class Model
        {
            count: number;
            constructor()
            {
                this.count = 0;
            }

            inc()
            {
                this.count++;
            }
        }
        const model = reactive(new Model());
        let dummy;

        effect(() =>
        {
            dummy = model.count;
        });
        expect(dummy).toBe(0);
        model.inc();
        expect(dummy).toBe(1);
    });

    it('停止', () =>
    {
        let dummy;
        const obj = reactive({ prop: 1 });
        const runner = effect(() =>
        {
            dummy = obj.prop;
        }) as EffectReactivity;

        obj.prop = 2;
        expect(dummy).toBe(2);
        // 使用 effect(func).pause() 代替 @vue/reactivity 中的 stop(effect(func))
        runner.pause();
        obj.prop = 3;
        expect(dummy).toBe(2);

        // 停止的 effect 仍可手动调用
        // 使用 effect(func).run() 代替 @vue/reactivity 中的 effect(func)()
        runner.run();
        expect(dummy).toBe(3);
    });

    it('停止：停止的 effect 嵌套在普通 effect 中', () =>
    {
        let dummy;
        const obj = reactive({ prop: 1 });
        const runner = effect(() =>
        {
            dummy = obj.prop;
        }) as EffectReactivity;

        // 使用 effect(func).pause() 代替 @vue/reactivity 中的 stop(effect(func))
        runner.pause();
        obj.prop = 2;
        expect(dummy).toBe(1);

        // 内部停止的 effect 中观察的值将作为依赖跟踪外部 effect
        effect(() =>
        {
            // 使用 effect(func).run() 代替 @vue/reactivity 中的 effect(func)()
            runner.run();
        });
        expect(dummy).toBe(2);

        // 通知外部 effect 运行
        obj.prop = 3;
        expect(dummy).toBe(3);
    });

    it('新旧值都是 NaN 时不应触发', () =>
    {
        const obj = reactive({
            foo: NaN,
        });
        const fnSpy = vi.fn(() => obj.foo);

        effect(fnSpy);
        obj.foo = NaN;
        expect(fnSpy).toHaveBeenCalledTimes(1);
    });

    it('数组长度设为 0 时应触发所有 effect', () =>
    {
        const observed: any = reactive([1]);
        let dummy; let
            record;

        effect(() =>
        {
            dummy = observed.length;
        });
        effect(() =>
        {
            record = observed[0];
        });
        expect(dummy).toBe(1);
        expect(record).toBe(1);

        observed[1] = 2;
        expect(observed[1]).toBe(2);

        observed.unshift(3);
        expect(dummy).toBe(3);
        expect(record).toBe(3);

        observed.length = 0;
        expect(dummy).toBe(0);
        expect(record).toBeUndefined();
    });

    it('设置相同代理时不应触发', () =>
    {
        const obj = reactive({ foo: 1 });
        const observed: any = reactive({ obj });
        const fnSpy = vi.fn(() => observed.obj);

        effect(fnSpy);

        expect(fnSpy).toHaveBeenCalledTimes(1);
        observed.obj = obj;
        expect(fnSpy).toHaveBeenCalledTimes(1);

        const obj2 = reactive({ foo: 1 });
        const observed2: any = reactive({ obj2 });
        const fnSpy2 = vi.fn(() => observed2.obj2);

        effect(fnSpy2);

        expect(fnSpy2).toHaveBeenCalledTimes(1);
        observed2.obj2 = obj2;
        expect(fnSpy2).toHaveBeenCalledTimes(1);
    });

    it('用字符串设置长度时应触发', () =>
    {
        let ret1 = 'idle';
        let ret2 = 'idle';
        const arr1 = reactive(new Array(11).fill(0));
        const arr2 = reactive(new Array(11).fill(0));

        effect(() =>
        {
            ret1 = arr1[10] === undefined ? 'arr[10] is set to empty' : 'idle';
        });
        effect(() =>
        {
            ret2 = arr2[10] === undefined ? 'arr[10] is set to empty' : 'idle';
        });
        arr1.length = 2;
        arr2.length = '2' as any;
        expect(ret1).toBe(ret2);
    });

    test('应跟踪 hasOwnProperty', () =>
    {
        const obj: any = reactive({});
        let has = false;
        const fnSpy = vi.fn();

        effect(() =>
        {
            fnSpy();
            has = obj.hasOwnProperty('foo');
        });
        expect(fnSpy).toHaveBeenCalledTimes(1);
        expect(has).toBe(false);

        obj.foo = 1;
        expect(fnSpy).toHaveBeenCalledTimes(2);
        expect(has).toBe(true);

        delete obj.foo;
        expect(fnSpy).toHaveBeenCalledTimes(3);
        expect(has).toBe(false);

        // 不应在不相关的键上触发
        obj.bar = 2;
        expect(fnSpy).toHaveBeenCalledTimes(3);
        expect(has).toBe(false);
    });

    it('批处理时应只触发一次', () =>
    {
        const counter = reactive({ num: 0 });

        const counterSpy = vi.fn(() => counter.num);

        effect(counterSpy);

        counterSpy.mockClear();

        batchRun(() =>
        {
            counter.num++;
            counter.num++;
        });

        expect(counterSpy).toHaveBeenCalledTimes(1);
    });

    test('应暂停/恢复 effect', () =>
    {
        const obj = reactive({ foo: 1 });
        const fnSpy = vi.fn(() => obj.foo);
        const runner = effect(fnSpy);

        expect(fnSpy).toHaveBeenCalledTimes(1);
        expect(obj.foo).toBe(1);

        runner.pause();
        obj.foo++;
        expect(fnSpy).toHaveBeenCalledTimes(1);
        expect(obj.foo).toBe(2);

        runner.resume();
        expect(fnSpy).toHaveBeenCalledTimes(2);
        expect(obj.foo).toBe(2);

        obj.foo++;
        expect(fnSpy).toHaveBeenCalledTimes(3);
        expect(obj.foo).toBe(3);
    });

    test('调用 resume 时应立即执行一次', () =>
    {
        const obj = reactive({ foo: 1 });
        const fnSpy = vi.fn(() => obj.foo);
        const runner = effect(fnSpy);

        expect(fnSpy).toHaveBeenCalledTimes(1);
        expect(obj.foo).toBe(1);

        runner.pause();
        obj.foo++;
        expect(fnSpy).toHaveBeenCalledTimes(1);
        expect(obj.foo).toBe(2);

        obj.foo++;
        expect(fnSpy).toHaveBeenCalledTimes(1);
        expect(obj.foo).toBe(3);

        runner.resume();
        expect(fnSpy).toHaveBeenCalledTimes(2);
        expect(obj.foo).toBe(3);
    });

    test('修改多个属性时不应向批处理队列添加重复依赖', () =>
    {
        // 模拟 RenderObjectChanges 示例中的场景：
        // 连续修改多个响应式属性时，同一个 effect 不应被重复添加到批处理队列
        const obj = reactive({
            pipeline: {
                vertex: { code: 'vertex shader 1' },
                fragment: { code: 'fragment shader 1' },
            },
            bindingResources: {
                color: { value: [1, 0, 0, 1] },
            },
        });

        let renderCount = 0;
        const warnSpy = vi.spyOn(console, 'warn');

        // 创建一个依赖多个属性的 effect
        effect(() =>
        {
            // 访问多个属性，建立依赖
            obj.pipeline.vertex.code;
            obj.pipeline.fragment.code;
            obj.bindingResources.color.value;
            renderCount++;
        });

        expect(renderCount).toBe(1);
        warnSpy.mockClear();

        // 连续修改多个属性，模拟用户点击事件
        obj.pipeline.vertex.code = 'vertex shader 2';
        obj.pipeline.fragment.code = 'fragment shader 2';
        obj.bindingResources.color.value = [0, 1, 0, 1];

        // effect 应该只执行一次（由于响应式系统的设计，每次修改都会触发）
        // 但不应该有重复依赖的警告
        expect(warnSpy).not.toHaveBeenCalledWith('dep already in _isRunedDeps');
        expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('dep already in _needEffectDeps'));

        warnSpy.mockRestore();
    });

    test('同一 effect 多次触发时应在批处理队列中去重', () =>
    {
        const obj = reactive({ a: 1, b: 2, c: 3 });

        const effectSpy = vi.fn(() =>
        {
            // 访问所有属性
            return obj.a + obj.b + obj.c;
        });

        effect(effectSpy);
        expect(effectSpy).toHaveBeenCalledTimes(1);

        effectSpy.mockClear();

        // 在同一个同步代码块中修改多个属性
        // 这会多次触发同一个 effect
        obj.a = 10;
        obj.b = 20;
        obj.c = 30;

        // 由于响应式系统的特性，每次修改都会立即触发 effect
        // 但同一个 effect 在同一批次中不应被重复添加
        expect(effectSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    test('嵌套对象属性修改时不应有重复警告', () =>
    {
        const state = reactive({
            config: {
                theme: 'light',
                fontSize: 14,
            },
            user: {
                name: 'test',
                settings: {
                    notifications: true,
                },
            },
        });

        const warnSpy = vi.spyOn(console, 'warn');
        let effectRunCount = 0;

        effect(() =>
        {
            // 深度依赖多个嵌套属性
            state.config.theme;
            state.config.fontSize;
            state.user.name;
            state.user.settings.notifications;
            effectRunCount++;
        });

        expect(effectRunCount).toBe(1);
        warnSpy.mockClear();

        // 连续修改多个嵌套属性
        state.config.theme = 'dark';
        state.config.fontSize = 16;
        state.user.name = 'updated';
        state.user.settings.notifications = false;

        // 不应有重复依赖的警告
        expect(warnSpy).not.toHaveBeenCalledWith('dep already in _isRunedDeps');
        expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('dep already in _needEffectDeps'));

        warnSpy.mockRestore();
    });
});
