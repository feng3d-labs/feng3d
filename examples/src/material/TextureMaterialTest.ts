import { Camera, CubeGeometry, Object3D, reactive, Renderable, Scene, StandardMaterial, createStandardMaterial, View, logic, cameraLogic, sceneLogic, createObject3D, createCamera, createScene, createMeshRenderer, createCubeGeometry} from 'feng3d';
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
reactive(scene).background = { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 };

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(sceneLogic(scene).object3D).children.push(cameraLogic(camera).object3D);

const engine = new View(null, sceneObject3D);

const cube = createObject3D();
reactive(cube.position).z = 3;
reactive(cube.position).y = -1;
reactive(sceneLogic(scene).object3D).children.push(cube);

//变化旋转与颜色
setInterval(() => {
    reactive(cube.rotation).y += 1;
}, 15);

const model = createMeshRenderer(); reactive(cube).components.push(model);
const cubeGeo = createCubeGeometry(); reactive(cubeGeo).width = 1; reactive(cubeGeo).height = 1; reactive(cubeGeo).depth = 1; reactive(cubeGeo).segmentsW = 1; reactive(cubeGeo).segmentsH = 1; reactive(cubeGeo).segmentsD = 1; reactive(cubeGeo).tile6 = false;
reactive(model).geometry = cubeGeo;
//材质
const textureMaterial = reactive(model).material = createStandardMaterial();
(textureMaterial as any).s_texture = { source: { url: '/m.png' }, flipY: false };
