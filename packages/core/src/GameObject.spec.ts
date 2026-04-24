import { describe, expect, it } from 'vitest';
import { GameObject } from './GameObject';
import { Transform } from './Transform';
import { Component } from './Component';
import { effect, reactive } from '@feng3d/reactivity';

// 测试用组件
class TestComponent extends Component
{
    readonly value = 42;
}

describe('GameObject', () =>
{
    describe('components', () =>
    {
        it('应包含默认的 Transform 组件', () =>
        {
            const gameObject = new GameObject();
            expect(gameObject.components).toHaveLength(1);
            expect(gameObject.components[0]).toBeInstanceOf(Transform);
        });
    });

    describe('transform', () =>
    {
        it('应返回 Transform 组件', () =>
        {
            const gameObject = new GameObject();
            expect(gameObject.transform).toBeInstanceOf(Transform);
        });

        it('transform 应与 getComponent(Transform) 返回相同类型的组件', () =>
        {
            const gameObject = new GameObject();
            const component = gameObject.getComponent(Transform);
            expect(gameObject.transform).toBeInstanceOf(Transform);
            expect(component).toBeInstanceOf(Transform);
        });

        it('transform 应支持响应式更新', () =>
        {
            const gameObject = new GameObject();

            // 记录 transform 变化
            const transforms: (Transform | null)[] = [];
            effect(() =>
            {
                transforms.push(gameObject.transform);
            });

            // 初始 transform
            expect(transforms).toHaveLength(1);
            expect(transforms[0]).toBeInstanceOf(Transform);
        });

        it('Transform 被移除时应触发 transform 更新', () =>
        {
            const gameObject = new GameObject();
            const r_gameObject = reactive(gameObject);

            const transforms: (Transform | null)[] = [];
            effect(() =>
            {
                transforms.push(gameObject.transform);
            });

            // 初始有 Transform
            expect(transforms).toHaveLength(1);
            expect(transforms[0]).toBeInstanceOf(Transform);

            // 移除 Transform（清空 components）
            reactive(r_gameObject.components).splice(0, 1);

            // transform 应变为 null
            expect(transforms).toHaveLength(2);
            expect(transforms[1]).toBeNull();
        });

        it('Transform 被替换时应触发 transform 更新', () =>
        {
            const gameObject = new GameObject();
            const r_gameObject = reactive(gameObject);

            const transforms: (Transform | null)[] = [];
            effect(() =>
            {
                transforms.push(gameObject.transform);
            });

            // 初始 Transform
            expect(transforms).toHaveLength(1);
            const originalTransform = transforms[0];
            expect(originalTransform).toBeInstanceOf(Transform);

            // 替换为新的 Transform
            const newTransform = new Transform();
            reactive(r_gameObject.components)[0] = newTransform;

            // transform 应更新为新的 Transform
            expect(transforms).toHaveLength(2);
            expect(transforms[1]).toBeInstanceOf(Transform);
            expect(transforms[1]).not.toBe(originalTransform);
        });
    });

    describe('getComponent', () =>
    {
        it('应能获取 Transform 组件', () =>
        {
            const gameObject = new GameObject();
            const transform = gameObject.getComponent(Transform);
            expect(transform).toBeInstanceOf(Transform);
            expect(transform).not.toBeNull();
        });

        it('获取不存在的组件应返回 null', () =>
        {
            const gameObject = new GameObject();
            const component = gameObject.getComponent(TestComponent);
            expect(component).toBeNull();
        });

        it('应能获取正确类型的组件', () =>
        {
            class MockGameObject extends GameObject
            {
                override readonly components = [new Transform(), new TestComponent()];
            }

            const gameObject = new MockGameObject();
            const testComponent = gameObject.getComponent(TestComponent);
            expect(testComponent).toBeInstanceOf(TestComponent);
            expect(testComponent?.value).toBe(42);
        });

        it('应能区分不同的组件类型', () =>
        {
            class MockGameObject extends GameObject
            {
                override readonly components = [
                    new Transform(),
                    new TestComponent(),
                    new Transform(),
                ];
            }

            const gameObject = new MockGameObject();
            const transforms = gameObject.components.filter(c => c instanceof Transform);
            expect(transforms).toHaveLength(2);

            // getComponent 应返回第一个匹配的
            const transform = gameObject.getComponent(Transform);
            expect(transform).toBe(transforms[0]);
        });
    });
});
