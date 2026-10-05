/**
 * SegmentMaterial 的 TSL 着色器定义。
 *
 * 语义与迁移前的内联 WGSL 一致：顶点部分与 ColorMaterial 相同（position + 顶点色 varying）；
 * 片元用 `u_segmentColor` 与顶点色**逐分量**相乘、alpha 取顶点色（历史规避同 ColorMaterial）。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { attribute, fragment, gl_Position, let_, return_, struct, uniform, varying, vec3, vec4, vertex } from '@feng3d/tsl';
import { createCameraUniforms, createTransformUniforms } from './uniforms';

/** 懒构建缓存 */
let cachedSegmentShader: { vertex: string; fragment: string } | null = null;

/**
 * 获取 SegmentMaterial 的 vertex / fragment WGSL（首次调用时构建并缓存）。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getSegmentShaderWGSL(): { vertex: string; fragment: string }
{
    if (cachedSegmentShader === null)
    {
        cachedSegmentShader = buildSegmentShader();
    }

    return cachedSegmentShader;
}

/**
 * 用 TSL 构建 SegmentMaterial 的着色器。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
function buildSegmentShader(): { vertex: string; fragment: string }
{
    const transform = createTransformUniforms();
    const camera = createCameraUniforms();

    const SegmentUniforms = struct('SegmentUniforms', { u_segmentColor: vec4 });
    const material = SegmentUniforms(uniform('material_uniforms', 0, 3));

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
        // 逐分量相乘，alpha 取顶点色（见文件头注释）
        return_(vec4(
            v_color.r.multiply(material.u_segmentColor.r),
            v_color.g.multiply(material.u_segmentColor.g),
            v_color.b.multiply(material.u_segmentColor.b),
            v_color.a,
        ));
    });

    return { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
}
