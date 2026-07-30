import { describe, expect, it } from 'vitest';
import { logic, reactive, toRaw } from '@feng3d/reactivity';

// 触发 registerLogic('Container', containerLogic) 注册
import './Container';
import type { Container } from './Container';

/**
 * containerLogic 单元测试。
 *
 * containerLogic（src/core/Container.ts）组合 entityLogic，在 Entity 组件管理基础上叠加：
 * - children computed（响应式追踪 raw.children）
 * - parent 只读 getter（仅由 setParent 内部维护）
 * - children→parent 自动同步 effect（push 到 children 时自动设置 child.parent）
 *
 * 测试用 { __type__: 'Container' } as Container 字面量构造（不依赖 Object3D）。
 * 注意：
 * - 必须先 import './Container' 触发 registerLogic，否则 logic(container) 返回 null。
 * - push child 到 reactive(parent).children 前，需先 logic(parent) 让 children→parent
 *   同步 effect 建立依赖。
 * - 从响应式数组取出的元素是代理，用 toRaw 还原后再比较引用。
 */

// ---- 测试 ----

describe('containerLogic - 基本属性', () =>
{
    it('logic 实例非空且 entity 指向 raw', () =>
    {
        const c = { __type__: 'Container' } as Container;
        const l = logic(c);

        expect(l).not.toBeNull();
        expect(l.entity).toBe(c);
    });

    it('children 缺失时 pre-fill 为空数组', () =>
    {
        const raw = { __type__: 'Container' } as Container;
        logic(raw);

        expect(raw.children).toEqual([]);
    });

    it('children 已存在时不覆盖', () =>
    {
        const existing = { __type__: 'Container' } as Container;
        const raw = { __type__: 'Container', children: [existing] } as Container;
        const l = logic(raw);

        expect(toRaw(l.children[0])).toBe(existing);
    });

    it('components 继承自 entityLogic：缺失时 pre-fill 为空数组', () =>
    {
        const raw = { __type__: 'Container' } as Container;
        logic(raw);

        expect(raw.components).toEqual([]);
    });
});

describe('containerLogic - children', () =>
{
    it('children getter 反映 raw.children 的变化', () =>
    {
        const c = { __type__: 'Container' } as Container;
        const l = logic(c);
        // 触发 computed 求值建立依赖
        void l.children.length;

        expect(l.children.length).toBe(0);

        const child = { __type__: 'Container' } as Container;
        reactive(c).children.push(child);

        expect(l.children.length).toBe(1);
        expect(toRaw(l.children[0])).toBe(child);
    });

    it('初始 children 中的子对象可被读取', () =>
    {
        const c1 = { __type__: 'Container' } as Container;
        const c2 = { __type__: 'Container' } as Container;
        const parent = { __type__: 'Container', children: [c1, c2] } as Container;
        const l = logic(parent);

        expect(l.children.length).toBe(2);
        expect(toRaw(l.children[0])).toBe(c1);
        expect(toRaw(l.children[1])).toBe(c2);
    });

    it('splice 移除子对象后 children 更新', () =>
    {
        const c1 = { __type__: 'Container' } as Container;
        const c2 = { __type__: 'Container' } as Container;
        const parent = { __type__: 'Container', children: [c1, c2] } as Container;
        const l = logic(parent);
        void l.children.length;

        reactive(parent).children.splice(0, 1);

        expect(l.children.length).toBe(1);
        expect(toRaw(l.children[0])).toBe(c2);
    });
});

