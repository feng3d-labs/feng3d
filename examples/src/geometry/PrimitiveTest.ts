import { Camera, ColorMaterial, createColorMaterial, CubeGeometry, CustomGeometry, Object3D, Matrix4x4, PlaneGeometry, reactive, Renderable, Scene, SphereGeometry, Vector3, View, logic, createObject3D, createCamera, createScene, createMeshRenderer, createCustomGeometry, createPlaneGeometry, createSphereGeometry, createCubeGeometry} from 'feng3d';
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
reactive(scene).background = { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 };

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive((logic(camera).entity).position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(logic(scene).entity).children.push(logic(camera).entity);

const engine = new View(null, sceneObject3D);

const object3D = createObject3D();
const model = createMeshRenderer(); reactive(object3D).components.push(model);

const geometry = reactive(model).geometry = createCustomGeometry();
const gLogic = logic(geometry);
gLogic.addGeometry(createPlaneGeometry());
const matrix = new Matrix4x4();
matrix.appendTranslation(0, 0.50, 0);
const sphereGeo = createSphereGeometry(); reactive(sphereGeo).radius = 50;
gLogic.addGeometry(sphereGeo, matrix);

matrix.appendTranslation(0, 0.50, 0);
const addGeometry = createCubeGeometry();
gLogic.addGeometry(addGeometry, matrix);

reactive(addGeometry).width = 0.50;
matrix.appendTranslation(0, 0.50, 0);
matrix.appendRotation(Vector3.Z_AXIS, 45);
gLogic.addGeometry(addGeometry, matrix);

reactive(object3D.position).z = 3;
reactive(object3D.position).y = -1;
reactive(logic(scene).entity).children.push(object3D);

//初始化颜色材质
reactive(model).material = createColorMaterial();
const colorUniforms = model.material as ColorMaterial;

//变化旋转与颜色
setInterval(() => {
    reactive(object3D.rotation).y += 1;
}, 15);
setInterval(() => {
    // 每通道独立响应式随机（纯数据 Color4）
    reactive(colorUniforms.uniforms.u_diffuseInput).r = Math.random();
    reactive(colorUniforms.uniforms.u_diffuseInput).g = Math.random();
    reactive(colorUniforms.uniforms.u_diffuseInput).b = Math.random();
}, 1000);
