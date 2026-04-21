import { computed, reactive, type Computed } from '@feng3d/reactivity';
import { type BufferBinding, type RenderObject, type RenderPassDescriptor, type RenderPipeline, type Submit, type VertexAttributes, WebGPU } from '@feng3d/webgpu';
import { mat4, vec3 } from 'wgpu-matrix';

/**
 * 渲染旋转立方体
 *
 * @param canvas - Canvas 元素
 * @param options - 配置选项
 * @returns 渲染控制器
 */
export async function renderRotatingCube(
    canvas: HTMLCanvasElement,
    options: RenderRotatingCubeOptions,
): Promise<RenderRotatingCubeController>
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

    // 响应式状态
    const state = reactive({
        rotation: 0,
    });

    // 计算属性：当状态变化时自动更新
    const submit: Computed<Submit> = computed(() => {
        const viewMatrix = mat4.identity();
        mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);
        mat4.rotate(viewMatrix, vec3.fromValues(Math.sin(state.rotation), Math.cos(state.rotation), 0), 1, viewMatrix);
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

    // 动画循环
    let animationFrameId: number | null = null;
    let lastTime = Date.now();

    function animate()
    {
        const now = Date.now();
        const deltaTime = (now - lastTime) / 1000;
        lastTime = now;

        // 更新旋转角度（触发 computed 重新计算）
        reactive(state).rotation += deltaTime;

        // 渲染
        webgpu.submit(submit.value);

        animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return {
        /**
         * 停止动画
         */
        stop: () =>
        {
            if (animationFrameId !== null)
            {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        },
        /**
         * 手动触发渲染一帧
         */
        render: () =>
        {
            webgpu.submit(submit.value);
        },
        /**
         * 获取当前状态
         */
        get state()
        {
            return state;
        },
    };
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

/**
 * 渲染控制器
 */
export interface RenderRotatingCubeController
{
    /** 停止动画 */
    stop(): void;
    /** 手动触发渲染一帧 */
    render(): void;
    /** 获取当前状态 */
    get state(): { rotation: number };
}
