struct VaryingStruct {
    @builtin(position) position: vec4<f32>,
    @location(0) v_st: vec2<f32>,
    @location(1) v_position: vec3<f32>,
}

@group(0) @binding(0) var<uniform> mvMatrix: mat4x4<f32>;
@group(0) @binding(1) var<uniform> pMatrix: mat4x4<f32>;
@group(0) @binding(2) var displacementMap_texture: texture_2d<f32>;
@group(0) @binding(3) var displacementMap: sampler;

@vertex
fn main(
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(4) texcoord: vec2<f32>,
) -> VaryingStruct {
    var output: VaryingStruct;
    output.v_st = texcoord;

    // 在顶点着色器中采样纹理（使用 LOD 0）
    let height = textureSampleLevel(displacementMap_texture, displacementMap, texcoord, 0.0).b;
    let displacedPosition = vec4<f32>(position, 1.0) + vec4<f32>(normal * height, 0.0);
    output.v_position = (mvMatrix * displacedPosition).xyz;
    var clipPosition = pMatrix * mvMatrix * displacedPosition;

    // 转换深度范围从 [-1, 1] 到 [0, 1]
    clipPosition.z = (clipPosition.z + clipPosition.w) * 0.5;
    output.position = clipPosition;

    return output;
}
