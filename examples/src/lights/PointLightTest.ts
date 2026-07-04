import { Camera, Color4, CubeGeometry, ColorMaterial, DirectionalLight, FPSController, GameObject, PlaneGeometry, PointLight, reactive, Renderable, Scene, serialization, ShadowType, SphereGeometry, StandardMaterial, TextureWrap, ticker, transformLogic, Vector3, View, windowEventProxy } from 'feng3d';
const scene = serialization.setValue(new GameObject(), { name: "Untitled" }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: "Main Camera" }).addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const light0 = serialization.setValue(new GameObject(), { name: "pointLight" });
const light1 = serialization.setValue(new GameObject(), { name: "pointLight" });

initObjects();
initLights();

ticker.onframe(setPointLightPosition);

reactive(camera.transform.position).z = -5;
reactive(camera.transform.position).y = 2;
transformLogic(camera.transform).lookAt(new Vector3());
camera.gameObject.addComponent(FPSController);
//
windowEventProxy.on("keyup", (event) => {
    const boardKey = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
    switch (boardKey) {
        case "c":
            clearObjects();
            break;
        case "b":
            initObjects();
            scene.gameObject.addChild(light0);
            scene.gameObject.addChild(light1);
            break;
    }
});

function initObjects() {
    const material = serialization.setValue(new StandardMaterial(), {
        s_diffuse: { __class__: "Texture2D", source: { url: '/head_diffuse.jpg' }, wrapS: TextureWrap.MIRRORED_REPEAT, wrapT: TextureWrap.MIRRORED_REPEAT },
        s_normal: { __class__: "Texture2D", source: { url: '/head_normals.jpg' }, wrapS: TextureWrap.MIRRORED_REPEAT, wrapT: TextureWrap.MIRRORED_REPEAT },
        s_specular: { __class__: "Texture2D", source: { url: '/head_specular.jpg' }, wrapS: TextureWrap.MIRRORED_REPEAT, wrapT: TextureWrap.MIRRORED_REPEAT },
    } as any);

    //初始化立方体
    const plane = new GameObject();
    reactive(plane.transform.position).y = -1;
    const model = plane.addComponent(Renderable);
    const geometry = model.geometry = serialization.setValue(new PlaneGeometry(), { width: 10, height: 10 });
    geometry.scaleU = 2;
    geometry.scaleV = 2;
    model.material = material;
    scene.gameObject.addChild(plane);

    const cube = new GameObject();
    const cubemodel = cube.addComponent(Renderable);
    cubemodel.material = material;
    cubemodel.geometry = serialization.setValue(new CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
    cubemodel.geometry.scaleU = 2;
    cubemodel.geometry.scaleV = 2;
    scene.gameObject.addChild(cube);
}

function clearObjects() {
    for (let i = scene.gameObject.numChildren - 1; i >= 0; i--) {
        scene.gameObject.removeChildAt(i);
    }
}

function initLights() {
    scene.ambientColor.setTo(0.2, 0.2, 0.2, 1.0);

    //
    const lightColor0 = new Color4(1, 0, 0, 1);
    let model = light0.addComponent(Renderable);
    model.geometry = serialization.setValue(new SphereGeometry(), { radius: 0.05 });
    //初始化点光源
    const pointLight0 = light0.addComponent(PointLight);
    pointLight0.shadowType = ShadowType.PCF_Shadows;
    pointLight0.color = lightColor0.toColor3();
    model.material = serialization.setValue(new ColorMaterial(), { uniforms: { u_diffuseInput: lightColor0 } } as any);
    scene.gameObject.addChild(light0);

    //
    const lightColor1 = new Color4(0, 1, 0, 1);
    model = light1.addComponent(Renderable);
    model.geometry = serialization.setValue(new SphereGeometry(), { radius: 0.05 });
    //初始化点光源
    const pointLight1 = light1.addComponent(DirectionalLight);
    pointLight1.shadowType = ShadowType.PCF_Shadows;
    pointLight1.color = lightColor1.toColor3();
    model.material = serialization.setValue(new ColorMaterial(), { uniforms: { u_diffuseInput: lightColor1 } } as any);
    scene.gameObject.addChild(light1);
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
