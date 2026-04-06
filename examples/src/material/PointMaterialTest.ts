import { serialization, GameObject, Scene, Color4, Camera, Vector3, View, PointGeometry, Material, RenderMode, Renderable, PointUniforms } from 'feng3d';

const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const pointGeometry = new PointGeometry();
const pointMaterial = serialization.setValue(new Material(), { shaderName: 'point', renderParams: { renderMode: RenderMode.POINTS } });
const gameObject = serialization.setValue(new GameObject(), { name: 'plane' });
const model = gameObject.addComponent(Renderable);
model.geometry = pointGeometry;
model.material = pointMaterial;
gameObject.transform.z = 3;
scene.gameObject.addChild(gameObject);

const length = 200;
const height = 2 / Math.PI;
for (let x = -length; x <= length; x = x + 4)
{
    const angle = x / length * Math.PI;
    const vec = new Vector3(x / 100, Math.sin(angle) * height, 0);
    pointGeometry.points.push({ position: vec });
}

// 变化旋转
setInterval(function ()
{
    gameObject.transform.ry += 1;
    (<PointUniforms>pointMaterial.uniforms).u_PointSize = 1 + 5 * Math.sin(gameObject.transform.ry / 30);
}, 15);
