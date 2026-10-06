import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { logic, reactive } from '@feng3d/reactivity';
import type { RenderObject } from '@feng3d/webgpu';
import './ProjectedShadowMaterial';
import type { ProjectedShadowMaterial } from './ProjectedShadowMaterial';
import type { MaterialLogic } from './Material';

/**
 * ProjectedShadowMaterialLogic 的渲染状态与 uniform 单测。
 *
 * 复刻 three.js ShadowMesh 的关键在渲染状态而不只是颜色：
 * 半透明混合 + 不写深度 + 模板测试（同一像素只混合一次），
 * 任何一项写错都会表现为「阴影过黑 / 互相遮挡 / 重复加深」。
 */
describe('ProjectedShadowMaterialLogic', () =>
{
    /** 直接对一个 material 数据对象取 logic */
    function mount(material: Record<string, unknown>): MaterialLogic
    {
        const mat = { __type__: 'ProjectedShadowMaterial', ...material } as unknown as ProjectedShadowMaterial;

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

    /** 取出 beforeRender 写进 renderObject 的 pipeline */
    function pipelineOf(l: MaterialLogic): Record<string, unknown>
    {
        const renderObject = {} as RenderObject;

        l.beforeRender(renderObject);

        return renderObject.pipeline as unknown as Record<string, unknown>;
    }

    it('未声明 uniforms 时补齐默认值（单位投影矩阵 / 黑 / 0.6）', () =>
    {
        const uniforms = uniformsOf(mount({}));

        expect(uniforms.u_shadowMatrix).toEqual({
            __type__: 'Matrix4x4',
            elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        });
        expect(uniforms.u_color).toEqual({ __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 });
        expect(uniforms.u_opacity).toBe(0.6);
    });

    it('声明了 uniforms 时按声明值写入', () =>
    {
        const matrix = { __type__: 'Matrix4x4', elements: new Array(16).fill(0) };
        const uniforms = uniformsOf(mount({
            uniforms: { u_shadowMatrix: matrix, u_color: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 }, u_opacity: 0.25 },
        }));

        // reactive 代理会让对象身份变化（经 proxy 读回），故按值比较
        expect(uniforms.u_shadowMatrix).toEqual(matrix);
        expect(uniforms.u_color).toEqual({ __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 });
        expect(uniforms.u_opacity).toBe(0.25);
    });

    it('管线状态复刻 three ShadowMesh：半透明混合 + 不写深度 + 模板只增不减', () =>
    {
        const pipeline = pipelineOf(mount({}));
        const fragment = pipeline.fragment as { targets: { blend: Record<string, unknown> }[] };
        const depthStencil = pipeline.depthStencil as Record<string, unknown>;

        expect(fragment.targets[0]!.blend).toEqual({
            color: { operation: 'add', srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
            alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
        });
        expect(depthStencil.depthWriteEnabled).toBe(false);
        expect(depthStencil.stencilReference).toBe(0);
        expect(depthStencil.stencilFront).toEqual({ compare: 'equal', failOp: 'keep', depthFailOp: 'keep', passOp: 'increment-clamp' });
        expect(depthStencil.stencilBack).toEqual({ compare: 'equal', failOp: 'keep', depthFailOp: 'keep', passOp: 'increment-clamp' });
    });

    it('恒为透明材质（进入透明队列且不参与实时阴影投射）', () =>
    {
        expect(mount({}).isTransparent).toBe(true);
    });

    it('修改纯数据 uniforms 后 beforeRender 反映新值（响应式）', () =>
    {
        const mat = { __type__: 'ProjectedShadowMaterial', uniforms: { u_opacity: 0.6 } } as unknown as ProjectedShadowMaterial;
        const l = logic(mat) as MaterialLogic;

        expect(uniformsOf(l).u_opacity).toBe(0.6);

        reactive((mat as { uniforms: { u_opacity: number } }).uniforms).u_opacity = 0.2;

        expect(uniformsOf(l).u_opacity).toBe(0.2);
    });
});
