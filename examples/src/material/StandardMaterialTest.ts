import { Camera, Color4, CubeGeometry, GameObject, reactive, Renderable, Scene, StandardMaterial, Texture2D, TextureFormat, View } from 'feng3d';
const sceneGameObject = new GameObject(); sceneGameObject.name = "Untitled";
const scene = sceneGameObject.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraGameObject = new GameObject(); cameraGameObject.name = "Main Camera";
const camera = cameraGameObject.addComponent(Camera);
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
const cubeGeo = new CubeGeometry(); cubeGeo.width = 1; cubeGeo.height = 1; cubeGeo.depth = 1; cubeGeo.segmentsW = 1; cubeGeo.segmentsH = 1; cubeGeo.segmentsD = 1; cubeGeo.tile6 = false;
model.geometry = cubeGeo;
//材质
const textureMaterial = model.material = new StandardMaterial();
textureMaterial.s_diffuse = new Texture2D();
textureMaterial.s_diffuse.source = { url: '/m.png' };
textureMaterial.s_diffuse.format = TextureFormat.RGBA;
textureMaterial.s_diffuse.anisotropy = 16;
textureMaterial.uniforms.u_diffuse.a = 0.2;

reactive(textureMaterial.renderPipeline.fragment).targets = [{
    blend: {
        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
        alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    },
}];
