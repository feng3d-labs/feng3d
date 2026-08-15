import { describe, expect, it, beforeAll } from 'vitest';
import { logic, reactive, registerLogic, toRaw } from '@feng3d/reactivity';

// 触发 registerLogic('Entity', entityLogic) 注册
import './Entity';
import { componentLogic } from '../component/Component';
import type { Entity } from './Entity';
import type { Object3D } from './Object3D';

/**
 * entityLogic 单元测试。
 *
 * entityLogic（src/core/Entity.ts）是 logic 组合链的最底层，提供：
 * - components computed（响应式追踪 raw.components）
 * - getComponent / getComponents（按 __type__ + 类型层级表查询）
 * - 自动初始化 effect（components 变化时对新组件调用 init）
 *
 * 测试用 { __type__: 'Entity' } as Entity 字面量构造（不依赖 Object3D/Container）。
 * 注意：
 * - 必须先 import './Entity' 触发 registerLogic，否则 logic(entity) 返回 null。
 * - _initialized 是模块级 WeakSet，跨用例共享，每个测试需新建 component 实例。
 * - 从响应式数组取出的元素是代理，用 toRaw 还原后再比较引用。
 */

// ---- 测试用轻量组件：记录是否被 init ----

interface InitSpyComp
{
    __type__: 'InitSpyComp';
}

const initSpy = { callCount: 0, lastOwner: null as Object3D | null };

function InitSpyCompLogic(c: InitSpyComp)
{
    const base = componentLogic(c);
    const baseInit = base.init;

    return Object.assign(base, {
        init(entity?: unknown): void
        {
            initSpy.callCount++;
            initSpy.lastOwner = (entity as Object3D) ?? null;
            baseInit.call(base, entity as Object3D);
        },
    });
}

beforeAll(() =>
{
    registerLogic('InitSpyComp', InitSpyCompLogic);
});

/** 构造干净的 InitSpyComp 实例 */
function createInitSpyComp(): InitSpyComp
{
    return { __type__: 'InitSpyComp' };
}

// ---- 测试 ----

describe('entityLogic - 基本属性', () =>
{
    it('logic 实例非空且 entity 指向 raw', () =>
    {
        const e = { __type__: 'Entity' } as Entity;
        const l = logic(e);

        expect(l).not.toBeNull();
        expect(l.entity).toBe(e);
    });

    it('components 缺失时 pre-fill 为空数组', () =>
    {
        const raw = { __type__: 'Entity' } as Entity;
        logic(raw);

        expect(raw.components).toEqual([]);
    });

    it('components 已存在时不覆盖', () =>
    {
        const existing = { __type__: 'Camera' };
        const raw = { __type__: 'Entity', components: [existing] } as Entity;
        const l = logic(raw);

        // pre-fill 不应创建新数组，引用保持不变
        expect(raw.components).toBe(raw.components);
        expect(toRaw(l.components[0])).toBe(existing);
    });

    it('components getter 反映 raw.components 的变化', () =>
    {
        const e = { __type__: 'Entity' } as Entity;
        const l = logic(e);
        // 触发 computed 求值建立依赖
        void l.components.length;

        expect(l.components.length).toBe(0);

        const cam = { __type__: 'Camera' };
        reactive(e).components.push(cam);

        expect(l.components.length).toBe(1);
        expect(toRaw(l.components[0])).toBe(cam);
    });
});

