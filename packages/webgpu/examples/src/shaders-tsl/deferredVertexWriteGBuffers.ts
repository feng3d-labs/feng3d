/**
 * deferredRendering 示例的 G-Buffer 顶点着色器（原 `vertexWriteGBuffers.wgsl` 的 TSL 版）。
 *
 * 对照手写：位置/法线变换到世界空间，uv 直传；输出三个 varying（0–2）。
 */
import { attribute, gl_Position, let_, mat4, normalize, struct, uniform, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取顶点着色器的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getDeferredVertexWriteGBuffersWGSL(): string
{
    if (cached === null)
    {
        cached = build();
    }

    return cached;
}

function build(): string
{
    const Uniforms = struct('Uniforms', { modelMatrix: mat4, normalModelMatrix: mat4 });
    const Camera = struct('Camera', { viewProjectionMatrix: mat4 });
    const uniforms = Uniforms(uniform('uniforms', 0, 0)) as unknown as {
        modelMatrix: ReturnType<typeof mat4>;
        normalModelMatrix: ReturnType<typeof mat4>;
    };
    const camera = Camera(uniform('camera', 0, 1)) as unknown as { viewProjectionMatrix: ReturnType<typeof mat4> };

    const a_position = vec3(attribute('position', 0));
    const a_normal = vec3(attribute('normal', 1));
    const a_uv = vec2(attribute('uv', 2));

    const v_fragPosition = vec3(varying('fragPosition', 0));
    const v_fragNormal = vec3(varying('fragNormal', 1));
    const v_fragUV = vec2(varying('fragUV', 2));

    return vertex('main', () =>
    {
        const fragPosition = let_('fragPosition', uniforms.modelMatrix.multiply(vec4(a_position, 1.0) as Vec4Value).xyz as Vec3Value);

        v_fragPosition.assign(fragPosition);
        gl_Position.assign(camera.viewProjectionMatrix.multiply(vec4(fragPosition, 1.0) as Vec4Value) as Vec4Value);
        v_fragNormal.assign(normalize(uniforms.normalModelMatrix.multiply(vec4(a_normal, 1.0) as Vec4Value).xyz as Vec3Value) as Vec3Value);
        v_fragUV.assign(a_uv as Vec2Value);
    }).toWGSL();
}
