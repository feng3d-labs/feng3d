import { serialization, GameObject, Scene, Color4, Camera, Vector3, View, FPSController, HoldSizeComponent, BillboardComponent, Renderable, PlaneGeometry, Material } from 'feng3d';

const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

camera.gameObject.addComponent(FPSController);
scene.background.setTo(0.3, 0.3, 0.3, 1);

const cube = GameObject.createPrimitive('Cube');
cube.transform.z = 3;
scene.gameObject.addChild(cube);

const gameObject = GameObject.createPrimitive('Plane');
gameObject.transform.y = 1.50;
const holdSizeComponent = gameObject.addComponent(HoldSizeComponent);
holdSizeComponent.holdSize = 1;
holdSizeComponent.camera = camera;
const billboardComponent = gameObject.addComponent(BillboardComponent);
billboardComponent.camera = camera;
cube.addChild(gameObject);

// 材质
const model = gameObject.getComponent(Renderable);
model.geometry = serialization.setValue(new PlaneGeometry(), { width: 0.1, height: 0.1, segmentsW: 1, segmentsH: 1, yUp: false });
const textureMaterial = model.material = serialization.setValue(new Material(), { uniforms: { s_diffuse: { __class__: 'Texture2D', source: { url: '../../resources/m.png' } } } });
// textureMaterial.cullFace = CullFace.NONE;
//

// var texture = textureMaterial.texture = new ImageDataTexture();
// var canvas2D = document.createElement("canvas");
// canvas2D.width = 256;
// canvas2D.height = 256;
// var context2D = canvas2D.getContext("2d");
// // context2D.fillStyle = "red";
// // context2D.fillRect(0, 0, canvas2D.width, canvas2D.height);
// context2D.fillStyle = "green";
// context2D.font = '48px serif';
// // context2D.fillText('Hello world', 50, 100);
// context2D.fillText('Hello world', 0, 50);
// // context2D.strokeText('Hello world', 50, 100);
// var imageData = context2D.getImageData(0, 0, canvas2D.width, canvas2D.height);
// texture.pixels = imageData;

// gameObject.holdSize = 1;
