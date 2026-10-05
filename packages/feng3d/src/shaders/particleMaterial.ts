/**
 * 粒子材质着色器 WGSL（手写）。
 *
 * 从 GLSL 翻译而来（规范 §9），语义与下列遗留文件一致：
 * - 「packages/feng3d/src/shaders/modules/particle_pars_vert.glsl」（缩放 → 旋转 → 公告牌 → 位移 → UV）
 * - 「packages/feng3d/src/shaders/Particles_Additive.vertex.glsl / .fragment.glsl」（贴图 × 粒子颜色）
 *
 * 为什么手写而不用 TSL：「@feng3d/tsl」目前没有 mat3 类型封装，而公告牌矩阵是 mat3x3<f32>；
 * 与 standardVertexShader.ts 同属「手写 WGSL」一类，待 TSL 支持 mat3 后再迁移。
 *
 * 顶点输入（location 与 ParticleSystem 写入 renderObject.vertices 的属性名一一对应）：
 * - 0 a_position / 3 a_uv：四边形几何体（QuadGeometry）
 * - 4 a_particle_position / 5 a_particle_scale / 6 a_particle_rotation
 * - 7 a_particle_color / 8 a_particle_tilingOffset / 9 a_particle_flipUV
 *
 * 绑定：
 * - @group(0) @binding(1) cameraUniforms（ForwardRenderer 注入）
 * - @group(0) @binding(3) material_uniforms（{ u_TintColor: vec4<f32> }）
 * - @group(1) @binding(0) s_texture: texture_2d<f32>
 * - @group(1) @binding(1) s_textureSampler: sampler
 * - @group(1) @binding(2) particle_uniforms（{ u_particle_billboardMatrix: mat3x3<f32>, u_modelMatrix: mat4x4<f32> }）
 *   由 ParticleSystem 每帧写入：模拟空间为 World 时 u_modelMatrix 取单位矩阵（粒子位置已是世界坐标），
 *   Local 时取粒子系统宿主 Object3D 的 local2world。
 */
import { cameraUniformsWGSL } from '../cameras/Camera';

/** 粒子顶点着色器 WGSL */
const particleVertexWGSL = `
struct VertexInput {
    @location(0) a_position: vec3<f32>,
    @location(3) a_uv: vec2<f32>,
    @location(4) a_particle_position: vec3<f32>,
    @location(5) a_particle_scale: vec3<f32>,
    @location(6) a_particle_rotation: vec3<f32>,
    @location(7) a_particle_color: vec4<f32>,
    @location(8) a_particle_tilingOffset: vec4<f32>,
    @location(9) a_particle_flipUV: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) uv: vec2<f32>,
}

struct ParticleUniforms {
    u_particle_billboardMatrix: mat3x3<f32>,
    u_modelMatrix: mat4x4<f32>,
}

@group(1) @binding(2) var<uniform> particle_uniforms: ParticleUniforms;
` + cameraUniformsWGSL + `
/**
 * 按 YXZ 顺序构造旋转矩阵（与 particle_pars_vert.glsl 的默认分支逐行一致；
 * 顶点数据里的 rotation 已是弧度）。
 */
fn makeParticleRotationMatrix(rotation: vec3<f32>) -> mat3x3<f32> {
    let sinX = sin(rotation.x);
    let cosX = cos(rotation.x);
    let sinY = sin(rotation.y);
    let cosY = cos(rotation.y);
    let sinZ = sin(rotation.z);
    let cosZ = cos(rotation.z);

    let ce = cosY * cosZ;
    let cf = cosY * sinZ;
    let de = sinY * cosZ;
    let df = sinY * sinZ;

    let te0 = ce + df * sinX;
    let te4 = de * sinX - cf;
    let te8 = cosX * sinY;

    let te1 = cosX * sinZ;
    let te5 = cosX * cosZ;
    let te9 = -sinX;

    let te2 = cf * sinX - de;
    let te6 = df + ce * sinX;
    let te10 = cosX * cosY;

    // WGSL 的 mat3x3 按列构造，与 GLSL 的 tmp[0] / tmp[1] / tmp[2] 赋值顺序一致
    return mat3x3<f32>(vec3<f32>(te0, te1, te2), vec3<f32>(te4, te5, te6), vec3<f32>(te8, te9, te10));
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    // 缩放 → 旋转 → 公告牌 → 位移（顺序与 GLSL particleAnimation 一致）
    var localPosition = input.a_position * input.a_particle_scale;
    localPosition = makeParticleRotationMatrix(input.a_particle_rotation) * localPosition;
    localPosition = particle_uniforms.u_particle_billboardMatrix * localPosition;
    localPosition = localPosition + input.a_particle_position;

    let worldPosition = particle_uniforms.u_modelMatrix * vec4<f32>(localPosition, 1.0);
    output.position = cameraUniforms.u_viewProjection * worldPosition;

    output.color = input.a_particle_color;

    // UV：翻转 + 平铺偏移（textureSheetAnimation 模块）
    var uv = input.a_uv;
    if (input.a_particle_flipUV.x > 0.5) { uv.x = 1.0 - uv.x; }
    if (input.a_particle_flipUV.y > 0.5) { uv.y = 1.0 - uv.y; }
    output.uv = uv * input.a_particle_tilingOffset.xy + input.a_particle_tilingOffset.zw;

    return output;
}
`;

/** 粒子片段着色器 WGSL（贴图 × 粒子颜色 × 材质色调） */
const particleFragmentWGSL = `
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) uv: vec2<f32>,
}

struct ParticleMaterialUniforms {
    u_TintColor: vec4<f32>,
}

@group(0) @binding(3) var<uniform> material_uniforms: ParticleMaterialUniforms;

@group(1) @binding(0) var s_texture: texture_2d<f32>;
@group(1) @binding(1) var s_textureSampler: sampler;

@fragment
fn main(input: VertexOutput) -> @location(0) vec4<f32> {
    let texColor = textureSample(s_texture, s_textureSampler, input.uv);
    let tint = material_uniforms.u_TintColor;

    // 逐分量相乘（与 GLSL particle_frag / Particles_Additive.fragment 一致）
    return vec4<f32>(
        texColor.rgb * input.color.rgb * tint.rgb,
        texColor.a * input.color.a * tint.a,
    );
}
`;

/**
 * 粒子材质的 vertex / fragment WGSL。
 *
 * 两份文本都是纯字符串常量，import 本模块不产生副作用（规范 §15 R2）。
 */
export const particleShaderWGSL: { readonly vertex: string; readonly fragment: string } = {
    vertex: particleVertexWGSL,
    fragment: particleFragmentWGSL,
};

/**
 * 获取粒子材质的 vertex / fragment WGSL。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getParticleShaderWGSL(): { readonly vertex: string; readonly fragment: string }
{
    return particleShaderWGSL;
}
