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

renderRotatingCube({
    canvas,
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
    rotation: 0,
}).then((controller) =>
{
    // 使用 requestAnimationFrame 更新旋转角度
    let lastTime = performance.now();
    let rotation = 0;

    function animate(currentTime: number)
    {
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        rotation += deltaTime;
        // 使用 setRotation 触发渲染
        controller.setRotation(rotation);

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
});
