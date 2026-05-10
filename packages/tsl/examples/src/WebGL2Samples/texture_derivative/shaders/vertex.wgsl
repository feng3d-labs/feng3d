struct VaryingStruct {
    @builtin(position) position: vec4<f32>,
    @location(0) v_uv: vec2<f32>,
    @location(1) v_position: vec3<f32>,
}

@group(0) @binding(0) var<uniform> mvMatrix: mat4x4<f32>;
@group(0) @binding(1) var<uniform> pMatrix: mat4x4<f32>;

@vertex
fn main(
    @location(0) position: vec3<f32>,
    @location(4) texcoord: vec2<f32>,
) -> VaryingStruct {
    var output: VaryingStruct;
    output.v_uv = texcoord;
    output.v_position = (mvMatrix * vec4<f32>(position, 1.0)).xyz;
    var clipPosition = pMatrix * mvMatrix * vec4<f32>(position, 1.0);
    // 将深度从 [-1, 1] 转换到 [0, 1]
    clipPosition.z = (clipPosition.z + clipPosition.w) * 0.5;
    output.position = clipPosition;
    return output;
}

