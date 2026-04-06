import { serialization, GameObject, Scene, Color4, Camera, Vector3, View, Renderable, CubeGeometry, Material, FogMode, Color3, ticker } from 'feng3d';

const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const cube = new GameObject();
cube.transform.z = -7;
cube.transform.y = 0;
scene.gameObject.addChild(cube);

const model = cube.addComponent(Renderable);
model.geometry = serialization.setValue(new CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
// 材质
const material = model.material = serialization.setValue(new Material(), {
    uniforms: {
        s_diffuse: {
            __class__: 'Texture2D',
            source: { url: '../../resources/m.png' }
        },
        u_fogMode: FogMode.LINEAR,
        u_fogColor: new Color3(1, 1, 0),
        u_fogMinDistance: 2,
        u_fogMaxDistance: 3,
    }
});

ticker.onframe(() =>
{
    cube.transform.ry += 1;
});
