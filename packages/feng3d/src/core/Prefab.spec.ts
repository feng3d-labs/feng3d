import { describe, expect, it } from 'vitest';
import { logic } from '@feng3d/reactivity';
import type { Object3D } from './Object3D';
import './Object3D';   // 触发 registerLogic('Object3D', ...) 副作用
import { applyPrefab, getPrefab, registerPrefabs } from './Prefab';

/**
 * Prefab 内联 defs（框架设计文档 3.6）：模板深拷贝 + overrides 递归合并。
 */
describe('core/Prefab', () =>
{
    it('prefabId 节点 logic 触达时实例化（模板补缺 + overrides 覆盖）', () =>
    {
        registerPrefabs({
            CubePrefab: {
                __type__: 'Object3D',
                position: { x: 0, y: 0, z: 0 },
                components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry' } }],
            } as Object3D,
        });

        const instance = {
            __type__: 'Object3D',
            name: 'Cube-1',
            prefabId: 'CubePrefab',
            overrides: { position: { x: 1, y: 0, z: 0 } },
        } as unknown as Object3D;

        logic(instance);   // 触达 → applyPrefab

        const raw = instance as any;
        expect(raw.name).toBe('Cube-1');                        // 实例自身字段优先
        expect(raw.position).toEqual({ x: 1, y: 0, z: 0 });     // overrides 覆盖
        expect(raw.components.length).toBe(1);                  // 模板补缺
        expect(raw.components[0].__type__).toBe('MeshRenderer');

        // 实例化后模板与实例独立（深拷贝，互不影响）
        const template = getPrefab('CubePrefab') as any;
        expect(template.position).toEqual({ x: 0, y: 0, z: 0 });
        raw.components[0].geometry = null;
        expect(template.components[0].geometry).toEqual({ __type__: 'CubeGeometry' });
    });

    it('两个实例互不影响（独立深拷贝）', () =>
    {
        registerPrefabs({
            PrefabB: { __type__: 'Object3D', scale: { x: 1, y: 1, z: 1 } } as Object3D,
        });

        const a = { __type__: 'Object3D', prefabId: 'PrefabB' } as unknown as Object3D;
        const b = { __type__: 'Object3D', prefabId: 'PrefabB' } as unknown as Object3D;
        logic(a);
        logic(b);

        (a as any).scale.x = 5;
        expect((b as any).scale.x).toBe(1);
    });

    it('未注册的 prefabId 打印错误且不崩溃', () =>
    {
        const node = { __type__: 'Object3D', prefabId: 'NotExists' } as unknown as Object3D;

        expect(() => logic(node)).not.toThrow();
        expect(getPrefab('NotExists')).toBeUndefined();
    });

    it('overrides 对象字段递归合并', () =>
    {
        registerPrefabs({
            PrefabC: { __type__: 'Object3D', position: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } } as Object3D,
        });

        const node = {
            __type__: 'Object3D', prefabId: 'PrefabC',
            overrides: { position: { y: 2 } },   // 只覆盖 y，继承模板 x/z
        } as unknown as Object3D;
        logic(node);

        expect((node as any).position).toEqual({ x: 0, y: 2, z: 0 });
        expect((node as any).scale).toEqual({ x: 1, y: 1, z: 1 });
    });
});
