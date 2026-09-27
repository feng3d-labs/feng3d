import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { logic, reactive, registerLogic } from '@feng3d/reactivity';
import { ComponentLogicBase } from '../component/Component';
import type { Component } from '../component/Component';
import type { Entity } from './Entity';
import type { Object3D } from './Object3D';
import './Object3D';

/**
 * 组件 `init()` 内写宿主 `children` 的时序（issue #222）。
 *
 * 现场：`EntityLogic` 构造期注册的 effect **同步**执行组件 `init()`，而这早于
 * `ContainerLogic` 对 `children` 的 pre-fill。于是任何在 `init()` 里往宿主 `children`
 * 写入的组件都会炸：
 *
 * ```
 * TypeError: Cannot read properties of undefined (reading 'push')
 * ```
 *
 * 编辑器侧长期用 `scripts/iconUtils.ts` 的 `appendChildren()` 自行 pre-fill 绕行
 * （`if (!r_host.children) r_host.children = [];`），属于调用方兜底。
 *
 * 修法：把组件初始化从 `EntityLogic` 构造期推迟到**最派生类构造完成之后**
 * （`EntityLogic` / `ContainerLogic` 用 `new.target` 判断让位，`Object3DLogic` 作为
 * 最派生类在字段初始化后调用 `initComponents()`）。
 */
interface ChildPushing extends Component
{
    readonly __type__: 'ChildPushing';
    readonly childName?: string;
}

declare module '../component/Component'
{
    interface ComponentMap
    {
        ChildPushing: ChildPushing;
    }
}

/** 记录 init 时看到的宿主状态，用于断言"init 发生在 pre-fill 之后" */
let seenChildren: unknown;

class ChildPushingLogic extends ComponentLogicBase
{
    protected constructor(data: ChildPushing)
    {
        super(data);
    }

    static create(data: ChildPushing): ChildPushingLogic
    {
        return new ChildPushingLogic(data);
    }

    override init(entity?: Entity): void
    {
        super.init(entity);

        const r_owner = reactive(entity as Object3D) as { children?: Object3D[] };

        seenChildren = r_owner.children;

        // 这就是旧实现会崩的那一行：children 还没 pre-fill 时 `push` 落空
        // （不用 `?.`：本用例要验证的正是"它一定存在"）
        r_owner.children!.push({
            __type__: 'Object3D',
            name: (this.component as ChildPushing | undefined)?.childName ?? 'autoChild',
        });
    }
}

registerLogic('ChildPushing', ChildPushingLogic as unknown as new (data: ChildPushing) => ChildPushingLogic);

describe('组件 init() 内写宿主 children（issue #222）', () =>
{
    it('Object3D 宿主：init 执行时 children 已 pre-fill，push 不抛异常', () =>
    {
        const component = { __type__: 'ChildPushing', childName: 'autoChild' } as ChildPushing;
        const host = { __type__: 'Object3D', name: 'host', components: [component] } as Object3D;

        expect(() => logic(host)).not.toThrow();

        // 组件在 init 里看到的已经是数组（不是 undefined）
        expect(Array.isArray(seenChildren)).toBe(true);

        // 子对象确实挂上了
        expect(host.children).toHaveLength(1);
        expect(host.children![0].name).toBe('autoChild');
    });

    it('Container 宿主同样安全', () =>
    {
        const component = { __type__: 'ChildPushing', childName: 'fromContainer' } as ChildPushing;
        const host = { __type__: 'Container', name: 'host', components: [component] } as unknown as Object3D;

        expect(() => logic(host)).not.toThrow();
        expect(host.children![0].name).toBe('fromContainer');
    });

    it('宿主已有 children 时追加到末尾，不覆盖既有子对象', () =>
    {
        const existing = { __type__: 'Object3D', name: 'existing' } as Object3D;
        const component = { __type__: 'ChildPushing', childName: 'appended' } as ChildPushing;
        const host = { __type__: 'Object3D', name: 'host', components: [component], children: [existing] } as Object3D;

        logic(host);

        expect(host.children).toHaveLength(2);
        expect(host.children![0]).toBe(existing);
        expect(host.children![1].name).toBe('appended');
    });

    it('组件 init 期间读宿主 logic 的位置字段可用（最派生类字段已初始化）', () =>
    {
        // 这条守着"推迟到最派生类构造完成"的另一个理由：init 里可能读宿主的 computed
        // （位置/世界矩阵），它们在 Object3DLogic 的 super() 之后才初始化。
        const component = { __type__: 'ChildPushing', childName: 'probe' } as ChildPushing;
        const host = { __type__: 'Object3D', name: 'host', position: { x: 1, y: 2, z: 3 }, components: [component] } as Object3D;

        expect(() => logic(host)).not.toThrow();
        expect(logic(host).worldPosition).toBeDefined();
    });
});
