import { reactive } from '@feng3d/reactivity';
import { type BufferBinding, type RenderObject, type RenderPassDescriptor, type RenderPipeline, type Submit, type VertexAttributes, WebGPU } from '@feng3d/webgpu';
import { mat4, vec3 } from 'wgpu-matrix';

/**
 * 渲染旋转立方体
 *
 * @param canvas - Canvas 元素
 * @param options - 配置选项
 */
export async function renderRotatingCube(
    canvas: HTMLCanvasElement,
    options: RenderRotatingCubeOptions,
): Promise<void>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    const renderPass: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } },
                clearValue: [0.5, 0.5, 0.5, 1.0],
            },
        ],
        depthStencilAttachment: {
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    const uniforms: BufferBinding<{ modelViewProjectionMatrix: Float32Array }> = {
        value: { modelViewProjectionMatrix: new Float32Array(16) as Float32Array },
    };

    const renderObject: RenderObject = {
        pipeline: options.pipeline,
        vertices: options.vertices,
        draw: { __type__: 'DrawVertex', vertexCount: options.vertexCount },
        bindingResources: {
            ...options.bindingResources,
            uniforms,
        },
    };

    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective(
        (2 * Math.PI) / 5,
        aspect,
        1,
        100.0,
    );
    const modelViewProjectionMatrix = mat4.create();

    function getTransformationMatrix()
    {
        const viewMatrix = mat4.identity();

        mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);
        const now = Date.now() / 1000;

        mat4.rotate(
            viewMatrix,
            vec3.fromValues(Math.sin(now), Math.cos(now), 0),
            1,
            viewMatrix,
        );

        mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);

        return modelViewProjectionMatrix as Float32Array;
    }

    const data: Submit = {
        commandEncoders: [
            {
                passEncoders: [
                    { descriptor: renderPass, renderPassObjects: [renderObject] },
                ],
            },
        ],
    };

    function frame()
    {
        const transformationMatrix = getTransformationMatrix();

        // 更新uniforms
        reactive(uniforms.value!).modelViewProjectionMatrix = transformationMatrix.subarray();

        webgpu.submit(data);

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

/**
 * 渲染旋转立方体配置选项
 */
export interface RenderRotatingCubeOptions
{
    /** 渲染管线 */
    pipeline: RenderPipeline;
    /** 顶点属性 */
    vertices: VertexAttributes;
    /** 顶点数量 */
    vertexCount: number;
    /** 额外的绑定资源 */
    bindingResources?: Record<string, unknown>;
}
