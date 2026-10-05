import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 高度场碰撞体示例（对应 cannon-es 的 `heightfield.html`）。
 *
 * 一片由正弦函数生成的起伏地面，球从高处落下、顺着坡滚进谷里。
 *
 * 高度场用二维矩阵描述地形（每格一个高度），比三角网格省得多——
 * 适合坡地、丘陵这类"规则网格 + 高度"的地面。
 *
 * 一个容易踩的点：cannon-es 的 Heightfield 把高度放在 **Z 轴**上（地形展开在 X-Y 平面），
 * 而 feng3d 是 Y 轴朝上，所以这里给物体一个绕 X 轴 -90° 的旋转把两者对齐——
 * 这一步依赖"刚体旋转同步"（旋转从 Object3D 同步给刚体）。
 *
 * 已知瑕疵（有意留在这里以便看清高度场本身）：视觉用的是一块**平**的 PlaneGeometry，
 * 而碰撞用的是起伏的高度场，所以球看起来像在贴着平面滚动。要视觉与碰撞一致，
 * 得按同一份 heights 生成带起伏的网格（那是渲染侧的事，不影响本示例演示碰撞体本身）。
 */
const SIZE = 8;
const ELEMENT = 1.1;

// 高度矩阵：data[x][y] = 正弦起伏
const heights: number[][] = [];
for (let x = 0; x < SIZE; x++)
{
    const row: number[] = [];
    for (let y = 0; y < SIZE; y++)
    {
        row.push(Math.sin(x * 0.6) * Math.cos(y * 0.6) * 1.1);
    }
    heights.push(row);
}

const BALLS = [
    { x: -3, z: -2, y: 9, color: { r: 0.90, g: 0.45, b: 0.30 } },
    { x: 1, z: 2, y: 11, color: { r: 0.35, g: 0.75, b: 0.40 } },
    { x: 3.5, z: -3, y: 13, color: { r: 0.35, g: 0.55, b: 0.95 } },
];

const balls = BALLS.map((b, i) => ({
    __type__: 'Object3D',
    name: 'Ball-' + (i + 1),
    position: { x: b.x, y: b.y, z: b.z },
    components: [{
        __type__: 'MeshRenderer',
        geometry: { __type__: 'SphereGeometry', radius: 0.45 },
        material: {
            __type__: 'ColorMaterial',
            uniforms: { u_diffuseInput: { __type__: 'Color4', r: b.color.r, g: b.color.g, b: b.color.b, a: 1 } },
        },
    }, { __type__: 'SphereCollider', radius: 0.45 }, { __type__: 'Rigidbody', mass: 1 }],
}));

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsHeightfield',
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
            position: { x: 0, y: 8, z: 18 },
            rotation: { x: -0.35, y: 0, z: 0 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            // 地形：视觉用一个大平面承载（碰撞是高度场），绕 X 轴 -90° 把 Z 朝上对齐
            __type__: 'Object3D',
            name: 'Terrain',
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: -Math.PI / 2, y: 0, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'PlaneGeometry', width: SIZE * ELEMENT, height: SIZE * ELEMENT, segments: 1 },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.24, g: 0.30, b: 0.26, a: 1 } },
                },
            }, {
                __type__: 'HeightfieldCollider',
                heights,
                elementSize: ELEMENT,
            }, { __type__: 'Rigidbody', mass: 0 }],
        }, ...balls],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
