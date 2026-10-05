/**
 * reversedZ 示例的顶点着色器（原 \`vertexPrecisionErrorPass.wgsl\` 的 TSL 版）。
 *
 * 对照手写：uniform 里是 \`array<mat4x4<f32>, 5>\`（模型矩阵数组），用 instance_index 取。
 */
import { array, attribute, builtin, gl_Position, let_, mat4, struct, uniform, uint, varying, vec4, vertex } from '@feng3d/tsl';

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取顶点着色器的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getReversedZVertexPrecisionErrorPassWGSL(): string
{
    if (cached === null)
    {
        cached = build();
    }

    return cached;
}

function build(): string
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
    const v_clipPos = vec4(varying('clipPos', 0));

    const vertexShader = vertex('main', () =>
    {
        // 手写：camera.viewProjectionMatrix * uniforms.modelMatrix[instanceIdx] * position
        const clipPos = let_('clipPos', camera.viewProjectionMatrix
            .multiply(uniforms.modelMatrix.index(instanceIdx))
            .multiply(position));

        gl_Position.assign(clipPos);
        v_clipPos.assign(clipPos);
    });

    return vertexShader.toWGSL();
}
