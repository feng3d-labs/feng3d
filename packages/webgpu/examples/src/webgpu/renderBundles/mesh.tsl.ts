/**
 * renderBundles 示例的网格着色器（原 `mesh.wgsl` 的 TSL 版，含两个入口）。
 *
 * 对照手写：uniform 在 @group(0)@binding(0)（struct）与 @group(1)@binding(0)（**裸 mat4**）；
 * 片元采样纹理 + 极简方向光。
 *
 * 三处说明：
 * 1. `modelMatrix` 是**裸 mat4** 而不是 struct——TSL 里直接 `uniform('modelMatrix', 1, 0)` 包 mat4；
 * 2. **采样器展开顺序与手写相反**（TSL：meshTexture_texture 在 binding 1、meshTexture(sampler) 在 2），数据侧已改；
 * 3. 手写的 `saturate` 在 TSL 里用同名的 `saturate`（本批新增，生成 clamp(x, 0.0, 1.0)）。
 */
import { attribute, dot, float, fragment, gl_Position, let_, mat4, max, normalize, return_, sampler2D, saturate, struct, texture2D, uniform, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存 */
let cached: { vertex: string; fragment: string } | null = null;

/**
 * 获取网格着色器的 vertex / fragment WGSL。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getRenderBundlesMeshWGSL(): { vertex: string; fragment: string }
{
    if (cached === null)
    {
        const Uniforms = struct('Uniforms', { viewProjectionMatrix: mat4 });
        const uniforms = Uniforms(uniform('uniforms', 0, 0)) as unknown as { viewProjectionMatrix: ReturnType<typeof mat4> };
        // 裸 mat4 的 uniform（不是 struct）——用 mat4(host) 包一层才是矩阵值
        const modelMatrix = mat4(uniform('modelMatrix', 1, 0));
        const meshTexture = sampler2D(uniform('meshTexture', 1, 1));

        const a_position = vec3(attribute('position', 0));
        const a_normal = vec3(attribute('normal', 1));
        const a_uv = vec2(attribute('uv', 2));
        const v_normal = vec3(varying('normal', 0));
        const v_uv = vec2(varying('uv', 1));

        const vertexShader = vertex('vertexMain', () =>
        {
            gl_Position.assign(uniforms.viewProjectionMatrix.multiply(modelMatrix).multiply(vec4(a_position, 1.0) as Vec4Value) as Vec4Value);
            v_normal.assign(normalize(modelMatrix.multiply(vec4(a_normal, 0.0) as Vec4Value).xyz as Vec3Value) as Vec3Value);
            v_uv.assign(a_uv as Vec2Value);
        });

        const fragmentShader = fragment('fragmentMain', () =>
        {
            const textureColor = let_('textureColor', texture2D(meshTexture, v_uv) as Vec4Value);
            // 极简方向光（手写的常量直接内联）
            const lightDir = let_('lightDir', vec3(1.0, 1.0, 1.0) as Vec3Value);
            const dirColor = let_('dirColor', vec3(1.0, 1.0, 1.0) as Vec3Value);
            const ambientColor = let_('ambientColor', vec3(0.05, 0.05, 0.05) as Vec3Value);
            const lightColor = let_('lightColor', saturate(
                ambientColor
                    .add(max(dot(v_normal, lightDir), float(0.0)).multiply(dirColor) as Vec3Value) as Vec3Value,
            ) as Vec3Value);

            return_(vec4((textureColor.xyz as Vec3Value).multiply(lightColor) as Vec3Value, textureColor.w) as Vec4Value);
        });

        cached = { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
    }

    return cached;
}
