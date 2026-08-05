import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, Segment, SegmentGeometry, SegmentMaterial, View, ticker } from 'feng3d';

/** 方向变换可视化（箭头旋转表示方向变化）。对照 three.js webgl_math_orientation_transform.html */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 坐标轴箭头（R/G/B 三色线段）
function makeArrow(dx: number, dy: number, dz: number, r: number, g: number, b: number): Segment
{
    return {
        start: { x: 0, y: 0, z: 0 }, end: { x: dx, y: dy, z: dz },
        startColor: { __type__: 'Color4', r, g, b, a: 1 }, endColor: { __type__: 'Color4', r, g, b, a: 1 },
    };
}

let groupRot: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.15, g: 0.15, b: 0.15, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 30, y: 30, z: 50 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 500 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'group', rotation: groupRot = { x: 0, y: 0, z: 0 },
              children: [
                // 多个朝向的箭头组（环形排列）
                ...Array.from({ length: 8 }, (_, i) => {
                    const a = (i / 8) * Math.PI * 2;
                    const dir = { __type__: 'SegmentGeometry' as const, segments: [
                        makeArrow(0, 20, 0, 1, 0, 0),
                        makeArrow(Math.cos(a) * 15, 0, Math.sin(a) * 15, 0, 1, 0),
                        makeArrow(-Math.sin(a) * 15, 0, Math.cos(a) * 15, 0, 0, 1),
                    ] };
                    return { __type__: 'Object3D' as const, name: `arrow_${i}`, position: { x: Math.cos(a) * 30, y: 0, z: Math.sin(a) * 30 }, rotation: { x: 0, y: a, z: 0 },
                        components: [{ __type__: 'MeshRenderer' as const, geometry: dir, material: { __type__: 'SegmentMaterial' as const } }] };
                }),
              ] },
        ],
    },
};
const viewLogic = logic(view);
ticker.onframe(() => { reactive(groupRot).y += 0.005; webgpu.submit(viewLogic.submit); });
