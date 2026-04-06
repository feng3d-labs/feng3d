namespace examples
{
    var scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Untitled' }).addComponent(feng3d.Scene);
    scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

    var camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Main Camera' }).addComponent(feng3d.Camera);
    camera.transform.position = new feng3d.Vector3(0, 1, -10);
    scene.gameObject.addChild(camera.gameObject);

    var engine = new feng3d.View(null, scene, camera);

    var light0 = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'pointLight' });
    var light1 = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'pointLight' });

    initObjects();
    initLights();

    feng3d.ticker.onframe(setPointLightPosition);

    camera.transform.z = -5;
    camera.transform.y = 2;
    camera.transform.lookAt(new feng3d.Vector3());
    camera.gameObject.addComponent(feng3d.FPSController);
    //
    feng3d.windowEventProxy.on('keyup', (event) =>
    {
        const boardKey = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
        switch (boardKey)
        {
            case 'c':
                clearObjects();
                break;
            case 'b':
                initObjects();
                scene.gameObject.addChild(light0);
                scene.gameObject.addChild(light1);
                break;
        }
    });

    function initObjects()
    {
        const material = feng3d.serialization.setValue(new feng3d.Material(), {
            uniforms: {
                s_diffuse: { __class__: 'Texture2D', source: { url: 'resources/head_diffuse.jpg' }, wrapS: feng3d.TextureWrap.MIRRORED_REPEAT, wrapT: feng3d.TextureWrap.MIRRORED_REPEAT },
                s_normal: { __class__: 'Texture2D', source: { url: 'resources/head_normals.jpg' }, wrapS: feng3d.TextureWrap.MIRRORED_REPEAT, wrapT: feng3d.TextureWrap.MIRRORED_REPEAT },
                s_specular: { __class__: 'Texture2D', source: { url: 'resources/head_specular.jpg' }, wrapS: feng3d.TextureWrap.MIRRORED_REPEAT, wrapT: feng3d.TextureWrap.MIRRORED_REPEAT },
            }
        });

        // 初始化立方体
        const plane = new feng3d.GameObject();
        plane.transform.y = -1;
        var model = plane.addComponent(feng3d.Renderable);
        const geometry = model.geometry = feng3d.serialization.setValue(new feng3d.PlaneGeometry(), { width: 10, height: 10 });
        geometry.scaleU = 2;
        geometry.scaleV = 2;
        model.material = material;
        scene.gameObject.addChild(plane);

        const cube = new feng3d.GameObject();
        var model = cube.addComponent(feng3d.Renderable);
        model.material = material;
        model.geometry = feng3d.serialization.setValue(new feng3d.CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
        model.geometry.scaleU = 2;
        model.geometry.scaleV = 2;
        scene.gameObject.addChild(cube);
    }

    function clearObjects()
    {
        for (let i = scene.gameObject.numChildren - 1; i >= 0; i--)
        {
            scene.gameObject.removeChildAt(i);
        }
    }

    function initLights()
    {
        scene.ambientColor.setTo(0.2, 0.2, 0.2, 1.0);

        //
        const lightColor0 = new feng3d.Color4(1, 0, 0, 1);
        let model = light0.addComponent(feng3d.Renderable);
        model.geometry = feng3d.serialization.setValue(new feng3d.SphereGeometry(), { radius: 0.05 });
        // 初始化点光源
        const pointLight0 = light0.addComponent(feng3d.PointLight);
        pointLight0.shadowType = feng3d.ShadowType.PCF_Shadows;
        pointLight0.color = lightColor0.toColor3();
        model.material = feng3d.serialization.setValue(new feng3d.Material(), { shaderName: 'color', uniforms: { u_diffuseInput: lightColor0 } });
        scene.gameObject.addChild(light0);

        //
        const lightColor1 = new feng3d.Color4(0, 1, 0, 1);
        model = light1.addComponent(feng3d.Renderable);
        model.geometry = feng3d.serialization.setValue(new feng3d.SphereGeometry(), { radius: 0.05 });
        // 初始化点光源
        const pointLight1 = light1.addComponent(feng3d.DirectionalLight);
        pointLight1.shadowType = feng3d.ShadowType.PCF_Shadows;
        pointLight1.color = lightColor1.toColor3();
        model.material = feng3d.serialization.setValue(new feng3d.Material(), { shaderName: 'color', uniforms: { u_diffuseInput: lightColor1 } });
        scene.gameObject.addChild(light1);
    }

    function setPointLightPosition()
    {
        const time = new Date().getTime();
        //
        let angle = time / 1000;
        light0.transform.y = 3;
        light0.transform.x = Math.sin(angle) * 3;
        light0.transform.z = Math.cos(angle) * 3;
        //
        angle = angle + Math.PI / 2;
        light1.transform.y = 3;
        light1.transform.x = Math.sin(angle) * 3;
        light1.transform.z = Math.cos(angle) * 3;
        light1.transform.lookAt(new feng3d.Vector3());
    }
}
