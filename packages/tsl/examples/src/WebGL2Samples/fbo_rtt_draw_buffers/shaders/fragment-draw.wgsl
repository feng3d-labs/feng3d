@group(0) @binding(0) var color1Map_texture: texture_2d<f32>;
@group(0) @binding(1) var color1Map: sampler;
@group(0) @binding(2) var color2Map_texture: texture_2d<f32>;
@group(0) @binding(3) var color2Map: sampler;

struct FragmentInput {
    @location(0) v_st: vec2<f32>,
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    let color1 = textureSample(color1Map_texture, color1Map, input.v_st);
    let color2 = textureSample(color2Map_texture, color2Map, input.v_st);
    return mix(color1, color2, input.v_st.x);
}
