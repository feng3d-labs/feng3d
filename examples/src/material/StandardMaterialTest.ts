import { Camera, Color4, CubeGeometry, Object3D, reactive, Renderable, Scene, StandardMaterial, createStandardMaterial, materialLogic, Texture2D, TextureFormat, View, logic, cameraLogic, sceneLogic, createObject3D, createCamera, createScene, createRenderable} from 'feng3d';
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

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

const model = createRenderable(); reactive(cube).components.push(model);
const cubeGeo = new CubeGeometry(); cubeGeo.width = 1; cubeGeo.height = 1; cubeGeo.depth = 1; cubeGeo.segmentsW = 1; cubeGeo.segmentsH = 1; cubeGeo.segmentsD = 1; cubeGeo.tile6 = false;
model.geometry = cubeGeo;
//材质
const textureMaterial = model.material = createStandardMaterial();
textureMaterial.s_diffuse = new Texture2D();
textureMaterial.s_diffuse.source = { url: '/m.png' };
textureMaterial.s_diffuse.format = TextureFormat.RGBA;
textureMaterial.s_diffuse.anisotropy = 16;
textureMaterial.uniforms.u_diffuse.a = 0.2;

reactive(materialLogic(textureMaterial).renderPipeline.fragment).targets = [{
    blend: {
        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
        alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    },
}];
