import { WebGPU } from '@feng3d/webgpu';
import {
    createTextureFromUrl,
    logic, MeshRenderer, Object3D,
    reactive, Scene, TextureMaterial,
    View, ticker,
} from 'feng3d';
// 多面体/圆/环几何体来自 addons（需显式 import 触发 registerLogic）
import type {
    CircleGeometry, IcosahedronGeometry, OctahedronGeometry, RingGeometry, TetrahedronGeometry,
} from '@feng3d/addons';
import '@feng3d/addons';

/**
 * 展示 feng3d 各种内置几何体，贴同一张 UV 网格纹理，旋转动画。
 *
 * 对照 three.js：examples/webgl_geometries.html
 *
 * 原示例用 MeshPhongMaterial + uv_grid_opengl.jpg 展示 Sphere/Icosa/Octa/Tetra/Plane/Box/
 * Circle/Ring/Cylinder/Cone/Torus/Knot 等几何体，排成网格，各自旋转。
 *
 * feng3d 适配：
 * - MeshPhongMaterial → TextureMaterial（无光照纯纹理，对应 MeshBasicMaterial({map})）
 * - 几何体一一对应（CubeGeometry/SphereGeometry/PlaneGeometry/CylinderGeometry/
 *   IcosahedronGeometry/OctahedronGeometry/TetrahedronGeometry/CircleGeometry/RingGeometry/TorusGeometry）
 * - 每个对象独立 rotation.y 动画
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// UV 网格纹理（对应原示例 uv_grid_opengl.jpg）
const uvTexture = await createTextureFromUrl('/uv_grid_opengl.jpg');

/** 创建一个新的 TextureMaterial（无光照纯纹理，每个 MeshRenderer 需独立实例） */
function makeMaterial(): TextureMaterial
{
    return {
        __type__: 'TextureMaterial',
        uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
        s_texture: uvTexture as unknown as TextureMaterial['s_texture'],
    };
}

// 旋转状态记录（每帧统一 +0.01）
const rotStates: { x: number; y: number; z: number }[] = [];

/** 构建一个旋转的几何体展示节点 */
function makeNode(name: string, geo: MeshRenderer['geometry'], x: number, z: number): Object3D
{
    const rot = { x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: 0 };
    rotStates.push(rot);

    return {
        __type__: 'Object3D',
        name,
        position: { x, y: 0, z },
        rotation: rot,
        components: [{
            __type__: 'MeshRenderer',
            geometry: geo,
            material: makeMaterial(),
        }],
    };
}

// 三排几何体（对应原示例的网格布局）
// 第一排（z=300）：球体、二十面体、八面体、四面体
// 第二排（z=100）：平面、立方体、圆、环
// 第三排（z=-100）：圆柱、圆环
const geometries: Object3D[] = [
    makeNode('sphere', { __type__: 'SphereGeometry', radius: 75, segmentsW: 20, segmentsH: 10 }, -300, 300),
    makeNode('icosahedron', { __type__: 'IcosahedronGeometry', radius: 75, detail: 0 } as IcosahedronGeometry, -100, 300),
    makeNode('octahedron', { __type__: 'OctahedronGeometry', radius: 75, detail: 0 } as OctahedronGeometry, 100, 300),
    makeNode('tetrahedron', { __type__: 'TetrahedronGeometry', radius: 75, detail: 0 } as TetrahedronGeometry, 300, 300),

    makeNode('plane', { __type__: 'PlaneGeometry', width: 100, height: 100, segmentsW: 4, segmentsH: 4 }, -300, 100),
    makeNode('cube', { __type__: 'CubeGeometry', width: 100, height: 100, depth: 100 }, -100, 100),
    makeNode('circle', { __type__: 'CircleGeometry', radius: 50, segments: 20, thetaStart: 0, thetaLength: Math.PI * 2 } as CircleGeometry, 100, 100),
    makeNode('ring', { __type__: 'RingGeometry', innerRadius: 10, outerRadius: 50, thetaSegments: 20, phiSegments: 5, thetaStart: 0, thetaLength: Math.PI * 2 } as RingGeometry, 300, 100),

    makeNode('cylinder', { __type__: 'CylinderGeometry', topRadius: 25, bottomRadius: 75, height: 100, segmentsW: 40, segmentsH: 5 }, -300, -100),
    makeNode('torus', { __type__: 'TorusGeometry', radius: 50, tubeRadius: 20, segmentsR: 20, segmentsT: 8 }, -100, -100),
];

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.95, g: 0.97, b: 1, a: 1 },
            ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        }],
        children: [
            {
                // 相机俯瞰几何体阵列，OrbitControls 可旋转观察
                // 注意：rotation 必须在字面量预声明，否则 OrbitControls 写入的新 rotation
                // 字段不会被响应式系统追踪
                __type__: 'Object3D', name: 'Main Camera',
                position: { x: 0, y: 400, z: 600 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [
                    {
                        __type__: 'PerspectiveCamera', fov: 45,
                        aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 2000,
                    },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 100 } },
                ],
            },
            ...geometries,
        ],
    },
};

const viewLogic = logic(view);

ticker.onframe(() =>
{
    // 每个几何体绕 y 轴自转
    for (const rot of rotStates)
    {
        reactive(rot).y += 0.01;
    }
    webgpu.submit(viewLogic.submit);
});
