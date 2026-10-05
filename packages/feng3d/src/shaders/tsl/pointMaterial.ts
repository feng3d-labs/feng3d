/**
 * PointMaterial 的 TSL 着色器定义。
 *
 * 语义与迁移前的内联 WGSL 一致：`PointGeometry` 已把每点扩成 4 顶点、`a_uv` 承载
 * 四边形角偏移 corner ∈ [-1,1]²；顶点着色器把点投影到 clip space 后按 `u_PointSize`
 * 在 NDC 屏幕空间展开，并乘 `clipPos.w` 做透视修正（远处点视觉更小）。
 * 片元用 `u_color` 与顶点色逐 rgb 相乘、alpha 取顶点色。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { attribute, float, fragment, gl_Position, let_, return_, struct, uniform, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';
import { createCameraUniforms, createGlobalUniforms, createTransformUniforms } from './uniforms';

/** 懒构建缓存 */
let cachedPointShader: { vertex: string; fragment: string } | null = null;

/**
 * 获取 PointMaterial 的 vertex / fragment WGSL（首次调用时构建并缓存）。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getPointShaderWGSL(): { vertex: string; fragment: string }
{
    if (cachedPointShader === null)
    {
        cachedPointShader = buildPointShader();
    }

    return cachedPointShader;
}

/**
 * 用 TSL 构建 PointMaterial 的着色器。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
function buildPointShader(): { vertex: string; fragment: string }
{
    const transform = createTransformUniforms();
    const camera = createCameraUniforms();
    const global = createGlobalUniforms();

    const PointUniforms = struct('PointUniforms', {
        u_color: vec4,
        u_PointSize: float,
    });
    const material = PointUniforms(uniform('material_uniforms', 0, 3));

    const a_position = vec3(attribute('a_position', 0));
    const a_color = vec4(attribute('a_color', 1));
    // a_uv 复用为 billboard 四边形角偏移 corner ∈ [-1,1]²（PointGeometry 写入）
    const a_uv = vec2(attribute('a_uv', 2));
    const v_color = vec4(varying('color'));

    const vertexShader = vertex('main', () =>
    {
        // 全部中间值都用 let_ 生成 WGSL 局部变量：既与手写版本同形（避免矩阵乘法结合顺序变化带来浮点差异），
        // 也避免 clipPos / ndcOffset 这类多次引用的值被内联成重复表达式
        const worldPosition = let_('worldPosition', transform.u_modelMatrix.multiply(vec4(a_position, 1.0)));
        const clipPos = let_('clipPos', camera.u_viewProjection.multiply(worldPosition));
        // NDC 空间按像素展开：corner × size / viewportPixels × 2（×2 因 NDC 范围 [-1,1]）
        const ndcOffset = let_('ndcOffset', a_uv.multiply(material.u_PointSize).divide(global.u_Viewport).multiply(2.0));
        // 透视修正：偏移施加在 clip space（乘 clipPos.w），保证屏幕空间等尺寸。
        // 注意：TSL 的 vec4 没有 (Vec2, Float, Float) 构造，故先合成 Vec3 再补 w。
        const expandedXY = clipPos.xy.add(ndcOffset.multiply(clipPos.w));
        gl_Position.assign(vec4(vec3(expandedXY, clipPos.z), clipPos.w));
        v_color.assign(a_color);
    });

    const fragmentShader = fragment('main', () =>
    {
        return_(vec4(v_color.xyz.multiply(material.u_color.xyz), v_color.a));
    });

    return { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
}
