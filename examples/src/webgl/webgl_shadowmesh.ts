import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_shadowmesh.html。
 *
 * 原示例：4 个几何体（红方块/蓝圆柱/品红圆环/白球）+ 各自的 ShadowMesh
 * （投影到地平面的扁平阴影），方向光沿圆周运动，阴影随之旋转。
 *
 * feng3d 适配（已知限制）：
 * - ShadowMesh（平面投影阴影）：feng3d 无此技术，实时阴影（ShadowRenderer）对
 *   StandardMaterial 管线不兼容（产生大量 warning），故不开启阴影。
 *   仅展示几何体 + 光照效果，保留方向光圆周运动动画。
 * - ArrowHelper/lightSphere/lightHolder：省略。
 * - MeshLambertMaterial → StandardMaterial（glossiness 0 = 漫反射）。
 * - emissive 近似：three.js MeshLambert{emissive:0x200000} 给暗自发光，
 *   feng3d 无 emissive 字段，用 ambientColor(0.1) 补偿背光面亮度。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

let cubeRot: { readonly x: number; readonly y: number; readonly z: number };
let torusRot: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            // Scene.background = 0x0096ff（天蓝）
            background: { __type__: 'Color4', r: 0, g: 0.588, b: 1, a: 1 },
            // emissive 近似：低 ambient 补偿背光面
            ambientColor: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(55, aspect, 1, 3000), position(0, 2.5, 10)
            {
                __type__: 'Object3D', name: 'Main Camera',
                position: { x: 0, y: 2.5, z: 10 }, rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'PerspectiveCamera', fov: 55,
                    aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 3000,
                }],
            },
            // 方向光（圆周运动，对应原示例 sunLight 绕场景旋转）
            {
                __type__: 'Object3D', name: 'sunLight',
                position: { x: 5, y: 7, z: -1 }, rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    // feng3d 无 1/π 衰减，intensity 1 对应 three.js intensity ≈ 3/π ≈ 0.955
                    intensity: 1,
                }],
            },
            // 地面：BoxGeometry(30, 0.01, 40), MeshLambert{color:0x008200}
            {
                __type__: 'Object3D', name: 'ground', position: { x: 0, y: 0, z: 0 },
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
                }],
            },
            // 红色方块 z=-1（对应 three.js cube）
            {
                __type__: 'Object3D', name: 'cube', position: { x: 0, y: 0.5, z: -1 },
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
                }],
            },
            // 蓝色圆柱 z=-2.5（对应 three.js cylinder）
            {
                __type__: 'Object3D', name: 'cylinder', position: { x: 0, y: 1, z: -2.5 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CylinderGeometry', topRadius: 0.3, bottomRadius: 0.3, height: 2, segmentsW: 16, segmentsH: 1 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0, g: 0, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
            // 品红圆环 z=-6（对应 three.js torus, color:0xff00ff）
            {
                __type__: 'Object3D', name: 'torus', position: { x: 0, y: 0.5, z: -6 },
                rotation: torusRot = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'TorusGeometry', radius: 1, tubeRadius: 0.2, segmentsR: 16, segmentsT: 10 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 0, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
            // 白色球 z=-3.5（对应 three.js sphere）
            {
                __type__: 'Object3D', name: 'sphere', position: { x: 2, y: 0.5, z: -3.5 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 0.5, segmentsW: 20, segmentsH: 10 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
const lightObj = view.root!.children![1];

ticker.onframe(() =>
{
    const t = Date.now() * 0.001;
    // 几何体旋转
    reactive(cubeRot).y = t;
    reactive(torusRot).x = t * 0.5;
    // 方向光圆周运动（对应原示例 verticalAngle/horizontalAngle）
    reactive(lightObj).position = {
        x: Math.cos(t * 0.5) * 8,
        y: Math.sin(t * 0.3) * 3 + 5,
        z: Math.sin(t * 0.5) * 8 - 1,
    };
    webgpu.submit(viewLogic.submit);
});
