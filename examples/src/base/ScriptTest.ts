import { Camera, Color3, Color4, CubeGeometry, decoratorRegisterClass, FogMode, Object3D, reactive, Renderable, Scene, Script, ScriptComponent, StandardMaterial, Texture2D, View, logic, cameraLogic, sceneLogic, createObject3D, createCamera, createScene, createRenderable, createScriptComponent} from 'feng3d';
@decoratorRegisterClass()
class ScriptDemo extends Script
{
    cube: Object3D;

    init()
    {
        const cube = this.cube = createObject3D();
        reactive(cube.position).z = -7;
        reactive(this.object3D).children.push(cube);

        const model = createRenderable(); reactive(cube).components.push(model);
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
        reactive(this.cube.rotation).y += 1;
    }

    /**
     * 销毁
     */
    dispose()
    {
        logic(this.cube).dispose();
        this.cube = null;
    }
}

const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = 'Untitled';
logic(sceneObject3D);
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = 'Main Camera';
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(sceneLogic(scene).object3D).children.push(cameraLogic(camera).object3D);

const engine = new View(null, scene, camera);

const sc = createScriptComponent(); sc.scriptName = 'ScriptDemo'; reactive(sceneLogic(scene).object3D).components.push(sc);
