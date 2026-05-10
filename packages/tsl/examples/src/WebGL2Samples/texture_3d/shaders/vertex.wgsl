struct VertexInput {
    @location(0) position: vec2<f32>,
    @location(1) in_texcoord: vec2<f32>,
}

struct VaryingStruct {
    @builtin(position) vPosition: vec4<f32>,
    @location(0) v_texcoord: vec3<f32>,
}

@binding(0) @group(0) var<uniform> orientation: mat4x4<f32>;

@vertex
fn main(input: VertexInput) -> VaryingStruct {
    var output: VaryingStruct;
    
    // Multiply the texture coordinate by the transformation
    // matrix to place it into 3D space
    let transformed = orientation * vec4<f32>(input.in_texcoord - vec2<f32>(0.5, 0.5), 0.5, 1.0);
    output.v_texcoord = transformed.xyz;
    
    let position = vec4<f32>(input.position, 0.0, 1.0);
    output.vPosition = vec4<f32>(position.x, position.y, position.z * 0.5 + position.w * 0.5, position.w);
    return output;
}

