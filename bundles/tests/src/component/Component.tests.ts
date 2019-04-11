namespace feng3d
{
    QUnit.module("Component", () =>
    {
        // @see https://gitee.com/feng3d/feng3d/issues/IK27X
        // 测试Component配发的事件会先传递到GameObject中然后传递到组件中
        QUnit.test("dispatchEvent", (assert) =>
        {
            var c = serialization.setValue(new GameObject(), { name: "t" }).addComponent(Camera);

            var e = c.dispatch("lensChanged");
            c.dispatchEvent(e);

            assert.ok(e.targets[0] == c);

            c.gameObject.components.forEach(element =>
            {
                assert.ok(e.targets.indexOf(element) != -1);
            });

        });
    });
}