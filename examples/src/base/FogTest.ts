import { Camera, Color3, Color4, CubeGeometry, FogMode, Object3D, reactive, Renderable, Scene, StandardMaterial, Texture2D, ticker, View, object3DLogic, cameraLogic, sceneLogic} from 'feng3d';

const sceneObject3D = new Object3D(); reactive(sceneObject3D).name = "Untitled";
object3DLogic(sceneObject3D);
const scene = new Scene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); reactive(cameraObject3D).name = "Main Camera";
object3DLogic(cameraObject3D);
const camera = new Camera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(sceneLogic(scene).object3D).children.push(cameraLogic(camera).object3D);

const engine = new View(null, scene, camera);

const cube = new Object3D();
reactive(cube.position).z = -7;
reactive(cube.position).y = 0;
reactive(sceneLogic(scene).object3D).children.push(cube);

const model = new Renderable(); reactive(cube).components.push(model);
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
    reactive(cube.rotation).y += 1;
});
