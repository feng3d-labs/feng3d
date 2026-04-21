import { computed, effect, reactive, toRaw } from '@feng3d/reactivity';
import { WebGPU, type BufferBinding, type CanvasTexture, type RenderObject, type RenderPass as RenderPassType, type RenderPipeline, type Submit, type VertexAttributes } from '@feng3d/webgpu';
import { mat4, vec3 } from 'wgpu-matrix';

/**
 * 渲染入口函数
 *
 * @param input - 输入配置
 * @returns 销毁函数
 */
export async function render(
    input: RenderInput,
): Promise<() => void> {
    const { pipeline, vertices, vertexCount, bindingResources = {} } = input;
    const devicePixelRatio = window.devicePixelRatio || 1;

    const webgpu = await new WebGPU().init();

    const r_input = reactive(input);

    // 响应式状态
    let currentCanvasId: string | undefined;

    // 初始化
    const initialCanvas = toRaw(r_input.canvas);
    currentCanvasId = initialCanvas.id;
    initialCanvas.width = initialCanvas.clientWidth * devicePixelRatio;
    initialCanvas.height = initialCanvas.clientHeight * devicePixelRatio;

    const uniforms: BufferBinding<{ modelViewProjectionMatrix: Float32Array }> = {
        value: { modelViewProjectionMatrix: new Float32Array(16) as Float32Array },
    };

    // 稳定的 RenderObject
    const renderObject: RenderObject = {
        pipeline: pipeline as RenderPipeline,
        vertices,
        draw: { __type__: 'DrawVertex', vertexCount },
        bindingResources: {
            ...bindingResources,
            uniforms,
        },
    };

    // 稳定的 RenderPass 结构（只创建一次）
    const renderPass: RenderPassType = {
        descriptor: {
            colorAttachments: [
                {
                    view: { texture: { context: { canvasId: initialCanvas.id } } },
                    clearValue: [0.5, 0.5, 0.5, 1.0],
                },
            ],
            depthStencilAttachment: {
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        },
        renderPassObjects: [renderObject],
    };

    // 渲染调度标志：确保每帧最多调度一次
    let frameScheduled = false;
    let disposed = false;

    /**
     * 调度一帧渲染（如果当前没有已调度的帧）
     */
    function scheduleFrame(): void {
        if (disposed || frameScheduled) return;

        frameScheduled = true;
        requestAnimationFrame(() => {
            if (disposed) return;
            frameScheduled = false;
            webgpu.submit(submit);
        });
    }

    // 稳定的 Submit 结构（只创建一次）
    const submit: Submit = {
        commandEncoders: [
            {
                passEncoders: [renderPass],
            },
        ],
    };

    // 监听 canvas 变化，更新 canvas 大小和 canvasId
    effect(() => {
        if (disposed) return;
        const canvas = toRaw(r_input.canvas);
        if (currentCanvasId !== canvas.id) {
            currentCanvasId = canvas.id;

            // 设置 canvas 大小
            canvas.width = canvas.clientWidth * devicePixelRatio;
            canvas.height = canvas.clientHeight * devicePixelRatio;

            // 精确更新 canvasId（使用 reactive 使响应式系统追踪变化）
            reactive((renderPass.descriptor.colorAttachments[0]!.view.texture as CanvasTexture).context).canvasId = canvas.id;
        }
    });

    // 计算属性：依赖 canvas 宽高，自动计算投影矩阵
    const computedProjection = computed(() => {
        const canvas = toRaw(r_input.canvas);
        return mat4.perspective(
            (2 * Math.PI) / 5,
            canvas.width / canvas.height,
            1,
            100.0,
        );
    });

    // 计算属性：纯函数，返回计算后的矩阵数据
    const computedMatrix = computed(() => {
        const rotation = r_input.rotation;
        const projection = computedProjection.value;

        const viewMatrix = mat4.identity();
        mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);
        mat4.rotate(viewMatrix, vec3.fromValues(Math.sin(rotation), Math.cos(rotation), 0), 1, viewMatrix);

        const mvpMatrix = mat4.create();
        mat4.multiply(projection, viewMatrix, mvpMatrix);

        return mvpMatrix.slice() as Float32Array; // 返回一个新的 Float32Array 视图，确保响应式系统能正确追踪变化
    });

    // 监听矩阵变化，更新 uniforms 并触发渲染
    effect(() => {
        if (disposed) return;

        // 赋值触发响应式更新
        reactive(uniforms.value!).modelViewProjectionMatrix = computedMatrix.value;

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
