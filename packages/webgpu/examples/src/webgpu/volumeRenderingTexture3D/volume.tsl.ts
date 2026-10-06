/**
 * volumeRenderingTexture3D 示例的体渲染着色器（原 `volume.wgsl` 的 TSL 版，含两个入口）。
 *
 * 对照手写：顶点用逆 MVP 把全屏三角形的三个角反投影成射线的 near/far 点、算出步长；
 * 片元沿射线走 NumSteps 步采样 3D 纹理并做前后混合。
 *
 * 四处说明：
 * 1. `myTexture: texture_3d<f32>` 用 TSL 的 sampler3D；
 * 2. `near /= near.w` / `rayPos += step` 都是复合赋值——TSL 里写 assign(x, x.OP(...))；
 * 3. `all(rayPos.xyz < vec3f(1.0))` 用 lessThanAll（round 51 新增），再用 Bool.and 组合；
 * 4. 结果灰度用 vec4(result, result, result, 1.0)（手写是 vec3f(result) 广播）。
 */
import { arrayWithValues, assign, builtin, float, forRange_, fragment, gl_Position, let_, mat4, return_, sampler3D, select, struct, texture, uint, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof vec4>;
type FloatValue = ReturnType<typeof float>;

/** 手写的顶层常量 */
const NUM_STEPS = 64;

/** 懒构建缓存 */
let cached: { vertex: string; fragment: string } | null = null;

/**
 * 获取体渲染着色器的 vertex / fragment WGSL。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getVolumeWGSL(): { vertex: string; fragment: string }
{
    if (cached === null)
    {
        const Uniforms = struct('Uniforms', { inverseModelViewProjectionMatrix: mat4 });
        const uniforms = Uniforms(uniform('uniforms', 0, 0)) as unknown as {
            inverseModelViewProjectionMatrix: ReturnType<typeof mat4>;
        };
        const myTexture = sampler3D(uniform('myTexture', 0, 2));

        const vertexIndex = uint(builtin('gl_VertexID'));
        // 三个顶点覆盖全屏（手写的 pos 数组）
        const positions = arrayWithValues(vec2, [
            vec2(-1.0, 3.0), vec2(-1.0, -1.0), vec2(3.0, -1.0),
        ]);

        const vout_near = vec3(varying('near', 0));
        const vout_step = vec3(varying('step', 1));

        // ---- 顶点 ----
        const vertexShader = vertex('vertex_main', () =>
        {
            const xy = let_('xy', positions.index(vertexIndex) as Vec2Value) as Vec2Value;
            const clipXY = let_('clipXY', vec4(xy, 0.0, 1.0) as Vec4Value) as Vec4Value;

            // near = invMVP * vec4(xy, 0, 1); near /= near.w
            const nearPos = var_('near', uniforms.inverseModelViewProjectionMatrix.multiply(clipXY) as Vec4Value) as Vec4Value;

            assign(nearPos, nearPos.divide(nearPos.w) as Vec4Value);

            // far = invMVP * vec4(xy, 1, 1); far /= far.w
            const farPos = var_('far', uniforms.inverseModelViewProjectionMatrix.multiply(vec4(xy, 1.0, 1.0) as Vec4Value) as Vec4Value) as Vec4Value;

            assign(farPos, farPos.divide(farPos.w) as Vec4Value);

            gl_Position.assign(clipXY);
            vout_near.assign((nearPos.xyz as Vec3Value));
            // (far.xyz - near.xyz) / f32(NumSteps)
            vout_step.assign((farPos.xyz as Vec3Value).subtract(nearPos.xyz as Vec3Value).divide(float(NUM_STEPS)) as Vec3Value);
        });

        // ---- 片元 ----
        const vin_near = vec3(varying('near', 0));
        const vin_step = vec3(varying('step', 1));

        const fragmentShader = fragment('fragment_main', () =>
        {
            const rayPos = var_('rayPos', vin_near as Vec3Value) as Vec3Value;
            const result = var_('result', float(0.0)) as FloatValue;

            forRange_('i', 0, NUM_STEPS, () =>
            {
                // texCoord = (rayPos + 1.0) * 0.5
                const texCoord = let_('texCoord', (rayPos as Vec3Value)
                    .add(vec3(1.0, 1.0, 1.0))
                    .multiply(vec3(0.5, 0.5, 0.5)) as Vec3Value) as Vec3Value;
                // sample = texture(...).r * 4.0 / f32(NumSteps)
                const sample = let_('sample', (texture(myTexture, texCoord) as Vec4Value).x
                    .multiply(float(4.0))
                    .divide(float(NUM_STEPS)) as FloatValue) as FloatValue;

                // intersects = all(rayPos < 1) && all(rayPos > -1)
                const intersects = let_('intersects', (rayPos as Vec3Value).lessThanAll(vec3(1.0, 1.0, 1.0))
                    .and((rayPos as Vec3Value).greaterThanAll(vec3(-1.0, -1.0, -1.0))));

                // result += select(0.0, (1.0 - result) * sample, intersects && result < 1.0)
                const blended = let_('blended', float(1.0).subtract(result).multiply(sample) as FloatValue) as FloatValue;

                assign(result, result.add(select(intersects.and(result.lessThan(1.0)), blended, float(0.0)) as FloatValue) as FloatValue);

                assign(rayPos, (rayPos as Vec3Value).add(vin_step) as Vec3Value);
            });

            // 手写是 vec4f(vec3f(result), 1.0)
            return_(vec4(result, result, result, float(1.0)) as Vec4Value);
        });

        cached = { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
    }

    return cached;
}
