struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) vTextureCoord: vec2<f32>,
    @location(1) vLighting: vec3<f32>,
}

@binding(0) @group(0) var<uniform> uModelViewMatrix: mat4x4<f32>;
@binding(1) @group(0) var<uniform> uProjectionMatrix: mat4x4<f32>;
@binding(2) @group(0) var<uniform> uNormalMatrix: mat4x4<f32>;

@vertex
fn main(
    @location(0) aVertexPosition: vec3<f32>,
    @location(1) aVertexNormal: vec3<f32>,
    @location(2) aTextureCoord: vec2<f32>,
) -> VertexOutput {
    var output: VertexOutput;
    var position = vec4<f32>(aVertexPosition, 1.0);
    output.position = uProjectionMatrix * uModelViewMatrix * position;
    output.vTextureCoord = aTextureCoord;

    // Apply lighting effect
    let ambientLight = vec3<f32>(0.3, 0.3, 0.3);
    let directionalLightColor = vec3<f32>(1.0, 1.0, 1.0);
    let directionalVector = normalize(vec3<f32>(0.85, 0.8, 0.75));

    let transformedNormal = uNormalMatrix * vec4<f32>(aVertexNormal, 1.0);
    let directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
    output.vLighting = ambientLight + (directionalLightColor * directional);

    return output;
}

