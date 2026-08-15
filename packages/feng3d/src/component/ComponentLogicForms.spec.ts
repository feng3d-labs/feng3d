import { describe, expect, it } from 'vitest';
import { logic, registerLogic } from '@feng3d/reactivity';
import { Component3D, ComponentLogicBase } from './Component';
import './Component';
import '../component/Billboard';
import '../component/HoldSize';

/**
 * Logic 两种形态共存验证（AGENTS 第 3 章）：class（protected constructor）与
 * 存量工厂函数经 `logic()` 的 `new factory(data)` 统一分发调用，行为一致。
 */
describe('component/Logic 形态共存', () =>
{
    it('class 形态（protected constructor）可经 logic() 创建', () =>
    {
        const billboard = { __type__: 'Billboard' } as never;
        const l = logic(billboard) as unknown as BillboardLike;

        expect(l).toBeDefined();
        expect(l.component).toBe(billboard);
        expect(l.beforeRender).toBeInstanceOf(Function);
        // 原型方法共享（class 模板的内存优势）
        expect(Object.getPrototypeOf(l).beforeRender).toBeDefined();
    });

    it('class 与工厂函数形态实例行为一致（entity 注入）', async () =>
    {
        const holdSize = { __type__: 'HoldSize' } as never;
        const l = logic(holdSize) as unknown as { entity: unknown; init: (e?: unknown) => void };
        expect(l.entity).toBeNull();

        const entity = { __type__: 'Object3D' } as never;
        l.init(entity);
        expect(l.entity).toBe(entity);
    });

    it('新注册 class 工厂与函数工厂经同一分发入口工作', () =>
    {
        // class 形态
        class FooLogic extends ComponentLogicBase
        {
            protected constructor(data: never)
            {
                super(data);
            }

            static make(data: never): FooLogic
            {
                return new FooLogic(data);
            }

            hello(): string { return 'class'; }
        }
        registerLogic('FooClass', FooLogic as unknown as new (d: never) => unknown);
        // 函数形态
        function fooFnLogic(_data: never): { hello: () => string }
        {
            return { hello: () => 'fn' };
        }
        registerLogic('FooFn', fooFnLogic as never);

        expect((logic({ __type__: 'FooClass' } as never) as unknown as { hello(): string }).hello()).toBe('class');
        expect((logic({ __type__: 'FooFn' } as never) as unknown as { hello(): string }).hello()).toBe('fn');
    });
});

interface BillboardLike
{
    component: unknown;
    beforeRender: (renderObject: unknown) => void;
}
