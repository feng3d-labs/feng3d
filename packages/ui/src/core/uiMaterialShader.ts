/**
 * UI 材质着色器的 TSL 定义（issue #712；原 `uiMaterialWGSL` 内联手写 WGSL 的 TSL 版）。
 *
 * 语义与手写逐行一致：
 * - 顶点：单位四边形 (0,0)-(1,1) 按 `u_rect` 缩放偏移 → 世界变换 → 按 `u_projection.x`
 *   选「相机投影」或「屏幕空间叠加」两条路径；uv 再按 `u_uvRect` 缩放偏移；
 * - 片元：采样纹理，与 `u_color` **逐分量**相乘（规避"uniform 第 4 分量传到 GPU 后为 0"
 *   的老坑，见 ColorMaterial / SegmentMaterial 的同款注释）。
 *
 * 两处需要说明：
 *
 * 1. **采样器的展开顺序**：手写是 `s_textureSampler`（sampler）在 binding 0、
 *    `s_texture`（texture）在 binding 1；TSL 的 `sampler2D` 展开相反——
 *    `s_texture_texture`（texture）在 binding 0、`s_texture`（sampler）在 binding 1。
 *    所以**数据侧也要跟着改**（见 UIMaterial 里写 bindingResources 的那段）。
 * 2. **两条投影路径**用 `if_ / else_` 生成（TSL 的 if 语句会收集到 if 体 / else 体）。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { attribute, float, fragment, gl_Position, if_, let_, return_, sampler2D, struct, texture2D, uniform, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';
import { createCameraUniforms, createGlobalUniforms, createTransformUniforms } from 'feng3d';

type Vec2Value = ReturnType<typeof vec2>;
type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存 */
let cached: { vertex: string; fragment: string } | null = null;

/**
 * 获取 UI 材质的 vertex / fragment WGSL。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getUIMaterialShaderWGSL(): { vertex: string; fragment: string }
{
    if (cached === null)
    {
        cached = build();
    }

    return cached;
}

function build(): { vertex: string; fragment: string }
{
    const transform = createTransformUniforms();
    const camera = createCameraUniforms();
    const global = createGlobalUniforms();

    const UIUniforms = struct('UIUniforms', {
        u_rect: vec4,
        u_color: vec4,
        u_uvRect: vec4,
        u_projection: vec4,
    });
    const material = UIUniforms(uniform('material_uniforms', 0, 3)) as unknown as {
        u_rect: Vec4Value;
        u_color: Vec4Value;
        u_uvRect: Vec4Value;
        u_projection: Vec4Value;
    };

    // 采样器展开：texture 在 binding 0、sampler 在 binding 1（与手写相反，数据侧已跟着改）
    const s_texture = sampler2D(uniform('s_texture', 1, 0));

    const a_position = vec3(attribute('a_position', 0));
    const a_uv = vec2(attribute('a_uv', 3));
    const v_uv = vec2(varying('uv', 0));

    const vertexShader = vertex('vertex', () =>
    {
        // 单位四边形按 u_rect 缩放并偏移（u_rect.xy = 左上角偏移，u_rect.zw = 宽高）
        const localPosition = let_('localPosition', vec4(
            vec2(a_position.x, a_position.y).multiply(material.u_rect.zw as Vec2Value).add(material.u_rect.xy as Vec2Value),
            0.0, 1.0,
        ) as Vec4Value);
        const worldPosition = let_('worldPosition', transform.u_modelMatrix.multiply(localPosition));

        if_(material.u_projection.x.greaterThan(0.5), () =>
        {
            // 世界空间：用相机投影，并把 y 镜像（画布 y 向下、世界 y 向上）
            gl_Position.assign(camera.u_viewProjection.multiply(
                vec4(worldPosition.x, float(0.0).subtract(worldPosition.y), worldPosition.z, float(1.0)) as Vec4Value,
            ) as Vec4Value);
        }).else(() =>
        {
            // 屏幕空间叠加：画布像素坐标 → NDC（画布尺寸由 UI Pass 注入 globalUniforms）
            gl_Position.assign(vec4(
                worldPosition.x.divide(global.u_Viewport.x).multiply(2.0).subtract(1.0),
                float(1.0).subtract(worldPosition.y.divide(global.u_Viewport.y).multiply(2.0)),
                0.0, 1.0,
            ) as Vec4Value);
        });

        // 世界空间下 position.y 的镜像与顶点 uv 一起作用，纹理方向自然正确，这里不再额外翻 uv
        v_uv.assign((a_uv.multiply(material.u_uvRect.zw as Vec2Value).add(material.u_uvRect.xy as Vec2Value)) as Vec2Value);
    });

    const fragmentShader = fragment('fragment', () =>
    {
        const textureColor = let_('textureColor', texture2D(s_texture, v_uv) as Vec4Value);

        // 逐分量书写：见文件头注释
        return_(vec4(
            textureColor.x.multiply(material.u_color.x),
            textureColor.y.multiply(material.u_color.y),
            textureColor.z.multiply(material.u_color.z),
            textureColor.w.multiply(material.u_color.w),
        ) as Vec4Value);
    });

    return { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
}
