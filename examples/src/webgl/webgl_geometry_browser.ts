import { WebGPU } from '@feng3d/webgpu';
import { CatmullRomCurve3, Vector3, Shape2, Vector2 } from '@feng3d/math';
import { StandardMaterial, Scene, View, logic, reactive, ticker } from 'feng3d';
import '@feng3d/addons';
import type { TubeGeometry, ExtrudeGeometry, ConvexGeometry } from '@feng3d/addons';

/**
 * 几何体展示：排列 feng3d 所有几何体类型（含新增的 Dodecahedron/Tube/Convex/Extrude）。
 * 对应 three.js scenes/geometry-browser。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 凸包输入点
const hullPts: Vector3[] = [];
for (let i = 0; i < 20; i++) hullPts.push(new Vector3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1));
// 管道路径
const tubePath = new CatmullRomCurve3([new Vector3(-1,0,0),new Vector3(0,1,0),new Vector3(1,0,0),new Vector3(0,-1,0),new Vector3(-1,0,0)]);
// 挤出形状
const star = new Shape2();
for (let i = 0; i < 10; i++) { const a=i/10*Math.PI*2, r=i%2===0?1:0.5; if(i===0) star.moveTo(Math.cos(a)*r,Math.sin(a)*r); else star.lineTo(Math.cos(a)*r,Math.sin(a)*r); }

const mat = (r:number,g:number,b:number) => ({ __type__: 'StandardMaterial' as const, uniforms: { u_diffuse: { __type__: 'Color4' as const, r, g, b, a: 1 }, u_specular: { __type__: 'Color4' as const, r:0.3,g:0.3,b:0.3,a:1 }, u_glossiness: 20, u_reflectivity: 0 } } as StandardMaterial);
const mesh = (geo: object, x: number, z: number, r: number, g: number, b: number) => ({
    __type__: 'Object3D' as const, position: { x, y: 0, z }, rotation: { x: 0.3, y: 0.5, z: 0 },
    components: [{ __type__: 'MeshRenderer' as const, geometry: geo, material: mat(r,g,b) }],
});

const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.05, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 8, z: 18 },
              components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'dirLight', position: { x: 1, y: 1, z: 1 },
              components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 3 }] },
            mesh({ __type__: 'SphereGeometry', radius: 1, segmentsW: 16, segmentsH: 8 }, -6, -3, 0.2, 0.6, 1),
            mesh({ __type__: 'CubeGeometry', width: 1.5, height: 1.5, depth: 1.5 }, -3, -3, 1, 0.3, 0.2),
            mesh({ __type__: 'IcosahedronGeometry', radius: 1, detail: 0 }, 0, -3, 0.2, 0.8, 0.3),
            mesh({ __type__: 'DodecahedronGeometry', radius: 1 }, 3, -3, 0.8, 0.3, 0.2),
            mesh({ __type__: 'OctahedronGeometry', radius: 1 }, 6, -3, 0.9, 0.9, 0.2),
            mesh({ __type__: 'TorusGeometry', radius: 0.8, tubeRadius: 0.3, segmentsR: 16, segmentsT: 8 }, -6, 0, 0.5, 0.2, 0.8),
            mesh({ __type__: 'TorusKnotGeometry', radius: 0.7, tube: 0.25 }, -3, 0, 0.3, 0.7, 0.9),
            mesh({ __type__: 'CylinderGeometry', radius: 0.5, height: 1.5 }, 0, 0, 0.6, 0.6, 0.2),
            mesh({ __type__: 'ConeGeometry', radius: 0.8, height: 1.5 }, 3, 0, 0.9, 0.4, 0.1),
            mesh({ __type__: 'CapsuleGeometry', radius: 0.4, height: 0.8 }, 6, 0, 0.7, 0.3, 0.7),
            mesh({ __type__: 'TubeGeometry', path: tubePath, tubularSegments: 32, radius: 0.15, radialSegments: 6, closed: false } as TubeGeometry, -6, 3, 0.3, 0.9, 0.5),
            mesh({ __type__: 'ConvexGeometry', points: hullPts } as ConvexGeometry, -3, 3, 0.8, 0.8, 0.3),
            mesh({ __type__: 'ExtrudeGeometry', shapes: star, depth: 0.5 } as ExtrudeGeometry, 0, 3, 1, 0.8, 0.2),
            mesh({ __type__: 'TetrahedronGeometry', radius: 1 }, 3, 3, 0.4, 0.2, 0.8),
        ],
    },
};

const viewLogic = logic(view);
ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
