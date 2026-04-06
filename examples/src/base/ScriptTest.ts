namespace examples
{
    var scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Untitled' }).addComponent(feng3d.Scene);
    scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

    var camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Main Camera' }).addComponent(feng3d.Camera);
    camera.transform.position = new feng3d.Vector3(0, 1, -10);
    scene.gameObject.addChild(camera.gameObject);

    var engine = new feng3d.View(null, scene, camera);

    var sc = scene.gameObject.addScript('ScriptDemo');
}

@feng3d.decoratorRegisterClass()
class ScriptDemo extends feng3d.Script
{
    cube: feng3d.GameObject;

    init()
    {
        const cube = this.cube = new feng3d.GameObject();
        cube.transform.z = -7;
        this.gameObject.addChild(cube);

        const model = cube.addComponent(feng3d.Renderable);
        model.geometry = feng3d.serialization.setValue(new feng3d.CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
        // 材质
        const material = model.material = new feng3d.Material();
        const uniforms = <feng3d.StandardUniforms>material.uniforms;
        uniforms.s_diffuse = new feng3d.Texture2D();
        uniforms.s_diffuse.source = { url: 'resources/m.png' };

        uniforms.u_fogMode = feng3d.FogMode.LINEAR;
        uniforms.u_fogColor = new feng3d.Color3(1, 1, 0);
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
