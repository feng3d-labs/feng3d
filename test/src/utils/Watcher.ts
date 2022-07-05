QUnit.module("watcher", () =>
{
    QUnit.test("watch Object", (assert) =>
    {
        var o = { a: 1 };
        var out = "";
        var f = (h, p, o) => { out += "f"; };
        var f1 = (h, p, o) => { out += "f1"; };
        feng3d.watcher.watch(o, "a", f);
        // feng3d.watcher.watch(o,"a1",f)
        feng3d.watcher.watch(o, "a", f1);
        assert.ok(!!o[feng3d.__watchs__]);

        o.a = 2;
        feng3d.watcher.unwatch(o, "a", f);
        assert.ok(!!o[feng3d.__watchs__]);

        o.a = 3;
        assert.ok(out == "ff1f1", out);

        feng3d.watcher.unwatch(o, "a", f1);
        // 此时应该不存在属性 __watchs__
        assert.ok(!o[feng3d.__watchs__]);
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
        assert.ok(!!o[feng3d.__watchs__]);

        o.a = 2;
        assert.ok(num == 2);
        feng3d.watcher.unwatch(o, "a", f);
        assert.ok(!!o[feng3d.__watchs__]);

        o.a = 3;
        assert.ok(out == "ff1f1", out);
        assert.ok(num == 3);

        feng3d.watcher.unwatch(o, "a", f1);
        // 此时应该不存在属性 __watchs__
        assert.ok(!o[feng3d.__watchs__]);
    });

    QUnit.test("watch Object 性能", (assert) =>
    {
        var o = { a: 1 };

        var num = 1000000;
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

        var num = 1000000;
        var s = Date.now();
        for (let i = 0; i < num; i++)
        {
            o.x = i;
        }
        var t0 = Date.now() - s;

        delete o.x;
        o.x = 0;

        var s = Date.now();
        for (let i = 0; i < num; i++)
        {
            o.x = i;
        }
        var t1 = Date.now() - s;

        var f = () => { };
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

        delete o.x;
        o.x = 0;
        var s = Date.now();
        for (let i = 0; i < num; i++)
        {
            o.x = i;
        }
        var t3 = Date.now() - s;

        assert.ok(true, `${t0}->${t1}->${t2}->${t3} watch与unwatch操作后性能 1->${t0 / t1}->${t0 / t2}->${t0 / t3}`);
    });

    QUnit.test("watchchain Object", (assert) =>
    {
        var o = { a: { b: { c: 1 } } };
        var out = "";
        var f = (h, p, o) => { out += "f"; };
        var f1 = (h, p, o) => { out += "f1"; };
        feng3d.watcher.watchchain(o, "a.b.c", f);
        // 重复监听时不会生效，发生变化是 函数f只执行一次
        feng3d.watcher.watchchain(o, "a.b.c", f);
        // 可以在同一属性上监听多个函数
        feng3d.watcher.watchchain(o, "a.b.c", f1);
        // 添加监听后会自动生成 属性__watchchains__
        assert.ok(!!o[feng3d.__watchchains__]);

        o.a.b.c = 2;
        feng3d.watcher.unwatchchain(o, "a.b.c", f);
        o.a.b.c = 3;
        assert.ok(out == "ff1f1", out);
        //
        out = "";
        feng3d.watcher.unwatchchain(o, "a.b.c", f1);
        // 移除所有监听后 属性__watchchains__会自动被删除
        assert.ok(!o[feng3d.__watchchains__]);

        // 测试监听被清理干净
        o.a.b.c = 4;
        assert.ok(out == "", out);
        //
        out = "";
        feng3d.watcher.watchchain(o, "a.b.c", f);
        // 被赋予相同值时不会触发函数f
        o.a.b.c = 4;
        o.a.b.c = 5;
        assert.ok(out == "f", out);
        //
        out = "";
        o.a = { b: { c: 1 } }; // 调用一次 函数f
        o.a.b.c = 3;// 调用一次 函数f
        assert.ok(out == "ff", "out:" + out);
        //
        out = "";
        feng3d.watcher.unwatchchain(o, "a.b.c", f);
        o.a.b.c = 4;// 取消监听后 不会触发函数f
        assert.ok(out == "", "out:" + out);
        //
        out = "";
        feng3d.watcher.watchchain(o, "a.b.c", f);
        o.a = <any>null; // 触发一次函数f
        o.a = { b: { c: 1 } }// 触发一次函数f
        o.a.b.c = 5;// 触发一次函数f
        assert.ok(out == "fff", out);

        //
        var obj: any = {};
        out = "";
        feng3d.watcher.watchchain(obj, "a.b.c", f); // 监听不存在的属性
        obj.a = { b: { c: 1 } }; //obj.a.b.c从undefined变为1，  调用一次 函数f
        obj.a = null; //obj.a.b.c从undefined变为1，  调用一次 函数f
        assert.ok(out == "ff", out);

    });

    QUnit.test("bind unbind", (assert) =>
    {
        var vec2 = new feng3d.Vector2();
        var vec3 = new feng3d.Vector3();
        var vec4 = new feng3d.Vector4();

        feng3d.watcher.bind(vec2, "x", vec3, "x");
        feng3d.watcher.bind(vec2, "x", vec4, "x");

        var v = Math.random();

        vec2.x = v;
        assert.equal(vec2.x, v);
        assert.equal(vec2.x, vec3.x);
        assert.equal(vec2.x, vec4.x);

        vec4.x = v = Math.random();
        assert.equal(vec2.x, v);
        assert.equal(vec2.x, vec3.x);
        assert.equal(vec2.x, vec4.x);

        feng3d.watcher.unbind(vec3, "x", vec2, "x");
        feng3d.watcher.unbind(vec2, "x", vec4, "x");

        vec4.x = v = Math.random();
        assert.equal(vec4.x, v);
        assert.equal(vec2.x, vec3.x);

        assert.ok(vec2.x != v);

        assert.ok(feng3d.watcher["_binds"].length == 0);
    });

    QUnit.test("watchobject", (assert) =>
    {
        var o = { a: { b: { c: 1 }, d: 2 } };
        var out = "";
        var f = (h, p, o) => { out += "f"; };

        feng3d.watcher.watchobject(o, { a: { b: { c: null }, d: null } }, f);
        // 添加监听后会自动生成 属性__watchchains__
        assert.ok(!!o[feng3d.__watchchains__]);

        var out = "";
        o.a.b.c = 10; // 调用一次函数f
        o.a.d = 10;// 调用一次函数f
        assert.equal(out, "ff");

        feng3d.watcher.unwatchobject(o, { a: { b: { c: null }, d: null } }, f);
        // 添加监听后会自动生成 属性__watchchains__
        assert.ok(!o[feng3d.__watchchains__]);

        var out = "";
        o.a.b.c = 10; // 调用一次函数f
        o.a.d = 10;// 调用一次函数f
        assert.equal(out, "");

        // 监听所有属性
        var out = "";
        feng3d.watcher.watchobject(o, o, f);
        assert.ok(!!o[feng3d.__watchchains__]);
        o.a.d = 100;
        o.a.b.c = 100;
        assert.equal(out, "ff");

        feng3d.watcher.unwatchobject(o, o, f);
        assert.ok(!o[feng3d.__watchchains__]);
    });
});