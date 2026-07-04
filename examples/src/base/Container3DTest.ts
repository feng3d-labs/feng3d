import { Camera, Color4, ColorMaterial, Object3D, reactive, Renderable, Scene, ticker, View } from 'feng3d';
const sceneObject3D = new Object3D(); sceneObject3D.name = "Untitled";
const scene = sceneObject3D.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); cameraObject3D.name = "Main Camera";
const camera = cameraObject3D.addComponent(Camera);
{
    const _r_pos = reactive(camera.transform.position);
    _r_pos.x = 0; _r_pos.y = 1; _r_pos.z = -10;
}
scene.object3D.addChild(camera.object3D);

const engine = new View(null, scene, camera);

//初始化颜色材质
const cube = Object3D.createPrimitive("Cube");
scene.object3D.addChild(cube);

const colorMaterial = cube.getComponent(Renderable).material = new ColorMaterial();

const cylinder = Object3D.createPrimitive("Cylinder");
reactive(cylinder.transform.position).x = 2;
cube.addChild(cylinder);

let num = 0;
ticker.onframe(() => {
    //变化旋转与颜色
    reactive(cube.transform.rotation).y += 1;

    num++;

    if (num % 60 == 0) {
        reactive(colorMaterial.uniforms).u_diffuseInput = new Color4().fromUnit(Math.random() * (1 << 32 - 1));
    }
});
