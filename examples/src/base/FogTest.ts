import { Camera, Color3, CubeGeometry, FogMode, Object3D, reactive, Renderable, Scene, StandardMaterial, createStandardMaterial, Texture2D, ticker, View, logic, createObject3D, createCamera, createScene, createMeshRenderer, createCubeGeometry} from 'feng3d';

const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
reactive(scene).background = { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 };

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive((logic(camera).entity).position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(logic(scene).entity).children.push(logic(camera).entity);

const engine = new View(null, sceneObject3D);

const cube = createObject3D();
reactive(cube.position).z = -7;
reactive(cube.position).y = 0;
reactive(logic(scene).entity).children.push(cube);

const model = createMeshRenderer(); reactive(cube).components.push(model);
const cubeGeo = createCubeGeometry(); reactive(cubeGeo).width = 1; reactive(cubeGeo).height = 1; reactive(cubeGeo).depth = 1; reactive(cubeGeo).segmentsW = 1; reactive(cubeGeo).segmentsH = 1; reactive(cubeGeo).segmentsD = 1; reactive(cubeGeo).tile6 = false;
reactive(model).geometry = cubeGeo;
//材质
const material = reactive(model).material = createStandardMaterial();
const diffuseTex = new Texture2D(); diffuseTex.source = { url: '/m.png' };
reactive(material).s_diffuse = diffuseTex;
reactive(material.uniforms).u_fogMode = FogMode.LINEAR;
reactive(material.uniforms).u_fogColor = new Color3(1, 1, 0);
reactive(material.uniforms).u_fogMinDistance = 2;
reactive(material.uniforms).u_fogMaxDistance = 3;


ticker.onframe(() => {
    reactive(cube.rotation).y += 1;
});
