import { CopyBufferToBuffer, Submit } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';

import { fragmentShader, vertexShader } from './shaders/shader';

document.addEventListener('DOMContentLoaded', async () =>
{
    // 使用 TSL 生成着色器代码
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL();

    const devicePixelRatio = window.devicePixelRatio || 1;

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 顶点数据
    const vertices = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,
        1.0, 1.0,
        -1.0, 1.0,
        -1.0, -1.0,
    ]);

    // 目标缓冲区（初始为空）
    const vertexPosBufferDst = new Float32Array(vertices.length);

    // 缓冲区复制命令
    const copyBufferCommand: CopyBufferToBuffer = {
        __type__: 'CopyBufferToBuffer',
        source: vertices,
        destination: vertexPosBufferDst,
    };

    // 渲染提交
    const submit: Submit = {
        commandEncoders: [
            {
                passEncoders: [
                    // 首先执行缓冲区复制
                    copyBufferCommand,
                    // 然后执行渲染通道
                    {
                        descriptor: {
                            colorAttachments: [{
                                clearValue: [0.0, 0.0, 0.0, 1.0],
                                loadOp: 'clear',
                            }],
                        },
                        renderPassObjects: [{
                            pipeline: {
                                vertex: {
                                    wgsl: vertexWgsl,
                                },
                                fragment: {
                                    wgsl: fragmentWgsl,
                                },
                                primitive: { topology: 'triangle-list' },
                            },
                            vertices: {
                                pos: { data: vertexPosBufferDst, format: 'float32x2' },
                            },
                            draw: { __type__: 'DrawVertex', vertexCount: 6 },
                        }],
                    },
                ],
            },
        ],
    };

    // 执行渲染
    webgpu.submit(submit);
});