QUnit.module("watcher", () =>
{
    QUnit.test("watch Object", (assert) =>
    {
        var o = { a: 1 };
        var out = "";
        var f = (h, p, o) => { out += "f"; };
        var f1 = (h, p, o) => { out += "f1"; };
        feng3d.watcher.watch(o, "a", f);
        feng3d.watcher.watch(o, "a", f1);
        o.a = 2;
        feng3d.watcher.unwatch(o, "a", f);
        o.a = 3;
        assert.ok(out == "ff1f1", out);
    });

    QUnit.test("watch custom A", (assert) =>
    {
        class A
        {
            get a()
            {
                return this._a;
            }
            set a(v)
            {
                this._a = v;
                num = v;
            }
            private _a = 1;
        }
        var o = new A();
        var num = 0;
        var out = "";
        var f = (h, p, o) => { out += "f"; };
        var f1 = (h, p, o) => { out += "f1"; };
        feng3d.watcher.watch(o, "a", f);
        feng3d.watcher.watch(o, "a", f1);
        o.a = 2;
        assert.ok(num == 2);
        feng3d.watcher.unwatch(o, "a", f);
        o.a = 3;
        assert.ok(out == "ff1f1", out);
        assert.ok(num == 3);
    });

    QUnit.test("watch Object 性能", (assert) =>
    {
        var o = { a: 1 };

        var num = 10000000;
        var out = "";
        var f = () => { out += "f"; };
        var s = Date.now();
        for (let i = 0; i < num; i++)
        {
            o.a = i;
        }
        var t1 = Date.now() - s;
        out = ""
        feng3d.watcher.watch(o, "a", f);
        o.a = 2;
        feng3d.watcher.unwatch(o, "a", f);
        o.a = 3;
        var s = Date.now();
        for (let i = 0; i < num; i++)
        {
            o.a = i;
        }
        var t2 = Date.now() - s;

        assert.ok(true, `${t1}->${t2} watch与unwatch操作后性能 1->${t1 / t2}`);
    });

    QUnit.test("watch Vector3 性能", (assert) =>
    {
        var o = new feng3d.Vector3();

        var num = 10000000;
        var out = "";
        var f = () => { out += "f"; };
        var s = Date.now();
        for (let i = 0; i < num; i++)
        {
            o.x = i;
        }
        var t1 = Date.now() - s;
        out = ""
        feng3d.watcher.watch(o, "x", f);
        o.x = 2;
        feng3d.watcher.unwatch(o, "x", f);
        o.x = 3;
        var s = Date.now();
        for (let i = 0; i < num; i++)
        {
            o.x = i;
        }
        var t2 = Date.now() - s;

        assert.ok(true, `${t1}->${t2} watch与unwatch操作后性能 1->${t1 / t2}`);
    });

    QUnit.test("watchchain Object", (assert) =>
    {
        var o = { a: { b: { c: 1 } } };
        var out = "";
        var f = (h, p, o) => { out += "f"; };
        var f1 = (h, p, o) => { out += "f1"; };
        feng3d.watcher.watchchain(o, "a.b.c", f);
        feng3d.watcher.watchchain(o, "a.b.c", f1);
        o.a.b.c = 2;
        feng3d.watcher.unwatchchain(o, "a.b.c", f);
        o.a.b.c = 3;
        assert.ok(out == "ff1f1", out);
        //
        out = "";
        feng3d.watcher.unwatchchain(o, "a.b.c", f1);
        o.a.b.c = 4;
        assert.ok(out == "", out);
        //
        out = "";
        feng3d.watcher.watchchain(o, "a.b.c", f);
        o.a.b.c = 4;
        o.a.b.c = 5;
        assert.ok(out == "f", out);
        //
        out = "";
        o.a = { b: { c: 1 } };
        o.a.b.c = 3;
        assert.ok(out == "ff", "out:" + out);
        //
        out = "";
        feng3d.watcher.unwatchchain(o, "a.b.c", f);
        o.a.b.c = 4;
        assert.ok(out == "", "out:" + out);
        //
        out = "";
        feng3d.watcher.watchchain(o, "a.b.c", f);
        o.a = <any>null;
        o.a = { b: { c: 1 } }
        o.a.b.c = 5;
        assert.ok(out == "fff", out);
    });
});