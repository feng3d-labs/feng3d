import { Camera, Color4, GameObject, PointGeometry, PointMaterial, reactive, Renderable, Scene, serialization, Vector3, View } from 'feng3d';
const scene = serialization.setValue(new GameObject(), { name: "Untitled" }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: "Main Camera" }).addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const pointGeometry = new PointGeometry();
const pointMaterial = new PointMaterial();
const gameObject = serialization.setValue(new GameObject(), { name: "plane" });
const model = gameObject.addComponent(Renderable);
model.geometry = pointGeometry;
model.material = pointMaterial;
reactive(gameObject.transform.position).z = 3;
scene.gameObject.addChild(gameObject);

const length = 200;
const height = 2 / Math.PI;
for (let x = -length; x <= length; x = x + 4) {
    const angle = x / length * Math.PI;
    const vec = new Vector3(x / 100, Math.sin(angle) * height, 0);
    pointGeometry.points.push({ position: vec });
}

//变化旋转
setInterval(() => {
    reactive(gameObject.transform.rotation).y += 1;
}, 15);
