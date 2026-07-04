import { Camera, Color3, Color4, CubeGeometry, decoratorRegisterClass, FogMode, Object3D, reactive, Renderable, Scene, Script, StandardMaterial, Texture2D, View } from 'feng3d';
@decoratorRegisterClass()
class ScriptDemo extends Script
{
    cube: Object3D;

    init()
    {
        const cube = this.cube = new Object3D();
        reactive(cube.transform.position).z = -7;
        this.object3D.addChild(cube);

        const model = cube.addComponent(Renderable);
        const cubeGeo = new CubeGeometry(); cubeGeo.width = 1; cubeGeo.height = 1; cubeGeo.depth = 1; cubeGeo.segmentsW = 1; cubeGeo.segmentsH = 1; cubeGeo.segmentsD = 1; cubeGeo.tile6 = false;
        model.geometry = cubeGeo;
        // 材质
        const material = model.material = new StandardMaterial();
        const stdMaterial = material as StandardMaterial;
        stdMaterial.s_diffuse = new Texture2D();
        stdMaterial.s_diffuse.source = { url: '/m.png' };

        stdMaterial.uniforms.u_fogMode = FogMode.LINEAR;
        stdMaterial.uniforms.u_fogColor = new Color3(1, 1, 0);
        stdMaterial.uniforms.u_fogMinDistance = 2;
        stdMaterial.uniforms.u_fogMaxDistance = 3;
    }

    update()
    {
        reactive(this.cube.transform.rotation).y += 1;
    }

    /**
     * 销毁
     */
    dispose()
    {
        this.cube.dispose();
        this.cube = null;
    }
}

const sceneObject3D = new Object3D(); sceneObject3D.name = 'Untitled';
const scene = sceneObject3D.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); cameraObject3D.name = 'Main Camera';
const camera = cameraObject3D.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.object3D.addChild(camera.object3D);

const engine = new View(null, scene, camera);

const sc = scene.object3D.addScript('ScriptDemo');
