import { Camera, Color4, ColorUniforms, GameObject, Material, Renderable, Scene, serialization, Vector3, View } from "feng3d";

var scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

var camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

var engine = new View(null, scene, camera);

var cube = GameObject.createPrimitive('Cube');
cube.transform.z = 3;
scene.gameObject.addChild(cube);

// 初始化颜色材质
var colorMaterial = cube.getComponent(Renderable).material = serialization.setValue(new Material(), { shaderName: 'color' });

// 变化旋转与颜色
setInterval(function ()
{
    cube.transform.ry += 1;
}, 15);
setInterval(function ()
{
    (<ColorUniforms>colorMaterial.uniforms).u_diffuseInput.fromUnit(Math.random() * (1 << 32 - 1));
}, 1000);
