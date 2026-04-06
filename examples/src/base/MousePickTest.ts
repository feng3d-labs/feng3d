namespace examples
{
    /**
     * 操作方式:鼠标按下后可以使用移动鼠标改变旋转，wasdqe平移
     */
    var scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Untitled' }).addComponent(feng3d.Scene);
    scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

    var camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Main Camera' }).addComponent(feng3d.Camera);
    camera.transform.position = new feng3d.Vector3(0, 1, -10);
    scene.gameObject.addChild(camera.gameObject);

    var engine = new feng3d.View(null, scene, camera);

    camera.transform.z = -5;
    camera.transform.lookAt(new feng3d.Vector3());
    camera.gameObject.addComponent(feng3d.FPSController);

    var cube = feng3d.GameObject.createPrimitive('Cube');
    cube.mouseEnabled = true;
    cube.getComponent(feng3d.Renderable).material = new feng3d.Material();
    scene.gameObject.addChild(cube);

    var sphere = feng3d.GameObject.createPrimitive('Sphere');
    sphere.transform.position = new feng3d.Vector3(-1.50, 0, 0);
    sphere.mouseEnabled = true;
    sphere.getComponent(feng3d.Renderable).material = new feng3d.Material();
    scene.gameObject.addChild(sphere);

    var capsule = feng3d.GameObject.createPrimitive('Capsule');
    capsule.transform.position = new feng3d.Vector3(3, 0, 0);
    capsule.mouseEnabled = true;
    capsule.getComponent(feng3d.Renderable).material = new feng3d.Material();
    scene.gameObject.addChild(capsule);

    var cylinder = feng3d.GameObject.createPrimitive('Cylinder');
    cylinder.transform.position = new feng3d.Vector3(-3, 0, 0);
    cylinder.mouseEnabled = true;
    cylinder.getComponent(feng3d.Renderable).material = new feng3d.Material();
    scene.gameObject.addChild(cylinder);

    scene.on('click', (event) =>
    {
        const gameObject = <feng3d.GameObject>event.target;
        if (gameObject.getComponent(feng3d.Renderable))
        {
            const uniforms = <feng3d.StandardUniforms>gameObject.getComponent(feng3d.Renderable).material.uniforms;
            uniforms.u_diffuse.fromUnit(Math.random() * (1 << 24));
        }
    });

    // var engines = feng3d.Feng3dObject.getObjects(feng3d.Engine);

    // engines[0].mouse3DManager.mouseInput.catchMouseMove = true;

    // scene.on("mouseover", (event) =>
    // {
    //     var gameObject = <feng3d.GameObject>event.target;
    //     if (gameObject.getComponent(feng3d.Renderable))
    //     {
    //         var uniforms = <feng3d.StandardUniforms>gameObject.getComponent(feng3d.Renderable).material.uniforms;
    //         uniforms.u_diffuse.setTo(0, 1, 0);
    //     }
    // });

    // scene.on("mouseout", (event) =>
    // {
    //     var gameObject = <feng3d.GameObject>event.target;
    //     if (gameObject.getComponent(feng3d.Renderable))
    //     {
    //         var uniforms = <feng3d.StandardUniforms>gameObject.getComponent(feng3d.Renderable).material.uniforms;
    //         uniforms.u_diffuse.setTo(1, 1, 1);
    //     }
    // });
}
