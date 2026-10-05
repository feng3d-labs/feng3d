import { describe, expect, it } from 'vitest';
import { getNormalShaderWGSL } from './normalMaterial';

/**
 * NormalMaterial 的 TSL 着色器生成验收。
 *
 * 这是「手写 WGSL → TSL」迁移的**离线**验收：断言生成结果包含迁移前手写版本的全部
 * 结构约定（attribute location、结构体 uniform 的 group/binding、varying、法线→RGB 公式）。
 * 视觉回归（examples 的 e2e）另行人工执行——本机 3000 端口会被编辑器 dev server 占用。
 */
describe('NormalMaterial 的 TSL 着色器', () =>
{
    const { vertex, fragment } = getNormalShaderWGSL();

    it('顶点着色器保留 attributes 的 location 约定', () =>
    {
        expect(vertex).toContain('@location(0) a_position: vec3<f32>');
        expect(vertex).toContain('@location(1) a_normal: vec3<f32>');
    });

    it('顶点着色器声明与手写版本同槽位的结构体 uniform', () =>
    {
        expect(vertex).toContain('u_modelMatrix: mat4x4<f32>');
        expect(vertex).toContain('u_ITModelMatrix: mat4x4<f32>');
        expect(vertex).toContain('@group(0) @binding(0) var<uniform> transform: TransformUniforms;');
        expect(vertex).toContain('@group(0) @binding(1) var<uniform> cameraUniforms: CameraUniforms;');
    });

    it('顶点着色器做 modelMatrix → viewProjection 变换并输出世界法线', () =>
    {
        expect(vertex).toContain('transform.u_modelMatrix * vec4<f32>(a_position, 1.0)');
        expect(vertex).toContain('cameraUniforms.u_viewProjection *');
        expect(vertex).toContain('transform.u_ITModelMatrix * vec4<f32>(a_normal, 0.0)');
        expect(vertex).toContain('@builtin(position) position: vec4<f32>');
        expect(vertex).toContain('@location(0) worldNormal: vec3<f32>');
    });

    it('片元着色器把法线从 [-1,1] 映射到 [0,1]', () =>
    {
        expect(fragment).toContain('@fragment');
        expect(fragment).toContain('normalize(input.worldNormal) * 0.5 + vec3<f32>(0.5)');
        expect(fragment).toContain('-> @location(0) vec4<f32>');
    });

    it('同一份结果被缓存（多次调用返回同一对象）', () =>
    {
        expect(getNormalShaderWGSL()).toBe(getNormalShaderWGSL());
    });
});
