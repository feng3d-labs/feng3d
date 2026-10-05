/**
 * TextureMaterial 的 TSL 着色器定义。
 *
 * 语义与迁移前的内联 WGSL 一致：顶点做标准变换并把 a_uv 传给 varying `uv`；
 * 片元采样纹理，与材质 `u_color` **逐分量**相乘、透明度取纹理的 alpha
 * （规避「材质 uniform 的 alpha 分量传到 GPU 后恒为 0」，见 ColorMaterial 的注释）。
 *
 * **采样器命名**：TSL 把 `sampler2D(uniform('s_texture'))` 展开成
 * `s_texture_texture`（texture）+ `s_texture`（sampler），binding 分别是 group 1 的 0 / 1；
 * 引擎的 `WGPUBindGroupEntry` 认得这个展开格式（`_texture` 后缀 → 从 `bindingResources.s_texture`
 * 的 `.texture` / `.sampler` 取值），所以数据侧不需要改。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { attribute, fragment, gl_Position, let_, return_, sampler2D, struct, texture2D, uniform, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';
import { createCameraUniforms, createTransformUniforms } from './uniforms';

/** 懒构建缓存 */
let cachedTextureShader: { vertex: string; fragment: string } | null = null;

/**
 * 获取 TextureMaterial 的 vertex / fragment WGSL（首次调用时构建并缓存）。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getTextureShaderWGSL(): { vertex: string; fragment: string }
{
    if (cachedTextureShader === null)
    {
        cachedTextureShader = buildTextureShader();
    }

    return cachedTextureShader;
}

/**
 * 用 TSL 构建 TextureMaterial 的着色器。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
function buildTextureShader(): { vertex: string; fragment: string }
{
    const transform = createTransformUniforms();
    const camera = createCameraUniforms();

    const TextureUniforms = struct('TextureUniforms', { u_color: vec4 });
    const material = TextureUniforms(uniform('material_uniforms', 0, 3));

    // 采样器展开为 group 1 的 texture(0) + sampler(1)（绑定解析见文件头注释）
    const s_texture = sampler2D(uniform('s_texture', 1, 0));

    const a_position = vec3(attribute('a_position', 0));
    const a_uv = vec2(attribute('a_uv', 3));
    const v_uv = vec2(varying('uv'));

    const vertexShader = vertex('main', () =>
    {
        // 中间值一律用 let_：避免内联展开改变矩阵乘法的浮点结合顺序（见 ARCHITECTURE_V2 §P2）
        const worldPosition = let_('worldPosition', transform.u_modelMatrix.multiply(vec4(a_position, 1.0)));
        gl_Position.assign(camera.u_viewProjection.multiply(worldPosition));
        v_uv.assign(a_uv);
    });

    const fragmentShader = fragment('main', () =>
    {
        const texColor = let_('texColor', texture2D(s_texture, v_uv));
        const tint = let_('tint', material.u_color);
        return_(vec4(texColor.xyz.multiply(tint.xyz), texColor.a));
    });

    return { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
}
