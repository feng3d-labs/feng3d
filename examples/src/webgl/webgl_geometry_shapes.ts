import { WebGPU } from '@feng3d/webgpu';
import { Shape2, Vector2 } from '@feng3d/math';
import { logic, Object3D, Scene, StandardMaterial, View, ticker } from 'feng3d';
import '@feng3d/addons';
import type { ShapeGeometry, ExtrudeGeometry } from '@feng3d/addons';

/**
 * 移植自 three.js examples/webgl_geometry_shapes.html。
 *
 * 原示例：用 Shape 定义 2D 形状（圆/方/心/三角等），ShapeGeometry 平面渲染 + ExtrudeGeometry 挤出 3D。
 *
 * feng3d 适配：库已实现 ShapeGeometry（earcut 三角化）+ ExtrudeGeometry（简化版挤出）。
 * feng3d math 的 Shape2 支持 points 构造 + Path2 的 moveTo/lineTo/absarc。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 创建几个 2D 形状
// 圆形
const circleShape = new Shape2();
circleShape.absarc(0, 0, 4, 0, Math.PI * 2, false);

// 方形
const squareShape = new Shape2([
    new Vector2(-3, -3), new Vector2(3, -3), new Vector2(3, 3), new Vector2(-3, 3),
]);

// 三角形
const triangleShape = new Shape2([
    new Vector2(0, 4), new Vector2(-3.5, -2), new Vector2(3.5, -2),
]);

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.05, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 },
        }],
        children: [
            // 相机 + OrbitControls
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 5, z: 20 },
                components: [
                    { __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 1000 },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            // 方向光
            {
                __type__: 'Object3D',
                name: 'dirLight',
                position: { x: 1, y: 1, z: 1 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 3,
                }],
            },
            // ShapeGeometry 平面（圆形，左侧）
            {
                __type__: 'Object3D',
                name: 'circleFlat',
                position: { x: -8, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'ShapeGeometry', shape: circleShape } as ShapeGeometry,
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.2, g: 0.8, b: 0.3, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
            // ExtrudeGeometry 挤出（方形，中间）
            {
                __type__: 'Object3D',
                name: 'squareExtruded',
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: -0.3, y: 0.5, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'ExtrudeGeometry', shapes: squareShape, depth: 2 } as ExtrudeGeometry,
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.3, b: 0.2, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
            // ExtrudeGeometry 挤出（三角形，右侧）
            {
                __type__: 'Object3D',
                name: 'triangleExtruded',
                position: { x: 8, y: 0, z: 0 },
                rotation: { x: -0.3, y: -0.5, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'ExtrudeGeometry', shapes: triangleShape, depth: 3 } as ExtrudeGeometry,
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.3, g: 0.4, b: 0.9, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
