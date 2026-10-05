import { describe, expect, it } from 'vitest';
import { createLogicProto, logic, registerLogic, type LogicFactory } from '@feng3d/reactivity';
import { componentLogicProto } from './Component';
import './Component';
import '../component/Billboard';
import '../component/HoldSize';

/**
 * Logic 分发形态验证（AGENTS 第 3 章 + issue #653）：`registerLogic` **只接受工厂函数**。
 * class 构造函数（只有构造签名）不再可注册，class 形态经 `XxxLogic.create`
 * 作为工厂接入，与独立工厂函数经同一个 `logic()` 分发入口调用，行为一致。
 */
describe('component/Logic 只经工厂函数分发', () =>
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

    it('派生 proto 的工厂与独立工厂函数经同一分发入口工作', () =>
    {
        // 形态 1：在基类 proto 上派生（interface + proto + 工厂，issue #674 范式）
        const fooProto = createLogicProto<{ hello(): string }>(componentLogicProto, {
            hello: { value: function (): string { return 'proto'; } },
        });
        function fooProtoLogic(_data: never): { hello: () => string }
        {
            return Object.create(fooProto) as { hello: () => string };
        }
        registerLogic('FooProto', fooProtoLogic);
        // 形态 2：独立工厂函数（返回纯对象）
        function fooFnLogic(_data: never): { hello: () => string }
        {
            return { hello: () => 'fn' };
        }
        registerLogic('FooFn', fooFnLogic);

        expect((logic({ __type__: 'FooProto' } as never) as unknown as { hello(): string }).hello()).toBe('proto');
        expect((logic({ __type__: 'FooFn' } as never) as unknown as { hello(): string }).hello()).toBe('fn');
    });

    it('class 构造函数本身不再可作为工厂注册（类型层门禁）', () =>
    {
        // class 构造函数只有构造签名、没有调用签名，无法赋给 LogicFactory；
        // 这条断言是 issue #653 的反向验证：类型层拦住「绕过 static create 直接注册类」。
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
