/**
 * ProjectedShadowMaterial 的 TSL 着色器定义。
 *
 * 复刻 three.js 的 ShadowMesh（examples/jsm/objects/ShadowMesh.js + webgl_shadowmesh 示例）：
 * 阴影网格复用投射体几何体，顶点先由**平面投影矩阵**投到地面（three.js 里该矩阵被当作
 * 对象矩阵写入 ShadowMesh.update），再经相机 viewProjection 变换；片元输出纯色（黑色）
 * 与不透明度，由混合状态压暗地面。
 *
 * 与 three.js 的对应关系（逐项）：
 * - three: \`gl_Position = projectionMatrix * viewMatrix * (shadowMatrix * meshMatrix) * position\`
 *   → 这里 modelMatrix 由引擎的 transform uniform 提供（阴影对象与投射体保持同一变换），
 *     阴影矩阵经材质 uniform \`u_shadowMatrix\` 乘在 world 之后。
 * - three 的 MeshBasicMaterial（color 0x000000 / opacity 0.6 / transparent / depthWrite:false）
 *   → 片元输出 u_color 与 u_opacity，混合与深度状态由 ProjectedShadowMaterial 的管线声明。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { attribute, float, fragment, gl_Position, let_, mat4, return_, struct, uniform, vec3, vec4, vertex } from '@feng3d/tsl';
import { createCameraUniforms, createTransformUniforms } from './uniforms';

/** 懒构建缓存 */
let cachedProjectedShadowShader: { vertex: string; fragment: string } | null = null;

/**
 * 获取 ProjectedShadowMaterial 的 vertex / fragment WGSL（首次调用时构建并缓存）。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getProjectedShadowShaderWGSL(): { vertex: string; fragment: string }
{
    if (cachedProjectedShadowShader === null)
    {
        cachedProjectedShadowShader = buildProjectedShadowShader();
    }

    return cachedProjectedShadowShader;
}

/**
 * 用 TSL 构建平面投影阴影材质的着色器。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
function buildProjectedShadowShader(): { vertex: string; fragment: string }
{
    const transform = createTransformUniforms();
    const camera = createCameraUniforms();

    const ProjectedShadowUniforms = struct('ProjectedShadowUniforms', {
        u_shadowMatrix: mat4,
        u_color: vec4,
        u_opacity: float,
    });
    const material = ProjectedShadowUniforms(uniform('material_uniforms', 0, 3));

    const a_position = vec3(attribute('a_position', 0));

    const vertexShader = vertex('main', () =>
    {
        // 用 let_ 生成 WGSL 局部变量（与手写版本同形，避免矩阵乘法结合顺序变化带来浮点差异）
        const worldPosition = let_('worldPosition', transform.u_modelMatrix.multiply(vec4(a_position, 1.0)));
        const shadowPosition = let_('shadowPosition', material.u_shadowMatrix.multiply(worldPosition));
        gl_Position.assign(camera.u_viewProjection.multiply(shadowPosition));
    });

    const fragmentShader = fragment('main', () =>
    {
        return_(vec4(material.u_color.x, material.u_color.y, material.u_color.z, material.u_opacity));
    });

    return { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
}
