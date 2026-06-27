/**
 * core 材质 WGSL 着色器注册。
 *
 * 集中注册每个 shader 的：WGSL 源码 + uniforms 工厂 + 渲染状态（renderState）。
 * uniforms 与渲染状态隐含于此（不再有独立的 XxxUniforms 类或通用 RenderParams）。
 * 该模块在导入时执行注册。
 *
 * 绑定约定（所有 core WGSL 顶点着色器统一，详见 `color.vertex.wgsl.ts`）：
 * - @group(0) @binding(0) var<uniform> transform      - { u_modelMatrix, u_ITModelMatrix }
 * - @group(0) @binding(1) var<uniform> cameraUniforms - 相机数据
 * - @group(0) @binding(2) var<uniform> globalUniforms - 场景环境光 / 时间
 * - @group(0) @binding(3) var<uniform> uniforms       - 材质参数
 * - @group(1) @binding(N) var <texture/sampler>       - 材质纹理
 */
import { Color3, Color4 } from '@feng3d/math';
import { colorFragmentWGSL } from '../../shaders/color.fragment.wgsl';
import { colorVertexWGSL } from '../../shaders/color.vertex.wgsl';
import { standardFragmentWGSL } from '../../shaders/standard.fragment.wgsl';
import { standardVertexWGSL } from '../../shaders/standard.vertex.wgsl';
import { textureFragmentWGSL } from '../../shaders/texture.fragment.wgsl';
import { textureVertexWGSL } from '../../shaders/texture.vertex.wgsl';
import { Texture2D } from '../../textures/Texture2D';
import { TextureCube } from '../../textures/TextureCube';
import { registerShader } from './MaterialPipeline';

/**
 * 通用简单顶点着色器 WGSL（position + color，与 color 顶点着色器一致）。
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
 * 注册全部 core WGSL 着色器（含 uniforms 工厂与渲染状态）。
 *
 * uniforms 工厂创建各 shader 的默认 uniform 对象（原 XxxUniforms 类的字段）。
 * renderState 声明各 shader 的渲染管线配置（原 RenderParams/shaderlib 注册的 renderParams）。
 */
