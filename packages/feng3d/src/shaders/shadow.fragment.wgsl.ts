/**
 * 阴影深度片段着色器 WGSL
 *
 * depth-only Pass：无颜色输出，深度由光栅化自动写入 depthStencilAttachment。
 * shadowMap 纹理本身是 depth24plus，采样端直接读取 [0,1] 深度，无需 pack/unpack 编码。
 */

export const shadowFragmentWGSL = `
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
}

@fragment
fn main(input: VertexOutput) {
    // 空体：深度已由光栅化阶段写入 depthStencilAttachment。
}
`;

export default shadowFragmentWGSL;
