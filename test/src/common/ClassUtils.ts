namespace feng3d
{
    QUnit.module("ClassUtils", () =>
    {
        QUnit.test("getQualifiedClassName", (assert) =>
        {
            var className = classUtils.getQualifiedClassName(EventDispatcher);
            assert.ok(className == "feng3d.EventDispatcher");

            var className = classUtils.getQualifiedClassName(true);
            assert.ok(className == "Boolean");

            var className = classUtils.getQualifiedClassName(Boolean);
            assert.ok(className == "Boolean");

            var className = classUtils.getQualifiedClassName("1");
            assert.ok(className == "String");

            var className = classUtils.getQualifiedClassName(String);
            assert.ok(className == "String");

            var className = classUtils.getQualifiedClassName(123);
            assert.ok(className == "Number");

            var className = classUtils.getQualifiedClassName(Number);
            assert.ok(className == "Number");
        });
    });
}