import { RenderObject, Submit } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';
import { angleNormals } from './utils/angle-normals';
import * as bunny from './utils/bunny';
import { createCamera } from './utils/camera';

import { vertexShader, fragmentShader } from './shaders/shader';

document.addEventListener('DOMContentLoaded', async () =>
{
    // 使用 TSL 生成着色器代码
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    const devicePixelRatio = window.devicePixelRatio || 1;

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 计算兔子模型的边界框，用于调整相机距离
    const positions = bunny.positions.flat();
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < positions.length; i += 3)
    {
        minX = Math.min(minX, positions[i]);
        maxX = Math.max(maxX, positions[i]);
        minY = Math.min(minY, positions[i + 1]);
        maxY = Math.max(maxY, positions[i + 1]);
        minZ = Math.min(minZ, positions[i + 2]);
        maxZ = Math.max(maxZ, positions[i + 2]);
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const sizeX = maxX - minX;
    const sizeY = maxY - minY;
    const sizeZ = maxZ - minZ;
    const maxSize = Math.max(sizeX, sizeY, sizeZ);
    // 计算合适的初始距离，确保模型完整显示（使用模型大小的 3 倍作为初始距离）
    const initialDistance = maxSize * 3;

    const camera = createCamera({
        center: [centerX, centerY, centerZ],
        distance: initialDistance,
        maxDistance: initialDistance * 10, // 允许拉得更远
    });

    const indices = bunny.cells.flat();
    const normals = angleNormals(bunny.cells, bunny.positions).flat();

    const renderObject: RenderObject = {
        vertices: {
            position: { data: new Float32Array(positions), format: 'float32x3' as const },
            normal: { data: new Float32Array(normals), format: 'float32x3' as const },
        },
        indices: new Uint16Array(indices),
        draw: { __type__: 'DrawIndexed' as const, indexCount: indices.length },
        bindingResources: {},
        pipeline: {
            vertex: {
                wgsl: vertexWgsl,
            },
            fragment: {
                wgsl: fragmentWgsl,
            },
            depthStencil: { depthWriteEnabled: true },
        },
    };

    let frameCount = 0;

    function draw()
    {
        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;

        camera(renderObject, canvas.width, canvas.height);

        const submit: Submit = {
            commandEncoders: [{
                passEncoders: [
                    {
                        descriptor: {
                            colorAttachments: [{ clearValue: [0, 0, 0, 1] }],
                            depthStencilAttachment: { depthClearValue: 1 },
                        },
                        renderPassObjects: [renderObject],
                    },
                ],
            }],
        };

        webgpu.submit(submit);

        requestAnimationFrame(draw);
    }
    draw();
});

