/**
 * NormalMaterial 的 TSL 着色器定义。
 *
 * 语义与迁移前的手写 WGSL 一致（法线 → RGB，无光照计算）：
 * 顶点变换 position 与 normal，片元输出 `normalize(worldNormal) * 0.5 + 0.5`。
 *
 * 构建结果**懒加载并缓存**：模块顶层不执行着色器构建（AGENTS.md §15 R2 零模块级副作用）。
 */
import { attribute, fragment, gl_Position, let_, normalize, return_, varying, vec3, vec4, vertex } from '@feng3d/tsl';
import { createCameraUniforms, createTransformUniforms } from './uniforms';

/** 懒构建缓存（首次调用时填充） */
let cachedNormalShader: { vertex: string; fragment: string } | null = null;

/**
 * 获取 NormalMaterial 的 vertex / fragment WGSL（首次调用时用 TSL 构建并缓存）。
 *
 * @returns 与手写版本语义一致的 vertex / fragment WGSL
 */
export function getNormalShaderWGSL(): { vertex: string; fragment: string }
{
    if (cachedNormalShader === null)
    {
        cachedNormalShader = buildNormalShader();
    }

    return cachedNormalShader;
}

/**
 * 用 TSL 构建 NormalMaterial 的 vertex / fragment 着色器。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
function buildNormalShader(): { vertex: string; fragment: string }
{
    const transform = createTransformUniforms();
    const camera = createCameraUniforms();

    const a_position = vec3(attribute('a_position', 0));
    const a_normal = vec3(attribute('a_normal', 1));
    const worldNormal = vec3(varying('worldNormal'));

    const vertexShader = vertex('main', () =>
    {
        // 用 let_ 生成 WGSL 局部变量：与手写版本同形，避免中间值被内联后改变矩阵乘法的结合顺序（浮点结果会差 1 ulp）
        const worldPosition = let_('worldPosition', transform.u_modelMatrix.multiply(vec4(a_position, 1.0)));
        gl_Position.assign(camera.u_viewProjection.multiply(worldPosition));
        const normal = let_('normal', normalize(transform.u_ITModelMatrix.multiply(vec4(a_normal, 0.0)).xyz));
        worldNormal.assign(normal);
    });

    const fragmentShader = fragment('main', () =>
    {
        // 法线 [-1,1] → [0,1]
        return_(vec4(normalize(worldNormal).multiply(0.5).add(vec3(0.5)), 1.0));
    });

    return { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
}
