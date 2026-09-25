import { describe, expect, it } from 'vitest';
import { logic, reactive } from '@feng3d/reactivity';
import './Object3D';   // 触发 registerLogic('Object3D', ...) 副作用
import { getShared, liftSharedRefs, registerShared, resolveRefs } from './Ref';

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

    // ---- 序列化反向提升（设计 3.7 保存侧） ----

    it('注册表对象序列化时还原为原注册键的 $ref', () =>
    {
        const material = { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 } } };
        registerShared({ 'materials/red': material });

        const scene: any = {
            __type__: 'Object3D',
            children: [
                { __type__: 'Object3D', components: [{ __type__: 'MeshRenderer', material }] },
                { __type__: 'Object3D', components: [{ __type__: 'MeshRenderer', material }] },
            ],
        };

        const { root, defs } = liftSharedRefs(scene);

        // 还原为原键（不是自动 shared 表）
        expect(root.children[0].components[0].material).toEqual({ $ref: 'materials/red' });
        expect(root.children[1].components[0].material).toEqual({ $ref: 'materials/red' });
        expect(defs).toEqual({});

        // 原树不被修改
        expect(scene.children[0].components[0].material).toBe(material);
    });

    it('树内多处引用的纯数据对象自动提升到 shared 表', () =>
    {
        const sharedUniforms = { __type__: 'Color4', r: 0, g: 1, b: 0, a: 1 };
        const scene: any = {
            __type__: 'Object3D',
            children: [
                { __type__: 'Object3D', components: [{ __type__: 'MeshRenderer', material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: sharedUniforms } } }] },
                { __type__: 'Object3D', components: [{ __type__: 'MeshRenderer', material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: sharedUniforms } } }] },
            ],
        };

        const { root, defs } = liftSharedRefs(scene);

        // 两处均替换为同一 $ref
        const refA = root.children[0].components[0].material.uniforms.u_diffuse;
        const refB = root.children[1].components[0].material.uniforms.u_diffuse;
        expect(refA).toEqual(refB);
        expect(typeof refA.$ref).toBe('string');
        // 提升对象挂在 shared 表，内容为克隆
        const [table, name] = refA.$ref.split('/');
        expect(table).toBe('shared');
        expect(defs.shared[name]).toEqual(sharedUniforms);
    });

    it('提升 → 解析往返后引用关系等价', () =>
    {
        const geometry = { __type__: 'SphereGeometry', radius: 1.5 };
        const scene: any = {
            __type__: 'Object3D',
            children: [
                { __type__: 'Object3D', components: [{ __type__: 'MeshRenderer', geometry }] },
                { __type__: 'Object3D', components: [{ __type__: 'MeshRenderer', geometry }] },
            ],
        };

        const { root, defs } = liftSharedRefs(scene);

        // 模拟保存的 JSON 结构重新加载：按全路径键注册提升表（与 View.defs 加载一致）+ 解析 $ref
        const fullTable: Record<string, object> = {};
        for (const name in defs.shared)
        {
            fullTable[`shared/${name}`] = defs.shared[name];
        }
        registerShared(fullTable);
        resolveRefs(root);

        expect(root.children[0].components[0].geometry).toBe(root.children[1].components[0].geometry);
        expect(root.children[0].components[0].geometry).toEqual(geometry);
    });

    it('运行时对象原样返回、循环引用抛错', () =>
    {
        const matrix = { elements: [1, 0, 0] }; // plain，会被克隆
        const runtime = new (class Runtime { x = 1; })();
        const node: any = { a: runtime, b: matrix, c: null, d: 3 };

        const { root } = liftSharedRefs(node);
        expect(root.a).toBe(runtime);      // 运行时对象引用返回
        expect(root.b).toEqual(matrix);    // 纯数据克隆（值相等、非同一对象）
        expect(root.b).not.toBe(matrix);
        expect(root.c).toBeNull();
        expect(root.d).toBe(3);

        const cyclic: any = { name: 'a' };
        cyclic.self = cyclic;
        expect(() => liftSharedRefs(cyclic)).toThrow('循环引用');
    });
});
