namespace feng3d
{
    QUnit.module("GameObject", () =>
    {
        // @see https://gitee.com/feng3d/feng3d/issues/IK27X
        QUnit.test("dispatchEvent", (assert) =>
        {
            var g = new GameObject({ name: "t" });

            var e = g.dispatch("click");
            g.dispatchEvent(e);

            assert.ok(e.targets[0] == g);

        });
    });
}