import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 凸包碰撞体示例（对应 cannon-es 的 `convex.html`）。
 *
 * 与 Trimesh 的分工在这里看得很清楚：
 * - **Trimesh 只能静态**（它没有体积，算不出惯性）；
 * - **Convex 能动态**——这里三个**六棱柱/圆台**是动态刚体，落地后会翻滚、互相碰撞。
 *
 * 形状直接取几何体的顶点与三角面，所以 c 边形的圆柱（radialSegments = 6）
 * 就自然得到一个六棱柱的凸包。
 */
const PRISMS = [
    { x: -3.2, color: { r: 0.90, g: 0.45, b: 0.30 }, radiusTop: 1, radiusBottom: 1, height: 2.4, rotation: 0.3 },
    { x: 0, color: { r: 0.35, g: 0.75, b: 0.40 }, radiusTop: 0.35, radiusBottom: 1.2, height: 2.6, rotation: -0.5 },
    { x: 3.2, color: { r: 0.35, g: 0.55, b: 0.95 }, radiusTop: 1.2, radiusBottom: 0.35, height: 2.6, rotation: 0.8 },
];

const prisms = PRISMS.map((p, i) => {
    const geometry = {
        __type__: 'CylinderGeometry',
        radiusTop: p.radiusTop,
        radiusBottom: p.radiusBottom,
        height: p.height,
        radialSegments: 6,
        heightSegments: 1,
        yUp: true,
    };

    return {
        __type__: 'Object3D',
        name: 'Prism-' + (i + 1),
        position: { x: p.x, y: 6, z: 0 },
        rotation: { x: p.rotation, y: 0, z: p.rotation * 0.7 },
        components: [{
            __type__: 'MeshRenderer',
            geometry,
            material: {
                __type__: 'ColorMaterial',
                uniforms: { u_diffuseInput: { __type__: 'Color4', r: p.color.r, g: p.color.g, b: p.color.b, a: 1 } },
            },
        }, { __type__: 'ConvexCollider', geometry }, { __type__: 'Rigidbody', mass: 1 }],
    };
});

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsConvex',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.09, g: 0.10, b: 0.13, a: 1 },
        }, {
            __type__: 'PhysicsWorld',
            gravity: { x: 0, y: -9.82, z: 0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 6, z: 16 },
            rotation: { x: -0.2, y: 0, z: 0 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Ground',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.24, g: 0.27, b: 0.32, a: 1 } },
                },
            }, { __type__: 'BoxCollider', width: 30, height: 1, depth: 30 }, { __type__: 'Rigidbody', mass: 0 }],
            scale: { x: 30, y: 1, z: 30 },
        }, ...prisms],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
