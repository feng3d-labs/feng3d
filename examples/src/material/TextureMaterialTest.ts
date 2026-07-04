import { Camera, Color4, CubeGeometry, GameObject, reactive, Renderable, Scene, serialization, StandardMaterial, View } from 'feng3d';
const scene = serialization.setValue(new GameObject(), { name: "Untitled" }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: "Main Camera" }).addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const cube = new GameObject();
reactive(cube.transform.position).z = 3;
reactive(cube.transform.position).y = -1;
scene.gameObject.addChild(cube);

//变化旋转与颜色
setInterval(() => {
    reactive(cube.transform.rotation).y += 1;
}, 15);

const model = cube.addComponent(Renderable);
model.geometry = serialization.setValue(new CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
//材质
model.material = serialization.setValue(new StandardMaterial(), {
    s_texture: {
        __class__: "Texture2D", source: { url: '/m.png' }, flipY: false
    }
} as any);