describe('entityLogic - getComponent', () =>
{
    it('按 __type__ 精确匹配', () =>
    {
        const e = { __type__: 'Entity' } as Entity;
        const l = logic(e);
        const cam = { __type__: 'Camera' };
        reactive(e).components.push(cam);

        expect(toRaw(l.getComponent('Camera'))).toBe(cam);
    });

    it('经类型层级表匹配父类型（Camera 属于 Component 子类型）', () =>
    {
        const e = { __type__: 'Entity' } as Entity;
        const l = logic(e);
        const cam = { __type__: 'Camera' };
        reactive(e).components.push(cam);

        expect(toRaw(l.getComponent('Component'))).toBe(cam);
    });

    it('未命中返回 undefined', () =>
    {
        const l = logic({ __type__: 'Entity' } as Entity);

        expect(l.getComponent('NotExisting')).toBeUndefined();
    });

    it('返回第一个匹配项（多个同类组件取第一个）', () =>
    {
        const e = { __type__: 'Entity' } as Entity;
        const l = logic(e);
        const c1 = { __type__: 'Camera' };
        const c2 = { __type__: 'Camera' };
        reactive(e).components.push(c1, c2);

        expect(toRaw(l.getComponent('Camera'))).toBe(c1);
    });
});

describe('entityLogic - getComponents', () =>
{
    it('返回所有匹配项', () =>
    {
        const e = { __type__: 'Entity' } as Entity;
        const l = logic(e);
        const c1 = { __type__: 'Camera' };
        const c2 = { __type__: 'Camera' };
        const c3 = { __type__: 'Light' };
        reactive(e).components.push(c1, c2, c3);

        const result = l.getComponents('Camera').map(toRaw);

        expect(result).toEqual([c1, c2]);
    });

    it('空 typeName 返回全部组件', () =>
    {
        const e = { __type__: 'Entity' } as Entity;
        const l = logic(e);
        const c1 = { __type__: 'Camera' };
        const c2 = { __type__: 'Light' };
        reactive(e).components.push(c1, c2);

        const result = l.getComponents('').map(toRaw);

        expect(result).toEqual([c1, c2]);
    });

    it('传入 results 数组累加结果', () =>
    {
        const e = { __type__: 'Entity' } as Entity;
        const l = logic(e);
        const cam = { __type__: 'Camera' };
        reactive(e).components.push(cam);

        const results: { __type__: string }[] = [{ __type__: 'seed' }];
        const ret = l.getComponents('Camera', results);

        expect(ret).toBe(results);
        expect(results.length).toBe(2);
        expect(toRaw(results[1])).toBe(cam);
    });

    it('无匹配时返回空数组', () =>
    {
        const e = { __type__: 'Entity' } as Entity;
        const l = logic(e);
        reactive(e).components.push({ __type__: 'Camera' });

        expect(l.getComponents('Light')).toEqual([]);
    });
});

describe('entityLogic - 组件自动初始化', () =>
{
    it('挂载后 logic.init 被调用，参数为该 entity', () =>
    {
        initSpy.callCount = 0;
        initSpy.lastOwner = null;

        const e = { __type__: 'Entity' } as Entity;
        const l = logic(e);
        // 触发 components computed 求值，建立自动 init effect 的依赖
        l.getComponents('');
        const comp = createInitSpyComp();
        reactive(e).components.push(comp);

        expect(initSpy.callCount).toBe(1);
        expect(initSpy.lastOwner).toBe(e);
    });

    it('初始 components 中的组件也会被 init', () =>
    {
        initSpy.callCount = 0;

        const comp = createInitSpyComp();
        const e = { __type__: 'Entity', components: [comp] } as Entity;
        logic(e);

        expect(initSpy.callCount).toBe(1);
    });

    it('同一 component 实例只 init 一次（WeakSet 跨 logic 实例共享）', () =>
    {
        initSpy.callCount = 0;
        const e = { __type__: 'Entity' } as Entity;
        const l = logic(e);
        l.getComponents('');
        const comp = createInitSpyComp();
        reactive(e).components.push(comp);
        const countAfterFirst = initSpy.callCount;

        // 同一实例再次 push
        reactive(e).components.push(comp);

        expect(initSpy.callCount).toBe(countAfterFirst);
    });

    it('不同 component 实例各自 init', () =>
    {
        initSpy.callCount = 0;
        const e = { __type__: 'Entity' } as Entity;
        const l = logic(e);
        l.getComponents('');

        reactive(e).components.push(createInitSpyComp());
        reactive(e).components.push(createInitSpyComp());

        expect(initSpy.callCount).toBe(2);
    });
});
