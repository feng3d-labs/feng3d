/**
 * reversedZ 示例的纹理四边形顶点着色器（原 `vertexTextureQuad.wgsl` 的 TSL 版）。
 *
 * 对照手写：六个顶点的位置是**常量数组**，用 vertex_index 取，再拼成 vec4(pos, 0, 1)。
 */
import { arrayWithValues, builtin, gl_Position, let_, return_, uint, vec2, vec4, vertex } from '@feng3d/tsl';

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取顶点着色器的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getReversedZVertexTextureQuadWGSL(): string
{
    if (cached === null)
    {
        const vertexIndex = uint(builtin('gl_VertexID'));
        const positions = arrayWithValues(vec2, [
            vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
            vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0),
        ]);

        cached = vertex('main', () =>
        {
            const pos = let_('pos', positions.index(vertexIndex));

            gl_Position.assign(vec4(pos, 0.0, 1.0));
        }).toWGSL();
    }

    return cached;
}
