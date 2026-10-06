import { describe, expect, it } from 'vitest';
import { getSolidColorFragmentWGSL, getSolidColorVertexWGSL } from '../test_web/solidColorShaders.tsl';

/**
 * `test_web/depth-attachment-canvas-readpixels` 的着色器（TSL 版）离线验收。
 *
 * 说明：该页面依赖主仓不存在的 `@feng3d/render-api`（#715），**页面本身跑不起来**，
 * 所以这里只能做「生成文本与原手写逐条对应」的离线验收。
 */
describe('test_web 实心色三角形的着色器（TSL）', () =>
{
    const vertex = getSolidColorVertexWGSL();
    const fragment = getSolidColorFragmentWGSL();

    it('vertex：位置属性 location 0，直接输出 vec4(position, 1.0)', () =>
    {
        expect(vertex).toContain('@location(0) position: vec3<f32>');
        expect(vertex).toContain('@builtin(position) position: vec4<f32>');
        expect(vertex).toContain('output.position = vec4<f32>(position, 1.0);');
    });

    it('fragment：color uniform 在 binding 0 / group 0，返回就是 color', () =>
    {
        expect(fragment).toContain('@binding(0) @group(0) var<uniform> color : vec4<f32>;');
        expect(fragment).toContain('fn main() -> @location(0) vec4<f32>');
        expect(fragment).toContain('return color;');
    });

    it('两个三角形共用同一对着色器（页面里两处 code 完全一致）', () =>
    {
        // 生成函数带缓存：两次调用返回同一字符串
        expect(getSolidColorVertexWGSL()).toBe(vertex);
        expect(getSolidColorFragmentWGSL()).toBe(fragment);
    });
});
