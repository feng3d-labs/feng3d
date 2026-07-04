import { Camera, Color4, ColorMaterial, createPrimitive, Object3D, object3DLogic, reactive, Renderable, Scene, ticker, View } from 'feng3d';
const sceneObject3D = new Object3D();
object3DLogic(sceneObject3D);
reactive(sceneObject3D).name = "Untitled";
const scene = new Scene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D();
object3DLogic(cameraObject3D);
reactive(cameraObject3D).name = "Main Camera";
const camera = new Camera();
reactive(cameraObject3D).components.push(camera);
{
    const _r_pos = reactive(cameraObject3D.position);
    _r_pos.x = 0; _r_pos.y = 1; _r_pos.z = -10;
}
reactive(sceneObject3D).children.push(cameraObject3D);

const engine = new View(null, scene, camera);

//初始化颜色材质
const cube = createPrimitive("Cube");
reactive(sceneObject3D).children.push(cube);

const colorMaterial = (cube.components.find(c => c instanceof Renderable) as Renderable).material = new ColorMaterial();

const cylinder = createPrimitive("Cylinder");
reactive(cylinder.position).x = 2;
reactive(cube).children.push(cylinder);

let num = 0;
ticker.onframe(() =>
{
    //变化旋转与颜色
    reactive(cube.rotation).y += 1;

    num++;

    if (num % 60 == 0)
    {
        reactive(colorMaterial.uniforms).u_diffuseInput = new Color4().fromUnit(Math.random() * (1 << 32 - 1));
    }
});
