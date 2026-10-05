/**
 * 粒子材质着色器（TSL 构建）。
 *
 * 语义与手写版本（以及更早的 GLSL `particle_pars_vert.glsl`）逐条一致：
 * 顶点做「缩放 → 旋转（YXZ）→ 公告牌 → 位移 → 模型 / 投影」，片元做「贴图 × 粒子颜色 × 材质色调」。
 *
 * 顶点输入（location 与 ParticleSystem 写入 renderObject.vertices 的属性名一一对应）：
 * - 0 a_position / 3 a_uv（QuadGeometry）
 * - 4 a_particle_position / 5 a_particle_scale / 6 a_particle_rotation
 * - 7 a_particle_color / 8 a_particle_tilingOffset / 9 a_particle_flipUV
 *
 * 绑定：
 * - @group(0) @binding(1) cameraUniforms（ForwardRenderer 注入）
 * - @group(0) @binding(3) material_uniforms（{ u_TintColor: vec4<f32> }）
 * - @group(1) @binding(0/1) s_texture（sampler2D 展开为 s_texture_texture + s_texture，与 TextureMaterial 同约定）
 * - @group(1) @binding(2) particle_uniforms（{ u_particle_billboardMatrix: mat3x3<f32>, u_modelMatrix: mat4x4<f32> }）
 *   由 ParticleSystem 每帧写入：World 模拟空间下 u_modelMatrix 取单位矩阵（粒子位置已是世界坐标），
 *   Local 时取宿主 Object3D 的 local2world。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { attribute, cos, float, fragment, func, gl_Position, if_, let_, mat3, mat4, return_, sampler2D, sin, struct, texture2D, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';
import { createCameraUniforms } from './tsl/uniforms';

/** 懒构建缓存 */
let cachedParticleShader: { vertex: string; fragment: string } | null = null;

/**
 * 获取粒子材质的 vertex / fragment WGSL（首次调用时构建并缓存）。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getParticleShaderWGSL(): { vertex: string; fragment: string }
{
    if (cachedParticleShader === null)
    {
        cachedParticleShader = buildParticleShader();
    }

    return cachedParticleShader;
}

/**
 * 用 TSL 构建粒子材质的着色器。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
function buildParticleShader(): { vertex: string; fragment: string }
{
    const camera = createCameraUniforms();

    const ParticleMaterialUniforms = struct('ParticleMaterialUniforms', { u_TintColor: vec4 });
    const material = ParticleMaterialUniforms(uniform('material_uniforms', 0, 3));

    const ParticleUniforms = struct('ParticleUniforms', {
        u_particle_billboardMatrix: mat3,
        u_modelMatrix: mat4,
    });
    const particleUniforms = ParticleUniforms(uniform('particle_uniforms', 1, 2));

    // 采样器展开为 group 1 的 texture(0) + sampler(1)（与 TextureMaterial 同一约定）
    const s_texture = sampler2D(uniform('s_texture', 1, 0));

    // 顶点输入（location 显式指定，与 ParticleSystem 的实例属性表对应）
    const a_position = vec3(attribute('a_position', 0));
    const a_uv = vec2(attribute('a_uv', 3));
    const a_particle_position = vec3(attribute('a_particle_position', 4));
    const a_particle_scale = vec3(attribute('a_particle_scale', 5));
    const a_particle_rotation = vec3(attribute('a_particle_rotation', 6));
    const a_particle_color = vec4(attribute('a_particle_color', 7));
    const a_particle_tilingOffset = vec4(attribute('a_particle_tilingOffset', 8));
    const a_particle_flipUV = vec2(attribute('a_particle_flipUV', 9));

    const v_color = vec4(varying('color'));
    const v_uv = vec2(varying('uv'));

    /**
     * 按 YXZ 顺序构造旋转矩阵（与 particle_pars_vert.glsl 的默认分支逐行一致；顶点数据里的 rotation 已是弧度）。
     */
    const makeParticleRotationMatrix = func(
        'makeParticleRotationMatrix',
        [['rotation', vec3]],
        mat3,
        (rotation) =>
        {
            const sinX = let_('sinX', sin(rotation.x));
            const cosX = let_('cosX', cos(rotation.x));
            const sinY = let_('sinY', sin(rotation.y));
            const cosY = let_('cosY', cos(rotation.y));
            const sinZ = let_('sinZ', sin(rotation.z));
            const cosZ = let_('cosZ', cos(rotation.z));

            const ce = let_('ce', cosY.multiply(cosZ));
            const cf = let_('cf', cosY.multiply(sinZ));
            const de = let_('de', sinY.multiply(cosZ));
            const df = let_('df', sinY.multiply(sinZ));

            return_(mat3(
                vec3(ce.add(df.multiply(sinX)), cosX.multiply(sinZ), cf.multiply(sinX).subtract(de)),
                vec3(de.multiply(sinX).subtract(cf), cosX.multiply(cosZ), df.add(ce.multiply(sinX))),
                vec3(cosX.multiply(sinY), sinX.negate(), cosX.multiply(cosY)),
            ));
        },
    );

    const vertexShader = vertex('main', () =>
    {
        // 缩放 → 旋转 → 公告牌 → 位移（顺序与 GLSL particleAnimation 一致）
        const scaled = let_('scaledPosition', a_position.multiply(a_particle_scale));
        const rotated = let_('rotatedPosition', makeParticleRotationMatrix(a_particle_rotation).multiply(scaled));
        const billboarded = let_('billboardedPosition', particleUniforms.u_particle_billboardMatrix.multiply(rotated));
        const localPosition = let_('localPosition', billboarded.add(a_particle_position));
        const worldPosition = let_('worldPosition', particleUniforms.u_modelMatrix.multiply(vec4(localPosition, 1.0)));

        gl_Position.assign(camera.u_viewProjection.multiply(worldPosition));

        // 颜色与 UV
        const uv = var_('uv', a_uv);

        if_(a_particle_flipUV.x.greaterThan(0.5), () =>
        {
            uv.assign(vec2(float(1.0).subtract(uv.x), uv.y));
        });
        if_(a_particle_flipUV.y.greaterThan(0.5), () =>
        {
            uv.assign(vec2(uv.x, float(1.0).subtract(uv.y)));
        });

        v_color.assign(a_particle_color);
        v_uv.assign(uv.multiply(a_particle_tilingOffset.xy).add(a_particle_tilingOffset.zw));
    });

    const fragmentShader = fragment('main', () =>
    {
        const texColor = let_('texColor', texture2D(s_texture, v_uv));
        const tint = let_('tint', material.u_TintColor);

        return_(vec4(
            texColor.xyz.multiply(v_color.xyz).multiply(tint.xyz),
            texColor.a.multiply(v_color.a).multiply(tint.a),
        ));
    });

    return { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
}
