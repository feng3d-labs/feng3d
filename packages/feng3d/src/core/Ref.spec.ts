import { describe, expect, it } from 'vitest';
import { logic, reactive } from '@feng3d/reactivity';
import type { Object3D } from './Object3D';
import './Object3D';   // 触发 registerLogic('Object3D', ...) 副作用
import { getShared, registerShared, resolveRefs } from './Ref';

/**
 * $ref 共享引用（框架设计文档 3.7）。
 */
describe('core/Ref', () =>
{
    it('$ref 字段解析为注册表中的同一对象', () =>
    {
        const material = { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4' } } };
        registerShared({ diffuse: material });

        const node: any = {
            __type__: 'Object3D',
            components: [{ __type__: 'MeshRenderer', material: { $ref: 'diffuse' } }],
        };

        logic(node);   // 触达 → resolveRefs

        expect(node.components[0].material).toBe(material);
        expect(getShared('diffuse')).toBe(material);
    });

    it('多处 $ref 引用共享同一实例，经代理修改一处处处生效', () =>
    {
        const material: any = { __type__: 'ColorMaterial', color: { r: 1, g: 1, b: 1 } };
        registerShared({ m: material });

        const nodeA: any = { __type__: 'Object3D', components: [{ __type__: 'MeshRenderer', material: { $ref: 'm' } }] };
        const nodeB: any = { __type__: 'Object3D', components: [{ __type__: 'MeshRenderer', material: { $ref: 'm' } }] };
        logic(nodeA);
        logic(nodeB);

        expect(nodeA.components[0].material).toBe(nodeB.components[0].material);

        reactive(nodeA.components[0].material).color = { r: 0.5, g: 0.5, b: 0.5 };
        expect(nodeB.components[0].material.color).toEqual({ r: 0.5, g: 0.5, b: 0.5 });
    });

    it('未注册的 $ref 打印错误并保留原值', () =>
    {
        const node: any = { __type__: 'Object3D', tag: { $ref: 'not-registered' } };

        expect(() => resolveRefs(node)).not.toThrow();
        expect(node.tag).toEqual({ $ref: 'not-registered' });
    });

    it('嵌套对象与数组内的 $ref 均被解析', () =>
    {
        const geometry = { __type__: 'CubeGeometry' };
        registerShared({ cube: geometry });

        const node: any = {
            __type__: 'Object3D',
            components: [{ __type__: 'MeshRenderer', geometry: { $ref: 'cube' } }],
            children: [{ __type__: 'Object3D', components: [{ __type__: 'MeshRenderer', geometry: { $ref: 'cube' } }] }],
        };

        resolveRefs(node);

        expect(node.components[0].geometry).toBe(geometry);
        expect(node.children[0].components[0].geometry).toBe(geometry);
    });
});
