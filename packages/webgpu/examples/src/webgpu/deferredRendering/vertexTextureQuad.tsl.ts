/**
 * deferredRendering 示例的全屏四边形顶点着色器（原 `vertexTextureQuad.wgsl` 的 TSL 版）。
 *
 * 与 reversedZ 示例的同名着色器内容一致：六个顶点的常量数组 + vertex_index。
 */
import { arrayWithValues, builtin, gl_Position, let_, uint, vec2, vec4, vertex } from '@feng3d/tsl';

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取顶点着色器的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getDeferredVertexTextureQuadWGSL(): string
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
