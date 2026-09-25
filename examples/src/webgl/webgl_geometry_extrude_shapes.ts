import { WebGPU } from '@feng3d/webgpu';
import { CatmullRomCurve3, Vector3 } from '@feng3d/math';
import { logic, Object3D, Scene, StandardMaterial, View, ticker } from 'feng3d';
import '@feng3d/addons';
import type { TubeGeometry } from '@feng3d/addons';

/**
 * 移植自 three.js examples/webgl_geometry_extrude_shapes.html。
 *
 * 原示例：沿 CatmullRomCurve3 挤出 TubeGeometry，多个管道并排展示不同曲线形状。
 * 加方向光 + OrbitControls。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 3 条不同曲线
function makeSpiral(): CatmullRomCurve3
{
    const pts: Vector3[] = [];
    for (let i = 0; i < 20; i++) { pts.push(new Vector3(Math.cos(i*0.5)*5, i*0.5-5, Math.sin(i*0.5)*5)); }
    return new CatmullRomCurve3(pts);
}
function makeWave(): CatmullRomCurve3
{
    const pts: Vector3[] = [];
    for (let i = 0; i < 15; i++) { pts.push(new Vector3(i*0.8-6, Math.sin(i*0.8)*3, Math.cos(i*0.4)*2)); }
    return new CatmullRomCurve3(pts);
}
function makeKnot(): CatmullRomCurve3
{
    const pts: Vector3[] = [];
    for (let i = 0; i < 30; i++) { const t=i/30*Math.PI*2; pts.push(new Vector3(Math.cos(t)*4, Math.sin(t*2)*2, Math.sin(t)*4)); }
    return new CatmullRomCurve3(pts);
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.02, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 5, z: 25 },
                components: [
                    { __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 1000 },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            {
                __type__: 'Object3D',
                name: 'dirLight',
                position: { x: 1, y: 1, z: 1 },
                components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 3 }],
            },
            // 3 个管道
            {
                __type__: 'Object3D',
                position: { x: -10, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'TubeGeometry', path: makeSpiral(), tubularSegments: 64, radius: 0.3, radialSegments: 8, closed: false } as TubeGeometry,
                    material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.2, g: 0.8, b: 0.3, a: 1 }, u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 }, u_glossiness: 20, u_reflectivity: 0 } } as StandardMaterial,
                }],
            },
            {
                __type__: 'Object3D',
                position: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'TubeGeometry', path: makeWave(), tubularSegments: 64, radius: 0.3, radialSegments: 8, closed: false } as TubeGeometry,
                    material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.3, b: 0.2, a: 1 }, u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 }, u_glossiness: 20, u_reflectivity: 0 } } as StandardMaterial,
                }],
            },
            {
                __type__: 'Object3D',
                position: { x: 10, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'TubeGeometry', path: makeKnot(), tubularSegments: 64, radius: 0.3, radialSegments: 8, closed: false } as TubeGeometry,
                    material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.3, g: 0.4, b: 0.9, a: 1 }, u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 }, u_glossiness: 20, u_reflectivity: 0 } } as StandardMaterial,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
