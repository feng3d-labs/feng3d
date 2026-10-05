/**
 * cubemap 示例的立方体纹理采样片元着色器（原 `sampleCubemap.frag.wgsl` 的 TSL 版）。
 *
 * 对照手写：
 * ```wgsl
 * @group(0) @binding(1) var mySampler: sampler;
 * @group(0) @binding(2) var myTexture: texture_cube<f32>;
 * @fragment fn main(@location(0) fragUV: vec2<f32>, @location(1) fragPosition: vec4<f32>) -> @location(0) vec4<f32> {
 *     var cubemapVec = fragPosition.xyz - vec3(0.5);
 *     return textureSample(myTexture, mySampler, cubemapVec);
 * }
 * ```
 *
 * **采样器展开顺序与手写相反**（TSL：texture 在 binding、sampler 在 binding+1），
 * 所以数据侧也跟着改了（见 cubemap/index.ts）。
 */
import { fragment, let_, return_, samplerCube, texture, uniform, varying, vec3, vec4 } from '@feng3d/tsl';

type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取片元着色器的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getCubemapSampleCubemapWGSL(): string
{
    if (cached === null)
    {
        const myTexture = samplerCube(uniform('myTexture', 0, 1));
        // 手写声明了 fragUV 但没用；这里只取用得上的 fragPosition
        const v_fragPosition = vec4(varying('fragPosition', 1));

        cached = fragment('main', () =>
        {
            const cubemapVec = let_('cubemapVec', (v_fragPosition.xyz as Vec3Value).subtract(vec3(0.5, 0.5, 0.5)) as Vec3Value);

            return_(texture(myTexture, cubemapVec) as Vec4Value);
        }).toWGSL();
    }

    return cached;
}
