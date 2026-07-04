import { Camera, Color3, Color4, CubeGeometry, decoratorRegisterClass, FogMode, Object3D, reactive, Renderable, Scene, Script, ScriptComponent, StandardMaterial, Texture2D, View, object3DLogic, cameraLogic, sceneLogic} from 'feng3d';
@decoratorRegisterClass()
class ScriptDemo extends Script
{
    cube: Object3D;

    init()
    {
        const cube = this.cube = new Object3D();
        reactive(cube.position).z = -7;
        reactive(this.object3D).children.push(cube);

        const model = new Renderable(); reactive(cube).components.push(model);
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
        object3DLogic(this.cube).dispose();
        this.cube = null;
    }
}

const sceneObject3D = new Object3D(); reactive(sceneObject3D).name = 'Untitled';
object3DLogic(sceneObject3D);
const scene = new Scene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); reactive(cameraObject3D).name = 'Main Camera';
object3DLogic(cameraObject3D);
const camera = new Camera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(sceneLogic(scene).object3D).children.push(cameraLogic(camera).object3D);

const engine = new View(null, scene, camera);

const sc = new ScriptComponent(); sc.scriptName = 'ScriptDemo'; reactive(sceneLogic(scene).object3D).components.push(sc);
