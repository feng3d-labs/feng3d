import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
import '@feng3d/addons';

/** 多物体自动旋转阵列。5 种几何体 × 3 行，各自旋转 + 整体旋转。 */
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const objs: { node: Object3D; rot: { x: number; y: number; z: number } }[] = [];
const types = ['CubeGeometry', 'SphereGeometry', 'TorusGeometry', 'TetrahedronGeometry', 'OctahedronGeometry'];

for (let i = 0; i < 15; i++)
{
    const t = types[i % 5];
    const rot = { x: Math.random() * 3, y: Math.random() * 3, z: 0 };
    const node: Object3D = {
        __type__: 'Object3D', name: `o${i}`,
        position: { x: (i % 5 - 2) * 4, y: Math.floor(i / 5) * 4 - 4, z: 0 },
        rotation: rot,
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: t, radius: 1, width: 1.5, height: 1.5, depth: 1.5, detail: 0 } as never,
            material: {
                __type__: 'StandardMaterial',
                uniforms: {
                    u_diffuse: { __type__: 'Color4', r: Math.random() * 0.7 + 0.3, g: Math.random() * 0.7 + 0.3, b: Math.random() * 0.7 + 0.3, a: 1 },
                    u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 },
                    u_glossiness: 30, u_reflectivity: 0,
                },
            },
        }],
    };
    objs.push({ node, rot });
}

let gr: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: wc,
    root: {
        __type__: 'Object3D', name: 'U',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.12, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 18 }, rotation: gr = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width / wc.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'l', position: { x: 1, y: 1, z: 1 },
              components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            ...objs.map(o => o.node),
        ],
    },
};

const vl = logic(view);
ticker.onframe(() =>
{
    for (const o of objs)
    {
        reactive(o.rot).x += 0.01;
        reactive(o.rot).y += 0.02;
    }
    reactive(gr).y += 0.002;
    webgpu.submit(vl.submit);
});
