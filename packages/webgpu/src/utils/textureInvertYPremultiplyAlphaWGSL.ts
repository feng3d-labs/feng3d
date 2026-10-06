import { arrayWithValues, assign, builtin, float, fragment, gl_Position, if_, let_, overrideU32, return_, sampler2D, texture, uint, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type Vec4Value = ReturnType<typeof vec4>;
type FloatValue = ReturnType<typeof float>;

/**
 * 对纹理做 Y 轴翻转 / 预乘 Alpha 所用的着色器（TSL 构建，懒加载缓存）。
 *
 * 与手写 WGSL 的差异说明（**语义一致**）：
 * - 两个 `override` 是 **u32**（`override invertY: u32 = 0u;`、判断写成 `invertY == 1u`）——
 * - TSL 的 sampler 展开是 `mySampler_texture`（binding 0）+ `mySampler`（binding 1），
 *   手写是 sampler@0 + texture@1——**顺序相反**，数据侧按 TSL 的顺序写；
 *   为什么不照搬手写的 bool override：WebGPU 的 pipeline constants 类型是 number，bool override 无法被覆盖；
 * - TSL 生成两份文本，用两个 shader module（WebGPU 允许 vertex / fragment 不同 module）。
 */
let cached: { vertex: string; fragment: string } | null = null;

/**
 * 获取 Y 轴翻转 / 预乘 Alpha 所需的 vertex / fragment WGSL。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getTextureInvertYPremultiplyAlphaWGSL(): { vertex: string; fragment: string }
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

        const vout_uv = vec2(varying('vUV', 0));

        const vertexShader = vertex('vsmain', () =>
        {
            assign(vout_uv, texcoords.index(vertexIndex) as Vec2Value);

            // if (invertY) { vUV.y = 1.0 - vUV.y; }
            if_((overrideU32('invertY') as ReturnType<typeof uint>).equals(uint(1)), () =>
            {
                assign(vout_uv.y as never, float(1.0).subtract(vout_uv.y as FloatValue) as never);
            });

            gl_Position.assign(vec4(positions.index(vertexIndex) as Vec2Value, 0.0, 1.0) as Vec4Value);
        }, {
            // ⚠️ 原手写是 `override invertY = false;`（bool）+ constants 传 1/0（number）——
            // WebGPU 的 constants 类型是 number（GPUPipelineConstantValue），**bool override 无法被覆盖**。
            // 改成 u32 + 比较：语义等价，且 constants 真正生效。
            overrides: {
                invertY: { type: 'u32', value: '0u' },
                premultiplyAlpha: { type: 'u32', value: '0u' },
            },
        });

        const vin_uv = vec2(varying('vUV', 0));
        // 普通纹理：展开为 mySampler_texture（texture_2d<f32>）+ mySampler（sampler）
        const mySampler = sampler2D(uniform('mySampler', 0, 0));

        const fragmentShader = fragment('fsmain', () =>
        {
            const color = let_('color', texture(mySampler, vin_uv) as Vec4Value) as Vec4Value;

            // if (premultiplyAlpha) { color = vec4(color.rgb * color.a, color.a); }
            if_((overrideU32('premultiplyAlpha') as ReturnType<typeof uint>).equals(uint(1)), () =>
            {
                const a = let_('a', color.w as FloatValue) as FloatValue;

                assign(color, vec4(
                    (color.x as FloatValue).multiply(a),
                    (color.y as FloatValue).multiply(a),
                    (color.z as FloatValue).multiply(a),
                    a,
                ) as Vec4Value);
            });

            return_(color);
        });

        cached = { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
    }

    return cached;
}
