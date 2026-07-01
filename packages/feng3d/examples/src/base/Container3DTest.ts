import * as feng3d from 'feng3d';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
camera.transform.position = new feng3d.Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

//初始化颜色材质
const cube = feng3d.GameObject.createPrimitive("Cube");
scene.gameObject.addChild(cube);

const colorMaterial = cube.getComponent(feng3d.Renderable).material = feng3d.serialization.setValue(new feng3d.Material(), { shaderName: "color" });

const cylinder = feng3d.GameObject.createPrimitive("Cylinder");
cylinder.transform.x = 2;
// cube.addChild(cylinder);

let num = 0;
feng3d.ticker.onframe(() => {
    console.log("update");

    //变化旋转与颜色
    cube.transform.ry += 1;

    num++;

    if (num % 60 == 0) {
        (colorMaterial.uniforms as feng3d.ColorUniforms).u_diffuseInput.fromUnit(Math.random() * (1 << 32 - 1));
    }
});
