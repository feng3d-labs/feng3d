import { serialization, GameObject, Scene, Color4, Camera, Vector3, View, FPSController, Renderable, Material, StandardUniforms } from "../../../src";

/**
 * 操作方式:鼠标按下后可以使用移动鼠标改变旋转，wasdqe平移
 */
const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

camera.transform.z = -5;
camera.transform.lookAt(new Vector3());
camera.gameObject.addComponent(FPSController);

const cube = GameObject.createPrimitive('Cube');
cube.mouseEnabled = true;
cube.getComponent(Renderable).material = new Material();
scene.gameObject.addChild(cube);

const sphere = GameObject.createPrimitive('Sphere');
sphere.transform.position = new Vector3(-1.50, 0, 0);
sphere.mouseEnabled = true;
sphere.getComponent(Renderable).material = new Material();
scene.gameObject.addChild(sphere);

const capsule = GameObject.createPrimitive('Capsule');
capsule.transform.position = new Vector3(3, 0, 0);
capsule.mouseEnabled = true;
capsule.getComponent(Renderable).material = new Material();
scene.gameObject.addChild(capsule);

const cylinder = GameObject.createPrimitive('Cylinder');
cylinder.transform.position = new Vector3(-3, 0, 0);
cylinder.mouseEnabled = true;
cylinder.getComponent(Renderable).material = new Material();
scene.gameObject.addChild(cylinder);

scene.on('click', (event) =>
{
    const gameObject = <GameObject>event.target;
    if (gameObject.getComponent(Renderable))
    {
        const uniforms = <StandardUniforms>gameObject.getComponent(Renderable).material.uniforms;
        uniforms.u_diffuse.fromUnit(Math.random() * (1 << 24));
    }
});

// var engines = Feng3dObject.getObjects(Engine);

// engines[0].mouse3DManager.mouseInput.catchMouseMove = true;

// scene.on("mouseover", (event) =>
// {
//     var gameObject = <GameObject>event.target;
//     if (gameObject.getComponent(Renderable))
//     {
//         var uniforms = <StandardUniforms>gameObject.getComponent(Renderable).material.uniforms;
//         uniforms.u_diffuse.setTo(0, 1, 0);
//     }
// });

// scene.on("mouseout", (event) =>
// {
//     var gameObject = <GameObject>event.target;
//     if (gameObject.getComponent(Renderable))
//     {
//         var uniforms = <StandardUniforms>gameObject.getComponent(Renderable).material.uniforms;
//         uniforms.u_diffuse.setTo(1, 1, 1);
//     }
// });
