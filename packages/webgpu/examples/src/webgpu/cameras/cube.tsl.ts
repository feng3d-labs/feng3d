/**
 * cameras 示例的立方体着色器（原 `cube.wgsl` 的 TSL 版，含 vertex 与 fragment 两个入口）。
 *
 * 对照手写：
 * ```wgsl
 * struct Uniforms { modelViewProjectionMatrix : mat4x4f }
 * @group(0) @binding(0) var<uniform> uniforms : Uniforms;
 * @group(0) @binding(1) var mySampler: sampler;
 * @group(0) @binding(2) var myTexture: texture_2d<f32>;
 * @vertex fn vertex_main(@location(0) position: vec4f, @location(1) uv: vec2f) -> VertexOutput {
 *     return VertexOutput(uniforms.modelViewProjectionMatrix * position, uv);
 * }
 * @fragment fn fragment_main(@location(0) fragUV: vec2f) -> @location(0) vec4f {
 *     return textureSample(myTexture, mySampler, fragUV);
 * }
 * ```
 *
 * **采样器展开顺序与手写相反**（TSL：texture 在 binding 1、sampler 在 2），数据侧已跟着改。
 */
import { attribute, fragment, gl_Position, mat4, return_, sampler2D, struct, texture2D, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存 */
let cached: { vertex: string; fragment: string } | null = null;

/**
 * 获取立方体着色器的 vertex / fragment WGSL。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getCamerasCubeWGSL(): { vertex: string; fragment: string }
{
    if (cached === null)
    {
        const Uniforms = struct('Uniforms', { modelViewProjectionMatrix: mat4 });
        const uniforms = Uniforms(uniform('uniforms', 0, 0)) as unknown as { modelViewProjectionMatrix: ReturnType<typeof mat4> };
        const myTexture = sampler2D(uniform('myTexture', 0, 1));

        const a_position = vec4(attribute('position', 0));
        const a_uv = vec2(attribute('uv', 1));
        const v_fragUV = vec2(varying('fragUV', 0));

        const vertexShader = vertex('vertex_main', () =>
        {
            gl_Position.assign(uniforms.modelViewProjectionMatrix.multiply(a_position) as Vec4Value);
            v_fragUV.assign(a_uv as Vec2Value);
        });

        const fragmentShader = fragment('fragment_main', () =>
        {
            return_(texture2D(myTexture, v_fragUV) as Vec4Value);
        });

        cached = { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
    }

    return cached;
}
