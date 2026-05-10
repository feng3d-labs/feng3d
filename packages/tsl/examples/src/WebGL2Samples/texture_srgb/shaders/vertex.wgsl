@group(0) @binding(0) var<uniform> mvp: mat4x4<f32>;

// 使用 vec4 打包两个 vec2 坐标，减少 location 使用
// v_blurTexCoords: 14 个 vec2 -> 7 个 vec4
// h_blurTexCoords: 14 个 vec2 -> 7 个 vec4
// 总计: 1 (v_st) + 7 + 7 = 15 个 location
struct VaryingStruct {
    @builtin(position) position: vec4<f32>,
    @location(0) v_st: vec2<f32>,
    // 垂直方向模糊坐标 (打包为 vec4: xy = [i], zw = [i+1])
    @location(1) v_blur_01: vec4<f32>,
    @location(2) v_blur_23: vec4<f32>,
    @location(3) v_blur_45: vec4<f32>,
    @location(4) v_blur_67: vec4<f32>,
    @location(5) v_blur_89: vec4<f32>,
    @location(6) v_blur_AB: vec4<f32>,
    @location(7) v_blur_CD: vec4<f32>,
    // 水平方向模糊坐标 (打包为 vec4: xy = [i], zw = [i+1])
    @location(8) h_blur_01: vec4<f32>,
    @location(9) h_blur_23: vec4<f32>,
    @location(10) h_blur_45: vec4<f32>,
    @location(11) h_blur_67: vec4<f32>,
    @location(12) h_blur_89: vec4<f32>,
    @location(13) h_blur_AB: vec4<f32>,
    @location(14) h_blur_CD: vec4<f32>,
}

@vertex
fn main(
    @location(0) position: vec2<f32>,
    @location(4) textureCoordinates: vec2<f32>
) -> VaryingStruct {
    var v: VaryingStruct;
    v.v_st = textureCoordinates;
    var pos = mvp * vec4<f32>(position, 0.0, 1.0);
    pos.z = pos.z * 0.5 + pos.w * 0.5;
    v.position = pos;

    // 垂直方向模糊坐标 (打包为 vec4)
    v.v_blur_01 = vec4<f32>(v.v_st + vec2<f32>(0.0, -0.050), v.v_st + vec2<f32>(0.0, -0.036));
    v.v_blur_23 = vec4<f32>(v.v_st + vec2<f32>(0.0, -0.020), v.v_st + vec2<f32>(0.0, -0.016));
    v.v_blur_45 = vec4<f32>(v.v_st + vec2<f32>(0.0, -0.012), v.v_st + vec2<f32>(0.0, -0.008));
    v.v_blur_67 = vec4<f32>(v.v_st + vec2<f32>(0.0, -0.004), v.v_st + vec2<f32>(0.0,  0.004));
    v.v_blur_89 = vec4<f32>(v.v_st + vec2<f32>(0.0,  0.008), v.v_st + vec2<f32>(0.0,  0.012));
    v.v_blur_AB = vec4<f32>(v.v_st + vec2<f32>(0.0,  0.016), v.v_st + vec2<f32>(0.0,  0.020));
    v.v_blur_CD = vec4<f32>(v.v_st + vec2<f32>(0.0,  0.036), v.v_st + vec2<f32>(0.0,  0.050));

    // 水平方向模糊坐标 (打包为 vec4)
    v.h_blur_01 = vec4<f32>(v.v_st + vec2<f32>(-0.050, 0.0), v.v_st + vec2<f32>(-0.036, 0.0));
    v.h_blur_23 = vec4<f32>(v.v_st + vec2<f32>(-0.020, 0.0), v.v_st + vec2<f32>(-0.016, 0.0));
    v.h_blur_45 = vec4<f32>(v.v_st + vec2<f32>(-0.012, 0.0), v.v_st + vec2<f32>(-0.008, 0.0));
    v.h_blur_67 = vec4<f32>(v.v_st + vec2<f32>(-0.004, 0.0), v.v_st + vec2<f32>( 0.004, 0.0));
    v.h_blur_89 = vec4<f32>(v.v_st + vec2<f32>( 0.008, 0.0), v.v_st + vec2<f32>( 0.012, 0.0));
    v.h_blur_AB = vec4<f32>(v.v_st + vec2<f32>( 0.016, 0.0), v.v_st + vec2<f32>( 0.020, 0.0));
    v.h_blur_CD = vec4<f32>(v.v_st + vec2<f32>( 0.036, 0.0), v.v_st + vec2<f32>( 0.050, 0.0));

    return v;
}
