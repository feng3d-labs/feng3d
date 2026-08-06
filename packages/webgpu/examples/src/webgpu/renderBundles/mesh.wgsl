struct Uniforms {
  viewProjectionMatrix: mat4x4<f32>
}
@group(0) @binding(0) var<uniform> uniforms : Uniforms;

@group(1) @binding(0) var<uniform> modelMatrix : mat4x4<f32>;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) uv: vec2<f32>,
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = uniforms.viewProjectionMatrix * modelMatrix * vec4<f32>(input.position,1.0);
    output.normal = normalize((modelMatrix * vec4(input.normal, 0.0)).xyz);
    output.uv = input.uv;
    return output;
}

@group(1) @binding(1) var meshSampler: sampler;
@group(1) @binding(2) var meshTexture: texture_2d<f32>;

// Static directional lighting
const lightDir = vec3<f32>(1.0, 1.0, 1.0);
const dirColor = vec3(1.0);
const ambientColor = vec3<f32>(0.05);

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    let textureColor = textureSample(meshTexture, meshSampler, input.uv);

  // Very simplified lighting algorithm.
    let lightColor = saturate(ambientColor + max(dot(input.normal, lightDir), 0.0) * dirColor);

    return vec4<f32>(textureColor.rgb * lightColor, textureColor.a);
}