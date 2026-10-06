/**
 * solidColorLit 着色器（TSL 版）。
 *
 * **三个示例共用同一份手写 WGSL**（\`multipleCanvases\` / \`occlusionQuery\` / \`wireframe\` 的
 * \`solidColorLit.wgsl\` 逐字节相同），所以这里也只用一份实现。
 *
 * 对照手写：
 * \`\`\`wgsl
 * struct Uniforms { worldViewProjectionMatrix: mat4x4f, worldMatrix: mat4x4f, color: vec4f }
 * @vertex fn vs(vin: Vertex) -> VSOut {
 *     vOut.position = uni.worldViewProjectionMatrix * vin.position;
 *     vOut.normal = (uni.worldMatrix * vec4f(vin.normal, 0)).xyz;
 * }
 * @fragment fn fs(vin: VSOut) -> @location(0) vec4f {
 *     let lightDirection = normalize(vec3f(4, 10, 6));
 *     let light = dot(normalize(vin.normal), lightDirection) * 0.5 + 0.5;
 *     return vec4f(uni.color.rgb * light, uni.color.a);
 * }
 * \`\`\`
 */
import { attribute, dot, float, fragment, gl_Position, let_, mat4, normalize, return_, struct, uniform, varying, vec3, vec4, vertex } from '@feng3d/tsl';

type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存 */
let cached: { vertex: string; fragment: string } | null = null;

/**
 * 获取 solidColorLit 的 vertex / fragment WGSL。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getSolidColorLitWGSL(): { vertex: string; fragment: string }
{
    if (cached === null)
    {
        cached = build();
    }

    return cached;
}

function build(): { vertex: string; fragment: string }
{
    const Uniforms = struct('Uniforms', {
        worldViewProjectionMatrix: mat4,
        worldMatrix: mat4,
        color: vec4,
    });
    const uni = Uniforms(uniform('uni', 0, 0)) as unknown as {
        worldViewProjectionMatrix: ReturnType<typeof mat4>;
        worldMatrix: ReturnType<typeof mat4>;
        color: Vec4Value;
    };

    const a_position = vec4(attribute('position', 0));
    const a_normal = vec3(attribute('normal', 1));
    const v_normal = vec3(varying('normal', 0));

    const vertexShader = vertex('vs', () =>
    {
        gl_Position.assign(uni.worldViewProjectionMatrix.multiply(a_position) as Vec4Value);
        v_normal.assign(uni.worldMatrix.multiply(vec4(a_normal, 0.0) as Vec4Value).xyz as Vec3Value);
    });

    const fragmentShader = fragment('fs', () =>
    {
        const lightDirection = let_('lightDirection', normalize(vec3(4.0, 10.0, 6.0)) as Vec3Value);
        const light = let_('light', dot(normalize(v_normal), lightDirection).multiply(0.5).add(float(0.5)));

        return_(vec4(
            (uni.color.xyz as Vec3Value).multiply(light) as Vec3Value,
            uni.color.w,
        ) as Vec4Value);
    });

    return { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
}
