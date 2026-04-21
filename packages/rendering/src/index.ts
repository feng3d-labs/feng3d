/**
 * @feng3d/rendering
 *
 * GPU 驱动的渲染库
 * 从简单示例开始，逐步实现全 GPU 渲染核心
 */

// 导出 meshes
export { cubeVertexArray, cubeVertexCount, cubeVertexSize, cubePositionOffset, cubeUVOffset } from './meshes/cube.js';

// 导出 shaders
export { code as basicVertWGSL } from './shaders/basic.vert.wgsl.js';
export { code as vertexPositionColorFragWGSL } from './shaders/vertexPositionColor.frag.wgsl.js';
