/**
 * core 材质 WGSL 着色器注册。
 *
 * 把 shader 名称（与 core `Material.shaderName` 对应）映射到 core 包内的 WGSL 着色器资源。
 * 该模块在导入时执行注册，确保 `MaterialPipeline` 注册表中存在 color/texture/standard 三种基础 shader。
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
 * 注册基础 WGSL 着色器（color / texture / standard）。
 *
 * 注意：未注册的 shaderName（如 point/segment/skybox 等）目前不会填充 WebGPU 原生 pipeline，
 * 仍走 WebGL 兼容字段。后续按 Track B 翻译并逐步注册。
 */
export function registerCoreWGSLShaders(): void
{
    registerShader('color', {
        vertex: colorVertexWGSL,
        fragment: colorFragmentWGSL,
    });

    registerShader('texture', {
        vertex: textureVertexWGSL,
        fragment: textureFragmentWGSL,
    });

    registerShader('standard', {
        vertex: standardVertexWGSL,
        fragment: standardFragmentWGSL,
    });
}

// 模块导入时自动注册
registerCoreWGSLShaders();
