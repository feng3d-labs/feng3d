import { Object3D, reactive, Renderable, Scene, StandardMaterial, Vector3, View, logic, raycaster, ticker, Ray3, Camera } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';
import { windowEventProxy } from '@feng3d/shortcut';

let scene: Scene;
let camera: Camera;

/**
 * 操作方式:鼠标按下后可以使用移动鼠标改变旋转，wasdqe平移
 *
 * 点击物体随机变色。
 */
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [scene = {
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1, z: -10 },
            components: [camera = {
                __type__: 'PerspectiveCamera',
            }, {
                __type__: 'FPSController',
            }],
        }, {
            __type__: 'Object3D',
            name: 'Cube',
            position: { x: 0, y: 0, z: 0 },
            mouseEnabled: true,
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: { __type__: 'StandardMaterial' },
            }],
        }, {
            __type__: 'Object3D',
            name: 'Sphere',
            position: { x: -1.50, y: 0, z: 0 },
            mouseEnabled: true,
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'SphereGeometry' },
                material: { __type__: 'StandardMaterial' },
            }],
        }, {
            __type__: 'Object3D',
            name: 'Capsule',
            position: { x: 3, y: 0, z: 0 },
            mouseEnabled: true,
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CapsuleGeometry' },
                material: { __type__: 'StandardMaterial' },
            }],
        }, {
            __type__: 'Object3D',
            name: 'Cylinder',
            position: { x: -3, y: 0, z: 0 },
            mouseEnabled: true,
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CylinderGeometry' },
                material: { __type__: 'StandardMaterial' },
            }],
        }],
    },
};
const viewLogic = logic(view);

// 相机看向原点
logic(logic(scene).entity!.children[0]).lookAt(new Vector3());

// 点击拾取：监听 windowEventProxy mousedown+mouseup（与 FPSController 相同的事件源）
// click = 同一对象上 mousedown + mouseup

// 由鼠标屏幕坐标算摄像机射线（原 View.mouseRay3D / calcMouseRay3D 逻辑）
function getMouseRay(): Ray3 | null
{
    const rect = webgpuCanvas.getBoundingClientRect();
    const sx = windowEventProxy.clientX - rect.left;
    const sy = windowEventProxy.clientY - rect.top;
    // 屏幕坐标 → GPU 坐标（-1~1，Y 翻转）
    const gx = (sx * 2 - rect.width) / rect.width;
    const gy = -(sy * 2 - rect.height) / rect.height;

    return logic(camera).getRay3D(gx, gy);
}

let mouseDownObj: Object3D | null = null;
windowEventProxy.on('mousedown', () =>
{
    const mouseRay3D = getMouseRay();
    if (!mouseRay3D) { mouseDownObj = null; return; }
    const hit = raycaster.pick(mouseRay3D, logic(scene).mouseCheckObjects);
    mouseDownObj = hit?.object3D ?? null;
});
windowEventProxy.on('mouseup', () =>
{
    const mouseRay3D = getMouseRay();
    if (!mouseRay3D) { mouseDownObj = null; return; }
    const hit = raycaster.pick(mouseRay3D, logic(scene).mouseCheckObjects);
    const upObj = hit?.object3D ?? null;

    // mousedown 和 mouseup 命中同一对象 = click
    if (mouseDownObj && upObj && mouseDownObj === upObj)
    {
        const renderable = upObj.components!.find(c => c.__type__ === 'Renderable' || c.__type__ === 'MeshRenderer') as Renderable;
        if (renderable)
        {
            const material = renderable.material as StandardMaterial;
            reactive(material.uniforms.u_diffuse).r = Math.random();
            reactive(material.uniforms.u_diffuse).g = Math.random();
            reactive(material.uniforms.u_diffuse).b = Math.random();
        }
    }
    mouseDownObj = null;
});

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
