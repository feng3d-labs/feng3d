import * as feng3d from 'feng3d';
import { reactive } from '@feng3d/reactivity';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
{
    const _r_pos = reactive(camera.transform.position);
    _r_pos.x = 0; _r_pos.y = 1; _r_pos.z = -10;
}
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

//初始化颜色材质
const cube = feng3d.GameObject.createPrimitive("Cube");
scene.gameObject.addChild(cube);

const colorMaterial = cube.getComponent(feng3d.Renderable).material = new feng3d.ColorMaterial();

const cylinder = feng3d.GameObject.createPrimitive("Cylinder");
reactive(cylinder.transform.position).x = 2;
cube.addChild(cylinder);

let num = 0;
feng3d.ticker.onframe(() => {
    //变化旋转与颜色
    reactive(cube.transform.rotation).y += 1;

    num++;

    if (num % 60 == 0) {
        reactive(colorMaterial.uniforms).u_diffuseInput = new feng3d.Color4().fromUnit(Math.random() * (1 << 32 - 1));
    }
});
