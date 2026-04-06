import { serialization, GameObject, Scene, Color4, Camera, Vector3, View, Renderable, Material, ticker, ColorUniforms } from 'feng3d';

/**
 * 测试3D容器
 */
const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

// 初始化颜色材质
const cube = GameObject.createPrimitive('Cube');
scene.gameObject.addChild(cube);

const colorMaterial = cube.getComponent(Renderable).material = serialization.setValue(new Material(), { shaderName: 'color' });

const cylinder = GameObject.createPrimitive('Cylinder');
cylinder.transform.x = 2;
cube.addChild(cylinder);

let num = 0;
ticker.onframe(() =>
{
    console.log('update');

    // 变化旋转与颜色
    cube.transform.ry += 1;

    num++;

    if (num % 60 === 0)
    {
        (<ColorUniforms>colorMaterial.uniforms).u_diffuseInput.fromUnit(Math.random() * (1 << 32 - 1));
    }
});
