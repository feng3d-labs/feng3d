struct FragmentInput {
    @location(0) v_st: vec2<f32>,
}

@group(0) @binding(1) var materialDiffuse0_texture: texture_2d<f32>;
@group(0) @binding(2) var materialDiffuse0: sampler;
@group(0) @binding(3) var materialDiffuse1_texture: texture_2d<f32>;
@group(0) @binding(4) var materialDiffuse1: sampler;

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    // 在 uniform control flow 中先采样两个纹理
    let color0 = textureSample(materialDiffuse0_texture, materialDiffuse0, input.v_st);
    let color1 = textureSample(materialDiffuse1_texture, materialDiffuse1, input.v_st) * 0.77;
    
    // 使用 select 根据条件选择结果
    var color: vec4<f32>;
    if(input.v_st.y / input.v_st.x < 1.0){
        color = color0;
    } else {
        color = color1;
    }
    return color;
}
