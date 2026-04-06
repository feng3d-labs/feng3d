import { Camera, Color4, CubeGeometry, GameObject, Material, Renderable, Scene, serialization, Vector3, View } from 'feng3d';

const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const cube = new GameObject();
cube.transform.z = 3;
cube.transform.y = -1;
scene.gameObject.addChild(cube);

// 变化旋转与颜色
setInterval(function ()
{
    cube.transform.ry += 1;
}, 15);

const model = cube.addComponent(Renderable);
model.geometry = serialization.setValue(new CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
// model.geometry = new PlaneGeometry();
// 材质
model.material = serialization.setValue(new Material(), {
    shaderName: 'texture',
    uniforms: {
        s_texture: {
            __class__: 'Texture2D', source: { url: '../../resources/m.png' }, flipY: false
        }
    }
});
