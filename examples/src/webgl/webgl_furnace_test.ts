import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/**
 * 热炉测试（Furnace Test）— 纯白球在不同 glossiness 下的渐变。
 *
 * 对照 three.js：examples/webgl_furnace_test.html
 * 热炉测试是 PBR 材质验证的标准场景：纯白环境光下的球，glossiness 从 0→1。
 * feng3d 用 StandardMaterial + ambientColor 近似。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 一排球，glossiness 从 0 到 1
const spheres: Object3D[] = [];
const COUNT = 10;
for (let i = 0; i < COUNT; i++)
{
    const g = i / (COUNT - 1);
    spheres.push({
        __type__: 'Object3D', name: `furnace_${i}`,
        position: { x: (i - COUNT / 2 + 0.5) * 2.5, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SphereGeometry', radius: 1, segmentsW: 32, segmentsH: 16 },
            material: {
                __type__: 'StandardMaterial',
                uniforms: {
                    u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                    u_specular: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                    u_glossiness: g * 100, u_reflectivity: 0,
                },
            },
        }],
    });
}

const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 }, ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 20 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 45, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'dirLight', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 0.5 }] },
            ...spheres,
        ],
    },
};

const viewLogic = logic(view);
ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
