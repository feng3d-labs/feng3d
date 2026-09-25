import { WebGPU } from '@feng3d/webgpu';
import { CatmullRomCurve3, Vector3 } from '@feng3d/math';
import { logic, Object3D, Scene, StandardMaterial, View, ticker } from 'feng3d';
import '@feng3d/addons';
import type { TubeGeometry } from '@feng3d/addons';

/**
 * 移植自 three.js examples/webgl_geometry_extrude_splines.html。
 *
 * 原示例：沿 CatmullRomCurve3 曲线挤出 TubeGeometry 管道，OrbitControls 漫游。
 *
 * feng3d 适配：库已实现 TubeGeometry（@feng3d/addons），用 feng3d math 的 CatmullRomCurve3。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 定义曲线控制点（spline 路径）
const splinePoints = [
    new Vector3(-10, 0, 10),
    new Vector3(-5, 5, 5),
    new Vector3(0, 0, 0),
    new Vector3(5, -5, 5),
    new Vector3(10, 0, -10),
];
const path = new CatmullRomCurve3(splinePoints);

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.02, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 30 },
                components: [
                    { __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 1000 },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            // 管道 mesh
            {
                __type__: 'Object3D',
                name: 'tube',
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: {
                        __type__: 'TubeGeometry',
                        path: path as never,
                        tubularSegments: 64,
                        radius: 0.5,
                        radialSegments: 8,
                        closed: false,
                    } as TubeGeometry,
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.2, g: 0.8, b: 0.4, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 },
                            u_glossiness: 30, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
            // 方向光
            {
                __type__: 'Object3D',
                name: 'dirLight',
                position: { x: 1, y: 1, z: 1 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 3,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
