namespace feng3d
{
    // 默认在 Scene.init 添加物理世界模块
    functionwrap.extendFunction(feng3d.View, "createNewScene", function (r)
    {
        r.gameObject.addComponent("PhysicsWorld");
        return r;
    });

}