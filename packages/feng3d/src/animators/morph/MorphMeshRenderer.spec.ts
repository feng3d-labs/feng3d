import { describe, expect, it } from 'vitest';
import { logic } from '@feng3d/reactivity';
import type { RenderObject, RenderPipeline } from '@feng3d/webgpu';
import { standardVertexWGSL } from '../../materials/standardVertexShader';
import { MORPH_TARGET_COUNT } from '../../shaders/tsl/morph';
import type { CustomGeometry } from '../../geometry/CustomGeometry';
import type { Object3D } from '../../core/Object3D';
import '../../core/Object3D';
import './MorphMeshRenderer';
import type { MorphMeshRenderer, MorphMeshRendererLogic } from './MorphMeshRenderer';

/**
 * MorphMeshRenderer 的接线（不跑 GPU：只验 `beforeRender` 往 binding 里写了什么）。
 *
 * 关键不变量：delta 按 `targetIndex * vertexCount + vertexIndex` 排布、每项占一个 vec4；
 * 权重补齐到 `MORPH_TARGET_COUNT`；两者分别落在 storage buffer 与 uniform 两个 binding 上。
 */
describe('MorphMeshRenderer', () =>
{
    /** 造一个只带顶点着色器的渲染对象（材质管线的最小形态） */
    function makeRenderObject(wgsl: string): RenderObject
    {
        return {
            pipeline: { vertex: { wgsl }, fragment: { wgsl: '// fragment stub', targets: [{}] } } as RenderPipeline,
            bindingResources: {},
        } as RenderObject;
    }

    /** 造一个挂着 MorphMeshRenderer 的对象 */
    function makeMorphLogic(geometry: CustomGeometry, morphWeights: number[]): MorphMeshRendererLogic
    {
        const component: MorphMeshRenderer = { __type__: 'MorphMeshRenderer', geometry, morphWeights };
        const root = { __type__: 'Object3D', name: 'morph-root', components: [component] } as Object3D;

        logic(root);
        const componentLogic = logic(component) as MorphMeshRendererLogic;
        componentLogic.init(root);

        return componentLogic;
    }

    it('beforeRender 把 delta 写进 storage buffer、把补齐的权重写进 uniform', () =>
    {
        // 2 个顶点、2 个 target（每个 target 每顶点 3 个分量）
        const geometry = {
            __type__: 'CustomGeometry',
            positions: [0, 0, 0, 1, 0, 0],
            morphTargets: [[0.1, 0.2, 0.3, 0.4, 0.5, 0.6], [1, 2, 3, 4, 5, 6]],
        } as unknown as CustomGeometry;
        const componentLogic = makeMorphLogic(geometry, [0.25, 0.75]);
        const renderObject = makeRenderObject(standardVertexWGSL);

        componentLogic.beforeRender(renderObject);

        const storage = renderObject.bindingResources!.u_morphPositions as { bufferView: Float32Array };
        const positions = storage.bufferView;

        expect(positions).toBeInstanceOf(Float32Array);
        // 槽位总数 = MORPH_TARGET_COUNT × 顶点数 × 4（每顶点一个 vec4）
        expect(positions.length).toBe(MORPH_TARGET_COUNT * 2 * 4);
        // 第 0 个 target 的第 1 个顶点 → 第 4..6 位
        expect(positions[4]).toBeCloseTo(0.4, 6);
        expect(positions[5]).toBeCloseTo(0.5, 6);
        expect(positions[6]).toBeCloseTo(0.6, 6);
        // 第 1 个 target 从第 vertexCount 行之后开始（1 * 2 * 4 = 8）——
        // 与着色器的 `i * vertexCount + vertexIndex` 同一口径
        expect(positions[8]).toBeCloseTo(1, 6);
        expect(positions[9]).toBeCloseTo(2, 6);

        const uniforms = (renderObject.bindingResources!.morph as { value: { u_morphWeights: Float32Array; u_morphVertexCount: number } }).value;

        expect(uniforms.u_morphWeights).toBeInstanceOf(Float32Array);
        expect(uniforms.u_morphWeights.length).toBe(MORPH_TARGET_COUNT);
        expect(uniforms.u_morphWeights[0]).toBeCloseTo(0.25, 6);
        expect(uniforms.u_morphWeights[1]).toBeCloseTo(0.75, 6);
        // 未提供的槽位补 0（不是 undefined / NaN）
        expect(uniforms.u_morphWeights[MORPH_TARGET_COUNT - 1]).toBe(0);
        expect(uniforms.u_morphVertexCount).toBe(2);
    });

    it('标准材质管线换成 morph 顶点着色器，同一材质管线复用同一换装结果', () =>
    {
        const geometry = {
            __type__: 'CustomGeometry',
            positions: [0, 0, 0, 1, 0, 0],
            morphTargets: [[1, 1, 1, 1, 1, 1]],
        } as unknown as CustomGeometry;
        const componentLogic = makeMorphLogic(geometry, [1]);

        const first = makeRenderObject(standardVertexWGSL);
        const second = makeRenderObject(standardVertexWGSL);

        componentLogic.beforeRender(first);
        componentLogic.beforeRender(second);

        // 两个渲染对象各自被换装成 morph 变体（与标准版不同）
        expect(first.pipeline!.vertex!.wgsl).not.toBe(standardVertexWGSL);
        expect(second.pipeline!.vertex!.wgsl).toBe(first.pipeline!.vertex!.wgsl);
    });
});
