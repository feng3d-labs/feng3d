import { $set, Color4, ColorMaterial, CubeGeometry, Node3D, PlaneGeometry, ShadowType, SphereGeometry, StandardMaterial, ticker, Vector3, windowEventProxy } from 'feng3d';

const root = new Node3D();
root.addComponent('WebGLRenderer3D');

const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('Camera3D');
camera.entity.position = new Vector3(0, 1, -10);
scene.entity.addChild(camera.entity);

const light0 = $set(new Node3D(), { name: 'pointLight' });
const light1 = $set(new Node3D(), { name: 'pointLight' });

initObjects();
initLights();

ticker.onFrame(setPointLightPosition);

camera.entity.z = -5;
camera.entity.y = 2;
camera.entity.lookAt(new Vector3());
camera.entity.addComponent('FPSController3D');
//
windowEventProxy.on('keyup', (event) =>
{
    const boardKey = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
    switch (boardKey)
    {
        case 'c':
            clearObjects();
            break;
        case 'b':
            initObjects();
            scene.entity.addChild(light0);
            scene.entity.addChild(light1);
            break;
    }
});

function initObjects()
{
    const material = new StandardMaterial().init({
        uniforms: {
            s_diffuse: { __class__: 'LoadImageTexture2D', url: '../../head_diffuse.jpg', wrapS: 'MIRRORED_REPEAT', wrapT: 'MIRRORED_REPEAT' },
            s_normal: { __class__: 'LoadImageTexture2D', url: '../../head_normals.jpg', wrapS: 'MIRRORED_REPEAT', wrapT: 'MIRRORED_REPEAT' },
            s_specular: { __class__: 'LoadImageTexture2D', url: '../../head_specular.jpg', wrapS: 'MIRRORED_REPEAT', wrapT: 'MIRRORED_REPEAT' },
        }
    });

    // 初始化立方体
    const plane = new Node3D();
    plane.y = -1;
    let model = plane.addComponent('Mesh3D');
    const geometry = model.geometry = $set(new PlaneGeometry(), { width: 10, height: 10 });
    geometry.scaleU = 2;
    geometry.scaleV = 2;
    model.material = material;
    scene.entity.addChild(plane);

    const cube = new Node3D();
    model = cube.addComponent('Mesh3D');
    model.material = material;
    model.geometry = $set(new CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
    model.geometry.scaleU = 2;
    model.geometry.scaleV = 2;
    scene.entity.addChild(cube);
}

function clearObjects()
{
    for (let i = scene.entity.numChildren - 1; i >= 0; i--)
    {
        scene.entity.removeChildAt(i);
    }
}

function initLights()
{
    scene.ambientColor.setTo(0.2, 0.2, 0.2, 1.0);

    //
    const lightColor0 = new Color4(1, 0, 0, 1);
    let model = light0.addComponent('Mesh3D');
    model.geometry = $set(new SphereGeometry(), { radius: 0.05 });
    // 初始化点光源
    const pointLight0 = light0.addComponent('PointLight3D');
    pointLight0.shadowType = ShadowType.PCF_Shadows;
    pointLight0.color = lightColor0.toColor3();
    model.material = new ColorMaterial().init({ uniforms: { u_diffuseInput: lightColor0 } });
    scene.entity.addChild(light0);

    //
    const lightColor1 = new Color4(0, 1, 0, 1);
    model = light1.addComponent('Mesh3D');
    model.geometry = $set(new SphereGeometry(), { radius: 0.05 });
    // 初始化点光源
    const pointLight1 = light1.addComponent('DirectionalLight3D');
    pointLight1.shadowType = ShadowType.PCF_Shadows;
    pointLight1.color = lightColor1.toColor3();
    model.material = new ColorMaterial().init({ uniforms: { u_diffuseInput: lightColor1 } });
    scene.entity.addChild(light1);
}

function setPointLightPosition()
{
    const time = new Date().getTime();
    //
    let angle = time / 1000;
    light0.y = 3;
    light0.x = Math.sin(angle) * 3;
    light0.z = Math.cos(angle) * 3;
    //
    angle = angle + Math.PI / 2;
    light1.y = 3;
    light1.x = Math.sin(angle) * 3;
    light1.z = Math.cos(angle) * 3;
    light1.lookAt(new Vector3());
}
