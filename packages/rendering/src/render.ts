import { computed, effect, reactive, toRaw } from '@feng3d/reactivity';
import { CanvasContext, WebGPU, type BufferBinding, type RenderObject, type RenderPass as RenderPassType, type RenderPipeline, type Submit, type VertexAttributes } from '@feng3d/webgpu';
import { mat4, vec3 } from 'wgpu-matrix';

/**
 * 渲染模式
 */
export type RenderMode = 'always' | 'on-demand' | 'never';

/**
 * 相机内参
 */
export interface CameraIntrinsics
{
    /** X 方向焦距 */
    readonly fx: number;
    /** Y 方向焦距 */
    readonly fy: number;
    /** X 主点坐标 */
    readonly cx: number;
    /** Y 主点坐标 */
    readonly cy: number;
    /** 图像宽度 */
    readonly width: number;
    /** 图像高度 */
    readonly height: number;
    /** 近裁剪面距离（默认 0.1） */
    readonly near?: number;
    /** 远裁剪面距离（默认 100） */
    readonly far?: number;
}

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

    const canvasId = computed(() =>
    {
        r_input.canvas;

        // 直接访问原始值，避免重复追踪
        const canvas = input.canvas;

        // 设置 canvas 大小
        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;

        return canvas.id;
    });

    const canvasContext: CanvasContext = { canvasId: canvasId.value };

    // 稳定的 RenderPass 结构（只创建一次）
    const renderPass: RenderPassType = {
        descriptor: {
            colorAttachments: [
                {
                    view: { texture: { context: canvasContext } },
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
    function scheduleFrame(): void
    {
        if (disposed || frameScheduled) return;

        frameScheduled = true;
        requestAnimationFrame(() =>
        {
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
    effect(() =>
    {
        if (disposed) return;

        // 精准替换 canvasId
        reactive(canvasContext).canvasId = canvasId.value;
    });

    // 计算属性：依赖 canvas 宽高，自动计算投影矩阵
    const computedProjection = computed(() =>
    {
        const camera = r_input.camera;
        if (camera)
        {
            // 使用相机内参构建投影矩阵
            const { fx, fy, cx, cy, width, height, near = 0.1, far = 100 } = camera;

            // 从相机内参计算 frustum 参数
            const left = -cx * near / fx;
            const right = (width - cx) * near / fx;
            const bottom = -cy * near / fy;
            const top = (height - cy) * near / fy;

            return mat4.frustum(left, right, bottom, top, near, far);
        }
        else
        {
            // 先访问响应式对象触发追踪，然后获取原始值
            const canvas = toRaw(r_input.canvas);
            return mat4.perspective(
                (2 * Math.PI) / 5,
                canvas.width / canvas.height,
                0.1,
                100.0,
            );
        }
    });

    // 计算属性：纯函数，返回计算后的矩阵数据
    const computedMatrix = computed(() =>
    {
        const rotation = r_input.rotation;
        const position = r_input.position;
        const camera = r_input.camera;
        const projection = computedProjection.value;

        // 创建模型矩阵
        const modelMatrix = mat4.identity();
        if (position)
        {
            mat4.translate(modelMatrix, vec3.fromValues(position.x, position.y, position.z), modelMatrix);
        }

        // 欧拉角旋转（XYZ 顺序）
        if (rotation)
        {
            mat4.rotateX(modelMatrix, rotation.x, modelMatrix);
            mat4.rotateY(modelMatrix, rotation.y, modelMatrix);
            mat4.rotateZ(modelMatrix, rotation.z, modelMatrix);
        }

        // 创建视图矩阵
        const viewMatrix = mat4.identity();
        // 使用相机内参时，相机位于原点，不需要平移
        if (!camera)
        {
            mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);
        }

        // 组合模型视图矩阵
        const modelViewMatrix = mat4.create();
        mat4.multiply(viewMatrix, modelMatrix, modelViewMatrix);

        // 组合 MVP 矩阵
        const mvpMatrix = mat4.create();
        mat4.multiply(projection, modelViewMatrix, mvpMatrix);

        return mvpMatrix.slice() as Float32Array;
    });

    // 监听矩阵变化，更新 uniforms
    effect(() =>
    {
        if (disposed) return;

        // 赋值触发响应式更新
        reactive(uniforms.value!).modelViewProjectionMatrix = computedMatrix.value;

        // on-demand 模式下才调度渲染
        if (r_input.renderMode !== 'always')
        {
            scheduleFrame();
        }
    });

    // 始终渲染模式：持续调度渲染
    let rafId: number | undefined;
    function renderLoop(): void
    {
        if (disposed) return;
        if (r_input.renderMode === 'always')
        {
            webgpu.submit(submit);
            rafId = requestAnimationFrame(renderLoop);
        }
    }

    // 监听渲染模式变化
    effect(() =>
    {
        if (disposed) return;
        const mode = r_input.renderMode;

        // 停止之前的循环
        if (rafId !== undefined)
        {
            cancelAnimationFrame(rafId);
            rafId = undefined;
        }

        // 始终渲染模式
        if (mode === 'always')
        {
            renderLoop();
        }
        // on-demand 模式：首次渲染
        else if (mode === undefined || mode === 'on-demand')
        {
            scheduleFrame();
        }
        // never 模式：不渲染
    });

    // 返回销毁函数
    return () =>
    {
        disposed = true;
        if (rafId !== undefined)
        {
            cancelAnimationFrame(rafId);
        }
    };
}

/**
 * 渲染输入
 */
export interface RenderInput
{
    /** Canvas 元素 */
    readonly canvas: HTMLCanvasElement;
    /** 渲染管线 */
    readonly pipeline: RenderPipeline;
    /** 顶点属性 */
    readonly vertices: VertexAttributes;
    /** 顶点数量 */
    readonly vertexCount: number;
    readonly position?: { readonly x: number, readonly y: number, readonly z: number };
    /** 旋转角度（使用弧度表示） */
    readonly rotation: { readonly x: number, readonly y: number, readonly z: number };
    /** 相机内参（可选） */
    readonly camera?: CameraIntrinsics;
    /** 额外的绑定资源 */
    readonly bindingResources?: Readonly<Record<string, unknown>>;
    /**
     * 渲染模式
     * - `always`: 始终每帧渲染
     * - `on-demand`: 有变化时触发渲染（默认）
     * - `never`: 始终不渲染
     */
    readonly renderMode?: RenderMode;
}
