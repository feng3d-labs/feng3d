/**
 * texture_vertex 示例
 *
 * 演示在顶点着色器中使用纹理查找实现位移贴图（Displacement Mapping）。
 * 此示例完全按照原始 WebGL2Samples/texture_vertex.ts 实现。
 */

import { IndicesDataTypes, PrimitiveTopology, RenderPass, RenderPassObject, RenderPipeline, Sampler, Texture, VertexAttributes, VertexData, VertexFormat, vertexFormatMap } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';

import { mat4, vec3 } from 'gl-matrix';
import { GlTFLoader, Primitive } from './third-party/gltf-loader';

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

// 绘制模式映射
const IDrawMode2Name: { [key: string]: PrimitiveTopology } = {
    0: 'point-list',
    3: 'line-strip',
    2: 'LINE_LOOP' as any,
    1: 'line-list',
    5: 'triangle-strip',
    6: 'TRIANGLE_FAN' as any,
    4: 'triangle-list',
};

// 顶点属性类型映射
const VertexAttributeType2Name: { [key: number]: string } = Object.freeze({
    5126: 'FLOAT',
    5120: 'BYTE',
    5122: 'SHORT',
    5121: 'UNSIGNED_BYTE',
    5123: 'UNSIGNED_SHORT',
    5131: 'HALF_FLOAT',
    5124: 'INT',
    5125: 'UNSIGNED_INT',
    36255: 'INT_2_10_10_10_REV',
    33640: 'UNSIGNED_INT_2_10_10_10_REV',
});

