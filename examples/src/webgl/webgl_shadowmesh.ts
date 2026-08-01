import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_shadowmesh.html。
 *
 * 原示例：展示 ShadowMesh（投影到地平面的扁平阴影），多个几何体（立方体/球/圆环/圆柱）
 * + 方向光 + 地面，每帧旋转几何体，阴影随之变化。
 *
 * feng3d 适配：
 * - ShadowMesh（平面投影阴影）：feng3d 无此技术，改用实时阴影映射（DirectionalLight.castShadows），
 *   StandardMaterial 内置 shadow 采样。核心阴影效果（几何体在地面投射阴影）一致。
 * - ArrowHelper：feng3d 无辅助箭头，省略。
 * - MeshLambertMaterial → StandardMaterial（glossiness 0）。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

let cubeRot: { readonly x: number; readonly y: number; readonly z: number };
let sphereRot: { readonly x: number; readonly y: number; readonly z: number };
let torusRot: { readonly x: number; readonly y: number; readonly z: number };
let cylinderRot: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0, g: 0.588, b: 1, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 },
        }],
        children: [
            // 相机
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 2.5, z: 10 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 50,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 0.1,
                    far: 100,
                }],
            },
            // 方向光（投射阴影）
            {
                __type__: 'Object3D',
                name: 'sunLight',
                position: { x: 5, y: 7, z: -1 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 3,
                    castShadows: true,
                    shadowType: 'Hard_Shadows' as never,
                }],
            },
            // 地面（绿色，接收阴影）
            {
                __type__: 'Object3D',
                name: 'ground',
                position: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry', width: 30, height: 0.01, depth: 40 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0, g: 0.51, b: 0, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                    castShadows: false,
                    receiveShadows: true,
                }],
            },
            // 红色立方体
            {
                __type__: 'Object3D',
                name: 'cube',
                position: { x: 0, y: 0.5, z: -1 },
                rotation: cubeRot = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry', width: 1, height: 1, depth: 1 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                    castShadows: true, receiveShadows: true,
                }],
            },
            // 蓝色球体
            {
                __type__: 'Object3D',
                name: 'sphere',
                position: { x: -2, y: 0.5, z: 0 },
                rotation: sphereRot = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 0.5, segmentsW: 16, segmentsH: 8 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0, g: 0.5, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                    castShadows: true, receiveShadows: true,
                }],
            },
            // 黄色圆环
            {
                __type__: 'Object3D',
                name: 'torus',
                position: { x: 2, y: 0.5, z: 0 },
                rotation: torusRot = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'TorusGeometry', radius: 0.4, tubeRadius: 0.15, segmentsR: 16, segmentsT: 8 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 0.85, b: 0, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                    castShadows: true, receiveShadows: true,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
logic(view.root!.children![0]).lookAt({ x: 0, y: 0, z: 0 } as never);
logic(view.root!.children![1]).lookAt({ x: 0, y: 0, z: 0 } as never);

const cubeObj = view.root!.children![3];
const sphereObj = view.root!.children![4];
const torusObj = view.root!.children![5];

function animate(): void
{
    const t = Date.now() * 0.001;
    reactive(cubeRot).y = t;
    reactive(sphereRot).y = t * 0.7;
    reactive(torusRot).x = t * 0.5;

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
