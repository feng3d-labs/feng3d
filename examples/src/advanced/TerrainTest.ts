import { Camera, Color3, Color4, FPSController, Object3D, PointLight, reactive, Renderable, Scene, StandardMaterial, TerrainGeometry, Texture2D, TextureMinFilter, ticker, transformLogic, Vector3, Vector4, View, logic, cameraLogic, sceneLogic, createObject3D, createCamera, createScene, createRenderable, createPointLight, createFPSController} from 'feng3d';
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(sceneLogic(scene).object3D).children.push(cameraLogic(camera).object3D);

const engine = new View(null, sceneObject3D);

reactive(cameraLogic(camera).object3D.position).x = 0;
reactive(cameraLogic(camera).object3D.position).y = 80;
reactive(cameraLogic(camera).object3D.position).z = 0;
{ const c = createFPSController(); reactive(cameraLogic(camera).object3D).components.push(c); }

const root = '/terrain/';
//
const terrain = createObject3D(); reactive(terrain).name = "terrain";
const model = createRenderable(); reactive(terrain).components.push(model);
const heightMap = new Texture2D(); heightMap.source = { url: root + 'terrain_heights.jpg' };
const terrainGeo = new TerrainGeometry();
terrainGeo.heightMap = heightMap;
terrainGeo.width = 500; terrainGeo.height = 100; terrainGeo.depth = 500;
terrainGeo.segmentsW = 100;
terrainGeo.segmentsH = 100;
model.geometry = terrainGeo;
const material = new StandardMaterial();
let tex: Texture2D;
tex = new Texture2D(); tex.source = { url: root + 'terrain_diffuse.jpg' }; material.s_diffuse = tex;
tex = new Texture2D(); tex.source = { url: root + 'terrain_normals.jpg' }; material.s_normal = tex;
//
tex = new Texture2D(); tex.source = { url: root + 'terrain_splats.png' }; tex.generateMipmap = true; tex.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR; (material as any).s_blendTexture = tex;
tex = new Texture2D(); tex.source = { url: root + 'beach.jpg' }; tex.generateMipmap = true; tex.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR; (material as any).s_splatTexture1 = tex;
tex = new Texture2D(); tex.source = { url: root + 'grass.jpg' }; tex.generateMipmap = true; tex.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR; (material as any).s_splatTexture2 = tex;
tex = new Texture2D(); tex.source = { url: root + 'rock.jpg' }; tex.generateMipmap = true; tex.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR; (material as any).s_splatTexture3 = tex;
material.uniforms['u_splatRepeats'] = new Vector4(1, 50, 50, 50);

model.material = material;
reactive(sceneLogic(scene).object3D).children.push(terrain);

scene.ambientColor.setTo(0.2, 0.2, 0.2, 1.0);

//初始化光源
const light1 = createObject3D();
const pointLight1 = createPointLight(); reactive(light1).components.push(pointLight1);
pointLight1.range = 5000;
pointLight1.color = new Color3(1, 1, 1);
reactive(light1.position).y = 1000;
reactive(sceneLogic(scene).object3D).children.push(light1);

//
ticker.onframe(() => {
    const time = new Date().getTime();
    const angle = time / 1000 / 5;
    reactive(light1.position).y = Math.sin(angle) * 1000;
    reactive(light1.position).z = Math.cos(angle) * 1000;
});
