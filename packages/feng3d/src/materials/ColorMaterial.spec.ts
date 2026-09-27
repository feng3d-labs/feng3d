import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { logic, reactive } from '@feng3d/reactivity';
import type { RenderObject } from '@feng3d/webgpu';
import './ColorMaterial';
import type { ColorMaterial } from './ColorMaterial';
import type { MaterialLogic } from './Material';

/**
 * ColorMaterialLogic 的 uniform 与渲染状态派生单测。
 *
 * 覆盖「纯数据 → renderObject」这段最容易静默出错的地方：
 * uniform 缺字段时 GPU 侧恒为 0（画面全黑却没有任何报错），
 * 所以这里把「兜底默认值」和「beforeRender 真的写进去了」都钉住。
 *
 * 不需要 GPU 设备：beforeRender 只往 renderObject 这个纯数据对象上写。
 */
describe('ColorMaterialLogic', () =>
{
    /** 直接对一个 material 数据对象取 logic */
    function mount(material: Record<string, unknown>): MaterialLogic
    {
        const mat = { __type__: 'ColorMaterial', ...material } as unknown as ColorMaterial;

        return logic(mat) as MaterialLogic;
    }

    /** 取出 beforeRender 写进 renderObject 的 material_uniforms */
    function uniformsOf(l: MaterialLogic): Record<string, unknown>
    {
        const renderObject = {} as RenderObject;

        l.beforeRender(renderObject);

        const bindingResources = renderObject.bindingResources as unknown as Record<string, { value: Record<string, unknown> }>;

        return bindingResources.material_uniforms.value;
    }

    it('未声明 uniforms 时 u_diffuseInput 兜底为白色（缺字段会让 GPU 侧恒为 0）', () =>
    {
        const unified = uniformsOf(mount({}));

        expect(unified.u_diffuseInput).toEqual({ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 });
    });

    it('声明了 uniforms 时按声明值写入', () =>
    {
        const unified = uniformsOf(mount({
            uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.2, g: 0.4, b: 0.6, a: 1 } },
        }));

        expect(unified.u_diffuseInput).toEqual({ __type__: 'Color4', r: 0.2, g: 0.4, b: 0.6, a: 1 });
    });

    it('beforeRender 同时写入 pipeline 与 material_uniforms', () =>
    {
        const l = mount({});
        const renderObject = {} as RenderObject;

        l.beforeRender(renderObject);

        expect(renderObject.pipeline).toBeDefined();
        expect(renderObject.bindingResources?.material_uniforms).toBeDefined();
    });

    it('修改纯数据 uniforms 后 beforeRender 反映新值（响应式）', () =>
    {
        const mat = {
            __type__: 'ColorMaterial',
            uniforms: { u_diffuseInput: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
        } as unknown as ColorMaterial;

        const l = logic(mat) as MaterialLogic;

        expect(uniformsOf(l).u_diffuseInput).toMatchObject({ r: 1 });

        reactive((mat as { uniforms: { u_diffuseInput: { r: number } } }).uniforms.u_diffuseInput).r = 0.25;

        expect(uniformsOf(l).u_diffuseInput).toMatchObject({ r: 0.25 });
    });

    it('renderPipeline 的着色器同时声明 transform 与相机 uniform（缺一个就编译失败）', () =>
    {
        const l = mount({});
        const renderObject = {} as RenderObject;

        l.beforeRender(renderObject);

        const pipeline = renderObject.pipeline as unknown as { vertex: { wgsl: string } };

        expect(pipeline.vertex.wgsl).toContain('transform.u_modelMatrix');
        expect(pipeline.vertex.wgsl).toContain('cameraUniforms.u_viewProjection');
    });
});
