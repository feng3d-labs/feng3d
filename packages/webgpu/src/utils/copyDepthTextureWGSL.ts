import { arrayWithValues, assign, builtin, fragment, gl_Position, let_, return_, sampledDepthTexture, texture, uint, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type Vec4Value = ReturnType<typeof vec4>;

/**
 * 拷贝深度纹理到普通纹理所用的着色器（TSL 构建，懒加载缓存）。
 *
 * 与手写 WGSL 的差异说明（**语义一致**）：
 * - TSL 的 sampler 展开是 `mySampler_texture`（texture_depth_2d，binding 0）+ `mySampler`（sampler，binding 1），
 *   手写则是 sampler@0 + texture@1——**绑定点位顺序相反**，因此本文件的 bindGroupLayout / bindGroup 按 TSL 的顺序写；
 * - 手写是"一个 module 两个入口"，TSL 生成的是两份文本，这里用两个 shader module
 *   （WebGPU 允许 vertex / fragment 用不同 module）。
 */
let cached: { vertex: string; fragment: string } | null = null;

/**
 * 获取拷贝深度纹理所需的 vertex / fragment WGSL。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getCopyDepthTextureWGSL(): { vertex: string; fragment: string }
{
    if (cached === null)
    {
        const vertexIndex = uint(builtin('gl_VertexID'));
        const positions = arrayWithValues(vec2, [
            vec2(-1.0, 1.0), vec2(1.0, 1.0), vec2(-1.0, -1.0), vec2(1.0, -1.0),
        ]);
        const texcoords = arrayWithValues(vec2, [
            vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(0.0, 1.0), vec2(1.0, 1.0),
        ]);

        // varying 必须在每个 stage 各自的回调内创建
        const vout_uv = vec2(varying('vUV', 0));

        const vertexShader = vertex('vsmain', () =>
        {
            vout_uv.assign(texcoords.index(vertexIndex) as Vec2Value);
            gl_Position.assign(vec4(positions.index(vertexIndex) as Vec2Value, 0.0, 1.0) as Vec4Value);
        });

        const vin_uv = vec2(varying('vUV', 0));
        // 带 sampler 的深度纹理：展开为 mySampler_texture（texture_depth_2d）+ mySampler（sampler）
        const mySampler = sampledDepthTexture(uniform('mySampler', 0, 0));

        const fragmentShader = fragment('fsmain', () =>
        {
            // 手写：var color = textureSample(...)（f32）；这里取 .x（等价）
            const color = let_('color', texture(mySampler, vin_uv) as Vec4Value) as Vec4Value;

            return_(vec4(color.x, color.x, color.x, 1.0) as Vec4Value);
        });

        cached = { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
    }

    return cached;
}
