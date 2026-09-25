import { reactive, View, ticker, logic, Color4 } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';

let primitivesRotation: { readonly x: number; readonly y: number; readonly z: number; };
let u_diffuseInput: Color4;

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1, z: 10 },
            components: [{
                __type__: 'PerspectiveCamera',
            }],
        }, {
            __type__: 'Object3D',
            name: 'primitives',
            position: { x: 0, y: -1, z: 3 },
            rotation: primitivesRotation = { x: 0, y: 0, z: 0 },
            children: [{
                __type__: 'Object3D',
                name: 'plane',
                position: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PlaneGeometry', width: 100, height: 100, segmentsW: 1, segmentsH: 1, yUp: false },
                    material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } } },
                }],
            }, {
                __type__: 'Object3D',
                name: 'sphere',
                position: { x: 0, y: 0.5, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 50, segmentsW: 16, segmentsH: 12, yUp: true },
                    material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0, g: 1, b: 0, a: 1 } } },
                }],
            }, {
                __type__: 'Object3D',
                name: 'cube1',
                position: { x: 0, y: 1, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry', width: 1, height: 1, depth: 1 },
                    material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: u_diffuseInput = { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 } } },
                }],
            }, {
                __type__: 'Object3D',
                name: 'cube2',
                position: { x: 0, y: 1.5, z: 0 },
                rotation: { x: 0, y: 0, z: Math.PI / 4 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry', width: 0.5, height: 0.5, depth: 0.5 },
                    material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0, g: 0, b: 1, a: 1 } } },
                }],
            }],
        }],
    },
};
const viewLogic = logic(view);

// 变化旋转与颜色（rotation 单位为弧度，1° = π/180）
setInterval(() =>
{
    reactive(primitivesRotation).y += Math.PI / 180;
}, 15);

setInterval(() =>
{
    reactive(u_diffuseInput).r = Math.random();
    reactive(u_diffuseInput).g = Math.random();
    reactive(u_diffuseInput).b = Math.random();
}, 1000);

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
