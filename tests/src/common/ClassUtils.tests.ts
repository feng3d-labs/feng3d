namespace feng3d
{
    QUnit.module("ClassUtils", () =>
    {
        QUnit.test("getQualifiedClassName", (assert) =>
        {
            var className = ClassUtils.getQualifiedClassName(EventDispatcher);
            assert.ok(className == "feng3d.EventDispatcher");

            var className = ClassUtils.getQualifiedClassName(true);
            assert.ok(className == "Boolean");

            var className = ClassUtils.getQualifiedClassName(Boolean);
            assert.ok(className == "Boolean");

            var className = ClassUtils.getQualifiedClassName("1");
            assert.ok(className == "String");

            var className = ClassUtils.getQualifiedClassName(String);
            assert.ok(className == "String");

            var className = ClassUtils.getQualifiedClassName(123);
            assert.ok(className == "Number");

            var className = ClassUtils.getQualifiedClassName(Number);
            assert.ok(className == "Number");
        });
    });
}