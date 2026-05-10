struct VertexInput {
    @location(0) position: vec2<f32>,
    @location(4) in_texcoord: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) v_texcoord: vec3<f32>,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    // Multiply the texture coordinate by the transformation
    // matrix (identity) to place it into 3D space
    let identity = mat4x4<f32>(
        vec4<f32>(1.0, 0.0, 0.0, 0.0),
        vec4<f32>(0.0, 1.0, 0.0, 0.0),
        vec4<f32>(0.0, 0.0, 1.0, 0.0),
        vec4<f32>(0.0, 0.0, 0.0, 1.0)
    );
    let transformed = identity * vec4<f32>(input.in_texcoord - vec2<f32>(0.5, 0.5), 0.5, 1.0);
    output.v_texcoord = transformed.xyz;
    
    output.position = vec4<f32>(input.position, 0.0, 1.0);
    // 深度转换：从 [-1, 1] (WebGL NDC) 转换到 [0, 1] (WebGPU NDC)
    output.position.z = output.position.z * 0.5 + output.position.w * 0.5;
    return output;
}

