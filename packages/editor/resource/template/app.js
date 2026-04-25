/// <reference path="libs/feng3d.d.ts" />

var view = new feng3d.View();

// 初始化资源系统
feng3d.rs.init(() =>
{
    loadProjectJs(initProject);
});

function loadProjectJs(callback)
{
    if (feng3d.FS.fs.type == feng3d.FSType.http)
    {
        var path = feng3d.FS.fs.getAbsolutePath("project.js");
        var script = document.createElement("script");
        script.onload = () => { callback(); };
        script.src = path;
        document.head.appendChild(script);
    } else
    {
        // 读取项目脚本
        feng3d.FS.fs.readString("project.js", (err, content) =>
        {
            //
            var windowEval = eval.bind(window);
            // 运行project.js
            windowEval(content);
            callback();
        });
    }
}

function initProject()
{
    // 加载并初始化场景
    feng3d.FS.fs.readObject("default.scene.json", (err, obj) =>
    {
        feng3d.rs.deserializeWithAssets(obj, (scene) =>
        {
            if (scene.getComponent(feng3d.Scene))
                view.scene = scene.getComponent(feng3d.Scene);

            var cameras = view.root.getComponentsInChildren(feng3d.Camera);
            if (cameras.length > 0)
            {
                view.camera = cameras[0];
            } else
            {
                var camera = view.camera;
                camera.transform.z = -10;
                camera.transform.lookAt(new feng3d.Vector3());
                //
            }
        });

    });
}