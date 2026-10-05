/**
 * 天空盒的 TSL 着色器定义。
 *
 * 语义与迁移前 `SkyBox.ts` 内联的 `skyboxWGSL` 一致：
 * 用 `@builtin(vertex_index)` 从硬编码的 36 个立方体顶点里取位置，去掉视图矩阵的平移分量
 * （让天空盒跟随相机），位置取 `xyww` 保证深度为 1；片元按方向向量采样立方体贴图。
 *
 * 本批为此给 TSL 补的能力（原先都没有）：
 * - `samplerCube` + `texture(cubeSampler, vec3)` → `texture_cube<f32>` / `textureSample`；
 * - `arrayWithValues(vec3, values)` → `array<vec3<f32>, 36>(...)`（模块级常量数组）；
 * - `mat4(c0, c1, c2, c3)` → `mat4x4<f32>(...)`；`Mat4.index(i)` → `m[i]`；
 * - `gl_VertexID`（已有）。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { arrayWithValues, fragment, gl_Position, gl_VertexID, int, let_, mat4, return_, samplerCube, texture, uniform, var_, varying, vec3, vec4, vertex } from '@feng3d/tsl';
import { createCameraUniforms } from './uniforms';

/**
 * 硬编码的立方体 36 个顶点（6 个面 × 2 三角形 × 3 顶点）。
 *
 * 顺序与迁移前 `skyboxWGSL` 里的 `pos` 数组逐项一致。
 */
const SKYBOX_POSITIONS: [number, number, number][] = [
    // +Z
    [-1, 1, 1], [1, 1, 1], [1, -1, 1], [1, -1, 1], [-1, -1, 1], [-1, 1, 1],
    // -Z
    [1, 1, -1], [-1, 1, -1], [-1, -1, -1], [-1, -1, -1], [1, -1, -1], [1, 1, -1],
    // +X
    [1, 1, 1], [1, 1, -1], [1, -1, -1], [1, -1, -1], [1, -1, 1], [1, 1, 1],
    // -X
    [-1, 1, -1], [-1, 1, 1], [-1, -1, 1], [-1, -1, 1], [-1, -1, -1], [-1, 1, -1],
    // +Y
    [-1, 1, -1], [1, 1, -1], [1, 1, 1], [1, 1, 1], [-1, 1, 1], [-1, 1, -1],
    // -Y
    [-1, -1, 1], [1, -1, 1], [1, -1, -1], [1, -1, -1], [-1, -1, -1], [-1, -1, 1],
];

/** 懒构建缓存 */
let cachedSkyBoxShader: { vertex: string; fragment: string } | null = null;

/**
 * 获取天空盒的 vertex / fragment WGSL（首次调用时构建并缓存）。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getSkyBoxShaderWGSL(): { vertex: string; fragment: string }
{
    if (cachedSkyBoxShader === null)
    {
        cachedSkyBoxShader = buildSkyBoxShader();
    }

    return cachedSkyBoxShader;
}

/**
 * 用 TSL 构建天空盒着色器。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
function buildSkyBoxShader(): { vertex: string; fragment: string }
{
    const camera = createCameraUniforms();
    const s_skyboxTexture = samplerCube(uniform('s_skyboxTexture', 1, 0));

    // 模块级常量数组（externalVar → WGSL 的 const）
    const pos = var_('pos', arrayWithValues(vec3, SKYBOX_POSITIONS.map(([x, y, z]) => vec3(x, y, z))));

    const v_dir = vec3(varying('dir'));

    const vertexShader = vertex('vertex', () =>
    {
        const p = let_('p', pos.index(int(gl_VertexID)));

        // 去掉视图矩阵的平移分量（第 4 行取 (0,0,0,1)，前三行只取 xyz）
        const col0 = vec4(camera.u_viewMatrix.index(0).xyz, 0.0);
        const col1 = vec4(camera.u_viewMatrix.index(1).xyz, 0.0);
        const col2 = vec4(camera.u_viewMatrix.index(2).xyz, 0.0);
        const col3 = vec4(0.0, 0.0, 0.0, 1.0);
        const viewNoTrans = mat4(col0, col1, col2, col3);

        const viewProjectionNoTrans = camera.u_projectionMatrix.multiply(viewNoTrans);
        const clipPos = let_('clipPos', viewProjectionNoTrans.multiply(vec4(p, 1.0)));
        // xyww：深度为 1（远平面），保证天空盒不遮挡任何物体
        gl_Position.assign(vec4(vec3(clipPos.xy, clipPos.w), clipPos.w));
        v_dir.assign(p);
    });

    const fragmentShader = fragment('fragment', () =>
    {
        return_(texture(s_skyboxTexture, v_dir));
    });

    return { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
}
