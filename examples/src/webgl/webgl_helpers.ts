import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, Segment, SegmentGeometry, SegmentMaterial, StandardMaterial, View, ticker } from 'feng3d';

/** 辅助线展示（坐标轴 + 包围盒线框）。对照 three.js webgl_helpers.html */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 坐标轴线段（R/G/B 三轴）
const axisSegs: Segment[] = [
    { start: { x: 0, y: 0, z: 0 }, end: { x: 50, y: 0, z: 0 }, startColor: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 }, endColor: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 } },
    { start: { x: 0, y: 0, z: 0 }, end: { x: 0, y: 50, z: 0 }, startColor: { __type__: 'Color4', r: 0, g: 1, b: 0, a: 1 }, endColor: { __type__: 'Color4', r: 0, g: 1, b: 0, a: 1 } },
    { start: { x: 0, y: 0, z: 0 }, end: { x: 0, y: 0, z: 50 }, startColor: { __type__: 'Color4', r: 0, g: 0, b: 1, a: 1 }, endColor: { __type__: 'Color4', r: 0, g: 0, b: 1, a: 1 } },
];
// 包围盒线框（立方体边缘）
const boxSegs: Segment[] = [];
const s = 20;
for (const [x1,y1,z1, x2,y2,z2] of [
    [-s,-s,-s, s,-s,-s], [s,-s,-s, s,s,-s], [s,s,-s, -s,s,-s], [-s,s,-s, -s,-s,-s],
    [-s,-s,s, s,-s,s], [s,-s,s, s,s,s], [s,s,s, -s,s,s], [-s,s,s, -s,-s,s],
    [-s,-s,-s, -s,-s,s], [s,-s,-s, s,-s,s], [s,s,-s, s,s,s], [-s,s,-s, -s,s,s],
] as const)
{
    const col = { __type__: 'Color4' as const, r: 0.5, g: 0.5, b: 0.5, a: 1 };
    boxSegs.push({ start: { x: x1, y: y1, z: z1 }, end: { x: x2, y: y2, z: z2 }, startColor: { ...col }, endColor: { ...col } });
}

let torusRot: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 60, y: 40, z: 80 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 500 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'light', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            // Torus 主体
            { __type__: 'Object3D', name: 'torus', rotation: torusRot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'TorusGeometry', radius: 15, tubeRadius: 5, segmentsR: 32, segmentsT: 8 },
                material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.3, g: 0.6, b: 0.9, a: 1 }, u_specular: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 }, u_glossiness: 40, u_reflectivity: 0 } } }] },
            // 坐标轴
            { __type__: 'Object3D', name: 'axes', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: axisSegs } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] },
            // 包围盒
            { __type__: 'Object3D', name: 'bbox', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: boxSegs } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] },
        ],
    },
};
const viewLogic = logic(view);
ticker.onframe(() => { reactive(torusRot).y += 0.005; webgpu.submit(viewLogic.submit); });
