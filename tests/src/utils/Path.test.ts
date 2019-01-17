QUnit.module("Path", () =>
{
    QUnit.test("basename", (assert) =>
    {
        var result = [
            ".",
            "a/a.txt",
            "a/b",
            "a/b//",
            "a",
            "a.txt",
            "a/",
            "a.b/",
            '/foo/bar//baz//asdf//quux.html'
        ].map(e => feng3d.path.basename(e));

        assert.deepEqual(result, ['.', 'a.txt', 'b', 'b', 'a', 'a.txt', 'a', 'a.b', 'quux.html']);
    });
});