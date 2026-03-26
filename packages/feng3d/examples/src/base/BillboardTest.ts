import { $set, Color4, Node3D, PlaneGeometry, StandardMaterial, Vector3 } from 'feng3d';

const root = new Node3D();
root.addComponent('WebGLRenderer3D');

const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('Camera3D');
camera.entity.position = new Vector3(0, 1, -10);
scene.entity.addChild(camera.entity);

camera.entity.addComponent('FPSController3D');
scene.background.setTo(0.3, 0.3, 0.3, 1);

const cube = Node3D.createPrimitive('Cube');
cube.z = 3;
scene.entity.addChild(cube);

const node3d = Node3D.createPrimitive('Plane');
node3d.y = 1.50;
const holdSizeComponent = node3d.addComponent('HoldSize3D');
holdSizeComponent.holdSize = 1;
holdSizeComponent.camera = camera;
const billboardComponent = node3d.addComponent('Billboard3D');
billboardComponent.camera = camera;
cube.addChild(node3d);

// 材质
const model = node3d.getComponent('Mesh3D');
model.geometry = $set(new PlaneGeometry(), { width: 0.1, height: 0.1, segmentsW: 1, segmentsH: 1, yUp: false });
const textureMaterial = model.material = new StandardMaterial().init({ uniforms: { s_diffuse: { __class__: 'LoadImageTexture2D', url: '../../m.png' } } });
// textureMaterial.cullFace = 'NONE';
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

