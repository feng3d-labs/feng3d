QUnit.module("PathUtils", () =>
{
    QUnit.test("getName", (assert) =>
    {
        assert.ok(feng3d.pathUtils.getNameWithExtension("a") == "a");
        assert.ok(feng3d.pathUtils.getNameWithExtension("a.txt") == "a.txt");
        assert.ok(feng3d.pathUtils.getNameWithExtension("a/") == "a");
        assert.ok(feng3d.pathUtils.getNameWithExtension("a.b/") == "a.b");
    });

    QUnit.test("getExtension", (assert) =>
    {
        assert.ok(feng3d.pathUtils.getExtension("a.txt") == "txt");
        assert.ok(feng3d.pathUtils.getExtension("a") == "");
        assert.ok(feng3d.pathUtils.getExtension("a.b/b") == "");
        assert.ok(feng3d.pathUtils.getExtension("a.b/b.txt") == "txt");
        assert.ok(feng3d.pathUtils.getExtension("a.b/.txt") == "txt");
    });

    QUnit.test("getParentPath", (assert) =>
    {
        assert.ok(feng3d.pathUtils.getParentPath("a/a.txt") == "a/");
        assert.ok(feng3d.pathUtils.getParentPath("a/b") == "a/");
        assert.ok(feng3d.pathUtils.getParentPath("a/b/") == "a/");
    });

    QUnit.test("isDirectory", (assert) =>
    {
        assert.ok(feng3d.pathUtils.isDirectory("a/a.txt") == false);
        assert.ok(feng3d.pathUtils.isDirectory("a/b") == false);
        assert.ok(feng3d.pathUtils.isDirectory("a/b/") == true);
    });

    QUnit.test("getDirDepth", (assert) =>
    {
        assert.ok(feng3d.pathUtils.getDirDepth("a") == 0);
        assert.ok(feng3d.pathUtils.getDirDepth("a/") == 0);
        assert.ok(feng3d.pathUtils.getDirDepth("a/a.txt") == 1);
        assert.ok(feng3d.pathUtils.getDirDepth("a/b") == 1);
        assert.ok(feng3d.pathUtils.getDirDepth("a/b/") == 1);
        assert.ok(feng3d.pathUtils.getDirDepth("a/b/a") == 2);
        assert.ok(feng3d.pathUtils.getDirDepth("a/b/a/") == 2);
    });
});