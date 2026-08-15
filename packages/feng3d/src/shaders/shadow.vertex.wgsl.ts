/**
 * 阴影深度顶点着色器 WGSL
 *
 * 从 shadow.vertex.glsl 翻译：仅变换位置 + 传递 worldPosition。
 *
 * TransformUniforms 由 transformUniformsWGSL 拼接；相机侧不复用完整
 * cameraUniformsWGSL——阴影 Pass 只写 u_viewProjection 一个字段（见
 * ShadowRenderer.drawObject3D），复用完整结构会让其余 6 个字段每次上传
 * 都报「没有找到统一块变量属性」警告，故此处声明同槽位的精简结构。
 */
import { transformUniformsWGSL } from '../core/Object3D';

export const shadowVertexWGSL = `
struct VertexInput {
    @location(0) a_position: vec3<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPosition: vec3<f32>,
}
` + transformUniformsWGSL + `
struct ShadowCameraUniforms {
    u_viewProjection: mat4x4<f32>,
}

@group(0) @binding(1) var<uniform> cameraUniforms: ShadowCameraUniforms;
@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let worldPosition = transform.u_modelMatrix * vec4<f32>(input.a_position, 1.0);
    output.position = cameraUniforms.u_viewProjection * worldPosition;
    output.worldPosition = worldPosition.xyz;
    return output;
}
`;

export default shadowVertexWGSL;
