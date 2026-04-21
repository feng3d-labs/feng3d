import { render, RenderInput } from '@feng3d/rendering';

import {
    cubePositionOffset,
    cubeUVOffset,
    cubeVertexArray,
    cubeVertexCount,
    cubeVertexSize,
} from './meshes/cube.js';
import { basicVertWGSL } from './shaders/basic.vert.wgsl.js';
import { vertexPositionColorFragWGSL } from './shaders/vertexPositionColor.frag.wgsl.js';
import { reactive } from '@feng3d/reactivity';

const canvas1 = document.getElementById('webgpu1') as HTMLCanvasElement;
const canvas2 = document.getElementById('webgpu2') as HTMLCanvasElement;

const input: RenderInput = {
    canvas: canvas1,
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
};

render(input);

// 使用 requestAnimationFrame 更新旋转角度
let lastTime = performance.now();

const r_input = reactive(input);
function animate(currentTime: number) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    r_input.rotation += deltaTime;

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// 切换画布
let currentCanvas = 1;
const button = document.getElementById('switchCanvas') as HTMLButtonElement;
button.addEventListener('click', () => {
    currentCanvas = currentCanvas === 1 ? 2 : 1;
    r_input.canvas = currentCanvas === 1 ? canvas1 : canvas2;

    // 更新按钮文本和画布显示
    button.textContent = `切换画布 (当前: 画布${currentCanvas})`;
    canvas1.classList.toggle('active', currentCanvas === 1);
    canvas2.classList.toggle('active', currentCanvas === 2);
});
