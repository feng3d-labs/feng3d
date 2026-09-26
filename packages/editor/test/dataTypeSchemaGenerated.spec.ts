import { describe, expect, it } from 'vitest';
import { DATA_TYPE_SCHEMA } from '../src/vue-app/objectview/generated/dataTypeSchema';

/**
 * 生成的字段描述表的**不变量**（issue #147）。
 *
 * `scripts/gen-objectview-schema.mjs --check` 保证"产物与源码一致"，但那句话只在
 * 生成器**判据写对**时才成立：判据一旦退化（比如又把 `boolean` 判成 `Default`），
 * 重跑生成仍然自洽，面板却悄悄变差。所以这里直接钉几条来自真实接口的期望。
 */
describe('生成的字段描述表', () =>
{
    it('覆盖了主要组件类型（防止扫描判据退化成一个都扫不到）', () =>
    {
        const names = Object.keys(DATA_TYPE_SCHEMA);
        expect(names.length).toBeGreaterThanOrEqual(50);
        for (const required of ['MeshRenderer', 'PerspectiveCamera', 'StandardMaterial', 'Scene', 'CubeGeometry'])
        {
            expect(names).toContain(required);
        }
    });

    it('不包含 __type__ 字段（它是判别字段，不是可编辑数据）', () =>
    {
        const offenders: string[] = [];
        for (const [typeName, fields] of Object.entries(DATA_TYPE_SCHEMA))
        {
            for (const field of fields)
            {
                if (field.name === '__type__') offenders.push(typeName);
            }
        }
        expect(offenders).toEqual([]);
    });

    it('控件种类都在已知集合里（拼错会让面板静默退化成默认视图）', () =>
    {
        const known = new Set([
            'number', 'Boolean', 'String', 'Vector2', 'Vector3', 'Vector4',
            'Color3', 'Color4', 'Array', 'Enum', 'Object', 'Default',
            // `Object3D.components` 专用：按组件逐个渲染属性视图（OAVComponentList）
            'Components',
        ]);
        const unknown: string[] = [];
        for (const [typeName, fields] of Object.entries(DATA_TYPE_SCHEMA))
        {
            for (const field of fields)
            {
                if (!known.has(field.control)) unknown.push(`${typeName}.${field.name}=${field.control}`);
            }
        }
        expect(unknown).toEqual([]);
    });

    it('MeshRenderer：几何与材质是带候选类型名的嵌套对象，布尔字段是 Boolean', () =>
    {
        const fields = Object.fromEntries(DATA_TYPE_SCHEMA.MeshRenderer.map((f) => [f.name, f]));

        expect(fields.geometry.control).toBe('Object');
        expect(fields.geometry.typeNames).toContain('CubeGeometry');
        expect(fields.geometry.typeNames).toContain('SphereGeometry');
        expect(fields.material.control).toBe('Object');
        expect(fields.material.typeNames).toContain('StandardMaterial');

        // 回归：`castShadows?: boolean` 的可选性在符号标志上，早先的字符串比较 + 「有属性即对象」
        // 把它判成了 Default（当时 88 个字段都错）
        expect(fields.castShadows.control).toBe('Boolean');
        expect(fields.receiveShadows.control).toBe('Boolean');
    });

    it('PerspectiveCamera：四个数值参数是 number', () =>
    {
        const fields = Object.fromEntries(DATA_TYPE_SCHEMA.PerspectiveCamera.map((f) => [f.name, f]));

        for (const name of ['fov', 'aspect', 'near', 'far'])
        {
            expect(fields[name].control).toBe('number');
        }
    });

    it('Scene：颜色字段是 Color4', () =>
    {
        const fields = Object.fromEntries(DATA_TYPE_SCHEMA.Scene.map((f) => [f.name, f]));

        expect(fields.background.control).toBe('Color4');
        expect(fields.ambientColor.control).toBe('Color4');
    });

    it('StandardMaterial：字符串字面量联合是带候选值的 Enum', () =>
    {
        const fields = Object.fromEntries(DATA_TYPE_SCHEMA.StandardMaterial.map((f) => [f.name, f]));

        expect(fields.cullFace.control).toBe('Enum');
        expect(fields.cullFace.values).toEqual(['back', 'front', 'none']);
    });

    it('数组字段带元素控件种类（`readonly T[]` 会丢掉 readonly，判据要认 T[]）', () =>
    {
        const animation = Object.fromEntries(DATA_TYPE_SCHEMA.Animation.map((f) => [f.name, f]));

        expect(animation.animations.control).toBe('Array');
        expect(animation.animations.itemControl).toBe('Object');
    });

    it('Object3D.components 用组件列表控件（否则组件的字段视图永远不会被渲染）', () =>
    {
        const fields = Object.fromEntries(DATA_TYPE_SCHEMA.Object3D.map((f) => [f.name, f]));

        // 通用数组控件只会把组件显示成一串看不懂的对象；
        // 这个字段的语义是"这个对象挂了哪些组件"，要按组件逐个渲染属性视图
        expect(fields.components.control).toBe('Components');
        expect(fields.children.control).toBe('Array');
    });

    it('Object3D 的 position/rotation/scale 是 Vector3（内联字面量形状也能识别）', () =>
    {
        const fields = Object.fromEntries(DATA_TYPE_SCHEMA.Object3D.map((f) => [f.name, f]));

        expect(fields.position.control).toBe('Vector3');
        expect(fields.rotation.control).toBe('Vector3');
        expect(fields.scale.control).toBe('Vector3');
    });

    it('纯数据接口的字段在类型上都是 readonly，但不影响面板可编辑（写入走响应式代理）', () =>
    {
        const fields = DATA_TYPE_SCHEMA.MeshRenderer;
        const geometry = fields.find((f) => f.name === 'geometry');

        expect(geometry?.readonly).toBe(true);
    });
});
