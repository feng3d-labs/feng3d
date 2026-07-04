import { Camera, Color4, ColorMaterial, Object3D, reactive, Renderable, Scene, ticker, View, object3DLogic, createPrimitive } from 'feng3d';
const sceneObject3D = new Object3D(); reactive(sceneObject3D).name = "Untitled";
const scene = object3DLogic(sceneObject3D).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); reactive(cameraObject3D).name = "Main Camera";
const camera = object3DLogic(cameraObject3D).addComponent(Camera);
{
    const _r_pos = reactive(camera.object3D.position);
    _r_pos.x = 0; _r_pos.y = 1; _r_pos.z = -10;
}
object3DLogic(scene.object3D).addChild(camera.object3D);

const engine = new View(null, scene, camera);

//初始化颜色材质
const cube = createPrimitive("Cube");
object3DLogic(scene.object3D).addChild(cube);

const colorMaterial = object3DLogic(cube).getComponent(Renderable).material = new ColorMaterial();

const cylinder = createPrimitive("Cylinder");
reactive(cylinder.position).x = 2;
object3DLogic(cube).addChild(cylinder);

let num = 0;
ticker.onframe(() => {
    //变化旋转与颜色
    reactive(cube.rotation).y += 1;

    num++;

    if (num % 60 == 0) {
        reactive(colorMaterial.uniforms).u_diffuseInput = new Color4().fromUnit(Math.random() * (1 << 32 - 1));
    }
});
