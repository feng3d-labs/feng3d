@vertex
fn main(
    @builtin(vertex_index) vertexIndex: u32,
) -> @builtin(position) vec4<f32> {
    return vec4<f32>(
        2.0 * f32(vertexIndex % 2u) - 1.0,
        2.0 * f32(vertexIndex / 2u) - 1.0,
        0.0, 1.0
    );
}