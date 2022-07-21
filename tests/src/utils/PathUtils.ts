QUnit.module("PathUtils", () =>
{
    QUnit.test("basename", (assert) =>
    {
        feng3d.path
        assert.ok(feng3d.pathUtils.basename("a") == "a");
        assert.ok(feng3d.pathUtils.basename("a.txt") == "a.txt");
        assert.ok(feng3d.pathUtils.basename("a/") == "a");
        assert.ok(feng3d.pathUtils.basename("a.b/") == "a.b");
        //
        assert.ok(feng3d.path.basename("a") == "a");
        assert.ok(feng3d.path.basename("a.txt") == "a.txt");
        assert.ok(feng3d.path.basename("a/") == "a");
        assert.ok(feng3d.path.basename("a.b/") == "a.b");
    });

    QUnit.test("extname", (assert) =>
    {
        assert.ok(feng3d.pathUtils.extname("a.txt") == ".txt");
        assert.ok(feng3d.pathUtils.extname("a") == "");
        assert.ok(feng3d.pathUtils.extname("a.b/b") == "");
        assert.ok(feng3d.pathUtils.extname("a.b/b.txt") == ".txt");
        assert.ok(feng3d.pathUtils.extname("a.b/.txt") == ".txt");
        //
        assert.ok(feng3d.path.extname("a.txt") == ".txt");
        assert.ok(feng3d.path.extname("a") == "");
        assert.ok(feng3d.path.extname("a.b/b") == "");
        assert.ok(feng3d.path.extname("a.b/b.txt") == ".txt");
        // assert.ok(feng3d.path.extname("a.b/.txt") == ".txt");//error
    });

    QUnit.test("dirname", (assert) =>
    {
        assert.ok(feng3d.pathUtils.dirname("a/a.txt") == "a");
        assert.ok(feng3d.pathUtils.dirname("a/b") == "a");
        assert.ok(feng3d.pathUtils.dirname("a/b/") == "a");
        //
        assert.ok(feng3d.path.dirname("a/a.txt") == "a");
        assert.ok(feng3d.path.dirname("a/b") == "a");
        assert.ok(feng3d.path.dirname("a/b/") == "a");
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