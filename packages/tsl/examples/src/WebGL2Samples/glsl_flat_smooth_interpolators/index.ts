/**
 * glsl_flat_smooth_interpolators 示例
 *
 * 演示 flat 和 smooth 插值限定符的区别。
 *
 * flat 插值：不进行插值，使用 provoking 顶点的值（通常是最后一个顶点）
 * smooth 插值：默认的透视校正插值
 *
 * 此示例同时支持 WebGL 和 WebGPU 渲染。
 *
 * TSL 用法：
 * - smooth varying（默认）: `varying('v_normal', vec3())`
 * - flat varying: `varying('v_normal', vec3(), { interpolation: 'flat' })`
 */

import { IndicesDataTypes, RenderPass, RenderPassObject, RenderPipeline, VertexAttributes, VertexFormat, Viewport } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';
import { mat4, vec3 } from 'gl-matrix';

// 导入 TSL 着色器
import {
    flatVertexShader, flatFragmentShader,
    smoothVertexShader, smoothFragmentShader,
} from './shaders/shader';

// 导入 glTF 加载器
import { GlTFLoader, Primitive } from './third-party/gltf-loader';

/**
 * 初始化画布尺寸
 */
function initCanvasSize(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

// 视口枚举
const VIEWPORTS = {
    LEFT: 0,   // flat 插值
    RIGHT: 1,  // smooth 插值
    MAX: 2,
};

document.addEventListener('DOMContentLoaded', async () =>
{
    // TSL 生成着色器代码
    const flatVertWgsl = flatVertexShader.toWGSL();
    const flatFragWgsl = flatFragmentShader.toWGSL(flatVertexShader);

    const smoothVertWgsl = smoothVertexShader.toWGSL();
    const smoothFragWgsl = smoothFragmentShader.toWGSL(smoothVertexShader);

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initCanvasSize(canvas);
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 画布尺寸
    const canvasSize = {
        x: canvas.width,
        y: canvas.height,
    };

    // 视口设置（左右两边）
    const viewportWidth = canvasSize.x / 2;
    const viewportHeight = canvasSize.y;

    const viewport: Viewport[] = [
        // 左侧：flat 插值
        {
            x: 0,
            y: 0,
            width: viewportWidth,
            height: viewportHeight,
        },
        // 右侧：smooth 插值
        {
            x: viewportWidth,
            y: 0,
            width: viewportWidth,
            height: viewportHeight,
        },
    ];

    // 渲染管线
    const programs: RenderPipeline[] = [
        // flat 渲染管线
        {
            vertex: { wgsl: flatVertWgsl },
            fragment: { wgsl: flatFragWgsl },
            depthStencil: { depthCompare: 'less-equal' },
            primitive: { topology: 'triangle-list' },
        },
        // smooth 渲染管线
        {
            vertex: { wgsl: smoothVertWgsl },
            fragment: { wgsl: smoothFragWgsl },
            depthStencil: { depthCompare: 'less-equal' },
            primitive: { topology: 'triangle-list' },
        },
    ];

    // 加载 glTF 模型（资源文件已复制到示例目录内）
    const gltfUrl = './assets/gltf/di_model_tri.gltf';
    const glTFLoader = new GlTFLoader();

    glTFLoader.loadGLTF(gltfUrl, function (glTF)
    {
        const curScene = glTF.scenes[glTF.defaultScene];

        // 初始化顶点数组
        const vertexArrayMaps: {
            [key: string]: { vertexArray: { vertices?: VertexAttributes }, indices: IndicesDataTypes }[]
        } = {};

        let mesh: {
            primitives: Primitive[];
        };
        let primitive: Primitive;
        let vertexArray: { vertices?: VertexAttributes };

        let i: number; let len: number;

        for (const mid in curScene.meshes)
        {
            mesh = curScene.meshes[mid];
            vertexArrayMaps[mid] = [];

            for (i = 0, len = mesh.primitives.length; i < len; ++i)
            {
                primitive = mesh.primitives[i];

                const vertices = primitive.vertexBuffer;
                const indices = primitive.indices;

                const positionInfo = primitive.attributes.POSITION;
                const normalInfo = primitive.attributes.NORMAL;

                vertexArray = {
                    vertices: {
                        position: {
                            data: vertices, format: (['float32', 'float32x2', 'float32x3', 'float32x4'] as VertexFormat[])[positionInfo.size],
                            arrayStride: positionInfo.stride, offset: positionInfo.offset,
                        },
                        normal: {
                            data: vertices, format: (['float32', 'float32x2', 'float32x3', 'float32x4'] as VertexFormat[])[normalInfo.size],
                            arrayStride: normalInfo.stride, offset: normalInfo.offset,
                        },
                    },
                };
                vertexArrayMaps[mid].push({ vertexArray, indices });
            }
        }

        // 渲染准备
        const translate = vec3.create();
        vec3.set(translate, 0, -18, -60);
        const scale = vec3.create();
        const s = 0.3;
        vec3.set(scale, s, s, s);
        const modelView = mat4.create();
        mat4.translate(modelView, modelView, translate);
        mat4.scale(modelView, modelView, scale);

        const rotatationSpeedY = 0.01;

        const perspective = mat4.create();
        mat4.perspective(perspective, 0.785, 1, 1, 1000);

        const localMV = mat4.create();
        const localMVP = mat4.create();
        const localMVNormal = mat4.create();

        // 渲染循环
        (function render()
        {
            const renderObjects: RenderPassObject[] = [];
            const rp: RenderPass = {
                descriptor: {
                    colorAttachments: [{ clearValue: [0.0, 0.0, 0.0, 1.0], loadOp: 'clear' }],
                    depthStencilAttachment: { depthLoadOp: 'clear' },
                },
                renderPassObjects: renderObjects,
            };

            mat4.rotateY(modelView, modelView, rotatationSpeedY);

            for (const mid in curScene.meshes)
            {
                mesh = curScene.meshes[mid];

                for (i = 0, len = mesh.primitives.length; i < len; ++i)
                {
                    primitive = mesh.primitives[i];

                    mat4.multiply(localMV, modelView, primitive.matrix);
                    mat4.multiply(localMVP, perspective, localMV);

                    mat4.invert(localMVNormal, localMV);
                    mat4.transpose(localMVNormal, localMVNormal);

                    const vertexArray = vertexArrayMaps[mid][i].vertexArray;
                    const indices = vertexArrayMaps[mid][i].indices;

                    for (let v = 0; v < VIEWPORTS.MAX; ++v)
                    {
                        renderObjects.push(
                            {
                                viewport: viewport[v],
                                pipeline: programs[v],
                                bindingResources: {
                                    mvp: { value: localMVP as Float32Array },
                                    mvNormal: { value: localMVNormal as Float32Array },
                                },
                                vertices: vertexArray.vertices,
                                indices,
                                draw: { __type__: 'DrawIndexed', indexCount: primitive.indices.length, firstIndex: 0 },
                            });
                    }
                }
            }

            const submit = { commandEncoders: [{ passEncoders: [rp] }] };
            webgpu.submit(submit);

            requestAnimationFrame(render);
        })();
    });
});
