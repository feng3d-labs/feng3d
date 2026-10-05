/**
 * shadowMapping 示例的主顶点着色器（原 `vertex.wgsl` 的 TSL 版）。
 *
 * 对照手写：计算光源空间位置（XY 从 (-1,1) 转到 (0,1)、Y 翻转）与相机空间位置，
 * 输出 shadowPos / fragPos / fragNorm 三个 varying。
 */
import { attribute, gl_Position, let_, mat4, struct, uniform, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

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
export function getShadowMappingVertexWGSL(): string
{
    if (cached === null)
    {
        const Scene = struct('Scene', {
            lightViewProjMatrix: mat4,
            cameraViewProjMatrix: mat4,
            lightPos: vec3,
        });
        const Model = struct('Model', { modelMatrix: mat4 });
        const scene = Scene(uniform('scene', 0, 0)) as unknown as {
            lightViewProjMatrix: ReturnType<typeof mat4>;
            cameraViewProjMatrix: ReturnType<typeof mat4>;
        };
        const model = Model(uniform('model', 1, 0)) as unknown as { modelMatrix: ReturnType<typeof mat4> };

        const a_position = vec3(attribute('position', 0));
        const a_normal = vec3(attribute('normal', 1));

        const v_shadowPos = vec3(varying('shadowPos', 0));
        const v_fragPos = vec3(varying('fragPos', 1));
        const v_fragNorm = vec3(varying('fragNorm', 2));

        cached = vertex('main', () =>
        {
            // XY 在 (-1,1)、Z 在 (0,1)；下面把 XY 转到 (0,1)、Y 翻转（纹理坐标 Y 向下）
            const posFromLight = let_('posFromLight', scene.lightViewProjMatrix
                .multiply(model.modelMatrix)
                .multiply(vec4(a_position, 1.0) as Vec4Value) as Vec4Value);

            // TSL 的 vec2(x) 不做标量广播，写成 (x, x)
            const shadowXY = let_('shadowXY', (posFromLight.xy as Vec2Value)
                .multiply(vec2(0.5, -0.5)).add(vec2(0.5, 0.5)) as Vec2Value);

            v_shadowPos.assign(vec3(shadowXY.x, shadowXY.y, posFromLight.z) as Vec3Value);

            const clipPos = let_('clipPos', scene.cameraViewProjMatrix
                .multiply(model.modelMatrix)
                .multiply(vec4(a_position, 1.0) as Vec4Value) as Vec4Value);

            gl_Position.assign(clipPos);
            v_fragPos.assign(clipPos.xyz as Vec3Value);
            v_fragNorm.assign(a_normal as Vec3Value);
        }).toWGSL();
    }

    return cached;
}
