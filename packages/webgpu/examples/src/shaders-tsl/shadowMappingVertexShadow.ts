/**
 * shadowMapping 示例的阴影 Pass 顶点着色器（原 `vertexShadow.wgsl` 的 TSL 版）。
 *
 * 对照手写：scene.lightViewProjMatrix * model.modelMatrix * vec4(position, 1.0)。
 */
import { attribute, gl_Position, mat4, struct, uniform, vec3, vec4, vertex } from '@feng3d/tsl';

type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取顶点着色器的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getShadowMappingVertexShadowWGSL(): string
{
    if (cached === null)
    {
        const Scene = struct('Scene', {
            lightViewProjMatrix: mat4,
            cameraViewProjMatrix: mat4,
            lightPos: vec3,
        });
        const Model = struct('Model', { modelMatrix: mat4 });
        const scene = Scene(uniform('scene', 0, 0)) as unknown as { lightViewProjMatrix: ReturnType<typeof mat4> };
        const model = Model(uniform('model', 1, 0)) as unknown as { modelMatrix: ReturnType<typeof mat4> };

        const a_position = vec3(attribute('position', 0));

        cached = vertex('main', () =>
        {
            gl_Position.assign(scene.lightViewProjMatrix
                .multiply(model.modelMatrix)
                .multiply(vec4(a_position, 1.0) as Vec4Value) as Vec4Value);
        }).toWGSL();
    }

    return cached;
}
