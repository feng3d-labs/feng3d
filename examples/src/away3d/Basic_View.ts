import { $set, Color4, Node3D, PlaneGeometry, StandardMaterial, ticker, Vector3 } from 'feng3d';

const root = new Node3D();
root.addComponent('WebGLRenderer3D');

const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('Camera3D');
camera.entity.position = new Vector3(0, 1, -10);
scene.entity.addChild(camera.entity);

camera.entity.z = -6;
camera.entity.y = 5;
camera.entity.lookAt(new Vector3());

const plane = new Node3D();
const model = plane.addComponent('Mesh3D');
model.geometry = $set(new PlaneGeometry(), { width: 7, height: 7 });
model.material = new StandardMaterial().init({ uniforms: { s_diffuse: { __class__: 'LoadImageTexture2D', url: '../../floor_diffuse.jpg' } } });
scene.entity.addChild(plane);

ticker.onFrame(() =>
{
    plane.ry += 1;
});
