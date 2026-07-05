import { Object3D, batchRun, Camera, Color4, CubeGeometry, ColorMaterial, createColorMaterial, DirectionalLight, FPSController, PlaneGeometry, PointLight, reactive, Renderable, Scene, ShadowType, SphereGeometry, StandardMaterial, createStandardMaterial, Texture2D, TextureWrap, ticker, transformLogic, Vector3, View, windowEventProxy, logic, cameraLogic, sceneLogic, createObject3D, createCamera, createScene, createRenderable, createDirectionalLight, createPointLight, createFPSController, createPlaneGeometry, createSphereGeometry, createCubeGeometry} from 'feng3d';

function lookAtTransform(t: Object3D, target: Vector3, upAxis?: Vector3) {
    const m = transformLogic(t).matrix.value.clone();
    m.lookAt(target, upAxis);
    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
    m.toTRS(pos, rot, scl);
    const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
    batchRun(() => { r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z; r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z; r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z; });
}
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
reactive(scene).background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(sceneLogic(scene).object3D).children.push(cameraLogic(camera).object3D);

const engine = new View(null, sceneObject3D);

const light0 = createObject3D(); reactive(light0).name = "pointLight";
const light1 = createObject3D(); reactive(light1).name = "pointLight";

initObjects();
initLights();

ticker.onframe(setPointLightPosition);

reactive(cameraLogic(camera).object3D.position).z = -5;
reactive(cameraLogic(camera).object3D.position).y = 2;
lookAtTransform(cameraLogic(camera).object3D, new Vector3());
{ const c = createFPSController(); reactive(cameraLogic(camera).object3D).components.push(c); }
//
windowEventProxy.on("keyup", (event) => {
    const boardKey = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
    switch (boardKey) {
        case "c":
            clearObjects();
            break;
        case "b":
            initObjects();
            reactive(sceneLogic(scene).object3D).children.push(light0);
            reactive(sceneLogic(scene).object3D).children.push(light1);
            break;
    }
});

function initObjects() {
    const material = createStandardMaterial();
    let tex: Texture2D;
    tex = new Texture2D(); tex.source = { url: '/head_diffuse.jpg' }; tex.wrapS = TextureWrap.MIRRORED_REPEAT; tex.wrapT = TextureWrap.MIRRORED_REPEAT; reactive(material).s_diffuse = tex;
    tex = new Texture2D(); tex.source = { url: '/head_normals.jpg' }; tex.wrapS = TextureWrap.MIRRORED_REPEAT; tex.wrapT = TextureWrap.MIRRORED_REPEAT; reactive(material).s_normal = tex;
    tex = new Texture2D(); tex.source = { url: '/head_specular.jpg' }; tex.wrapS = TextureWrap.MIRRORED_REPEAT; tex.wrapT = TextureWrap.MIRRORED_REPEAT; reactive(material).s_specular = tex;

    //初始化立方体
    const plane = createObject3D();
    reactive(plane.position).y = -1;
    const model = createRenderable(); reactive(plane).components.push(model);
    const planeGeo = createPlaneGeometry(); reactive(planeGeo).width = 10; reactive(planeGeo).height = 10;
    const geometry = reactive(model).geometry = planeGeo;
    geometry.scaleU = 2;
    geometry.scaleV = 2;
    reactive(model).material = material;
    reactive(sceneLogic(scene).object3D).children.push(plane);

    const cube = createObject3D();
    const cubemodel = createRenderable(); reactive(cube).components.push(cubemodel);
    reactive(cubemodel).material = material;
    const cubeGeo = createCubeGeometry(); reactive(cubeGeo).width = 1; reactive(cubeGeo).height = 1; reactive(cubeGeo).depth = 1; reactive(cubeGeo).segmentsW = 1; reactive(cubeGeo).segmentsH = 1; reactive(cubeGeo).segmentsD = 1; reactive(cubeGeo).tile6 = false;
    reactive(cubemodel).geometry = cubeGeo;
    cubemodel.geometry.scaleU = 2;
    cubemodel.geometry.scaleV = 2;
    reactive(sceneLogic(scene).object3D).children.push(cube);
}

function clearObjects() {
    for (let i = reactive(sceneLogic(scene).object3D).children.length - 1; i >= 0; i--) {
        reactive(sceneLogic(scene).object3D).children.splice(i, 1);
    }
}

function initLights() {
    scene.ambientColor.setTo(0.2, 0.2, 0.2, 1.0);

    //
    const lightColor0 = new Color4(1, 0, 0, 1);
    let model = createRenderable(); reactive(light0).components.push(model);
    const sphereGeo0 = createSphereGeometry(); reactive(sphereGeo0).radius = 0.05;
    reactive(model).geometry = sphereGeo0;
    //初始化点光源
    const pointLight0 = createPointLight(); reactive(light0).components.push(pointLight0);
    reactive(pointLight0).shadowType = ShadowType.PCF_Shadows;
    reactive(pointLight0).color = lightColor0.toColor3();
    const colorMat0 = createColorMaterial(); colorMat0.uniforms.u_diffuseInput.copy(lightColor0);
    reactive(model).material = colorMat0;
    reactive(sceneLogic(scene).object3D).children.push(light0);

    //
    const lightColor1 = new Color4(0, 1, 0, 1);
    model = createRenderable(); reactive(light1).components.push(model);
    const sphereGeo1 = createSphereGeometry(); reactive(sphereGeo1).radius = 0.05;
    reactive(model).geometry = sphereGeo1;
    //初始化点光源
    const pointLight1 = createDirectionalLight(); reactive(light1).components.push(pointLight1);
    reactive(pointLight1).shadowType = ShadowType.PCF_Shadows;
    reactive(pointLight1).color = lightColor1.toColor3();
    const colorMat1 = createColorMaterial(); colorMat1.uniforms.u_diffuseInput.copy(lightColor1);
    reactive(model).material = colorMat1;
    reactive(sceneLogic(scene).object3D).children.push(light1);
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
