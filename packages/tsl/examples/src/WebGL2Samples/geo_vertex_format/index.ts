import { reactive } from '@feng3d/reactivity';
import { RenderObject, RenderPass, RenderPipeline, Sampler, Submit, Texture, VertexAttributes } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';
import { mat4, vec3 } from 'gl-matrix';
import { HalfFloat } from './third-party/HalfFloatUtility';

// 导入 TSL 着色器
import { fragmentShader, vertexShader } from './shaders/shader';

// 辅助函数：加载图像
function loadImage(url: string, onload: (img: HTMLImageElement) => void): HTMLImageElement
{
    const img = new Image();
    img.onload = function ()
    {
        onload(img);
    };
    img.src = url;

    return img;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // 生成着色器代码
    const vertexWgsl = vertexShader.toWGSL({ convertDepth: true }); // 必须启用深度转换
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    const devicePixelRatio = window.devicePixelRatio || 1;

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // -- 初始化几何数据

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

    // 法线数据使用 Half Float 格式
    const normals = HalfFloat.Float16Array([
        // Front face ，最后一位0用于填充
        0, 0, -1, 0,
        0, 0, -1, 0,
        0, 0, -1, 0,
        0, 0, -1, 0,
        // Back face
        0, 0, 1, 0,
        0, 0, 1, 0,
        0, 0, 1, 0,
        0, 0, 1, 0,
        // Top face
        0, 1, 0, 0,
        0, 1, 0, 0,
        0, 1, 0, 0,
        0, 1, 0, 0,
        // Bottom face
        0, -1, 0, 0,
        0, -1, 0, 0,
        0, -1, 0, 0,
        0, -1, 0, 0,
        // Right face
        -1, 0, 0, 0,
        -1, 0, 0, 0,
        -1, 0, 0, 0,
        -1, 0, 0, 0,
        // Left face
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
    ]);

    // 纹理坐标使用 Half Float 格式
    const texCoords = HalfFloat.Float16Array([
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
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
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

    // 立方体索引
    const cubeVertexIndices = new Uint16Array([
        0, 1, 2, 0, 2, 3, // front
        4, 5, 6, 4, 6, 7, // back
        8, 9, 10, 8, 10, 11, // top
        12, 13, 14, 12, 14, 15, // bottom
        16, 17, 18, 16, 18, 19, // right
        20, 21, 22, 20, 22, 23, // left
    ]);

    // -- 初始化顶点数据
    const vertices: VertexAttributes = {
        a_position: { data: positions, format: 'float32x3' },
        // 由于WebGPU不支持类型 "float16x3"，则需要设置 format 为 "float16x4"，最后一位0用于填充
        a_normal: { data: normals, format: 'float16x4' },
        a_texCoord: { data: texCoords, format: 'float16x2' },
    };

    // -- 初始化变换矩阵
    const modelMatrix = mat4.create();

    const viewMatrix = mat4.create();
    const translate = vec3.create();
    vec3.set(translate, 0, 0, -10);
    mat4.translate(viewMatrix, modelMatrix, translate);

    const perspectiveMatrix = mat4.create();
    mat4.perspective(perspectiveMatrix, 0.785, 1, 1, 1000);

    const viewProj = mat4.create();

    const modelInvTrans = mat4.create();
    mat4.transpose(modelInvTrans, modelMatrix);
    mat4.invert(modelInvTrans, modelInvTrans);

    const lightPosition = [0.0, 0.0, 5.0];

    // 加载纹理图片
    loadImage('./images/Di-3d.png', (img) =>
    {
        // -- 初始化纹理
        const texture: Texture = {
            descriptor: {
                format: 'rgba8unorm',
                mipLevelCount: 1,
                size: [img.width, img.height],
            },
            sources: [{ image: img, flipY: false }],
        };

        const sampler: Sampler = {
            minFilter: 'nearest',
            magFilter: 'nearest',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
        };

        // -- 创建渲染管线
        const program: RenderPipeline = {
            vertex: { wgsl: vertexWgsl },
            fragment: { wgsl: fragmentWgsl },
            depthStencil: { depthCompare: 'less', depthWriteEnabled: true },
            primitive: { topology: 'triangle-list', cullFace: 'back' },
        };

        // -- 创建渲染对象
        const ro: RenderObject = {
            pipeline: program,
            bindingResources: {
                u_model: { value: modelMatrix as Float32Array },
                u_modelInvTrans: { value: modelInvTrans as Float32Array },
                u_lightPosition: { value: lightPosition },
                u_ambient: { value: 0.1 },
            },
            vertices,
            indices: cubeVertexIndices,
            draw: { __type__: 'DrawIndexed', indexCount: 36 },
        };

        // -- 创建渲染通道
        const rp: RenderPass = {
            descriptor: {
                colorAttachments: [{ clearValue: [0.0, 0.0, 0.0, 1.0], loadOp: 'clear' }],
                depthStencilAttachment: { depthClearValue: 1.0, depthLoadOp: 'clear' },
            },
            renderPassObjects: [ro],
        };

        // -- 渲染循环的旋转参数
        const orientation = [0.0, 0.0, 0.0];

        function render()
        {
            // 更新旋转
            orientation[0] = 0.0050; // yaw
            orientation[1] = 0.0030; // pitch
            orientation[2] = 0.0009; // roll

            mat4.rotateX(viewMatrix, viewMatrix, orientation[0] * Math.PI);
            mat4.rotateY(viewMatrix, viewMatrix, orientation[1] * Math.PI);
            mat4.rotateZ(viewMatrix, viewMatrix, orientation[2] * Math.PI);
            mat4.multiply(viewProj, perspectiveMatrix, viewMatrix);

            // 更新绑定资源
            reactive(ro.bindingResources).u_viewProj = { value: viewProj as Float32Array };
            reactive(ro.bindingResources).s_tex2D = { texture, sampler } as any;

            // 创建提交数据
            const submit: Submit = { commandEncoders: [{ passEncoders: [rp] }] };

            // 执行渲染
            webgpu.submit(submit);

            requestAnimationFrame(render);
        }

        requestAnimationFrame(render);
    });
});

