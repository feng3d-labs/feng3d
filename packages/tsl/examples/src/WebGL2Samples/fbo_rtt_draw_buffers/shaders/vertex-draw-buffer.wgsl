struct VertexInput {
    @location(0) position: vec4<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    // 将深度从 WebGL 的 [-1, 1] 转换为 WebGPU 的 [0, 1]
    // 公式: z_webgpu = (z_webgl + 1.0) * 0.5
    let _pos_temp = input.position;
    output.position = vec4<f32>(_pos_temp.xy, (_pos_temp.z + 1.0) * 0.5, _pos_temp.w);
    return output;
}
