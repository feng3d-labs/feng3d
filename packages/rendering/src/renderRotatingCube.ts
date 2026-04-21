import { computed, effect, reactive, type Computed } from '@feng3d/reactivity';
import { WebGPU, type BufferBinding, type RenderObject, type RenderPassDescriptor, type RenderPipeline, type Submit, type VertexAttributes } from '@feng3d/webgpu';
import { mat4, vec3 } from 'wgpu-matrix';

/**
 * 渲染旋转立方体
 *
 * @param input - 输入配置
 * @returns 设置旋转角度的函数
 */
export async function renderRotatingCube(
    input: RenderRotatingCubeInput,
) {
    const { canvas, pipeline, vertices, vertexCount, bindingResources = {} } = input;
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
        pipeline: pipeline as RenderPipeline,
        vertices,
        draw: { __type__: 'DrawVertex', vertexCount },
        bindingResources: {
            ...bindingResources,
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

    const r_input = reactive(input);
    // 计算属性：当 r_state.rotation 变化时自动更新
    const submit: Computed<Submit> = computed(() => {
        const rotation = r_input.rotation;

        const viewMatrix = mat4.identity();
        mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);
        mat4.rotate(viewMatrix, vec3.fromValues(Math.sin(rotation), Math.cos(rotation), 0), 1, viewMatrix);
        mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);

        // 更新 uniforms
        reactive(uniforms.value!).modelViewProjectionMatrix = modelViewProjectionMatrix.subarray();

        return {
            commandEncoders: [
                {
                    passEncoders: [
                        { descriptor: renderPass, renderPassObjects: [renderObject] },
                    ],
                },
            ],
        };
    });

    // 渲染调度标志：确保每帧最多调度一次
    let frameScheduled = false;

    /**
     * 调度一帧渲染（如果当前没有已调度的帧）
     */
    function scheduleFrame(): void {
        if (frameScheduled) return; // 已经调度了，无需重复调度

        frameScheduled = true;
        requestAnimationFrame(() => {
            frameScheduled = false;
            webgpu.submit(submit.value);
        });
    }

    // 监听 r_state.rotation 变化，自动调度渲染
    effect(() => {
        r_input.rotation;
        scheduleFrame();
    });

    // 首次渲染
    scheduleFrame();
}

/**
 * 渲染旋转立方体输入
 */
export interface RenderRotatingCubeInput {
    /** Canvas 元素 */
    canvas: HTMLCanvasElement;
    /** 渲染管线 */
    pipeline: RenderPipeline;
    /** 顶点属性 */
    vertices: VertexAttributes;
    /** 顶点数量 */
    vertexCount: number;
    /** 初始旋转角度 */
    rotation?: number;
    /** 额外的绑定资源 */
    bindingResources?: Record<string, unknown>;
}
