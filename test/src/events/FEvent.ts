namespace feng3d
{
    QUnit.module("FEvent", () =>
    {
        QUnit.test("on", (assert) =>
        {
            var out = "";
            //
            var n = 1;
            var s = "a";
            var o = {};
            // 监听任意对象的任意事件
            event.on(n, "n", () => { out += "n" });
            event.on(s, "s", () => { out += "s" });
            event.on(o, "o", () => { out += "o" });
            // 派发事件
            event.emit(n, "n");
            event.emit(s, "s");
            event.emit(o, "o");
            // 监听回调被正常调用
            assert.ok(out == "nso");

            // 再次派发事件
            event.emit(o, "o");
            event.emit(s, "s");
            event.emit(n, "n");
            // 监听回调被正常调用
            assert.ok(out == "nsoosn");

            var out = "";
            // 使用obj作为回调函数的上下文
            var obj = { v: 1, fn: function (event: Event<any>) { out += event.type + this.v; } };
            event.on(obj, "click", obj.fn, obj);
            // 重复监听一次派发事件仅会被调用一次
            event.on(obj, "click", obj.fn, obj);
            event.emit(obj, "click");
            assert.ok(out == "click1");

            var out = "";
            // 相同事件类似的监听器优先级越高越优先被调用
            event.on(1, "pevent", () => { out += "p1" }, null, 1);
            event.on(1, "pevent", () => { out += "p0" }, null, 0);
            event.on(1, "pevent", () => { out += "p2" }, null, 2);
            event.emit(1, "pevent");
            assert.ok(out == "p2p1p0");
        });

        QUnit.test("off", (assert) =>
        {
            var out = "";
            var fn = () => { out += "1" };
            // 监听后派发事件触发回调。
            event.on(1, "a", fn);
            event.emit(1, "a");
            assert.ok(out == "1");

            // 移除监听后再次派发事件后并未触发监听回调。
            event.off(1, "a", fn);
            event.emit(1, "a");
            assert.ok(out == "1");

            var out = "";
            var fn = () => { out += "1" };
            var fn2 = () => { out += "2" };
            event.on(1, "b", fn);
            event.on(1, "b", fn2);
            // off缺省监听回调时移除指定事件类型所有监听。
            event.off(1, "b");
            event.emit(1, "b");
            assert.ok(!event.has(1, "b"));
            assert.ok(out == "");

            var out = "";
            var fn = () => { out += "1" };
            var fn2 = () => { out += "2" };
            event.on(1, "c", fn);
            event.on(1, "d", fn2);
            event.onAny(1, fn2);
            // off 缺省 事件类型时将会移除指定对象上所有事件监听。
            event.off(1);
            event.emit(1, "c");
            event.emit(1, "d");
            assert.ok(!event.has(1, "c"));
            assert.ok(!event.has(1, "d"));
            assert.ok(out == "");
        });

        QUnit.test("once", (assert) =>
        {
            // 只监听一次，被触发后自动移除监听。
            var out = "";
            event.once(1, "a", () => { out += "1" });
            event.emit(1, "a");
            assert.ok(out == "1");

            // 已经被移除，再次派发事件并不会被触发监听回调。
            event.emit(1, "a");
            assert.ok(out == "1");
        });

        QUnit.test("has", (assert) =>
        {
            // 新增监听，has检测到拥有该监听。
            var out = "";
            event.on(1, "a", () => { out += "1" });
            assert.ok(event.has(1, "a"));

            // 移除监听后，未检测到拥有该监听。
            event.off(1, "a");
            assert.ok(!event.has(1, "a"));

            // 新增once监听，has检测到拥有该监听。
            event.once(2, "2", () => { out += "2" });
            assert.ok(event.has(2, "2"));

            // once被触发后自动被移除，未检测到该监听。
            event.emit(2, "2");
            assert.ok(!event.has(2, "2"));
        });

        QUnit.test("onAny offAny", (assert) =>
        {
            var out = "";
            var fn = (e: Event<any>) => { out += e.type };
            // 新增一个对象的任意事件监听器。
            event.onAny(1, fn);

            // 配发多个不同事件后均被触发监听器。
            event.emit(1, "a");
            event.emit(1, "b");
            event.emit(1, "c");
            assert.ok(out == "abc");

            // 移除后并不会再次被触发。
            event.offAny(1, fn);
            event.emit(1, "a");
            event.emit(1, "b");
            event.emit(1, "c");
            assert.ok(out == "abc");
        });

        QUnit.test("dispatch", (assert) =>
        {
            // dispatch 携带数据 冒泡
            var data = { d: 0 };
            var out: Event<any> = null;
            var parent = { v: 0 };
            var child = { v: 1, parent: parent };
            event.on(parent, "b", (e) => { out = e; })
            event.emit(child, "b", data, true);
            assert.ok(out.data == data);
            // 派发事件的对象
            assert.ok(out.target == child);
            // 当前处理事件的对象
            assert.ok(out.currentTarget == parent);
            // 事件冒泡流向
            assert.ok(out.targets[0] == child);
            assert.ok(out.targets[1] == parent);

            // 处理停止事件的冒泡
            var parent = { v: 0 };
            var child = { v: 1, parent: parent };
            var outstr = "";
            event.on(child, "b1", (e) => { e.isStopBubbles = true; }, null, -1); // 新增优先级较低的监听器，并停止冒泡行为。
            event.on(child, "b1", (e) => { outstr += "child0"; }, null, 0); // 该监听器将会被触发。
            event.on(child, "b1", (e) => { outstr += "child-1"; }, null, -2); // 该监听器将会被触发。
            event.on(parent, "b1", (e) => { outstr += "parent"; }); // 冒泡被终止，该监听器不会被触发。
            event.emit(child, "b1", null, true);
            assert.equal(outstr, "child0child-1");

            // 处理停止事件
            var parent = { v: 0 };
            var child = { v: 1, parent: parent };
            var outstr = "";
            event.on(child, "b2", (e) => { e.isStop = true; }, null, -1); // 新增优先级较低的监听器，并停止事件流。
            event.on(child, "b2", (e) => { outstr += "child0"; }, null, 0); // 该监听器将会被触发。
            event.on(child, "b2", (e) => { outstr += "child-1"; }, null, -2); // 事件被终止，该监听器优先级较低将不会被触发。
            event.on(parent, "b2", (e) => { outstr += "parent"; }); // 事件被终止，该监听器不会被触发。
            event.emit(child, "b2", null, true);
            assert.equal(outstr, "child0");
        });

        QUnit.test("ObjectEventDispatcher", (assert) =>
        {
            // 针对number分配事件类型，在使用 on 等接口是会有自动提示。
            interface NType
            {
                "1": undefined;
                a: { b: number };
            }
            var nevent: ObjectEventDispatcher<number, NType> = <any>event;

            var out = "";
            var n = 1;
            nevent.on(n, "a", () => { out += "1" });
            nevent.emit(n, "1");
            nevent.emit(n, "a");
            assert.ok(out == "1");

            nevent.off(1, "a");
            nevent.emit(1, "a");
            assert.ok(out == "1");

            // 针对Object扩展分配事件类型，在使用 on 等接口是会有自动提示。
            interface OType extends NType
            {
                "2": null;
                b: { b: number };
            }
            var oevent: ObjectEventDispatcher<Object, OType> = <any>event;
            var o = {};
            oevent.on(o, "1", () => { out += "1" });
            oevent.on(o, "2", () => { out += "1" });
            oevent.on(o, "a", () => { out += "1" });
            oevent.on(o, "b", () => { out += "1" });

        });

    });
}