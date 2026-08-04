import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromUrl, logic, Object3D, reactive, Scene, TextureMaterial, View, ticker } from 'feng3d';

/** 纹理旋转展示（UV grid 纹理在立方体上旋转动画）。对照 three.js webgl_materials_texture_rotation.html */
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const tex = await createTextureFromUrl('/uv_grid_opengl.jpg');
let cubeRot: { readonly x: number; readonly y: number; readonly z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1 }, ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 30 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 40, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 1000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'cube', rotation: cubeRot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry', width: 10, height: 10, depth: 10 },
                material: { __type__: 'TextureMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }, s_texture: tex as unknown as TextureMaterial['s_texture'] } }] },
        ],
    },
};
const viewLogic = logic(view);
ticker.onframe(() => { reactive(cubeRot).x += 0.005; reactive(cubeRot).y += 0.01; webgpu.submit(viewLogic.submit); });