describe('containerLogic - parent 只读 getter', () =>
{
    it('parent 默认为 null', () =>
    {
        const l = logic({ __type__: 'Container' } as Container);

        expect(l.parent).toBeNull();
    });

    it('push 到 parent.children 后，child.parent 自动同步为 parent', () =>
    {
        const parent = { __type__: 'Container' } as Container;
        const child = { __type__: 'Container' } as Container;
        // 先 logic(parent) 让 children→parent 同步 effect 注册依赖
        const parentLogic = logic(parent);
        // 触发 children computed 求值建立依赖
        void parentLogic.children.length;

        reactive(parent).children.push(child);

        expect(toRaw(logic(child).parent)).toBe(parent);
    });

    it('初始 children 中的子对象 parent 同步为 parent', () =>
    {
        const child = { __type__: 'Container' } as Container;
        const parent = { __type__: 'Container', children: [child] } as Container;
        logic(parent);

        expect(toRaw(logic(child).parent)).toBe(parent);
    });

    it('parent 为只读 getter：外部直接赋值抛出 TypeError', () =>
    {
        const l = logic({ __type__: 'Container' } as Container);
        const parent = { __type__: 'Container' } as Container;

        expect(() =>
        {
            (l as { parent: Container }).parent = parent;
        }).toThrow(TypeError);

        // 赋值后 parent 仍为 null
        expect(l.parent).toBeNull();
    });

    it('parent 为只读 getter：通过 reactive 代理赋值同样抛出 TypeError', () =>
    {
        const l = logic({ __type__: 'Container' } as Container);
        const r_l = reactive(l);
        const parent = { __type__: 'Container' } as Container;

        expect(() =>
        {
            r_l.parent = parent;
        }).toThrow(TypeError);
        expect(l.parent).toBeNull();
    });

    it('从父级 children 移除后 parent 不自动变（仅 setParent 能修改）', () =>
    {
        const parent = { __type__: 'Container' } as Container;
        const child = { __type__: 'Container' } as Container;
        const parentLogic = logic(parent);
        void parentLogic.children.length;

        reactive(parent).children.push(child);
        expect(toRaw(logic(child).parent)).toBe(parent);

        // 从 children 中移除 child
        reactive(parent).children.splice(0, 1);

        // parent 仍是 parent（children→parent effect 只做单向添加同步，
        // 移除不自动置空；置空需 object3DLogic.dispose / setParent）
        expect(toRaw(logic(child).parent)).toBe(parent);
    });
});

describe('containerLogic - 多级层级', () =>
{
    it('三级层级：grandparent → parent → child 的 parent 链', () =>
    {
        const grandparent = { __type__: 'Container' } as Container;
        const parent = { __type__: 'Container' } as Container;
        const child = { __type__: 'Container' } as Container;

        const gpLogic = logic(grandparent);
        void gpLogic.children.length;
        reactive(grandparent).children.push(parent);

        const pLogic = logic(parent);
        void pLogic.children.length;
        reactive(parent).children.push(child);

        expect(toRaw(logic(parent).parent)).toBe(grandparent);
        expect(toRaw(logic(child).parent)).toBe(parent);
    });

    it('同一 parent 挂载多个 child，各自 parent 独立', () =>
    {
        const parent = { __type__: 'Container' } as Container;
        const c1 = { __type__: 'Container' } as Container;
        const c2 = { __type__: 'Container' } as Container;

        const pLogic = logic(parent);
        void pLogic.children.length;
        reactive(parent).children.push(c1, c2);

        expect(toRaw(logic(c1).parent)).toBe(parent);
        expect(toRaw(logic(c2).parent)).toBe(parent);
    });

    it('child 被挂载到新 parent 后 parent 更新为新 parent', () =>
    {
        const p1 = { __type__: 'Container' } as Container;
        const p2 = { __type__: 'Container' } as Container;
        const child = { __type__: 'Container' } as Container;

        // 先挂到 p1
        const p1Logic = logic(p1);
        void p1Logic.children.length;
        reactive(p1).children.push(child);
        expect(toRaw(logic(child).parent)).toBe(p1);

        // 从 p1 移除
        reactive(p1).children.splice(0, 1);

        // 挂到 p2
        const p2Logic = logic(p2);
        void p2Logic.children.length;
        reactive(p2).children.push(child);
        expect(toRaw(logic(child).parent)).toBe(p2);
    });
});

describe('containerLogic - 组件管理（继承自 entityLogic）', () =>
{
    it('getComponent 按 __type__ 匹配', () =>
    {
        const c = { __type__: 'Container' } as Container;
        const l = logic(c);
        const cam = { __type__: 'Camera' };
        reactive(c).components.push(cam);

        expect(toRaw(l.getComponent('Camera'))).toBe(cam);
    });

    it('getComponents 返回所有匹配项', () =>
    {
        const c = { __type__: 'Container' } as Container;
        const l = logic(c);
        const c1 = { __type__: 'Camera' };
        const c2 = { __type__: 'Light' };
        reactive(c).components.push(c1, c2);

        const result = l.getComponents('').map(toRaw);

        expect(result).toEqual([c1, c2]);
    });
});
