import { computed, effect, reactive, toRaw, type Computed } from '@feng3d/reactivity';
import { WebGPU, type BufferBinding, type RenderObject, type RenderPassDescriptor, type RenderPipeline, type Submit, type VertexAttributes } from '@feng3d/webgpu';
import { mat4, vec3 } from 'wgpu-matrix';

/**
 * 渲染入口函数
 *
 * @param input - 输入配置
 * @returns 销毁函数
 */
export async function render(
    input: RenderInput,
): Promise<() => void>
{
    const { pipeline, vertices, vertexCount, bindingResources = {} } = input;
    const devicePixelRatio = window.devicePixelRatio || 1;

    const webgpu = await new WebGPU().init();

    const r_input = reactive(input);

    // 响应式 renderPass 和 projectionMatrix
    let currentRenderPass: RenderPassDescriptor;
    let currentProjectionMatrix: Float32Array;
    let currentAspect: number;
    let currentCanvasId: string | undefined;

    // 初始化 renderPass 和 projectionMatrix
    function updateCanvas(canvas: HTMLCanvasElement): void {
        // 设置 canvas 大小
        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;

        // 更新 aspect
        currentAspect = canvas.width / canvas.height;
        currentProjectionMatrix = mat4.perspective(
            (2 * Math.PI) / 5,
            currentAspect,
            1,
            100.0,
        );

        // 更新 renderPass
        currentRenderPass = {
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

        // 追踪当前 canvas ID
        currentCanvasId = canvas.id;
    }

    // 初始化
    // 先访问属性建立依赖，再使用原始对象
    const initialCanvas = toRaw(r_input.canvas);
    updateCanvas(initialCanvas);

    const uniforms: BufferBinding<{ modelViewProjectionMatrix: Float32Array }> = {
        value: { modelViewProjectionMatrix: new Float32Array(16) as Float32Array },
    };

    const modelViewProjectionMatrix = mat4.create();

    // 计算属性：当 r_input.rotation 或 r_input.canvas 变化时自动更新
    const submit: Computed<Submit> = computed(() => {
        // 访问 canvas 以建立依赖，然后使用原始对象
        const canvas = toRaw(r_input.canvas);
        const rotation = r_input.rotation;

        // 检查 canvas 是否变化（通过 ID 比较）
        if (currentCanvasId !== canvas.id) {
            updateCanvas(canvas);
        }

        const viewMatrix = mat4.identity();
        mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);
        mat4.rotate(viewMatrix, vec3.fromValues(Math.sin(rotation), Math.cos(rotation), 0), 1, viewMatrix);
        mat4.multiply(currentProjectionMatrix, viewMatrix, modelViewProjectionMatrix);

        // 更新 uniforms
        reactive(uniforms.value!).modelViewProjectionMatrix = modelViewProjectionMatrix.subarray();

        return {
            commandEncoders: [
                {
                    passEncoders: [
                        { descriptor: currentRenderPass, renderPassObjects: [getRenderObject()] },
                    ],
                },
            ],
        };
    });

    function getRenderObject(): RenderObject {
        return {
            pipeline: pipeline as RenderPipeline,
            vertices,
            draw: { __type__: 'DrawVertex', vertexCount },
            bindingResources: {
                ...bindingResources,
                uniforms,
            },
        };
    }

    // 渲染调度标志：确保每帧最多调度一次
    let frameScheduled = false;
    let disposed = false;

    /**
     * 调度一帧渲染（如果当前没有已调度的帧）
     */
    function scheduleFrame(): void {
        if (disposed || frameScheduled) return; // 已经调度了，无需重复调度

        frameScheduled = true;
        requestAnimationFrame(() => {
            if (disposed) return;
            frameScheduled = false;
            webgpu.submit(submit.value);
        });
    }

    // 监听 r_input.rotation 和 r_input.canvas 变化，自动调度渲染
    effect(() => {
        if (disposed) return;
        r_input.rotation;
        r_input.canvas;
        scheduleFrame();
    });

    // 首次渲染
    scheduleFrame();

    // 返回销毁函数
    return () => {
        disposed = true;
    };
}

/**
 * 渲染输入
 */
export interface RenderInput {
    /** Canvas 元素 */
    canvas: HTMLCanvasElement;
    /** 渲染管线 */
    pipeline: RenderPipeline;
    /** 顶点属性 */
    vertices: VertexAttributes;
    /** 顶点数量 */
    vertexCount: number;
    /** 旋转角度 */
    rotation: number;
    /** 额外的绑定资源 */
    bindingResources?: Record<string, unknown>;
}
