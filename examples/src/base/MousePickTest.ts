import { Object3D, reactive, Renderable, Scene, StandardMaterial, Vector3, View, logic, batchRun, raycaster, windowEventProxy } from 'feng3d';

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
lookAtTransform(logic(scene).entity!.children[0], new Vector3());

// 点击拾取：直接监听 windowEventProxy click，用射线检测命中物体
windowEventProxy.on('click', () =>
{
    const mouseRay3D = (engine as any).mouseRay3D;
    if (!mouseRay3D) return;
    const objects = logic(scene).mouseCheckObjects;
    const hit = raycaster.pick(mouseRay3D, objects);
    const object3D = hit && hit.object3D;
    if (!object3D) return;

    const renderable = object3D.components!.find(c => c.__type__ === 'Renderable' || c.__type__ === 'MeshRenderer') as Renderable;
    if (renderable)
    {
        const material = renderable.material as StandardMaterial;
        // 每通道独立响应式随机（纯数据 Color4）
        reactive(material.uniforms.u_diffuse).r = Math.random();
        reactive(material.uniforms.u_diffuse).g = Math.random();
        reactive(material.uniforms.u_diffuse).b = Math.random();
    }
});

function lookAtTransform(t: Object3D, target: Vector3, upAxis?: Vector3)
{
    const m = logic(t).matrix.value.clone();
    m.lookAt(target, upAxis);
    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
    m.toTRS(pos, rot, scl);
    const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
    batchRun(() => { r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z; r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z; r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z; });
}
