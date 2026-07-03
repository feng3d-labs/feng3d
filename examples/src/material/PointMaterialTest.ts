import * as feng3d from 'feng3d';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
camera.transform.position = new feng3d.Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

const pointGeometry = new feng3d.PointGeometry();
const pointMaterial = new feng3d.PointMaterial();
const gameObject = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "plane" });
const model = gameObject.addComponent(feng3d.Renderable);
model.geometry = pointGeometry;
model.material = pointMaterial;
gameObject.transform.z = 3;
scene.gameObject.addChild(gameObject);

const length = 200;
const height = 2 / Math.PI;
for (let x = -length; x <= length; x = x + 4) {
    const angle = x / length * Math.PI;
    const vec = new feng3d.Vector3(x / 100, Math.sin(angle) * height, 0);
    pointGeometry.points.push({ position: vec });
}

//变化旋转
setInterval(() => {
    gameObject.transform.ry += 1;
}, 15);