export function registerCoreWGSLShaders(): void
{
    // ---- color：完整可用 ----
    registerShader('color', {
        vertex: colorVertexWGSL,
        fragment: colorFragmentWGSL,
        uniformsFactory: () => ({ u_diffuseInput: new Color4() }),
        renderState: { cullFace: 'back', frontFace: 'cw', depthCompare: 'less', depthWriteEnabled: true },
    });

    // ---- texture：完整可用 ----
    registerShader('texture', {
        vertex: textureVertexWGSL,
        fragment: textureFragmentWGSL,
        uniformsFactory: () => ({ u_color: new Color4(), s_texture: Texture2D.default }),
        renderState: { cullFace: 'back', frontFace: 'cw', depthCompare: 'less', depthWriteEnabled: true },
    });

    // ---- standard：完整可用（漫反射+环境光） ----
    registerShader('standard', {
        vertex: standardVertexWGSL,
        fragment: standardFragmentWGSL,
        uniformsFactory: () => ({
            u_PointSize: 1,
            s_diffuse: Texture2D.default,
            u_diffuse: new Color4(1, 1, 1, 1),
            u_alphaThreshold: 0,
            s_normal: Texture2D.defaultNormal,
            s_specular: Texture2D.default,
            u_specular: new Color3(),
            u_glossiness: 50,
            s_ambient: Texture2D.default,
            u_ambient: new Color4(),
            s_envMap: TextureCube.default,
            u_reflectivity: 1,
            u_fogMinDistance: 0,
            u_fogMaxDistance: 100,
            u_fogColor: new Color3(),
            u_fogDensity: 0.1,
            u_fogMode: 0,
        }),
        renderState: { cullFace: 'back', frontFace: 'cw', depthCompare: 'less', depthWriteEnabled: true },
    });

    // ---- point：桩 ----
    registerShader('point', {
        vertex: simpleVertexWGSL,
        fragment: whiteFragmentWGSL,
        uniformsFactory: () => ({ u_color: new Color4(), u_PointSize: 1 }),
        renderState: { topology: 'point-list', cullFace: 'none' },
    });

    // ---- segment：线段，开启混合 ----
    registerShader('segment', {
        vertex: simpleVertexWGSL,
        fragment: whiteFragmentWGSL,
        uniformsFactory: () => ({ u_segmentColor: new Color4() }),
        renderState: { topology: 'line-list', enableBlend: true, blendSrc: 'src-alpha', blendDst: 'one-minus-src-alpha', cullFace: 'none' },
    });

    // ---- outline：剔除正面 ----
    registerShader('outline', {
        vertex: simpleVertexWGSL,
        fragment: whiteFragmentWGSL,
        renderState: { cullFace: 'front', enableBlend: false },
    });

    // ---- wireframe：线框 ----
    registerShader('wireframe', {
        vertex: simpleVertexWGSL,
        fragment: wireframeFragmentWGSL,
        renderState: { topology: 'line-list', cullFace: 'none' },
    });

    // ---- water：复用 standard ----
    registerShader('water', {
        vertex: standardVertexWGSL,
        fragment: standardFragmentWGSL,
        uniformsFactory: () => ({
            u_alpha: 1.0,
            u_time: 0.0,
            u_size: 10.0,
            u_distortionScale: 20.0,
            u_waterColor: new Color3().fromUnit(0x555555),
            s_normalSampler: Texture2D.default,
            s_mirrorSampler: Texture2D.default,
        }),
        renderState: { cullFace: 'back', frontFace: 'cw', depthCompare: 'less', depthWriteEnabled: true },
    });

    // ---- terrain：复用 standard ----
    registerShader('terrain', {
        vertex: standardVertexWGSL,
        fragment: standardFragmentWGSL,
        uniformsFactory: () => ({
            u_diffuse: new Color4(1, 1, 1, 1),
            s_diffuse: Texture2D.default,
        }),
        renderState: { cullFace: 'back', frontFace: 'cw', depthCompare: 'less', depthWriteEnabled: true },
    });

    // ---- shadow：只写深度 ----
    registerShader('shadow', {
        vertex: simpleVertexWGSL,
        fragment: shadowFragmentWGSL,
        renderState: { cullFace: 'front', depthCompare: 'less', depthWriteEnabled: true },
    });

    // ---- skybox：复用 simple（实际由 SkyBoxRenderer 内联 WGSL） ----
    registerShader('skybox', {
        vertex: simpleVertexWGSL,
        fragment: whiteFragmentWGSL,
        uniformsFactory: () => ({ s_skyboxTexture: TextureCube.default }),
        renderState: { cullFace: 'none', depthCompare: 'less-equal', depthWriteEnabled: false },
    });

    // ---- ui：纹理 + 颜色混合（桩，复用 texture 着色器） ----
    registerShader('ui', {
        vertex: textureVertexWGSL,
        fragment: textureFragmentWGSL,
        uniformsFactory: () => ({ u_color: new Color4(), s_texture: Texture2D.default }),
        renderState: { enableBlend: true, blendSrc: 'src-alpha', blendDst: 'one-minus-src-alpha', depthCompare: 'always', depthWriteEnabled: false, cullFace: 'none' },
    });

    // ---- 粒子：复用 standard ----
    registerShader('Particles_Additive', {
        vertex: standardVertexWGSL,
        fragment: standardFragmentWGSL,
        renderState: { enableBlend: true, blendSrc: 'src-alpha', blendDst: 'one', cullFace: 'none' },
    });
    registerShader('Particles_AlphaBlendedPremultiply', {
        vertex: standardVertexWGSL,
        fragment: standardFragmentWGSL,
        renderState: { enableBlend: true, blendSrc: 'one', blendDst: 'one-minus-src-alpha', cullFace: 'none' },
    });
}

// 模块导入时自动注册
registerCoreWGSLShaders();
