import { reactive } from '@feng3d/reactivity';
import { renderRotatingCube } from '@feng3d/rendering';

import {
    cubePositionOffset,
    cubeUVOffset,
    cubeVertexArray,
    cubeVertexCount,
    cubeVertexSize,
} from './meshes/cube.js';
import { basicVertWGSL } from './shaders/basic.vert.wgsl.js';
import { vertexPositionColorFragWGSL } from './shaders/vertexPositionColor.frag.wgsl.js';

const canvas = document.getElementById('webgpu') as HTMLCanvasElement;

renderRotatingCube(canvas, {
    pipeline: {
        vertex: { code: basicVertWGSL },
        fragment: { code: vertexPositionColorFragWGSL },
        primitive: {
            cullFace: 'back',
        },
    },
    vertices: {
        position: { data: cubeVertexArray, format: 'float32x4', offset: cubePositionOffset, arrayStride: cubeVertexSize },
        uv: { data: cubeVertexArray, format: 'float32x2', offset: cubeUVOffset, arrayStride: cubeVertexSize },
    },
    vertexCount: cubeVertexCount,
}).then((controller) =>
{
    // 每秒更新一次旋转角度，触发渲染
    let lastTime = Date.now();
    setInterval(() =>
    {
        const now = Date.now();
        const deltaTime = (now - lastTime) / 1000;
        lastTime = now;

        // 修改状态会自动触发渲染
        reactive(controller.state).rotation += deltaTime;
    }, 16); // 约60fps
});
