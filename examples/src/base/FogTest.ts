import { Camera, Color3, Color4, CubeGeometry, FogMode, GameObject, reactive, Renderable, Scene, StandardMaterial, Texture2D, ticker, View } from 'feng3d';

const sceneGameObject = new GameObject(); sceneGameObject.name = "Untitled";
const scene = sceneGameObject.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraGameObject = new GameObject(); cameraGameObject.name = "Main Camera";
const camera = cameraGameObject.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const cube = new GameObject();
reactive(cube.transform.position).z = -7;
reactive(cube.transform.position).y = 0;
scene.gameObject.addChild(cube);

const model = cube.addComponent(Renderable);
const cubeGeo = new CubeGeometry(); cubeGeo.width = 1; cubeGeo.height = 1; cubeGeo.depth = 1; cubeGeo.segmentsW = 1; cubeGeo.segmentsH = 1; cubeGeo.segmentsD = 1; cubeGeo.tile6 = false;
model.geometry = cubeGeo;
//材质
const material = model.material = new StandardMaterial();
const diffuseTex = new Texture2D(); diffuseTex.source = { url: '/m.png' };
material.s_diffuse = diffuseTex;
material.uniforms.u_fogMode = FogMode.LINEAR;
material.uniforms.u_fogColor = new Color3(1, 1, 0);
material.uniforms.u_fogMinDistance = 2;
material.uniforms.u_fogMaxDistance = 3;


ticker.onframe(() => {
    reactive(cube.transform.rotation).y += 1;
});
