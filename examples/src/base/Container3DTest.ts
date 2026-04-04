import { Color4, ColorMaterial, ColorUniforms, Node3D, ticker, Vector3 } from 'feng3d';

const root = new Node3D();
root.addComponent('WebGLRenderer3D');

/**
 * 测试3D容器
 */
const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('Camera3D');
camera.entity.position = new Vector3(0, 1, -10);
scene.entity.addChild(camera.entity);

// 初始化颜色材质
const cube = Node3D.createPrimitive('Cube');
scene.entity.addChild(cube);

const colorMaterial = cube.getComponent('Mesh3D').material = new ColorMaterial();

const cylinder = Node3D.createPrimitive('Cylinder');
cylinder.x = 2;
cube.addChild(cylinder);

let num = 0;
ticker.onFrame(() =>
{
    // 变化旋转与颜色
    cube.ry += 1;

    num++;

    if (num % 60 === 0)
    {
        (<ColorUniforms>colorMaterial.uniforms).u_diffuseInput.random();
    }
});
