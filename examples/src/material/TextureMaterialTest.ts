import * as feng3d from 'feng3d';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
{ const _r = feng3d.reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

const cube = new feng3d.GameObject();
feng3d.reactive(cube.transform.position).z = 3;
feng3d.reactive(cube.transform.position).y = -1;
scene.gameObject.addChild(cube);

//变化旋转与颜色
setInterval(() => {
    feng3d.reactive(cube.transform.rotation).y += 1;
}, 15);

const model = cube.addComponent(feng3d.Renderable);
model.geometry = feng3d.serialization.setValue(new feng3d.CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
//材质
model.material = feng3d.serialization.setValue(new feng3d.StandardMaterial(), {
    s_texture: {
        __class__: "Texture2D", source: { url: '/m.png' }, flipY: false
    }
} as any);

