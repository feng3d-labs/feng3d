import { reactive } from '@feng3d/reactivity';
import { RenderObject, RenderPassDescriptor, Submit } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';

import redFragWGSL from '../../shaders/red.frag.wgsl';
import triangleVertWGSL from '../../shaders/triangle.vert.wgsl';

import styles from './animatedCanvasSize.module.css';

const init = async (canvas: HTMLCanvasElement) =>
{
    const webgpu = await new WebGPU().init();

    const renderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [{
            view: { texture: { context: { canvasId: canvas.id } } },
            clearValue: [0.0, 0.0, 0.0, 1.0],
        }],
        sampleCount: 4, // 设置多重采样数量
    };

    const renderObject: RenderObject = {
        pipeline: {
            vertex: { code: triangleVertWGSL }, fragment: { code: redFragWGSL },
        },
        draw: { __type__: 'DrawVertex', vertexCount: 3 },
    };

    canvas.classList.add(styles.animatedCanvasSize);

    function frame()
    {
        // 画布尺寸发生变化时更改渲染通道附件尺寸。
        const currentWidth = canvas.clientWidth * devicePixelRatio;
        const currentHeight = canvas.clientHeight * devicePixelRatio;

        canvas.width = currentWidth;
        canvas.height = currentHeight;

        // reactive(renderPassDescriptor).attachmentSize = { width: currentWidth, height: currentHeight };

        const data: Submit = {
            commandEncoders: [
                {
                    passEncoders: [
                        { descriptor: renderPassDescriptor, renderPassObjects: [renderObject] },
                    ],
                },
            ],
        };

        webgpu.submit(data);

        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas);
