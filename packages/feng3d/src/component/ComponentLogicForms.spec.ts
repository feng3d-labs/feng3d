import { describe, expect, it } from 'vitest';
import { logic, registerLogic, type LogicFactory } from '@feng3d/reactivity';
import { createComponentLogicBase } from './Component';
import './Component';
import '../component/Billboard';
import '../component/HoldSize';

/**
 * Logic 分发形态验证（AGENTS 第 3 章 + issue #653 / #674）：`registerLogic` **只接受工厂函数**。
 *
 * 用户口径（2026-10-05 修订）：Logic 一律是「工厂闭包直接返回对象字面量」——没有共享 proto、没有 class；
 * 这里验证的是「不同工厂写法经同一个 logic() 分发入口行为一致」。
 */
describe('component/Logic 只经工厂函数分发', () =>
{
    it('工厂形态（对象字面量）可经 logic() 创建', () =>
    {
        const billboard = { __type__: 'Billboard' } as never;
        const l = logic(billboard) as unknown as BillboardLike;

        expect(l).toBeDefined();
        expect(l.component).toBe(billboard);
        expect(l.beforeRender).toBeInstanceOf(Function);
    });

    it('工厂形态实例行为一致（entity 注入）', async () =>
    {
        const holdSize = { __type__: 'HoldSize' } as never;
        const l = logic(holdSize) as unknown as { entity: unknown; init: (e?: unknown) => void };
        expect(l.entity).toBeNull();

        const entity = { __type__: 'Object3D' } as never;
        l.init(entity);
        expect(l.entity).toBe(entity);
    });

    it('组合基座的工厂与独立工厂函数经同一分发入口工作', () =>
    {
        // 形态 1：组合基座行为（createComponentLogicBase）+ 自身成员（闭包对象字面量）
        function fooBaseLogic(data: never): { hello(): string; component: unknown }
        {
            const { members } = createComponentLogicBase(data as never);

            return {
                get component() { return members.component; },
                hello: () => 'base',
            };
        }
        registerLogic('FooBase', fooBaseLogic);
        // 形态 2：独立工厂函数（返回纯对象）
        function fooFnLogic(_data: never): { hello: () => string }
        {
            return { hello: () => 'fn' };
        }
        registerLogic('FooFn', fooFnLogic);

        expect((logic({ __type__: 'FooBase' } as never) as unknown as { hello(): string }).hello()).toBe('base');
        expect((logic({ __type__: 'FooFn' } as never) as unknown as { hello(): string }).hello()).toBe('fn');
    });

    it('class 构造函数不作为工厂注册（类型层门禁）', () =>
    {
        // class 构造函数只有构造签名、没有调用签名，无法赋给 LogicFactory。
        // @ts-expect-error 构造函数不能作为 registerLogic 的工厂
        const invalidFactory: LogicFactory<string> = class EmptyCtor {};

        // 运行时仍是一个函数（拦它的是类型检查，不是运行时报错）。
        expect(typeof invalidFactory).toBe('function');
    });
});

interface BillboardLike
{
    component: unknown;
    beforeRender: (renderObject: unknown) => void;
}
