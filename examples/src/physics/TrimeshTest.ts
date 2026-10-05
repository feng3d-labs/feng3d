import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 三角网格碰撞体示例（对应 cannon-es 的 `trimesh.html`）。
 *
 * 一个尖朝上的**圆锥**当静态碰撞体，四个球从不同高度落下、沿锥面滚开。
 *
 * 圆锥是 Trimesh 的典型用武之地：cannon-es 只有 Cylinder（圆柱）而没有 Cone，
 * 而 Trimesh 直接把**渲染用的那份几何**拿来当碰撞网格——所以圆锥的视觉与碰撞天然一致，
 * 不需要为碰撞单独建模。
 *
 * 注意 Trimesh **只能用于静态刚体**（它没有体积，算不出动态物体的惯性）。
 */
const CONE = { radiusTop: 0.05, radiusBottom: 3, height: 4, radialSegments: 24, heightSegments: 3, yUp: true };

const BALLS = [
    { x: -0.6, z: -0.6, y: 7, color: { r: 0.90, g: 0.45, b: 0.30 } },
    { x: 0.6, z: -0.6, y: 8, color: { r: 0.35, g: 0.75, b: 0.40 } },
    { x: -0.6, z: 0.6, y: 9, color: { r: 0.35, g: 0.55, b: 0.95 } },
    { x: 0.6, z: 0.6, y: 10, color: { r: 0.90, g: 0.75, b: 0.30 } },
];

const balls = BALLS.map((b, i) => ({
    __type__: 'Object3D',
    name: 'Ball-' + (i + 1),
    position: { x: b.x, y: b.y, z: b.z },
    components: [{
        __type__: 'MeshRenderer',
        geometry: { __type__: 'SphereGeometry', radius: 0.4 },
        material: {
            __type__: 'ColorMaterial',
            uniforms: { u_diffuseInput: { __type__: 'Color4', r: b.color.r, g: b.color.g, b: b.color.b, a: 1 } },
        },
    }, { __type__: 'SphereCollider', radius: 0.4 }, { __type__: 'Rigidbody', mass: 1 }],
}));

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsTrimesh',
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
            position: { x: 0, y: 6, z: 18 },
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
            }, { __type__: 'BoxCollider', width: 40, height: 1, depth: 40 }, { __type__: 'Rigidbody', mass: 0 }],
            position: { x: 0, y: -1, z: 0 },
            scale: { x: 40, y: 1, z: 40 },
        }, {
            // 圆锥：渲染与碰撞用的是同一份几何数据
            __type__: 'Object3D',
            name: 'Cone',
            position: { x: 0, y: 2, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CylinderGeometry', ...CONE },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.55, g: 0.58, b: 0.64, a: 1 } },
                },
            }, {
                __type__: 'TrimeshCollider',
                geometry: { __type__: 'CylinderGeometry', ...CONE },
            }, { __type__: 'Rigidbody', mass: 0 }],
        }, ...balls],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
