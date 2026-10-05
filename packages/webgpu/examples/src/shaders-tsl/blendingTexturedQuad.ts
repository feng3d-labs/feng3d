/**
 * blending 示例的纹理四边形着色器（原 `texturedQuad.wgsl` 的 TSL 版，含两个入口）。
 *
 * 对照手写：六个顶点的常量数组（0/1 的单位方形，两个三角形）；
 * uniform 在 `@group(0) @binding(2)`；片元采样纹理。
 *
 * **采样器展开顺序与手写相反**（TSL：texture 在 binding 0、sampler 在 1），数据侧已跟着改。
 */
import { arrayWithValues, attribute, builtin, fragment, gl_Position, let_, mat4, return_, sampler2D, struct, texture2D, uint, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存 */
let cached: { vertex: string; fragment: string } | null = null;

/**
 * 获取纹理四边形的 vertex / fragment WGSL。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getBlendingTexturedQuadWGSL(): { vertex: string; fragment: string }
{
    if (cached === null)
    {
        const Uniforms = struct('Uniforms', { matrix: mat4 });
        const uni = Uniforms(uniform('uni', 0, 2)) as unknown as { matrix: ReturnType<typeof mat4> };
        const ourTexture = sampler2D(uniform('ourTexture', 0, 0));

        const vertexIndex = uint(builtin('gl_VertexID'));
        const positions = arrayWithValues(vec2, [
            vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(0.0, 1.0),
            vec2(0.0, 1.0), vec2(1.0, 0.0), vec2(1.0, 1.0),
        ]);
        const v_texcoord = vec2(varying('texcoord', 0));

        const vertexShader = vertex('vs', () =>
        {
            const xy = let_('xy', positions.index(vertexIndex));

            gl_Position.assign(uni.matrix.multiply(vec4(xy, 0.0, 1.0) as Vec4Value) as Vec4Value);
            v_texcoord.assign(xy as Vec2Value);
        });

        const fragmentShader = fragment('fs', () =>
        {
            return_(texture2D(ourTexture, v_texcoord) as Vec4Value);
        });

        cached = { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
    }

    return cached;
}
