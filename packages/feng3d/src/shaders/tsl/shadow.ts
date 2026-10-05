/**
 * 阴影 Pass 的 TSL 着色器定义（depth-only，vertex-only pipeline）。
 *
 * 语义与迁移前的 `shaders/shadow.vertex.wgsl.ts` 一致：只变换位置 + 把世界坐标传给 varying
 * （varying 供后续可能的片元使用；当前 ShadowRenderer 用 vertex-only pipeline、无 fragment）。
 *
 * 相机侧用**精简**的 `ShadowCameraUniforms`（只 `u_viewProjection`）：阴影 Pass 只写这一个字段，
 * 复用完整 `CameraUniforms` 会让其余 6 个字段每次上传都报「没有找到统一块变量属性」警告。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { attribute, gl_Position, let_, varying, vec3, vec4, vertex } from '@feng3d/tsl';
import { createShadowCameraUniforms, createTransformUniforms } from './uniforms';

/** 懒构建缓存 */
let cachedShadowVertexShader: string | null = null;

/**
 * 获取阴影 Pass 顶点着色器的 WGSL（首次调用时构建并缓存）。
 *
 * @returns 顶点着色器 WGSL 文本
 */
export function getShadowVertexShaderWGSL(): string
{
    if (cachedShadowVertexShader === null)
    {
        cachedShadowVertexShader = buildShadowVertexShader();
    }

    return cachedShadowVertexShader;
}

/**
 * 用 TSL 构建阴影 Pass 的顶点着色器。
 *
 * @returns 顶点着色器的 WGSL 文本
 */
function buildShadowVertexShader(): string
{
    const transform = createTransformUniforms();
    const camera = createShadowCameraUniforms();

    const a_position = vec3(attribute('a_position', 0));
    const v_worldPosition = vec3(varying('worldPosition'));

    const vertexShader = vertex('main', () =>
    {
        // 中间值用 let_：与手写版本同形，避免内联改变矩阵乘法的浮点结合顺序（见 ARCHITECTURE_V2 §P2）
        const worldPosition = let_('worldPosition', transform.u_modelMatrix.multiply(vec4(a_position, 1.0)));
        gl_Position.assign(camera.u_viewProjection.multiply(worldPosition));
        v_worldPosition.assign(worldPosition.xyz);
    });

    return vertexShader.toWGSL();
}
