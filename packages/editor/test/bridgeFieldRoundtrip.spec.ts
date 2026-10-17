import { describe, expect, it } from 'vitest';
import { isReadDefaultField, resolvePath } from '../src/bridge/write/writePure';

/**
 * 读写路径的往返一致性（issue #931）。
 *
 * `scene.get` 为可读性做了两件事：把组件参数包进 `params`、用 Logic 默认值补 `activeSelf`。
 * 而 `scene.set` 原先只认数据里真实存在、且不带 `params` 层的字段——于是"照着 get 的结果
 * 拼 set 路径"必然失败。这里钉住写侧对这两种形态的兼容。
 */
describe('resolvePath：兼容 scene.get 的组件 params 包装（#931）', () =>
{
    const component = { __type__: 'DirectionalLight', shadowBias: 0.003, color: { __type__: 'Color3', r: 1 } };
    const object = { __type__: 'Object3D', name: 'Light', components: [component] };

    it('带 params 的路径能落到组件字段上', () =>
    {
        const { holder, key } = resolvePath(object, 'components[0].params.shadowBias');

        expect(holder).toBe(component);
        expect(key).toBe('shadowBias');
    });

    it('不带 params 的路径仍然可用（文档示例形态）', () =>
    {
        const { holder, key } = resolvePath(object, 'components[0].shadowBias');

        expect(holder).toBe(component);
        expect(key).toBe('shadowBias');
    });

    it('params 之后的嵌套字段也走得通', () =>
    {
        const { holder, key } = resolvePath(object, 'components[0].params.color.r');

        expect(holder).toBe(component.color);
        expect(key).toBe('r');
    });

    it('没有 __type__ 的普通对象上，params 仍然报错（不放过拼错）', () =>
    {
        expect(() => resolvePath({ a: 1 }, 'params.a')).toThrow(/找不到 params/);
    });

    it('有意接受的边界：带 __type__ 的对象一律把 params 当包装层', () =>
    {
        // `params` 是 scene.get 的专用包装名，数据里不应出现同名字段；
        // 用"是不是组件"做判据反而更脆（组件没有稳定的结构特征）
        const { key } = resolvePath({ __type__: 'X', a: 1 }, 'params.a');

        expect(key).toBe('a');
    });
});

describe('isReadDefaultField：读侧补默认值的字段（#931）', () =>
{
    it('activeSelf 属于该类字段（scene.get 总报 true）', () =>
    {
        expect(isReadDefaultField('activeSelf')).toBe(true);
    });

    it('普通字段不属于：缺了就该报错，不能被静默新增', () =>
    {
        expect(isReadDefaultField('postion')).toBe(false);
        expect(isReadDefaultField('position')).toBe(false);
        expect(isReadDefaultField('tag')).toBe(false);
    });
});
