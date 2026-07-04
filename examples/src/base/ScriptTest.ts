import { Camera, Color3, Color4, CubeGeometry, decoratorRegisterClass, FogMode, GameObject, reactive, Renderable, Scene, Script, serialization, StandardMaterial, Texture2D, View } from 'feng3d';
@decoratorRegisterClass()
class ScriptDemo extends Script
{
    cube: GameObject;

    init()
    {
        const cube = this.cube = new GameObject();
        reactive(cube.transform.position).z = -7;
        this.gameObject.addChild(cube);

        const model = cube.addComponent(Renderable);
        model.geometry = serialization.setValue(new CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
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

const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const sc = scene.gameObject.addScript('ScriptDemo');
