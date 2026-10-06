/**
 * reversedZ 示例的深度预通道顶点着色器（原 `vertexDepthPrePass.wgsl` 的 TSL 版）。
 *
 * 对照手写：只输出位置，**没有 varying**（所以这里不声明 any varying）。
 */
import { array, attribute, builtin, gl_Position, let_, mat4, struct, uniform, uint, vec4, vertex } from '@feng3d/tsl';

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取顶点着色器的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getReversedZVertexDepthPrePassWGSL(): string
{
    if (cached === null)
    {
        const Uniforms = struct('Uniforms', { modelMatrix: array(mat4, 5) });
        const Camera = struct('Camera', { viewProjectionMatrix: mat4 });

        const uniforms = Uniforms(uniform('uniforms', 0, 0)) as unknown as {
            modelMatrix: { index(i: unknown): ReturnType<typeof mat4> };
        };
        const camera = Camera(uniform('camera', 0, 1)) as unknown as {
            viewProjectionMatrix: ReturnType<typeof mat4>;
        };

        const instanceIdx = uint(builtin('gl_InstanceID'));
        const position = vec4(attribute('position', 0));

        cached = vertex('main', () =>
        {
            const clipPos = let_('clipPos', camera.viewProjectionMatrix
                .multiply(uniforms.modelMatrix.index(instanceIdx))
                .multiply(position));

            gl_Position.assign(clipPos);
        }).toWGSL();
    }

    return cached;
}
