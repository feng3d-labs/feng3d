import { serialization, GameObject, Scene, Color4, Camera, Vector3, View, Renderable, CustomGeometry, PlaneGeometry, Matrix4x4, SphereGeometry, CubeGeometry, Material, ColorUniforms } from 'feng3d';

const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const gameobject = new GameObject();
const model = gameobject.addComponent(Renderable);

const geometry = model.geometry = new CustomGeometry();
geometry.addGeometry(new PlaneGeometry());
const matrix = new Matrix4x4();
matrix.appendTranslation(0, 0.50, 0);
geometry.addGeometry(serialization.setValue(new SphereGeometry(), { radius: 50 }), matrix);

matrix.appendTranslation(0, 0.50, 0);
const addGeometry = new CubeGeometry();
geometry.addGeometry(addGeometry, matrix);

addGeometry.width = 0.50;
matrix.appendTranslation(0, 0.50, 0);
matrix.appendRotation(Vector3.Z_AXIS, 45);
geometry.addGeometry(addGeometry, matrix);

gameobject.transform.z = 3;
gameobject.transform.y = -1;
scene.gameObject.addChild(gameobject);

// 初始化颜色材质
model.material = serialization.setValue(new Material(), { shaderName: 'color' });
const colorUniforms = <ColorUniforms>model.material.uniforms;

// 变化旋转与颜色
setInterval(function ()
{
    gameobject.transform.ry += 1;
}, 15);
setInterval(function ()
{
    colorUniforms.u_diffuseInput.fromUnit(Math.random() * (1 << 32 - 1));
}, 1000);
