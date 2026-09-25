import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, Segment, SegmentGeometry, SegmentMaterial, View, ticker } from 'feng3d';

/** 线框渲染（用 SegmentGeometry 近似几何体边缘线框）。对照 three.js webgl_materials_wireframe.html */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 生成立方体线框
function cubeWireframe(size: number): Segment[]
{
    const s = size / 2;
    const c = { __type__: 'Color4' as const, r: 0.5, g: 1, b: 0.5, a: 1 };
    const edges: [number, number, number, number, number, number][] = [
        [-s,-s,-s, s,-s,-s], [s,-s,-s, s,s,-s], [s,s,-s, -s,s,-s], [-s,s,-s, -s,-s,-s],
        [-s,-s,s, s,-s,s], [s,-s,s, s,s,s], [s,s,s, -s,s,s], [-s,s,s, -s,-s,s],
        [-s,-s,-s, -s,-s,s], [s,-s,-s, s,-s,s], [s,s,-s, s,s,s], [-s,s,-s, -s,s,s],
    ];

    return edges.map(([x1,y1,z1,x2,y2,z2]) => ({
        start: { x: x1, y: y1, z: z1 }, end: { x: x2, y: y2, z: z2 },
        startColor: { ...c }, endColor: { ...c },
    }));
}

let rot: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 8 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'wire', rotation: rot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: cubeWireframe(3) } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] },
        ],
    },
};
const viewLogic = logic(view);
ticker.onframe(() => { reactive(rot).x += 0.005; reactive(rot).y += 0.008; webgpu.submit(viewLogic.submit); });
