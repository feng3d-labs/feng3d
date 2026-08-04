import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, raycaster, Ray3, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
import type { Camera } from 'feng3d';

/**
 * 射线拾取盒子（悬停高亮变色）。
 *
 * 对照 three.js：examples/webgl_interactive_cubes.html
 * 鼠标悬停的盒子高亮变色，移开后恢复原色。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const cubes: { node: Object3D; origColor: { r: number; g: number; b: number } }[] = [];
for (let i = 0; i < 50; i++)
{
    const hue = i / 50;
    const r = Math.sin(hue * 6.28) * 0.3 + 0.5;
    const g = Math.sin(hue * 6.28 + 2.1) * 0.3 + 0.5;
    const b = Math.sin(hue * 6.28 + 4.2) * 0.3 + 0.5;
    const mat: StandardMaterial = {
        __type__: 'StandardMaterial',
        uniforms: { u_diffuse: { __type__: 'Color4', r, g, b, a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 },
    };
    const node: Object3D = {
        __type__: 'Object3D', name: `cube_${i}`,
        position: { x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20, z: (Math.random() - 0.5) * 20 },
        rotation: { x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: 0 },
        components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry', width: 1, height: 1, depth: 1 }, material: mat }],
    };
    cubes.push({ node, origColor: { r, g, b } });
}

const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.94, g: 0.94, b: 0.94, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 30 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 70, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, enableRotate: false, enablePan: false }] },
            { __type__: 'Object3D', name: 'dirLight', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            ...cubes.map(c => c.node),
        ],
    },
};

const viewLogic = logic(view);
const camera = view.root!.children![0].components![0] as unknown as Camera;
let intersected: Object3D | null = null;

webgpuCanvas.addEventListener('pointermove', (e: PointerEvent) =>
{
    const rect = webgpuCanvas.getBoundingClientRect();
    const ray = logic(camera).getRay3D?.((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height) as Ray3 | undefined;
    if (!ray) return;
    const hit = raycaster.pick(ray, cubes.map(c => c.node));
    // 恢复旧的高亮
    if (intersected && (!hit || hit.entity !== intersected))
    {
        const c = cubes.find(c => c.node === intersected);
        if (c) reactive((c.node.components![0] as { material: StandardMaterial }).material.uniforms).u_diffuse = { __type__: 'Color4', r: c.origColor.r, g: c.origColor.g, b: c.origColor.b, a: 1 };
        intersected = null;
    }
    if (hit)
    {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entity = (hit as any).entity as Object3D;
        if (entity && entity !== intersected)
        {
            reactive((entity.components![0] as { material: StandardMaterial }).material.uniforms).u_diffuse = { __type__: 'Color4', r: 1, g: 0.5, b: 0, a: 1 };
            intersected = entity;
        }
    }
});

ticker.onframe(() =>
{
    for (const c of cubes)
    {
        const rot = c.node.rotation as { x: number; y: number };
        reactive(rot).x += 0.005;
        reactive(rot).y += 0.01;
    }
    webgpu.submit(viewLogic.submit);
});
