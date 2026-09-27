import { describe, expect, it } from 'vitest';
// 副作用导入：校验要查的是**引擎的 logic 注册表**（`isLogicRegistered`），
// 不导入 feng3d 时注册表是空的——那样"已注册的类型"会被误判成没注册
import 'feng3d';
import { assertDeclaredRenderableField } from '../src/bridge/write/writePure';

/**
 * 写时校验：`geometry` / `material` 这类"按 `__type__` 分发 logic"的字段必须声明得能被引擎认出来。
 *
 * 这些字段填错不会当场失败，而是让对象进入"渲染与拾取都挂掉、控制台只剩一句
 * `未注册的 __type__ 'undefined'`"的状态（实测：`scene.bounds` 抛
 * `Cannot read properties of null (reading 'bounding')`）。所以校验放在写入口，
 * 让错误在**写入之前**以可照着修的形式返回。
 */
describe('assertDeclaredRenderableField', () =>
{
    const where = 'components[0]（MeshRenderer）';

    it('放行缺省与 null（引擎侧回退默认几何体/材质）', () =>
    {
        expect(() => assertDeclaredRenderableField(undefined, 'geometry', where)).not.toThrow();
        expect(() => assertDeclaredRenderableField(null, 'geometry', where)).not.toThrow();
        expect(() => assertDeclaredRenderableField(null, 'material', where)).not.toThrow();
    });

    it('放行已注册的 __type__', () =>
    {
        expect(() => assertDeclaredRenderableField({ __type__: 'CubeGeometry' }, 'geometry', where)).not.toThrow();
        expect(() => assertDeclaredRenderableField({ __type__: 'StandardMaterial' }, 'material', where)).not.toThrow();
    });

    it('放行旧格式（无 __type__ 但有已注册的 __class__）——引擎侧会就地兼容', () =>
    {
        expect(() => assertDeclaredRenderableField(
            { assetId: 'Plane', __class__: 'PlaneGeometry' }, 'geometry', where)).not.toThrow();
    });

    it('拒绝缺 __type__，并指出字段、对象键与错误来源', () =>
    {
        expect(() => assertDeclaredRenderableField({ width: 1, height: 1 }, 'geometry', where))
            .toThrow(/components\[0\]（MeshRenderer） 的 geometry 数据不合法：缺少 __type__（该对象的键：width, height）/);
    });

    it('拒绝 __type__ 拼错的类型名（而不是留到运行期才报）', () =>
    {
        expect(() => assertDeclaredRenderableField({ __type__: 'CubeGeometory', width: 1 }, 'geometry', where))
            .toThrow(/__type__ 'CubeGeometory' 没有注册/);
    });

    it('拒绝非对象（字符串/数字会被当成字段值写进场景）', () =>
    {
        expect(() => assertDeclaredRenderableField('CubeGeometry', 'geometry', where))
            .toThrow(/需要是纯数据对象.*"CubeGeometry"/);
    });

    it('空对象给出"空对象"而不是空白提示', () =>
    {
        expect(() => assertDeclaredRenderableField({}, 'material', where)).toThrow(/该对象的键：\(空对象\)/);
    });

    it('判据是字段值自身，不是字段名——material 走同一条规则', () =>
    {
        expect(() => assertDeclaredRenderableField({ uniforms: {} }, 'material', where))
            .toThrow(/的 material 数据不合法/);
    });
});
