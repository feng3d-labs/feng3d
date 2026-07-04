import { Object3D, batchRun, Camera, Color4, CubeGeometry, ColorMaterial, DirectionalLight, FPSController, PlaneGeometry, PointLight, reactive, Renderable, Scene, ShadowType, SphereGeometry, StandardMaterial, Texture2D, TextureWrap, ticker, transformLogic, Vector3, View, windowEventProxy, object3DLogic } from 'feng3d';

function lookAtTransform(t: Object3D, target: Vector3, upAxis?: Vector3) {
    const m = transformLogic(t).matrix.value.clone();
    m.lookAt(target, upAxis);
    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
    m.toTRS(pos, rot, scl);
    const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
    batchRun(() => { r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z; r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z; r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z; });
}
const sceneObject3D = new Object3D(); reactive(sceneObject3D).name = "Untitled";
const scene = new Scene(); reactive(sceneObject3D).components.push(scene); scene.setObject3D(sceneObject3D); scene.init();
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); reactive(cameraObject3D).name = "Main Camera";
const camera = new Camera(); reactive(cameraObject3D).components.push(camera); camera.setObject3D(cameraObject3D); camera.init();
{ const _r = reactive(camera.object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
object3DLogic(scene.object3D).addChild(camera.object3D);

const engine = new View(null, scene, camera);

const light0 = new Object3D(); reactive(light0).name = "pointLight";
const light1 = new Object3D(); reactive(light1).name = "pointLight";

initObjects();
initLights();

ticker.onframe(setPointLightPosition);

reactive(camera.object3D.position).z = -5;
reactive(camera.object3D.position).y = 2;
lookAtTransform(camera.transform, new Vector3());
{ const c = new FPSController(); reactive(camera.object3D).components.push(c); c.setObject3D(camera.object3D); c.init(); }
//
windowEventProxy.on("keyup", (event) => {
    const boardKey = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
    switch (boardKey) {
        case "c":
            clearObjects();
            break;
        case "b":
            initObjects();
            object3DLogic(scene.object3D).addChild(light0);
            object3DLogic(scene.object3D).addChild(light1);
            break;
    }
});

function initObjects() {
    const material = new StandardMaterial();
    let tex: Texture2D;
    tex = new Texture2D(); tex.source = { url: '/head_diffuse.jpg' }; tex.wrapS = TextureWrap.MIRRORED_REPEAT; tex.wrapT = TextureWrap.MIRRORED_REPEAT; material.s_diffuse = tex;
    tex = new Texture2D(); tex.source = { url: '/head_normals.jpg' }; tex.wrapS = TextureWrap.MIRRORED_REPEAT; tex.wrapT = TextureWrap.MIRRORED_REPEAT; material.s_normal = tex;
    tex = new Texture2D(); tex.source = { url: '/head_specular.jpg' }; tex.wrapS = TextureWrap.MIRRORED_REPEAT; tex.wrapT = TextureWrap.MIRRORED_REPEAT; material.s_specular = tex;

    //初始化立方体
    const plane = new Object3D();
    reactive(plane.position).y = -1;
    const model = new Renderable(); reactive(plane).components.push(model); model.setObject3D(plane); model.init();
    const planeGeo = new PlaneGeometry(); planeGeo.width = 10; planeGeo.height = 10;
    const geometry = model.geometry = planeGeo;
    geometry.scaleU = 2;
    geometry.scaleV = 2;
    model.material = material;
    object3DLogic(scene.object3D).addChild(plane);

    const cube = new Object3D();
    const cubemodel = new Renderable(); reactive(cube).components.push(cubemodel); cubemodel.setObject3D(cube); cubemodel.init();
    cubemodel.material = material;
    const cubeGeo = new CubeGeometry(); cubeGeo.width = 1; cubeGeo.height = 1; cubeGeo.depth = 1; cubeGeo.segmentsW = 1; cubeGeo.segmentsH = 1; cubeGeo.segmentsD = 1; cubeGeo.tile6 = false;
    cubemodel.geometry = cubeGeo;
    cubemodel.geometry.scaleU = 2;
    cubemodel.geometry.scaleV = 2;
    object3DLogic(scene.object3D).addChild(cube);
}

function clearObjects() {
    for (let i = object3DLogic(scene.object3D).numChildren - 1; i >= 0; i--) {
        object3DLogic(scene.object3D).removeChildAt(i);
    }
}

function initLights() {
    scene.ambientColor.setTo(0.2, 0.2, 0.2, 1.0);

    //
    const lightColor0 = new Color4(1, 0, 0, 1);
    let model = new Renderable(); reactive(light0).components.push(model); model.setObject3D(light0); model.init();
    const sphereGeo0 = new SphereGeometry(); sphereGeo0.radius = 0.05;
    model.geometry = sphereGeo0;
    //初始化点光源
    const pointLight0 = new PointLight(); reactive(light0).components.push(pointLight0); pointLight0.setObject3D(light0); pointLight0.init();
    pointLight0.shadowType = ShadowType.PCF_Shadows;
    pointLight0.color = lightColor0.toColor3();
    const colorMat0 = new ColorMaterial(); colorMat0.uniforms.u_diffuseInput.copy(lightColor0);
    model.material = colorMat0;
    object3DLogic(scene.object3D).addChild(light0);

    //
    const lightColor1 = new Color4(0, 1, 0, 1);
    model = new Renderable(); reactive(light1).components.push(model); model.setObject3D(light1); model.init();
    const sphereGeo1 = new SphereGeometry(); sphereGeo1.radius = 0.05;
    model.geometry = sphereGeo1;
    //初始化点光源
    const pointLight1 = new DirectionalLight(); reactive(light1).components.push(pointLight1); pointLight1.setObject3D(light1); pointLight1.init();
    pointLight1.shadowType = ShadowType.PCF_Shadows;
    pointLight1.color = lightColor1.toColor3();
    const colorMat1 = new ColorMaterial(); colorMat1.uniforms.u_diffuseInput.copy(lightColor1);
    model.material = colorMat1;
    object3DLogic(scene.object3D).addChild(light1);
}

function setPointLightPosition() {
    const time = new Date().getTime();
    //
    let angle = time / 1000;
    reactive(light0.position).y = 3;
    reactive(light0.position).x = Math.sin(angle) * 3;
    reactive(light0.position).z = Math.cos(angle) * 3;
    //
    angle = angle + Math.PI / 2;
    reactive(light1.position).y = 3;
    reactive(light1.position).x = Math.sin(angle) * 3;
    reactive(light1.position).z = Math.cos(angle) * 3;
    lookAtTransform(light1, new Vector3());
}
