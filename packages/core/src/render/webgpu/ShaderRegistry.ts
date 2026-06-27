/**
 * core 材质 WGSL 着色器注册。
 *
 * 把 shader 名称（与 core `Material.shaderName` 对应）映射到 core 包内的 WGSL 着色器资源。
 * 该模块在导入时执行注册。
 *
 * 绑定约定（所有 core WGSL 顶点着色器统一，详见 `color.vertex.wgsl.ts`）：
 * - @group(0) @binding(0) var<uniform> transform      - { u_modelMatrix, u_ITModelMatrix }
 * - @group(0) @binding(1) var<uniform> cameraUniforms - 相机数据
 * - @group(0) @binding(2) var<uniform> globalUniforms - 场景环境光 / 时间
 * - @group(0) @binding(3) var<uniform> uniforms       - 材质参数
 * - @group(1) @binding(N) var <texture/sampler>       - 材质纹理
 *
 * 顶点 location 约定：
 * - @location(0) position  - @location(1) normal  - @location(2) tangent
 * - @location(3) uv        - @location(4) color
 */
import { colorFragmentWGSL } from '../../shaders/color.fragment.wgsl';
import { colorVertexWGSL } from '../../shaders/color.vertex.wgsl';
import { standardFragmentWGSL } from '../../shaders/standard.fragment.wgsl';
import { standardVertexWGSL } from '../../shaders/standard.vertex.wgsl';
import { textureFragmentWGSL } from '../../shaders/texture.fragment.wgsl';
import { textureVertexWGSL } from '../../shaders/texture.vertex.wgsl';
import { registerShader } from './MaterialPipeline';

/**
 * 通用简单顶点着色器 WGSL（position + color，与 color 顶点着色器一致）。
 *
 * 用于 point/segment/outline/wireframe/shadow 等简单 shader 的桩。
 */
const simpleVertexWGSL = colorVertexWGSL;

/**
 * 固定白色片段着色器 WGSL（桩）。
 */
const whiteFragmentWGSL = `
struct FragmentInput {
    @location(0) color: vec4<f32>,
}
struct FragmentOutput {
    @location(0) color: vec4<f32>,
}
@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = vec4<f32>(1.0, 1.0, 1.0, 1.0);
    return output;
}
`;

/**
 * 线框片段着色器 WGSL（桩，固定线框颜色）。
 */
const wireframeFragmentWGSL = `
struct FragmentOutput {
    @location(0) color: vec4<f32>,
}
@fragment
fn main() -> FragmentOutput {
    var output: FragmentOutput;
    output.color = vec4<f32>(1.0, 1.0, 1.0, 1.0);
    return output;
}
`;

/**
 * 阴影片段着色器 WGSL（桩，只写深度，不输出颜色）。
 */
const shadowFragmentWGSL = `
@fragment
fn main() {}
`;

/**
 * 注册全部 core WGSL 着色器。
 *
 * - color/texture/standard：完整可用版本。
 * - point/segment/outline/wireframe/shadow/water/terrain/Particles_*：最小 WGSL 桩，
 *   能编译通过并简化渲染，后续按需完善为完整着色器。
 */
export function registerCoreWGSLShaders(): void
{
    // 完整着色器
    registerShader('color', { vertex: colorVertexWGSL, fragment: colorFragmentWGSL });
    registerShader('texture', { vertex: textureVertexWGSL, fragment: textureFragmentWGSL });
    registerShader('standard', { vertex: standardVertexWGSL, fragment: standardFragmentWGSL });

    // 最小桩：复用简单顶点着色器 + 固定色片段
    registerShader('point', { vertex: simpleVertexWGSL, fragment: whiteFragmentWGSL });
    registerShader('segment', { vertex: simpleVertexWGSL, fragment: whiteFragmentWGSL });
    registerShader('outline', { vertex: simpleVertexWGSL, fragment: whiteFragmentWGSL });
    registerShader('wireframe', { vertex: simpleVertexWGSL, fragment: wireframeFragmentWGSL });
    registerShader('water', { vertex: standardVertexWGSL, fragment: standardFragmentWGSL });
    registerShader('terrain', { vertex: standardVertexWGSL, fragment: standardFragmentWGSL });

    // 阴影：只写深度
    registerShader('shadow', { vertex: simpleVertexWGSL, fragment: shadowFragmentWGSL });

    // 粒子：复用 standard
    registerShader('Particles_Additive', { vertex: standardVertexWGSL, fragment: standardFragmentWGSL });
    registerShader('Particles_AlphaBlendedPremultiply', { vertex: standardVertexWGSL, fragment: standardFragmentWGSL });
}

// 模块导入时自动注册
registerCoreWGSLShaders();
