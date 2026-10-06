/**
 * DebugShadowMapMaterial 的 TSL 着色器定义（原内联手写 WGSL 的 TSL 版）。
 *
 * 语义与迁移前的手写 WGSL 一致：
 * - 顶点做标准变换并把 `a_uv` 传给 varying `uv`；
 * - 片元把 uv 翻转 Y、转成**整数 texel 坐标**，用 `textureLoad` 读**深度纹理**，
 *   再可视化输出为灰度。
 *
 * 三处需要说明：
 *
 * 1. **深度纹理用 `depthSampler`**：它的 `toWGSL` 只声明 `texture_depth_2d` 本身，
 *    **不附带 sampler**（普通纹理在 WGSL 里 texture 与 sampler 是两个绑定，深度纹理不是）。
 *    手写里那个 `s_textureSampler: sampler` 只是"占位"（注释写明 textureLoad 不使用它），
 *    TSL 不生成它。
 * 2. **NaN 安全的钳制**：手写是 `if (!(depth >= 0.0)) depth = 0.0;`——`>=` 对 NaN 为 false，
 *    所以 NaN 会被钳到 0。TSL 里用 `select` 表达同一件事，**语义等价**。
 * 3. 中间值一律 `let_`（避免内联改变浮点结合顺序，见 ARCHITECTURE_V2 §P2）。
 */
import { attribute, clamp, depthSampler, float, fragment, gl_Position, let_, mix, return_, select, struct, texelFetch, uint, uniform, uvec2, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';
import { createCameraUniforms, createTransformUniforms } from './uniforms';

type FloatValue = ReturnType<typeof float>;
type Vec2Value = ReturnType<typeof vec2>;
type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存 */
let cachedDebugShadowMapShader: { vertex: string; fragment: string } | null = null;

/**
 * 获取 DebugShadowMapMaterial 的 vertex / fragment WGSL（首次调用时构建并缓存）。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getDebugShadowMapShaderWGSL(): { vertex: string; fragment: string }
{
    if (cachedDebugShadowMapShader === null)
    {
        cachedDebugShadowMapShader = buildDebugShadowMapShader();
    }

    return cachedDebugShadowMapShader;
}

/**
 * 用 TSL 构建 DebugShadowMapMaterial 的着色器。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
function buildDebugShadowMapShader(): { vertex: string; fragment: string }
{
    const transform = createTransformUniforms();
    const camera = createCameraUniforms();

    const DebugUniforms = struct('DebugUniforms', { u_texSize: vec2, u_invert: float });
    const material = DebugUniforms(uniform('material_uniforms', 0, 3)) as unknown as { u_texSize: Vec2Value; u_invert: FloatValue };

    // 深度纹理：binding 1 的 texture（binding 0 的 sampler 是占位，不声明）
    const s_texture = depthSampler(uniform('s_texture', 1, 1));

    const a_position = vec3(attribute('a_position', 0));
    const a_uv = vec2(attribute('a_uv', 3));
    const v_uv = vec2(varying('uv'));

    const vertexShader = vertex('main', () =>
    {
        const worldPosition = let_('worldPosition', transform.u_modelMatrix.multiply(vec4(a_position, 1.0)));
        gl_Position.assign(camera.u_viewProjection.multiply(worldPosition));
        v_uv.assign(a_uv);
    });

    const fragmentShader = fragment('main', () =>
    {
        // 翻转 Y（WebGPU 纹理 V=0 在顶部）
        const flippedX = let_('flippedX', v_uv.x) as FloatValue;
        const flippedY = let_('flippedY', float(1.0).subtract(v_uv.y)) as FloatValue;

        // uv → 整数 texel 坐标（textureLoad 需要 vec2<u32>）
        // 手写：vec2<u32>(u32(clamp(uv.x,0,1) * (size.x-1)), u32(clamp(uv.y,0,1) * (size.y-1)))
        // 注意：Float.multiply 的返回类型是联合（Float | Vec2 | Vec3 | Vec4），
        // 这里逐个断言为 Float，才能喂给 uint()。
        const sizeX = let_('sizeX', material.u_texSize.x.subtract(float(1.0))) as FloatValue;
        const sizeY = let_('sizeY', material.u_texSize.y.subtract(float(1.0))) as FloatValue;
        const texelX = let_('texelX', clamp(flippedX, float(0.0), float(1.0)).multiply(sizeX) as FloatValue) as FloatValue;
        const texelY = let_('texelY', clamp(flippedY, float(0.0), float(1.0)).multiply(sizeY) as FloatValue) as FloatValue;
        const texel = let_('texel', uvec2(uint(texelX), uint(texelY))) as unknown as { x: unknown; y: unknown };

        // 读深度（depth 纹理返回 ∈ [0,1]）
        const depthValue = var_('depth', texelFetch(s_texture, texel as never)) as FloatValue;
        // 手写：if (!(depth >= 0.0)) depth = 0.0;  if (!(depth <= 1.0)) depth = 1.0;
        // 用 select 表达同一件事（' >=' 对 NaN 为 false，所以 NaN → 0）
        depthValue.assign(select(depthValue.greaterThanOrEqual(0.0), depthValue, 0.0));
        depthValue.assign(select(depthValue.lessThanOrEqual(1.0), depthValue, 1.0));

        // 可视化：深度作为灰度；u_invert = 1 时输出 1 - depth
        // （three 的 ShadowMapViewer 用 UnpackDepthRGBAShader，它输出的正是 1 - depth）
        const gray = let_('gray', mix(depthValue, float(1.0).subtract(depthValue), material.u_invert)) as FloatValue;

        return_(vec4(gray, gray, gray, 1.0) as Vec4Value);
    });

    return { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
}
