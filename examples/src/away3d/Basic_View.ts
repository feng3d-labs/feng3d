import { Camera, Color4, GameObject, Material, PlaneGeometry, Renderable, Scene, serialization, ticker, Vector3, View } from 'feng3d';

const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

camera.transform.z = -6;
camera.transform.y = 5;
camera.transform.lookAt(new Vector3());

const plane = new GameObject();
const model = plane.addComponent(Renderable);
model.geometry = serialization.setValue(new PlaneGeometry(), { width: 7, height: 7 });
const material = model.material = serialization.setValue(new Material(), { uniforms: { s_diffuse: { __class__: 'Texture2D', source: { url: '../../resources/floor_diffuse.jpg' } } } });
scene.gameObject.addChild(plane);

ticker.onframe(() =>
{
    plane.transform.ry += 1;
});
