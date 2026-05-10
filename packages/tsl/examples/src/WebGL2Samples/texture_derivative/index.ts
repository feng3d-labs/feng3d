import { RenderObject, RenderPass, RenderPipeline, Sampler, Submit, Texture } from '@feng3d/render-api';
import { reactive } from '@feng3d/reactivity';
import { WebGPU } from '@feng3d/webgpu';
import { mat4, vec3 } from 'gl-matrix';

// 导入 TSL 着色器
import { fragmentShader, vertexShader } from './shaders/shader';

// 初始化画布大小
function initCanvasSize(canvas: HTMLCanvasElement): void
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

// 辅助函数：加载图像
function loadImage(url: string): Promise<HTMLImageElement>
{
    return new Promise((resolve, reject) =>
    {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // 生成着色器代码
    const vertexGlsl = vertexShader.toGLSL(2);
    const fragmentGlsl = fragmentShader.toGLSL(2);
    const vertexWgsl = vertexShader.toWGSL({ convertDepth: true });
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initCanvasSize(canvas);
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 加载纹理图像
    const image = await loadImage('./images/Di-3d.png');

    // 创建纹理
    const texture: Texture = {
        descriptor: {
            format: 'rgba8unorm',
            mipLevelCount: 1,
            size: [512, 512],
        },
        sources: [{
            image,
            flipY: false,
        }],
    };

    // 创建采样器
    const sampler: Sampler = {
        minFilter: 'nearest',
        magFilter: 'nearest',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
    };

    // 立方体顶点位置
    const positions = new Float32Array([
        // Front face
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0,
    ]);

    // 纹理坐标
    const texCoords = new Float32Array([
        // Front face
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,

        // Back face
        1.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,

        // Top face
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,

        // Bottom face
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,

        // Right face
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,

        // Left face
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
    ]);

    // 索引缓冲
    const cubeVertexIndices = new Uint16Array([
        0, 1, 2, 0, 2, 3, // front
        4, 5, 6, 4, 6, 7, // back
        8, 9, 10, 8, 10, 11, // top
        12, 13, 14, 12, 14, 15, // bottom
        16, 17, 18, 16, 18, 19, // right
        20, 21, 22, 20, 22, 23, // left
    ]);

    // 渲染管线
    const program: RenderPipeline = {
        vertex: {
            wgsl: vertexWgsl,
        },
        fragment: {
            wgsl: fragmentWgsl,
            targets: [{}],
        },
        depthStencil: {},
        primitive: { topology: 'triangle-list', cullFace: 'back' },
    };

    // 初始化矩阵
    const modelMatrix = mat4.create();
    const mvMatrix = mat4.create();
    const translate = vec3.create();
    vec3.set(translate, 0, 0, -10);
    mat4.translate(mvMatrix, modelMatrix, translate);

    const perspectiveMatrix = mat4.create();
    mat4.perspective(perspectiveMatrix, 0.785, 1, 1, 1000);

    // 渲染对象
    const renderObject: RenderObject = {
        pipeline: program,
        bindingResources: {
            mvMatrix: { value: mvMatrix as Float32Array },
            pMatrix: { value: perspectiveMatrix as Float32Array },
            diffuse: { texture, sampler } as any,
        },
        vertices: {
            position: { data: positions, format: 'float32x3' },
            texcoord: { data: texCoords, format: 'float32x2' },
        },
        indices: cubeVertexIndices,
        draw: { __type__: 'DrawIndexed', indexCount: 36 },
    };

    // 渲染通道
    const renderPass: RenderPass = {
        descriptor: {
            colorAttachments: [{ clearValue: [0.0, 0.0, 0.0, 1.0], loadOp: 'clear' }],
        },
        renderPassObjects: [renderObject],
    };

    // 提交对象
    const submit: Submit = {
        commandEncoders: [{ passEncoders: [renderPass] }],
    };

    // 旋转参数
    const orientation = [0.0, 0.0, 0.0];

    // 鼠标交互
    let mouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const handleMouseDown = (event: MouseEvent) =>
    {
        mouseDown = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    };

    const handleMouseUp = () =>
    {
        mouseDown = false;
    };

    const handleMouseMove = (event: MouseEvent) =>
    {
        if (!mouseDown) return;

        const newX = event.clientX;
        const newY = event.clientY;

        const deltaX = newX - lastMouseX;
        const deltaY = newY - lastMouseY;

        const m = mat4.create();
        mat4.rotateX(m, m, deltaX / 100.0);
        mat4.rotateY(m, m, deltaY / 100.0);

        const scale = vec3.create();
        vec3.set(scale, (1 + deltaX / 1000.0), (1 + deltaX / 1000.0), (1 + deltaX / 1000.0));
        mat4.scale(m, m, scale);

        mat4.multiply(mvMatrix, mvMatrix, m);

        lastMouseX = newX;
        lastMouseY = newY;
    };

    // 为 canvas 添加鼠标事件
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    // 渲染循环
    function render()
    {
        // 自动旋转
        orientation[0] = 0.00020; // yaw
        orientation[1] = 0.00010; // pitch
        orientation[2] = 0.00005; // roll

        mat4.rotateX(mvMatrix, mvMatrix, orientation[0] * Math.PI);
        mat4.rotateY(mvMatrix, mvMatrix, orientation[1] * Math.PI);
        mat4.rotateZ(mvMatrix, mvMatrix, orientation[2] * Math.PI);

        // 更新绑定资源
        reactive(renderObject.bindingResources).mvMatrix = { value: mvMatrix as Float32Array };
        reactive(renderObject.bindingResources).pMatrix = { value: perspectiveMatrix as Float32Array };

        // 提交渲染
        webgpu.submit(submit);

        requestAnimationFrame(render);
    }

    // 开始渲染循环
    render();
});

