/**
 * 阴影图调试顶点着色器
 *
 * 直接复用 textureVertexWGSL（标准顶点变换 + uv 传递）。
 * 调试片元着色器见 debugShadowMap.fragment.wgsl.ts。
 */

export { textureVertexWGSL as debugShadowMapVertexWGSL } from './texture.vertex.wgsl';
