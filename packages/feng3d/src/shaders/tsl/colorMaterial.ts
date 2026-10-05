/**
 * ColorMaterial 的 TSL 着色器定义。
 *
 * 语义与迁移前的内联 WGSL 一致：顶点变换 position、把 a_color 传给 varying `color`；
 * 片元用「顶点色 × 材质色」逐分量相乘，**alpha 取顶点色**（历史规避：材质 uniform 的
 * 第 4 分量传到 GPU 后恒为 0，整体相乘会让物体变黑——见迁移前 ColorMaterial.ts 的注释）。
 *
 * 入口名用 `main`，由引擎从 WGSL 反射取该阶段的第一个入口（迁移前用 `vertex` / `fragment`，
 * 二者在同一段 WGSL 里；拆成两段后各自只有一个入口）。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { attribute, fragment, gl_Position, let_, return_, struct, uniform, varying, vec3, vec4, vertex } from '@feng3d/tsl';
import { createCameraUniforms, createTransformUniforms } from './uniforms';

/** 懒构建缓存 */
let cachedColorShader: { vertex: string; fragment: string } | null = null;

/**
 * 获取 ColorMaterial 的 vertex / fragment WGSL（首次调用时构建并缓存）。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getColorShaderWGSL(): { vertex: string; fragment: string }
{
    if (cachedColorShader === null)
    {
        cachedColorShader = buildColorShader();
    }

    return cachedColorShader;
}

/**
 * 用 TSL 构建 ColorMaterial 的着色器。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
function buildColorShader(): { vertex: string; fragment: string }
{
    const transform = createTransformUniforms();
    const camera = createCameraUniforms();

    const ColorUniforms = struct('ColorUniforms', { u_diffuseInput: vec4 });
    const material = ColorUniforms(uniform('material_uniforms', 0, 3));

    const a_position = vec3(attribute('a_position', 0));
    const a_color = vec4(attribute('a_color', 1));
    const v_color = vec4(varying('color'));

    const vertexShader = vertex('main', () =>
    {
        // 用 let_ 生成 WGSL 局部变量（与手写版本同形，避免矩阵乘法结合顺序变化带来浮点差异）
        const worldPosition = let_('worldPosition', transform.u_modelMatrix.multiply(vec4(a_position, 1.0)));
        gl_Position.assign(camera.u_viewProjection.multiply(worldPosition));
        v_color.assign(a_color);
    });

    const fragmentShader = fragment('main', () =>
    {
        // 逐分量相乘，alpha 取顶点色（不要合并成一个 vec4 乘法，见文件头注释）
        return_(vec4(
            v_color.r.multiply(material.u_diffuseInput.r),
            v_color.g.multiply(material.u_diffuseInput.g),
            v_color.b.multiply(material.u_diffuseInput.b),
            v_color.a,
        ));
    });

    return { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
}
