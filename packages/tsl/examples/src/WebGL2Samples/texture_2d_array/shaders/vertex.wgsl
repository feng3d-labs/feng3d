struct VertexInput {
    @location(0) position: vec2<f32>,
    @location(4) texcoord: vec2<f32>,
}

struct VaryingStruct {
    @builtin(position) vPosition: vec4<f32>,
    @location(0) v_st: vec2<f32>,
}

@binding(0) @group(0) var<uniform> MVP: mat4x4<f32>;

@vertex
fn main(input: VertexInput) -> VaryingStruct {
    var output: VaryingStruct;
    output.v_st = input.texcoord;
    let position = MVP * vec4<f32>(input.position, 0.0, 1.0);
    output.vPosition = vec4<f32>(position.x, position.y, position.z * 0.5 + position.w * 0.5, position.w);
    return output;
}

