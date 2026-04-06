import { Camera, Color3, Color4, CubeGeometry, decoratorRegisterClass, FogMode, GameObject, Material, Renderable, Scene, Script, serialization, StandardUniforms, Texture2D, Vector3, View } from 'feng3d';

const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const sc = scene.gameObject.addScript('ScriptDemo');

@decoratorRegisterClass()
class ScriptDemo extends Script
{
    cube: GameObject;

    init()
    {
        const cube = this.cube = new GameObject();
        cube.transform.z = -7;
        this.gameObject.addChild(cube);

        const model = cube.addComponent(Renderable);
        model.geometry = serialization.setValue(new CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
        // 材质
        const material = model.material = new Material();
        const uniforms = <StandardUniforms>material.uniforms;
        uniforms.s_diffuse = new Texture2D();
        uniforms.s_diffuse.source = { url: '../../resources/m.png' };

        uniforms.u_fogMode = FogMode.LINEAR;
        uniforms.u_fogColor = new Color3(1, 1, 0);
        uniforms.u_fogMinDistance = 2;
        uniforms.u_fogMaxDistance = 3;
    }

    update()
    {
        this.cube.transform.ry += 1;
        // log("this.cube.transform.ry: " + this.cube.transform.ry);
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