// 获取顶点格式
function getIVertexFormat(numComponents: 1 | 2 | 3 | 4, type: string = 'FLOAT', normalized = false): VertexFormat
{
    for (const key in vertexFormatMap)
    {
        const element = vertexFormatMap[key];
        if (
            element.numComponents === numComponents
            && element.type === type
            && !element.normalized === !normalized
        )
        {
            return key as VertexFormat;
        }
    }

    console.error(`没有找到与 ${JSON.stringify({ numComponents, type, normalized })} 对应的顶点数据格式！`);

    return undefined;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // 生成着色器代码（注释掉则使用手写的 GLSL/WGSL 进行调试）
    const vertexGlsl = vertexShader.toGLSL(2);
    const fragmentGlsl = fragmentShader.toGLSL(2);
    const vertexWgsl = vertexShader.toWGSL({ convertDepth: true });
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initCanvasSize(canvas);
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 渲染管线
    const program: RenderPipeline = {
        vertex: {
            wgsl: vertexWgsl,
        },
        fragment: {
            wgsl: fragmentWgsl,
            targets: [{}],
        },
        depthStencil: { depthCompare: 'less' },
    };

    const vertexArrayMaps: { [key: string]: { vertices?: VertexAttributes, indices: IndicesDataTypes }[] } = {};

    // 循环中的变量
    let mesh: any;
    let primitive: Primitive;
    let vertexBuffer: VertexData;
    let indicesBuffer: IndicesDataTypes;

    let texture: Texture;
    let sampler: Sampler;

    // 加载模型后渲染
    const glTFLoader = new GlTFLoader();
    let curScene: any;
    const gltfUrl = './assets/gltf/plane.gltf';

    glTFLoader.loadGLTF(gltfUrl, function (glTF)
    {
        curScene = glTF.scenes[glTF.defaultScene];

        let i; let len;

        for (const mid in curScene.meshes)
        {
            mesh = curScene.meshes[mid];
            vertexArrayMaps[mid] = [];

            for (i = 0, len = mesh.primitives.length; i < len; ++i)
            {
                primitive = mesh.primitives[i];

                // 初始化缓冲区
                const vertices = primitive.vertexBuffer;
                vertexBuffer = vertices;

                const indices = primitive.indices;
                indicesBuffer = indices;

                // VertexAttribPointer
                const positionInfo = primitive.attributes.POSITION;
                const normalInfo = primitive.attributes.NORMAL;
                const texcoordInfo = primitive.attributes.TEXCOORD_0;

                //
                vertexArrayMaps[mid].push({
                    vertices: {
                        position: { data: vertexBuffer, format: getIVertexFormat(positionInfo.size, VertexAttributeType2Name[positionInfo.type] as any), arrayStride: positionInfo.stride, offset: positionInfo.offset },
                        normal: { data: vertexBuffer, format: getIVertexFormat(normalInfo.size, VertexAttributeType2Name[normalInfo.type] as any), arrayStride: normalInfo.stride, offset: normalInfo.offset },
                        texcoord: { data: vertexBuffer, format: getIVertexFormat(texcoordInfo.size, VertexAttributeType2Name[texcoordInfo.type] as any), arrayStride: texcoordInfo.stride, offset: texcoordInfo.offset },
                    }, indices: indicesBuffer,
                });
            }
        }

        // 初始化纹理
        const imageUrl = './images/heightmap.jpg';
        loadImage(imageUrl).then((image) =>
        {
            // 初始化 2D 纹理（与原始示例完全一致）
            texture = {
                descriptor: {
                    format: 'rgba8unorm',
                    mipLevelCount: 1,
                    size: [256, 256],
                },
                sources: [{ image, flipY: false }],
            };
            sampler = {
                minFilter: 'nearest',
                magFilter: 'nearest',
                addressModeU: 'clamp-to-edge',
                addressModeV: 'clamp-to-edge',
            };

            requestAnimationFrame(render);
        });
    });

    // 初始化渲染变量
    const orientation = [0.0, 0.0, 0.0];

    const tempMat4 = mat4.create();
    const modelMatrix = mat4.create();

    const eyeVec3 = vec3.create();
    vec3.set(eyeVec3, 4, 3, 1);
    const centerVec3 = vec3.create();
    vec3.set(centerVec3, 0, 0.5, 0);
    const upVec3 = vec3.create();
    vec3.set(upVec3, 0, 1, 0);

    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, eyeVec3, centerVec3, upVec3);

    const mvMatrix = mat4.create();
    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    const perspectiveMatrix = mat4.create();
    mat4.perspective(perspectiveMatrix, 0.785, 1, 1, 1000);

    // 鼠标行为
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
        const newX = event.clientX;
        const newY = event.clientY;

        const deltaX = newX - lastMouseX;
        const deltaY = newY - lastMouseY;

        const m = mat4.create();
        mat4.rotateX(m, m, deltaX / 100.0);
        mat4.rotateY(m, m, deltaY / 100.0);

        mat4.multiply(tempMat4, mvMatrix, m);
        mat4.copy(mvMatrix, tempMat4);

        lastMouseX = newX;
        lastMouseY = newY;
    };

    // 为 canvas 添加鼠标事件
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    const localMV = mat4.create();

    function render()
    {
        const renderObjects: RenderPassObject[] = [];

        // 渲染
        const rp: RenderPass = {
            descriptor: {
                colorAttachments: [{ clearValue: [0.0, 0.0, 0.0, 1.0], loadOp: 'clear' }],
                depthStencilAttachment: { depthLoadOp: 'clear' },
            },
            renderPassObjects: renderObjects,
        };

        orientation[0] = 0.00020; // yaw
        orientation[1] = 0.00010; // pitch
        orientation[2] = 0.00005; // roll

        mat4.rotateX(mvMatrix, mvMatrix, orientation[0] * Math.PI);
        mat4.rotateY(mvMatrix, mvMatrix, orientation[1] * Math.PI);
        mat4.rotateZ(mvMatrix, mvMatrix, orientation[2] * Math.PI);

        let i; let len;
        for (const mid in curScene.meshes)
        {
            mesh = curScene.meshes[mid];

            for (i = 0, len = mesh.primitives.length; i < len; ++i)
            {
                primitive = mesh.primitives[i];

                mat4.multiply(localMV, mvMatrix, primitive.matrix);

                renderObjects.push({
                    pipeline: {
                        ...program,
                        primitive: { topology: IDrawMode2Name[primitive.mode] },
                    },
                    bindingResources: {
                        mvMatrix: { value: localMV as Float32Array },
                        pMatrix: { value: perspectiveMatrix as Float32Array },
                        displacementMap: { texture, sampler } as any,
                        diffuse: { texture, sampler } as any,
                    },
                    vertices: vertexArrayMaps[mid][i].vertices,
                    indices: vertexArrayMaps[mid][i].indices,
                    draw: { __type__: 'DrawIndexed', indexCount: primitive.indices.length },
                });
            }
        }

        // 提交渲染
        webgpu.submit({ commandEncoders: [{ passEncoders: [rp] }] });

        requestAnimationFrame(render);
    }
});
