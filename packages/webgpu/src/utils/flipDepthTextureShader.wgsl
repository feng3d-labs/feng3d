// 深度纹理翻转着色器
// 使用深度渲染通道进行翻转

// 顶点着色器 - 生成全屏三角形
@vertex
fn vsmain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
    // 生成覆盖整个屏幕的三角形
    var pos = array<vec2<f32>, 3>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(3.0, -1.0),
        vec2<f32>(-1.0, 3.0)
    );
    return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}

// 片段着色器 - 读取源深度纹理，翻转 Y 轴后输出到深度附件
// 使用 textureLoad 直接读取，不需要 sampler
@group(0) @binding(0) var srcTexture: texture_depth_2d;

struct FragmentOutput {
    @builtin(frag_depth) depth: f32,
}

@fragment
fn fsmain(@builtin(position) fragCoord: vec4<f32>) -> FragmentOutput {
    let texSize = vec2<f32>(textureDimensions(srcTexture));
    
    // 计算翻转后的纹理坐标
    let uv = vec2<f32>(fragCoord.x / texSize.x, 1.0 - fragCoord.y / texSize.y);
    
    // 使用 textureLoad 读取深度值（避免采样器问题）
    let srcCoord = vec2<i32>(i32(fragCoord.x), i32(texSize.y - fragCoord.y));
    let depth = textureLoad(srcTexture, srcCoord, 0);
    
    var output: FragmentOutput;
    output.depth = depth;
    return output;
}
