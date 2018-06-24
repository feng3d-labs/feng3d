namespace feng3d
{
    QUnit.module("GameObject", () =>
    {
        // @see https://gitee.com/feng3d/feng3d/issues/IK27X
        // 测试GameObject配发的事件会先处理自身然后传递到组件中
        QUnit.test("dispatchEvent", (assert) =>
        {
            var g = new GameObject({ name: "t" });

            var e = g.dispatch("click");
            g.dispatchEvent(e);

            assert.ok(e.targets[0] == g);

            g.components.forEach(element =>
            {
                assert.ok(e.targets.indexOf(element) != -1);
            });

        });
    });
}