import { render, RenderInput, RenderMode } from '@feng3d/rendering';

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
    renderMode: 'on-demand',
};

// 启动渲染
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

// 当前画布状态
let currentCanvasIndex = 1;

// GUI 控制
const GUI = (window as any).dat.GUI;
const gui = new GUI();
const folder = gui.addFolder('渲染设置');

// 渲染模式控制（dat.gui 需要直接传入响应式对象）
// eslint-disable-next-line feng3d/no-reactive-argument
folder.add(r_input, 'renderMode', ['on-demand', 'always', 'never'] as RenderMode[])
    .name('渲染模式');

// 画布控制参数
const params = {
    currentCanvas: 1,
    showCanvas2: true,
};

// 切换画布控制
folder.add(params, 'currentCanvas', [1, 2])
    .name('当前画布')
    .onChange((value: number) => {
        const numValue = Number(value);
        if (numValue !== currentCanvasIndex) {
            currentCanvasIndex = numValue;
            const targetCanvas = numValue === 1 ? canvas1 : canvas2;
            // 直接赋值给响应式对象
            r_input.canvas = targetCanvas;
        }
    });

// 画布2显示控制
folder.add(params, 'showCanvas2')
    .name('显示画布2')
    .onChange((value: boolean) => {
        canvas2.classList.toggle('hidden', !value);
    });

folder.open();
