import { describe, expect, it } from 'vitest';

// 必须最先：在任何 @feng3d/webgpu 间接导入之前 stub 全局
import '../../test/webgpu-stub';

import { logic } from '@feng3d/reactivity';
import { WgslReflect } from 'wgsl_reflect';

// 触发 registerLogic 注册（否则 logic() 返回 null）
import '../../core/Object3D';
import '../../materials/StandardMaterial';
import './SkinnedMeshRenderer';
import { standardSkinnedVertexWGSL, standardVertexWGSL } from '../../materials/standardVertexShader';
import { SKIN_MATRIX_COUNT } from '../../shaders/modules/skeleton.wgsl';

import type { Object3D } from '../../core/Object3D';
import type { RenderObject, RenderPipeline } from '@feng3d/webgpu';
import type { SkinnedMeshRenderer, SkinnedMeshRendererLogic } from './SkinnedMeshRenderer';

/**
 * issue #337：WGSL 蒙皮。
 *
 * 两段验收都在**离线**完成：① WGSL 结构用 `wgsl_reflect` 解析（顶点输入 location、uniform 绑定、
 * 固定数组长度）；② `SkinnedMeshRendererLogic.beforeRender` 的行为（矩阵补齐、管线换装、引用稳定）。
 * 真实 GPU 画面验证在 examples/e2e 侧做，见 PR 正文。
 */

describe('WGSL 蒙皮结构（issue #337）', () =>
{
    it('蒙皮顶点着色器被反射识别出两组骨骼顶点属性（location 5–8）', () =>
    {
        const reflect = new WgslReflect(standardSkinnedVertexWGSL);
        const main = reflect.entry.vertex[0];
        const names = main.inputs.map((input) => input.name);

        expect(names).toEqual(expect.arrayContaining([
            'a_position', 'a_normal', 'a_tangent', 'a_uv', 'a_color',
            'a_skinIndices', 'a_skinWeights', 'a_skinIndices1', 'a_skinWeights1',
        ]));

        const skinLocations = main.inputs
            .filter((input) => input.name.startsWith('a_skin'))
            .map((input) => input.location)
            .sort();

        expect(skinLocations).toEqual([5, 6, 7, 8]);
        // 注意：属性数（9）不等于顶点缓冲数——缓冲按"属性数据对象"分组，4 个蒙皮属性共享同一个
        // 交错 data，真实缓冲数由 skinningVertexLayout.spec.ts 用 WGPUVertexBufferLayout 验证。
    });

    it('蒙皮 uniform 声明为 group(3) binding(0)，数组长度与数据侧常量一致', () =>
    {
        expect(standardSkinnedVertexWGSL).toContain(`array<mat4x4<f32>, ${SKIN_MATRIX_COUNT}>`);
        expect(standardSkinnedVertexWGSL).toContain('@group(3) @binding(0) var<uniform> skinned: SkinnedUniforms;');
        expect(standardSkinnedVertexWGSL).toContain('fn skinPosition(');
        // 两组骨骼都参与加权（每顶点最多 8 根）
        expect(standardSkinnedVertexWGSL).toContain('skinIndices1: vec4<f32>');
        expect(standardSkinnedVertexWGSL).toContain('skinWeights1[i]');
    });

    it('非蒙皮顶点着色器不含任何骨骼内容（未蒙皮路径不受影响）', () =>
    {
        expect(standardVertexWGSL).not.toContain('a_skin');
        expect(standardVertexWGSL).not.toContain('skinned');
        expect(standardVertexWGSL).not.toContain('skinPosition');
    });
});

describe('SkinnedMeshRendererLogic.beforeRender（issue #337）', () =>
{
    /** 造一个只带顶点着色器的渲染对象（材质管线的最小形态） */
    function makeRenderObject(wgsl: string): RenderObject
    {
        return {
            pipeline: { vertex: { wgsl }, fragment: { wgsl: '// fragment stub', targets: [{}] } } as RenderPipeline,
            bindingResources: {},
        } as RenderObject;
    }

    /** 造一个挂了 SkinnedMeshRenderer 的对象（无 Skeleton → 走单位矩阵兜底分支） */
    function makeSkinLogic(): SkinnedMeshRendererLogic
    {
        const component: SkinnedMeshRenderer = { __type__: 'SkinnedMeshRenderer' };
        const root = { __type__: 'Object3D', name: 'skin-root', components: [component] } as Object3D;

        logic(root);
        const componentLogic = logic(component) as SkinnedMeshRendererLogic;
        // RenderableLogic.init 接收 Object3D（不是 ComponentLogicBase 的 Entity）
        componentLogic.init(root);

        return componentLogic;
    }

    it('写入 skinned 绑定，并把骨骼矩阵补齐到固定槽位数', () =>
    {
        const componentLogic = makeSkinLogic();
        const renderObject = makeRenderObject(standardVertexWGSL);

        componentLogic.beforeRender(renderObject);

        const value = renderObject.bindingResources!.skinned!.value as { u_skeletonGlobalMatriices?: unknown[] };

        expect(value.u_skeletonGlobalMatriices).toHaveLength(SKIN_MATRIX_COUNT);
    });

    it('标准材质管线换成蒙皮顶点着色器，同一材质管线复用同一换装结果（保 GPU 管线缓存命中）', () =>
    {
        const componentLogic = makeSkinLogic();
        // 同一个材质管线对象被两个渲染对象共享（现实里多个网格共用一个材质的形态）
        const source: RenderPipeline = {
            vertex: { wgsl: standardVertexWGSL },
            fragment: { wgsl: '// fragment stub', targets: [{}] },
        };
        const first = { pipeline: source, bindingResources: {} } as RenderObject;
        const second = { pipeline: source, bindingResources: {} } as RenderObject;

        componentLogic.beforeRender(first);
        componentLogic.beforeRender(second);

        expect(first.pipeline.vertex.wgsl).toBe(standardSkinnedVertexWGSL);
        expect(second.pipeline).toBe(first.pipeline);
    });

    it('非标准材质管线不换装（暂无蒙皮变体，留作欠账）', () =>
    {
        const componentLogic = makeSkinLogic();
        const renderObject = makeRenderObject('// other vertex shader');

        componentLogic.beforeRender(renderObject);

        expect(renderObject.pipeline.vertex.wgsl).toBe('// other vertex shader');
    });
});
