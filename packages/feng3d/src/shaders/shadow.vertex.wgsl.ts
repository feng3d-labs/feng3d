/**
 * 阴影深度顶点着色器 WGSL
 *
 * 从 shadow.vertex.glsl 翻译：仅变换位置 + 传递 worldPosition。
 *
 * TransformUniforms / CameraUniforms 由 transformUniformsWGSL / cameraUniformsWGSL 拼接，
 * 避免重复声明（struct 定义在数据源 Object3D.ts / Camera.ts 中维护）。
 */
import { cameraUniformsWGSL } from '../cameras/Camera';
import { transformUniformsWGSL } from '../core/Object3D';

export const shadowVertexWGSL = `
struct VertexInput {
    @location(0) a_position: vec3<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPosition: vec3<f32>,
}
` + transformUniformsWGSL + cameraUniformsWGSL + `
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
