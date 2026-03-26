import { Color4, ColorMaterial, ColorUniforms, Node3D, Vector3 } from 'feng3d';

const root = new Node3D();
root.addComponent('WebGLRenderer3D');

const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('Camera3D');
camera.entity.position = new Vector3(0, 1, -10);
scene.entity.addChild(camera.entity);

const cube = Node3D.createPrimitive('Cube');
cube.z = 3;
scene.entity.addChild(cube);

// 初始化颜色材质
const colorMaterial = cube.getComponent('Mesh3D').material = new ColorMaterial();

// 变化旋转与颜色
setInterval(function ()
{
    cube.ry += 1;
}, 15);
setInterval(function ()
{
    (<ColorUniforms>colorMaterial.uniforms).u_diffuseInput.random();
}, 1000);
