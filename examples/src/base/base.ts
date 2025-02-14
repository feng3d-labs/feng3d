import { Color4, Node3D, ticker } from 'feng3d';

// 创建根结点
const root = new Node3D();

root.addComponent('WebGLRenderer3D');

const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('Camera3D');
scene.entity.addChild(camera.entity);

const cube = Node3D.createPrimitive('Cube');
cube.y = -1;
cube.z = 3;
scene.entity.addChild(cube);

ticker.onFrame(() =>
{
    cube.ry++;
});
