import { reactive } from '@feng3d/reactivity';
import { afterEach, assert, beforeEach, describe, it } from 'vitest';
import { ReactiveObject } from '../src/ReactiveObject';

describe('ReactiveObject', () =>
{
    describe('基础功能', () =>
    {
        let reactiveClass: ReactiveObject;

        beforeEach(() =>
        {
            reactiveClass = new ReactiveObject();
        });

        afterEach(() =>
        {
            if (reactiveClass)
            {
                reactiveClass.destroy();
            }
        });

        it('应该正确创建实例并支持effect方法', () =>
        {
            assert.ok(reactiveClass);
            assert.ok(reactiveClass.effect);
            assert.ok(reactiveClass.destroy);

            let effectCalled = false;
            const eff = reactiveClass.effect(() =>
            {
                effectCalled = true;
            });

            assert.ok(eff);
            assert.strictEqual(effectCalled, true);
        });

        it('应该支持destroy方法停止副作用', () =>
        {
            let callCount = 0;
            const reactiveObj = reactive({ testProp: '' });

            reactiveClass.effect(() =>
            {
                callCount++;
                reactiveObj.testProp;
            });

            // 初始调用
            assert.strictEqual(callCount, 1);

            // 修改属性触发副作用
            reactiveObj.testProp = 'value';
            assert.strictEqual(callCount, 2);

            // 销毁后，副作用应该停止
            reactiveClass.destroy();

            // 再次修改属性，副作用不应该被触发
            reactiveObj.testProp = 'new value';
            assert.strictEqual(callCount, 2); // 应该仍然是2，不会增加
        });
    });

    describe('继承使用 - 监听自身属性变化', () =>
    {
        class TestClass extends ReactiveObject
        {
            readonly name: string = '';
            readonly age: number = 0;
            readonly active: boolean = false;

            // 派生状态
            readonly showData: {
                readonly displayName: string;
                readonly isAdult: boolean;
                readonly status: string;
            } = {
                    displayName: '',
                    isAdult: false,
                    status: '',
                };

            constructor()
            {
                super();

                const r_this = reactive(this);
                const r_showData = reactive(this.showData);

                // 监听name变化，更新displayName
                this.effect(() =>
                {
                    r_showData.displayName = r_this.name || 'Anonymous';
                });

                // 监听age变化，更新isAdult
                this.effect(() =>
                {
                    r_showData.isAdult = r_this.age >= 18;
                });

                // 监听多个属性变化，更新status
                this.effect(() =>
                {
                    if (!r_this.active)
                    {
                        r_showData.status = 'inactive';
                    }
                    else if (r_this.age >= 18)
                    {
                        r_showData.status = 'active-adult';
                    }
                    else
                    {
                        r_showData.status = 'active-minor';
                    }
                });
            }

            destroy()
            {
                const r_showData = reactive(this.showData);

                // 清理派生状态
                r_showData.displayName = '';
                r_showData.isAdult = false;
                r_showData.status = '';

                super.destroy();
            }
        }

        let testInstance: TestClass;

        beforeEach(() =>
        {
            testInstance = new TestClass();
        });

        afterEach(() =>
        {
            if (testInstance)
            {
                testInstance.destroy();
            }
        });

        it('应该正确初始化派生状态', () =>
        {
            const data = testInstance.showData;

            assert.strictEqual(data.displayName, 'Anonymous');
            assert.strictEqual(data.isAdult, false);
            assert.strictEqual(data.status, 'inactive');
        });

        it('应该响应name变化并更新displayName', () =>
        {
            const r_testInstance = reactive(testInstance);
            const showData = testInstance.showData;
            const r_showData = reactive(showData);

            // 初始状态
            assert.strictEqual(showData.displayName, 'Anonymous');

            // 设置name
            r_testInstance.name = 'John';
            assert.strictEqual(r_showData.displayName, 'John');

            // 清空name
            r_testInstance.name = '';
            assert.strictEqual(r_showData.displayName, 'Anonymous');
        });

        it('应该响应age变化并更新isAdult', () =>
        {
            const r_testInstance = reactive(testInstance);
            const showData = testInstance.showData;

            // 初始状态
            assert.strictEqual(showData.isAdult, false);

            // 设置未成年年龄
            r_testInstance.age = 16;
            assert.strictEqual(showData.isAdult, false);

            // 设置成年年龄
            r_testInstance.age = 18;
            assert.strictEqual(showData.isAdult, true);

            // 设置更大年龄
            r_testInstance.age = 25;
            assert.strictEqual(showData.isAdult, true);
        });

        it('应该响应多个属性变化并更新status', () =>
        {
            const r_testInstance = reactive(testInstance);
            const showData = testInstance.showData;

            // 初始状态 - inactive
            assert.strictEqual(showData.status, 'inactive');

            // 激活但未成年
            r_testInstance.active = true;
            r_testInstance.age = 16;
            assert.strictEqual(showData.status, 'active-minor');

            // 激活且成年
            r_testInstance.age = 18;
            assert.strictEqual(showData.status, 'active-adult');

            // 停用
            r_testInstance.active = false;
            assert.strictEqual(showData.status, 'inactive');
        });

        it('应该正确处理复杂的依赖关系', () =>
        {
            const r_testInstance = reactive(testInstance);

            // 测试多个属性同时变化
            r_testInstance.name = 'Alice';
            r_testInstance.age = 20;
            r_testInstance.active = true;

            const data = testInstance.showData;

            assert.strictEqual(data.displayName, 'Alice');
            assert.strictEqual(data.isAdult, true);
            assert.strictEqual(data.status, 'active-adult');
        });

        it('应该在销毁时清理状态', () =>
        {
            const r_testInstance = reactive(testInstance);
            const showData = testInstance.showData;

            // 设置一些状态
            r_testInstance.name = 'Bob';
            r_testInstance.age = 25;
            r_testInstance.active = true;

            // 验证状态已设置
            assert.strictEqual(showData.displayName, 'Bob');
            assert.strictEqual(showData.isAdult, true);
            assert.strictEqual(showData.status, 'active-adult');

            // 销毁
            testInstance.destroy();

            // 验证状态已清理
            assert.strictEqual(showData.displayName, '');
            assert.strictEqual(showData.isAdult, false);
            assert.strictEqual(showData.status, '');
        });
    });

    describe('边界情况', () =>
    {
        it('应该处理空函数副作用', () =>
        {
            const reactiveClass = new ReactiveObject();

            assert.doesNotThrow(() =>
            {
                const eff = reactiveClass.effect(() =>
                {
                    // 空函数
                });

                assert.ok(eff);
            });
            reactiveClass.destroy();
        });

        it('应该支持多次调用destroy', () =>
        {
            const reactiveClass = new ReactiveObject();

            // 第一次调用destroy
            reactiveClass.destroy();

            // 第二次调用destroy不应该抛出错误
            assert.doesNotThrow(() =>
            {
                reactiveClass.destroy();
            });
        });

        it('销毁后副作用应该停止生效', () =>
        {
            const reactiveClass = new ReactiveObject();
            let callCount = 0;
            const reactiveObj = reactive({ testProp: '' });

            // 创建副作用
            reactiveClass.effect(() =>
            {
                callCount++;
                reactiveObj.testProp;
            });

            // 初始调用
            assert.strictEqual(callCount, 1);

            // 修改属性，触发副作用
            reactiveObj.testProp = 'value1';
            assert.strictEqual(callCount, 2);

            // 销毁
            reactiveClass.destroy();

            // 再次修改属性，副作用不应该被触发
            reactiveObj.testProp = 'value2';
            assert.strictEqual(callCount, 2); // 应该仍然是2，不会增加

            // 继续修改属性，副作用仍然不应该被触发
            reactiveObj.testProp = 'value3';
            assert.strictEqual(callCount, 2); // 应该仍然是2，不会增加
        });

        it('销毁后创建新的副作用应该失败', () =>
        {
            const reactiveClass = new ReactiveObject();

            // 销毁
            reactiveClass.destroy();

            // 尝试创建新的副作用应该失败或抛出错误
            try
            {
                reactiveClass.effect(() =>
                {
                    console.log('test');
                });
                assert.fail('应该在销毁后抛出错误');
            }
            catch (error)
            {
                // 预期的错误
                assert.ok(error);
            }
        });

        it('继承类销毁后副作用应该停止生效', () =>
        {
            class TestClass extends ReactiveObject
            {
                readonly value = 0;
                readonly displayValue = '';

                constructor()
                {
                    super();
                    const r_this = reactive(this);
                    const r_displayValue = reactive({ displayValue: '' });

                    this.effect(() =>
                    {
                        r_displayValue.displayValue = `Value: ${r_this.value}`;
                    });
                }
            }

            const testInstance = new TestClass();
            let callCount = 0;
            const reactiveObj = reactive({ testProp: '' });

            // 创建额外的副作用
            testInstance.effect(() =>
            {
                callCount++;
                reactiveObj.testProp;
            });

            // 初始调用
            assert.strictEqual(callCount, 1);

            // 修改属性，触发副作用
            reactiveObj.testProp = 'value1';
            assert.strictEqual(callCount, 2);

            // 销毁
            testInstance.destroy();

            // 再次修改属性，副作用不应该被触发
            reactiveObj.testProp = 'value2';
            assert.strictEqual(callCount, 2); // 应该仍然是2，不会增加
        });
    });
});
