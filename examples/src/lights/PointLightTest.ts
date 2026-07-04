import { Camera, Color4, CubeGeometry, ColorMaterial, DirectionalLight, FPSController, Object3D, PlaneGeometry, PointLight, reactive, Renderable, Scene, ShadowType, SphereGeometry, StandardMaterial, Texture2D, TextureWrap, ticker, transformLogic, Vector3, View, windowEventProxy } from 'feng3d';
const sceneObject3D = new Object3D(); sceneObject3D.name = "Untitled";
const scene = sceneObject3D.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); cameraObject3D.name = "Main Camera";
const camera = cameraObject3D.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.object3D.addChild(camera.object3D);

const engine = new View(null, scene, camera);

const light0 = new Object3D(); light0.name = "pointLight";
const light1 = new Object3D(); light1.name = "pointLight";

initObjects();
initLights();

ticker.onframe(setPointLightPosition);

reactive(camera.transform.position).z = -5;
reactive(camera.transform.position).y = 2;
transformLogic(camera.transform).lookAt(new Vector3());
camera.object3D.addComponent(FPSController);
//
windowEventProxy.on("keyup", (event) => {
    const boardKey = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
    switch (boardKey) {
        case "c":
            clearObjects();
            break;
        case "b":
            initObjects();
            scene.object3D.addChild(light0);
            scene.object3D.addChild(light1);
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
    reactive(plane.transform.position).y = -1;
    const model = plane.addComponent(Renderable);
    const planeGeo = new PlaneGeometry(); planeGeo.width = 10; planeGeo.height = 10;
    const geometry = model.geometry = planeGeo;
    geometry.scaleU = 2;
    geometry.scaleV = 2;
    model.material = material;
    scene.object3D.addChild(plane);

    const cube = new Object3D();
    const cubemodel = cube.addComponent(Renderable);
    cubemodel.material = material;
    const cubeGeo = new CubeGeometry(); cubeGeo.width = 1; cubeGeo.height = 1; cubeGeo.depth = 1; cubeGeo.segmentsW = 1; cubeGeo.segmentsH = 1; cubeGeo.segmentsD = 1; cubeGeo.tile6 = false;
    cubemodel.geometry = cubeGeo;
    cubemodel.geometry.scaleU = 2;
    cubemodel.geometry.scaleV = 2;
    scene.object3D.addChild(cube);
}

function clearObjects() {
    for (let i = scene.object3D.numChildren - 1; i >= 0; i--) {
        scene.object3D.removeChildAt(i);
    }
}

function initLights() {
    scene.ambientColor.setTo(0.2, 0.2, 0.2, 1.0);

    //
    const lightColor0 = new Color4(1, 0, 0, 1);
    let model = light0.addComponent(Renderable);
    const sphereGeo0 = new SphereGeometry(); sphereGeo0.radius = 0.05;
    model.geometry = sphereGeo0;
    //初始化点光源
    const pointLight0 = light0.addComponent(PointLight);
    pointLight0.shadowType = ShadowType.PCF_Shadows;
    pointLight0.color = lightColor0.toColor3();
    const colorMat0 = new ColorMaterial(); colorMat0.uniforms.u_diffuseInput.copy(lightColor0);
    model.material = colorMat0;
    scene.object3D.addChild(light0);

    //
    const lightColor1 = new Color4(0, 1, 0, 1);
    model = light1.addComponent(Renderable);
    const sphereGeo1 = new SphereGeometry(); sphereGeo1.radius = 0.05;
    model.geometry = sphereGeo1;
    //初始化点光源
    const pointLight1 = light1.addComponent(DirectionalLight);
    pointLight1.shadowType = ShadowType.PCF_Shadows;
    pointLight1.color = lightColor1.toColor3();
    const colorMat1 = new ColorMaterial(); colorMat1.uniforms.u_diffuseInput.copy(lightColor1);
    model.material = colorMat1;
    scene.object3D.addChild(light1);
}

function setPointLightPosition() {
    const time = new Date().getTime();
    //
    let angle = time / 1000;
    reactive(light0.transform.position).y = 3;
    reactive(light0.transform.position).x = Math.sin(angle) * 3;
    reactive(light0.transform.position).z = Math.cos(angle) * 3;
    //
    angle = angle + Math.PI / 2;
    reactive(light1.transform.position).y = 3;
    reactive(light1.transform.position).x = Math.sin(angle) * 3;
    reactive(light1.transform.position).z = Math.cos(angle) * 3;
    transformLogic(light1.transform).lookAt(new Vector3());
}
