struct UBO {
  width: u32,
}

struct Buffer {
  weights: array<f32>,
}

@binding(0) @group(0) var<uniform> ubo : UBO;
@binding(1) @group(0) var<storage, read> buf_in : Buffer;
@binding(2) @group(0) var<storage, read_write> buf_out : Buffer;
@binding(3) @group(0) var tex_in : texture_2d<f32>;

////////////////////////////////////////////////////////////////////////////////
// import_level
//
// Loads the alpha channel from a texel of the source image, and writes it to
// the buf_out.weights.
////////////////////////////////////////////////////////////////////////////////
@compute @workgroup_size(64)
fn import_level(@builtin(global_invocation_id) coord: vec3<u32>) {
    _ = &buf_in;
    let offset = coord.x + coord.y * ubo.width;
    buf_out.weights[offset] = textureLoad(tex_in, vec2<i32>(coord.xy), 0).w;
}
