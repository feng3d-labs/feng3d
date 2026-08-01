import { WebGPU } from '@feng3d/webgpu';
import { StandardMaterial, Scene, View, Object3D, logic, reactive, raycaster, Camera } from 'feng3d';
import { windowEventProxy } from '@feng3d/shortcut';

/**
 * 移植自 three.js examples/webgl_interactive_cubes_ortho.html。
 * 正交相机 + Raycaster 拾取变色。点击立方体改变颜色。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

let scene: Scene;
let camera: Camera;

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [scene = {
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.941, g: 0.941, b: 0.941, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 10 },
                components: [camera = {
                    __type__: 'OrthographicCamera',
                    left: -webgpuCanvas.width / 80,
                    right: webgpuCanvas.width / 80,
                    top: webgpuCanvas.height / 80,
                    bottom: -webgpuCanvas.height / 80,
                    near: 0.1,
                    far: 100,
                }],
            },
            {
                __type__: 'Object3D',
                name: 'dirLight',
                position: { x: 1, y: 1, z: 1 },
                components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 3 }],
            },
        ],
    },
};

// 生成 N 个立方体
const cubes: Object3D[] = [];
for (let x = -3; x <= 3; x++)
{
    for (let y = -3; y <= 3; y++)
    {
        const cube: Object3D = {
            __type__: 'Object3D',
            name: `cube_${x}_${y}`,
            position: { x: x * 1.5, y: y * 1.5, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry', width: 1, height: 1, depth: 1 },
                material: {
                    __type__: 'StandardMaterial',
                    uniforms: {
                        u_diffuse: { __type__: 'Color4', r: Math.random(), g: Math.random(), b: Math.random(), a: 1 },
                        u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                        u_glossiness: 0, u_reflectivity: 0,
                    },
                } as StandardMaterial,
            }],
            mouseEnabled: true,
        };
        cubes.push(cube);
        view.root!.children!.push(cube);
    }
}

const viewLogic = logic(view);

// 点击拾取变色
windowEventProxy.on('mousedown', () =>
{
    const rect = webgpuCanvas.getBoundingClientRect();
    const sx = windowEventProxy.clientX - rect.left;
    const sy = windowEventProxy.clientY - rect.top;
    const gx = (sx * 2 - rect.width) / rect.width;
    const gy = -(sy * 2 - rect.height) / rect.height;
    const ray = logic(camera).getRay3D(gx, gy);
    if (!ray) return;
    const hit = raycaster.pick(ray, cubes);
    if (hit && hit.object3D)
    {
        const meshRenderer = hit.object3D.components!.find(c => c.__type__ === 'MeshRenderer') as { material: StandardMaterial };
        if (meshRenderer?.material?.uniforms)
        {
            reactive(meshRenderer.material.uniforms).u_diffuse = {
                __type__: 'Color4',
                r: Math.random(), g: Math.random(), b: Math.random(), a: 1,
            };
        }
    }
});

function animate(): void
{
    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
