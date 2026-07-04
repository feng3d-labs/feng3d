import { Camera, Color4, ColorMaterial, GameObject, reactive, Renderable, Scene, serialization, ticker, View } from 'feng3d';
const scene = serialization.setValue(new GameObject(), { name: "Untitled" }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: "Main Camera" }).addComponent(Camera);
{
    const _r_pos = reactive(camera.transform.position);
    _r_pos.x = 0; _r_pos.y = 1; _r_pos.z = -10;
}
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

//初始化颜色材质
const cube = GameObject.createPrimitive("Cube");
scene.gameObject.addChild(cube);

const colorMaterial = cube.getComponent(Renderable).material = new ColorMaterial();

const cylinder = GameObject.createPrimitive("Cylinder");
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
