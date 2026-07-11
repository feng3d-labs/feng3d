import { Object3D, reactive, Renderable, Scene, StandardMaterial, Vector3, View, logic, raycaster } from 'feng3d';
import { windowEventProxy } from '@feng3d/shortcut';

/**
 * 操作方式:鼠标按下后可以使用移动鼠标改变旋转，wasdqe平移
 *
 * 点击物体随机变色。
 */
const sceneObject3D: Object3D = {
    __type__: 'Object3D',
    name: 'Untitled',
    components: [{
        __type__: 'Scene',
        background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
    }],
    children: [{
        __type__: 'Object3D',
        name: 'Main Camera',
        position: { x: 0, y: 1, z: -10 },
        components: [{
            __type__: 'Camera',
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
};

const engine = new View(null, sceneObject3D);
const scene = sceneObject3D.components![0] as Scene;

// 相机看向原点
logic(logic(scene).entity!.children[0]).lookAt(new Vector3());

// 点击拾取：监听 windowEventProxy mousedown+mouseup（与 FPSController 相同的事件源）
// click = 同一对象上 mousedown + mouseup
let mouseDownObj: Object3D | null = null;
windowEventProxy.on('mousedown', () =>
{
    const mouseRay3D = (engine as any).mouseRay3D;
    if (!mouseRay3D) { mouseDownObj = null; return; }
    const hit = raycaster.pick(mouseRay3D, logic(scene).mouseCheckObjects);
    mouseDownObj = hit?.object3D ?? null;
});
windowEventProxy.on('mouseup', () =>
{
    const mouseRay3D = (engine as any).mouseRay3D;
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
            console.log('[click] material type=', material?.__type__, 'has uniforms=', !!material?.uniforms, 'u_diffuse=', JSON.stringify(material?.uniforms?.u_diffuse));
            reactive(material.uniforms.u_diffuse).r = Math.random();
            reactive(material.uniforms.u_diffuse).g = Math.random();
            reactive(material.uniforms.u_diffuse).b = Math.random();
            console.log('[click] after change u_diffuse=', JSON.stringify(material?.uniforms?.u_diffuse));
        }
    }
    mouseDownObj = null;
});
