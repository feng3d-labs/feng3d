import { describe, expect, it } from 'vitest';
import { serialization } from '../src/Serialization';

/**
 * 纯数据（`__type__` 字面量）反序列化测试。
 *
 * 主仓的 `Object3D` / `Scene` / 几何体 / 材质已迁移为纯数据接口，运行时没有构造器，
 * JSON 里只有 `__type__` 而没有 `__class__`。这些用例锁定该链路的往返行为，
 * 避免再次退化成「必须存在构造器」。
 */
describe('serialization.deserialize 纯数据链路', () =>
{
    it('反序列化纯数据对象并保留全部字段', () =>
    {
        const json = {
            __type__: 'Object3D',
            name: 'root',
            position: { x: 1, y: 2, z: 3 },
            rotation: { x: 0, y: 1.5, z: 0 },
        };

        const result = serialization.deserialize<typeof json>(json);

        expect(result.__type__).toBe('Object3D');
        expect(result.name).toBe('root');
        expect(result.position).toEqual({ x: 1, y: 2, z: 3 });
        expect(result.rotation).toEqual({ x: 0, y: 1.5, z: 0 });
    });

    it('递归处理 components / children / 数组', () =>
    {
        const json = {
            __type__: 'Object3D',
            name: 'root',
            components: [{ __type__: 'Scene', ambientColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 } }],
            children: [
                {
                    __type__: 'Object3D',
                    name: 'Cube',
                    position: { x: 0, y: 0.5, z: 0 },
                    components: [{
                        __type__: 'MeshRenderer',
                        geometry: { __type__: 'CubeGeometry' },
                        material: {
                            __type__: 'StandardMaterial',
                            uniforms: { u_diffuse: { __type__: 'Color4', r: 0.9, g: 0.45, b: 0.2, a: 1 } },
                        },
                    }],
                },
            ],
        };

        const result = serialization.deserialize<typeof json>(json);

        expect(result.components).toHaveLength(1);
        expect(result.components[0].__type__).toBe('Scene');
        expect(result.components[0].ambientColor).toEqual({ __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 });
        expect(result.children).toHaveLength(1);
        expect(result.children[0].name).toBe('Cube');
        expect(result.children[0].position).toEqual({ x: 0, y: 0.5, z: 0 });
        expect(result.children[0].components[0].geometry).toEqual({ __type__: 'CubeGeometry' });
        expect(result.children[0].components[0].material.uniforms.u_diffuse.r).toBe(0.9);
    });

    it('反序列化结果与原 JSON 不共享可变引用', () =>
    {
        const json = { __type__: 'Object3D', name: 'root', position: { x: 1, y: 2, z: 3 } };
        const result = serialization.deserialize<typeof json>(json);

        result.position.x = 99;

        expect(json.position.x).toBe(1);
    });

    it('缺失字段不会凭空写入（保持数据干净，默认值交由 Logic 兜底）', () =>
    {
        const json: { __type__: string, name: string, position?: unknown } = { __type__: 'Object3D', name: 'root' };
        const result = serialization.deserialize<typeof json>(json);

        expect(result.name).toBe('root');
        expect('position' in result).toBe(false);
    });
});
