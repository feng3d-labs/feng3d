import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
import type { Segment, SegmentGeometry, SegmentMaterial } from 'feng3d';

/** 钟摆（正弦摆动 + 摆锤）。 */
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const ropeSeg: Segment = { start: { x: 0, y: 0, z: 0 }, end: { x: 0, y: -80, z: 0 }, startColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 }, endColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 } };
let pivot: { x: number; y: number; z: number };
const v: View = {
    __type__: 'View', canvas: wc,
    root: {
        __type__: 'Object3D', name: 'U',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.12, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.7, g: 0.7, b: 0.7, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: -40, z: 150 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 45, aspect: wc.width / wc.height, near: 1, far: 1000 }, { __type__: 'OrbitControls', target: { x: 0, y: -40, z: 0 } }] },
            { __type__: 'Object3D', name: 'dl', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            { __type__: 'Object3D', name: 'pivot', rotation: pivot = { x: 0, y: 0, z: 0 },
              children: [
                  { __type__: 'Object3D', name: 'rope', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: [ropeSeg] } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] },
                  { __type__: 'Object3D', name: 'bob', position: { x: 0, y: -85, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry', width: 20, height: 20, depth: 20 }, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.5, b: 0.2, a: 1 }, u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 }, u_glossiness: 30, u_reflectivity: 0 } } }] },
              ] } as Object3D,
        ],
    },
};
const vl = logic(v);
ticker.onframe(() => { const t = Date.now() * 0.001; reactive(pivot).z = Math.sin(t * 1.5) * 0.4; webgpu.submit(vl.submit); });
