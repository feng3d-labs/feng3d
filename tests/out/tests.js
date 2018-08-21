"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var feng3d;
(function (feng3d) {
    var ObjectBase = /** @class */ (function () {
        function ObjectBase() {
            this.id = 1;
        }
        __decorate([
            feng3d.serialize
        ], ObjectBase.prototype, "id", void 0);
        return ObjectBase;
    }());
    feng3d.ObjectBase = ObjectBase;
    var C = /** @class */ (function (_super) {
        __extends(C, _super);
        function C() {
            // @serialize
            // id = 2;
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.a = 1;
            _this.c = 1;
            return _this;
        }
        C.prototype.change = function () {
            feng3d.log("change", this.a, arguments);
        };
        __decorate([
            feng3d.serialize
        ], C.prototype, "a", void 0);
        __decorate([
            feng3d.serialize
        ], C.prototype, "c", void 0);
        return C;
    }(ObjectBase));
    feng3d.C = C;
    QUnit.module("Serialization", function () {
        QUnit.test("serialize", function (assert) {
            var base = new ObjectBase();
            base.id = Math.random();
            var resultb = feng3d.serialization.serialize(base);
            var base1 = feng3d.serialization.deserialize(resultb);
            assert.ok(base.id == base1.id);
            var c = new C();
            c.id = Math.random();
            c.a = Math.random();
            c.c = Math.random();
            var result = feng3d.serialization.serialize(c);
            var c1 = feng3d.serialization.deserialize(result);
            assert.ok(c.id == c1.id);
            assert.ok(c.a == c1.a);
            assert.ok(c.c == c1.c);
        });
        QUnit.test("serialize function", function (assert) {
            function add(a, b) {
                return a + b;
            }
            var result = feng3d.serialization.serialize(add);
            var result1 = feng3d.serialization.deserialize(result);
            var a = Math.random();
            var b = Math.random();
            assert.ok(result1(a, b) == add(a, b));
        });
        QUnit.test("serialize Array", function (assert) {
            var arr = [1, 2, 3, "a", "b"];
            var result = feng3d.serialization.serialize(arr);
            var result1 = feng3d.serialization.deserialize(result);
            var r = arr.reduce(function (prev, item, index) { if (!prev)
                return prev; return arr[index] == result1[index]; }, true);
            assert.ok(r);
        });
        QUnit.test("serialize Object", function (assert) {
            var obj = { a: 1, b: 2, c: 3, d: "a", e: "b" };
            var result = feng3d.serialization.serialize(obj);
            var result1 = feng3d.serialization.deserialize(result);
            var r = Object.keys(obj).reduce(function (prev, item) { if (!prev)
                return prev; return obj[item] == result1[item]; }, true);
            assert.ok(r);
        });
        QUnit.test("serialize.setValue 相同类型时不会新建对象", function (assert) {
            var obj = { a: 1, b: { c: 3, d: "a", e: "b", o: new C() } };
            var obj1 = feng3d.serialization.serialize(obj);
            obj1.b.c = 5;
            obj1.b.o.id = 5;
            var b = obj.b;
            feng3d.serialization.setPropertyValue(obj, obj1, "b");
            assert.ok(obj.b == b);
            obj1.b.o.id = 3;
            assert.ok(obj.b != obj1.b);
        });
        QUnit.test("serialize.different 获取两个数据的差异", function (assert) {
            var c = new C();
            c.id = 8;
            var diff = feng3d.serialization.different(c, new C());
            assert.ok(Object.keys(diff).length == 1);
        });
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var NUM = 10;
    QUnit.module("OrthographicLens", function () {
        QUnit.test("project", function (assert) {
            // 生成随机正交矩阵
            var left = Math.random();
            var right = Math.random() + left;
            var top = Math.random();
            var bottom = Math.random() + top;
            var near = Math.random();
            var far = Math.random() + near;
            var orthographicLens = new feng3d.OrthographicLens(left, right, top, bottom, near, far);
            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new feng3d.Vector3(left, bottom, near);
            var tv = orthographicLens.project(lbn);
            assert.ok(new feng3d.Vector3(-1, -1, -1).equals(tv));
            var lbf = new feng3d.Vector3(left, bottom, far);
            var tv = orthographicLens.project(lbf);
            assert.ok(new feng3d.Vector3(-1, -1, 1).equals(tv));
            var ltn = new feng3d.Vector3(left, top, near);
            var tv = orthographicLens.project(ltn);
            assert.ok(new feng3d.Vector3(-1, 1, -1).equals(tv));
            var ltf = new feng3d.Vector3(left, top, far);
            var tv = orthographicLens.project(ltf);
            assert.ok(new feng3d.Vector3(-1, 1, 1).equals(tv));
            var rbn = new feng3d.Vector3(right, bottom, near);
            var tv = orthographicLens.project(rbn);
            assert.ok(new feng3d.Vector3(1, -1, -1).equals(tv));
            var rbf = new feng3d.Vector3(right, bottom, far);
            var tv = orthographicLens.project(rbf);
            assert.ok(new feng3d.Vector3(1, -1, 1).equals(tv));
            var rtn = new feng3d.Vector3(right, top, near);
            var tv = orthographicLens.project(rtn);
            assert.ok(new feng3d.Vector3(1, 1, -1).equals(tv));
            var rtf = new feng3d.Vector3(right, top, far);
            var tv = orthographicLens.project(rtf);
            assert.ok(new feng3d.Vector3(1, 1, 1).equals(tv));
        });
        QUnit.test("unproject", function (assert) {
            // 生成随机正交矩阵
            var left = Math.random();
            var right = Math.random() + left;
            var top = Math.random();
            var bottom = Math.random() + top;
            var near = Math.random();
            var far = Math.random() + near;
            var orthographicLens = new feng3d.OrthographicLens(left, right, top, bottom, near, far);
            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new feng3d.Vector3(-1, -1, -1);
            var tv = orthographicLens.unproject(lbn);
            assert.ok(new feng3d.Vector3(left, bottom, near).equals(tv));
            var lbf = new feng3d.Vector3(-1, -1, 1);
            var tv = orthographicLens.unproject(lbf);
            assert.ok(new feng3d.Vector3(left, bottom, far).equals(tv));
            var ltn = new feng3d.Vector3(-1, 1, -1);
            var tv = orthographicLens.unproject(ltn);
            assert.ok(new feng3d.Vector3(left, top, near).equals(tv));
            var ltf = new feng3d.Vector3(-1, 1, 1);
            var tv = orthographicLens.unproject(ltf);
            assert.ok(new feng3d.Vector3(left, top, far).equals(tv));
            var rbn = new feng3d.Vector3(1, -1, -1);
            var tv = orthographicLens.unproject(rbn);
            assert.ok(new feng3d.Vector3(right, bottom, near).equals(tv));
            var rbf = new feng3d.Vector3(1, -1, 1);
            var tv = orthographicLens.unproject(rbf);
            assert.ok(new feng3d.Vector3(right, bottom, far).equals(tv));
            var rtn = new feng3d.Vector3(1, 1, -1);
            var tv = orthographicLens.unproject(rtn);
            assert.ok(new feng3d.Vector3(right, top, near).equals(tv));
            var rtf = new feng3d.Vector3(1, 1, 1);
            var tv = orthographicLens.unproject(rtf);
            assert.ok(new feng3d.Vector3(right, top, far).equals(tv));
        });
        QUnit.test("unprojectRay", function (assert) {
            var left = Math.random();
            var right = Math.random() + left;
            var top = Math.random();
            var bottom = Math.random() + top;
            var near = Math.random();
            var far = Math.random() + near;
            var orthographicLens = new feng3d.OrthographicLens(left, right, top, bottom, near, far);
            var x = Math.random();
            var y = Math.random();
            for (var i = 0; i < NUM; i++) {
                var ray = orthographicLens.unprojectRay(x, y);
                var p = ray.getPointWithZ(feng3d.FMath.lerp(near, far, Math.random()));
                var pp = orthographicLens.project(p);
                assert.ok(feng3d.FMath.equals(x, pp.x));
                assert.ok(feng3d.FMath.equals(y, pp.y));
            }
        });
        QUnit.test("unprojectWithDepth", function (assert) {
            var left = Math.random();
            var right = Math.random() + left;
            var top = Math.random();
            var bottom = Math.random() + top;
            var near = Math.random();
            var far = Math.random() + near;
            var orthographicLens = new feng3d.OrthographicLens(left, right, top, bottom, near, far);
            var x = Math.random();
            var y = Math.random();
            for (var i = 0; i < NUM; i++) {
                var sZ = feng3d.FMath.lerp(near, far, Math.random());
                var p = orthographicLens.unprojectWithDepth(x, y, sZ);
                assert.ok(feng3d.FMath.equals(sZ, p.z));
                var pp = orthographicLens.project(p);
                assert.ok(feng3d.FMath.equals(x, pp.x));
                assert.ok(feng3d.FMath.equals(y, pp.y));
            }
        });
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var NUM = 10;
    QUnit.module("PerspectiveLens", function () {
        QUnit.test("project", function (assert) {
            var fov = Math.random() * 360;
            var aspect = Math.random();
            var near = Math.random();
            var far = Math.random();
            var perspectiveLens = new feng3d.PerspectiveLens(fov, aspect, near, far);
            var tan = Math.tan(fov * Math.PI / 360);
            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new feng3d.Vector3(-tan * near * aspect, -tan * near, near);
            var tv = perspectiveLens.project(lbn);
            assert.ok(new feng3d.Vector3(-1, -1, -1).equals(tv));
            var lbf = new feng3d.Vector3(-tan * far * aspect, -tan * far, far);
            var tv = perspectiveLens.project(lbf);
            assert.ok(new feng3d.Vector3(-1, -1, 1).equals(tv));
            var ltn = new feng3d.Vector3(-tan * near * aspect, tan * near, near);
            var tv = perspectiveLens.project(ltn);
            assert.ok(new feng3d.Vector3(-1, 1, -1).equals(tv));
            var ltf = new feng3d.Vector3(-tan * far * aspect, tan * far, far);
            var tv = perspectiveLens.project(ltf);
            assert.ok(new feng3d.Vector3(-1, 1, 1).equals(tv));
            var rbn = new feng3d.Vector3(tan * near * aspect, -tan * near, near);
            var tv = perspectiveLens.project(rbn);
            assert.ok(new feng3d.Vector3(1, -1, -1).equals(tv));
            var rbf = new feng3d.Vector3(tan * far * aspect, -tan * far, far);
            var tv = perspectiveLens.project(rbf);
            assert.ok(new feng3d.Vector3(1, -1, 1).equals(tv));
            var rtn = new feng3d.Vector3(tan * near * aspect, tan * near, near);
            var tv = perspectiveLens.project(rtn);
            assert.ok(new feng3d.Vector3(1, 1, -1).equals(tv));
            var rtf = new feng3d.Vector3(tan * far * aspect, tan * far, far);
            var tv = perspectiveLens.project(rtf);
            assert.ok(new feng3d.Vector3(1, 1, 1).equals(tv));
        });
        QUnit.test("unproject", function (assert) {
            var fov = Math.random() * 360;
            var aspect = Math.random();
            var near = Math.random();
            var far = Math.random();
            var perspectiveLens = new feng3d.PerspectiveLens(fov, aspect, near, far);
            var tan = Math.tan(fov * Math.PI / 360);
            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new feng3d.Vector3(-1, -1, -1);
            var tv = perspectiveLens.unproject(lbn);
            assert.ok(new feng3d.Vector3(-tan * near * aspect, -tan * near, near).equals(tv));
            var lbf = new feng3d.Vector3(-1, -1, 1);
            var tv = perspectiveLens.unproject(lbf);
            assert.ok(new feng3d.Vector3(-tan * far * aspect, -tan * far, far).equals(tv));
            var ltn = new feng3d.Vector3(-1, 1, -1);
            var tv = perspectiveLens.unproject(ltn);
            assert.ok(new feng3d.Vector3(-tan * near * aspect, tan * near, near).equals(tv));
            var ltf = new feng3d.Vector3(-1, 1, 1);
            var tv = perspectiveLens.unproject(ltf);
            assert.ok(new feng3d.Vector3(-tan * far * aspect, tan * far, far).equals(tv));
            var rbn = new feng3d.Vector3(1, -1, -1);
            var tv = perspectiveLens.unproject(rbn);
            assert.ok(new feng3d.Vector3(tan * near * aspect, -tan * near, near).equals(tv));
            var rbf = new feng3d.Vector3(1, -1, 1);
            var tv = perspectiveLens.unproject(rbf);
            assert.ok(new feng3d.Vector3(tan * far * aspect, -tan * far, far).equals(tv));
            var rtn = new feng3d.Vector3(1, 1, -1);
            var tv = perspectiveLens.unproject(rtn);
            assert.ok(new feng3d.Vector3(tan * near * aspect, tan * near, near).equals(tv));
            var rtf = new feng3d.Vector3(1, 1, 1);
            var tv = perspectiveLens.unproject(rtf);
            assert.ok(new feng3d.Vector3(tan * far * aspect, tan * far, far).equals(tv));
        });
        QUnit.test("unprojectRay", function (assert) {
            var fov = Math.random() * 360;
            var aspect = Math.random();
            var near = Math.random();
            var far = Math.random();
            var perspectiveLens = new feng3d.PerspectiveLens(fov, aspect, near, far);
            var x = Math.random();
            var y = Math.random();
            for (var i = 0; i < NUM; i++) {
                var ray = perspectiveLens.unprojectRay(x, y);
                var p = ray.getPointWithZ(feng3d.FMath.lerp(near, far, Math.random()));
                var pp = perspectiveLens.project(p);
                assert.ok(feng3d.FMath.equals(x, pp.x));
                assert.ok(feng3d.FMath.equals(y, pp.y));
            }
        });
        QUnit.test("unprojectWithDepth", function (assert) {
            var fov = Math.random() * 360;
            var aspect = Math.random();
            var near = Math.random();
            var far = Math.random();
            var perspectiveLens = new feng3d.PerspectiveLens(fov, aspect, near, far);
            var x = Math.random();
            var y = Math.random();
            for (var i = 0; i < NUM; i++) {
                var sZ = feng3d.FMath.lerp(near, far, Math.random());
                var p = perspectiveLens.unprojectWithDepth(x, y, sZ);
                assert.ok(feng3d.FMath.equals(sZ, p.z));
                var pp = perspectiveLens.project(p);
                assert.ok(feng3d.FMath.equals(x, pp.x));
                assert.ok(feng3d.FMath.equals(y, pp.y));
            }
        });
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    QUnit.module("ClassUtils", function () {
        QUnit.test("getQualifiedClassName", function (assert) {
            var className = feng3d.classUtils.getQualifiedClassName(feng3d.EventDispatcher);
            assert.ok(className == "feng3d.EventDispatcher");
            var className = feng3d.classUtils.getQualifiedClassName(true);
            assert.ok(className == "Boolean");
            var className = feng3d.classUtils.getQualifiedClassName(Boolean);
            assert.ok(className == "Boolean");
            var className = feng3d.classUtils.getQualifiedClassName("1");
            assert.ok(className == "String");
            var className = feng3d.classUtils.getQualifiedClassName(String);
            assert.ok(className == "String");
            var className = feng3d.classUtils.getQualifiedClassName(123);
            assert.ok(className == "Number");
            var className = feng3d.classUtils.getQualifiedClassName(Number);
            assert.ok(className == "Number");
        });
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    QUnit.module("Component", function () {
        // @see https://gitee.com/feng3d/feng3d/issues/IK27X
        // 测试Component配发的事件会先传递到GameObject中然后传递到组件中
        QUnit.test("dispatchEvent", function (assert) {
            var c = new feng3d.GameObject({ name: "t" }).addComponent(feng3d.Camera);
            var e = c.dispatch("lensChanged");
            c.dispatchEvent(e);
            assert.ok(e.targets[0] == c.gameObject);
            c.gameObject.components.forEach(function (element) {
                assert.ok(e.targets.indexOf(element) != -1);
            });
        });
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    QUnit.module("GameObject", function () {
        // @see https://gitee.com/feng3d/feng3d/issues/IK27X
        // 测试GameObject配发的事件会先处理自身然后传递到组件中
        QUnit.test("dispatchEvent", function (assert) {
            var g = new feng3d.GameObject({ name: "t" });
            var e = g.dispatch("click");
            g.dispatchEvent(e);
            assert.ok(e.targets[0] == g);
            g.components.forEach(function (element) {
                assert.ok(e.targets.indexOf(element) != -1);
            });
        });
    });
})(feng3d || (feng3d = {}));
QUnit.module("LinkedList", function () {
    QUnit.test("LinkedList", function (assert) {
        var ll = new ds.LinkedList();
        assert.deepEqual(ll.shift(), undefined);
        assert.deepEqual(ll.pop(), undefined);
    });
    QUnit.test("unshift", function (assert) {
        var ll = new ds.LinkedList();
        var arr = ds.utils.createArray(10, function () { return Math.random(); });
        ll.unshift.apply(ll, arr);
        assert.deepEqual(ll.toArray(), arr);
        ll.unshift(1);
        arr.unshift(1);
        assert.deepEqual(ll.toArray(), arr);
    });
    QUnit.test("push", function (assert) {
        var ll = new ds.LinkedList();
        var arr = ds.utils.createArray(10, function () { return Math.random(); });
        ll.push.apply(ll, arr);
        assert.deepEqual(ll.toArray(), arr);
        ll.push(1);
        arr.push(1);
        assert.deepEqual(ll.toArray(), arr);
    });
    QUnit.test("shift", function (assert) {
        var ll = new ds.LinkedList();
        var arr = ds.utils.createArray(10, function () { return Math.random(); });
        ll.push.apply(ll, arr);
        assert.deepEqual(ll.toArray(), arr);
        assert.deepEqual(ll.shift(), arr.shift());
        assert.deepEqual(ll.shift(), arr.shift());
        assert.deepEqual(ll.toArray(), arr);
    });
    QUnit.test("pop", function (assert) {
        var ll = new ds.LinkedList();
        var arr = ds.utils.createArray(10, function () { return Math.random(); });
        ll.push.apply(ll, arr);
        assert.deepEqual(ll.toArray(), arr);
        assert.deepEqual(ll.pop(), arr.pop());
        assert.deepEqual(ll.pop(), arr.pop());
        assert.deepEqual(ll.toArray(), arr);
    });
    QUnit.test("toArray", function (assert) {
        var ll = new ds.LinkedList();
        var arr = ds.utils.createArray(10, function () { return Math.random(); });
        ll.push.apply(ll, arr);
        assert.deepEqual(ll.toArray(), arr);
    });
    QUnit.test("fromArray", function (assert) {
        var ll = new ds.LinkedList();
        var arr = ds.utils.createArray(10, function () { return Math.random(); });
        ll.fromArray(arr);
        assert.deepEqual(ll.toArray(), arr);
    });
});
QUnit.module("PriorityQueue", function () {
    QUnit.test("push", function (assert) {
        var arr = ds.utils.createArray(10, function () { return Math.random(); });
        var compare = function (a, b) { return a - b; };
        var q = new ds.PriorityQueue(compare);
        q.push.apply(q, arr);
        var sortarr = arr.concat().sort(compare);
        assert.deepEqual(q.toArray(), sortarr);
        arr.push(1);
        q.push(1);
        sortarr = arr.concat().sort();
        assert.deepEqual(q.toArray(), sortarr);
    });
    QUnit.test("shift", function (assert) {
        var arr = ds.utils.createArray(10, function () { return Math.random(); });
        var compare = function (a, b) { return a - b; };
        var q = new ds.PriorityQueue(compare);
        q.push.apply(q, arr);
        var sortarr = arr.concat().sort(compare);
        for (var i = sortarr.length - 1; i >= 0; i--) {
            assert.deepEqual(q.shift(), sortarr.shift());
        }
    });
    QUnit.test("toArray", function (assert) {
        var arr = ds.utils.createArray(10, function () { return Math.random(); });
        var compare = function (a, b) { return a - b; };
        var q = new ds.PriorityQueue(compare);
        q.push.apply(q, arr);
        var sortarr = arr.concat().sort(compare);
        assert.deepEqual(q.toArray(), sortarr);
    });
    QUnit.test("fromArray", function (assert) {
        var arr = ds.utils.createArray(10, function () { return Math.random(); });
        var compare = function (a, b) { return a - b; };
        var q = new ds.PriorityQueue(compare);
        q.fromArray(arr);
        var sortarr = arr.concat().sort(compare);
        assert.deepEqual(q.toArray(), sortarr);
    });
});
QUnit.module("Queue", function () {
    QUnit.test("push", function (assert) {
        var arr = ds.utils.createArray(10, function () { return Math.random(); });
        var q = new ds.Queue();
        q.push.apply(q, arr);
        assert.deepEqual(q.toArray(), arr);
        arr.push(1);
        q.push(1);
        assert.deepEqual(q.toArray(), arr);
    });
    QUnit.test("shift", function (assert) {
        var arr = ds.utils.createArray(10, function () { return Math.random(); });
        var q = new ds.Queue();
        q.push.apply(q, arr);
        for (var i = arr.length - 1; i >= 0; i--) {
            assert.deepEqual(q.shift(), arr.shift());
        }
    });
    QUnit.test("toArray", function (assert) {
        var arr = ds.utils.createArray(10, function () { return Math.random(); });
        var q = new ds.Queue();
        q.push.apply(q, arr);
        assert.deepEqual(q.toArray(), arr);
    });
    QUnit.test("fromArray", function (assert) {
        var arr = ds.utils.createArray(10, function () { return Math.random(); });
        var q = new ds.Queue();
        q.fromArray(arr);
        assert.deepEqual(q.toArray(), arr);
    });
});
QUnit.module("Utils", function () {
    QUnit.test("arrayFrom", function (assert) {
        var arr = ds.utils.createArray(100, function () { return Math.floor(Math.random() * 100); });
        var float32Array = new Float32Array(arr);
        var arr0 = ds.utils.arrayFrom(float32Array);
        assert.deepEqual(arr, arr0);
    });
    QUnit.test("arrayUnique", function (assert) {
        var arr = ds.utils.createArray(100, function () { return Math.floor(Math.random() * 100); });
        ds.utils.arrayUnique(arr);
        assert.deepEqual(ds.utils.arrayIsUnique(arr), true);
    });
    QUnit.test("arrayIsUnique", function (assert) {
        assert.deepEqual(ds.utils.arrayIsUnique([1, 2, 3]), true);
        assert.deepEqual(ds.utils.arrayIsUnique([1, 2, 2]), false);
    });
    QUnit.test("createArray", function (assert) {
        var arr = ds.utils.createArray(100, function (i) { return i; });
        for (var i = 0; i < arr.length; i++) {
            assert.deepEqual(i, arr[i]);
        }
    });
    QUnit.test("binarySearch", function (assert) {
        var arr = ds.utils.createArray(100, function () { return Math.floor(Math.random() * 100); });
        var compareFn = function (a, b) { return a - b; };
        arr.sort(compareFn);
        var index = Math.floor(arr.length * Math.random());
        var find = ds.utils.binarySearch(arr, arr[index], compareFn);
        assert.deepEqual(find <= index, true);
        assert.deepEqual(arr[index], arr[find]);
        if (find > 0)
            assert.equal(arr[find] - arr[find - 1] > 0, true);
        if (find < arr.length - 1)
            assert.equal(arr[find] - arr[find + 1] <= 0, true);
        assert.deepEqual(-1, ds.utils.binarySearch(arr, -1, compareFn));
    });
    QUnit.test("binarySearchInsert", function (assert) {
        var arr = ds.utils.createArray(100, function () { return Math.floor(Math.random() * 100); });
        var compareFn = function (a, b) { return a - b; };
        arr.sort(compareFn);
        var index = Math.floor(arr.length * Math.random());
        var find = ds.utils.binarySearchInsert(arr, arr[index], compareFn);
        assert.deepEqual(find <= index, true);
        assert.deepEqual(0, ds.utils.binarySearchInsert(arr, -1, compareFn));
        assert.deepEqual(100, ds.utils.binarySearchInsert(arr, 10000, compareFn));
    });
});
var feng3d;
(function (feng3d) {
    QUnit.module("Box3", function () {
        QUnit.test("intersectsTriangle", function (assert) {
            var box = feng3d.Box.random();
            var triangle = feng3d.Triangle3D.fromPoints(box.randomPoint(), box.randomPoint(), box.randomPoint());
            assert.ok(box.intersectsTriangle(triangle));
            var triangle1 = feng3d.Triangle3D.fromPoints(box.randomPoint(), box.randomPoint().addNumber(5), box.randomPoint().addNumber(6));
            assert.ok(box.intersectsTriangle(triangle1));
            //
            var box2 = new feng3d.Box(new feng3d.Vector3(-1, -1, -1), new feng3d.Vector3(1, 1, 1));
            var triangle2 = new feng3d.Triangle3D(new feng3d.Vector3(1.5, 0, 0), new feng3d.Vector3(0, 1.5, 0), new feng3d.Vector3(1.5, 1.5, 0));
            assert.ok(box2.intersectsTriangle(triangle2));
        });
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    QUnit.module("Line3D", function () {
        QUnit.test("getPlane", function (assert) {
            var line = feng3d.Line3D.random();
            var plane = line.getPlane();
            assert.ok(plane.onWithPoint(line.position));
            assert.ok(plane.onWithPoint(line.position.addTo(line.direction)));
        });
        QUnit.test("distanceWithPoint", function (assert) {
            var l = feng3d.Line3D.random();
            assert.ok(l.distanceWithPoint(l.position) == 0);
            var n = feng3d.Vector3.random().cross(l.direction).scale(100);
            assert.ok(Math.abs(l.distanceWithPoint(n.addTo(l.position)) - n.length) < n.length / 1000);
        });
        QUnit.test("intersectWithLine3D", function (assert) {
            var l0 = feng3d.Line3D.random();
            var l1 = feng3d.Line3D.fromPoints(l0.position.clone(), feng3d.Vector3.random());
            assert.ok(l0.position.equals(l0.intersectWithLine3D(l1)));
            l1.fromPoints(l0.getPoint(Math.random()), l0.getPoint(Math.random()));
            assert.ok(l0.equals(l0.intersectWithLine3D(l1)));
        });
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    QUnit.module("Matrix4x4", function () {
        QUnit.test("invert", function (assert) {
            var mat = new feng3d.PerspectiveLens().matrix;
            // var mat = new Matrix4x4().recompose([Vector3.random(), Vector3.random(), Vector3.random()]);
            var imat = mat.clone().invert();
            assert.ok(imat.clone().append(mat).equals(new feng3d.Matrix4x4()));
            var v = feng3d.Vector4.random();
            // var v = Vector4.fromVector3(Vector3.random(), 1);
            var v0 = v.clone().applyMatrix4x4(mat).applyMatrix4x4(imat);
            assert.ok(v.equals(v0));
        });
        QUnit.test("decompose,recompose", function (assert) {
            var vs = [feng3d.Vector3.random(), feng3d.Vector3.random(), feng3d.Vector3.random()];
            var mat = new feng3d.Matrix4x4().recompose(vs);
            var vs0 = mat.decompose();
            assert.ok(vs[0].equals(vs0[0]));
            assert.ok(vs[1].equals(vs0[1]));
            assert.ok(vs[2].equals(vs0[2]));
        });
        QUnit.test("！！！！", function (assert) {
            var mat0 = new feng3d.Matrix4x4().recompose([feng3d.Vector3.random(), feng3d.Vector3.random(), feng3d.Vector3.random()]);
            var mat1 = new feng3d.Matrix4x4().recompose([feng3d.Vector3.random(), feng3d.Vector3.random(), feng3d.Vector3.random()]);
            var mat2 = mat0.append(mat1);
            var vs = mat2.decompose();
            var mat3 = new feng3d.Matrix4x4().recompose(vs);
            // !!!!
            assert.notOk(mat2.equals(mat3));
        });
        QUnit.test("setOrtho， 测试正交矩阵可逆性", function (assert) {
            // 生成随机正交矩阵
            var left = Math.random();
            var right = Math.random() + left;
            var top = Math.random();
            var bottom = Math.random() + top;
            var near = Math.random();
            var far = Math.random() + near;
            //
            var mat = new feng3d.Matrix4x4().setOrtho(left, right, top, bottom, near, far);
            assert.ok(mat.determinant != 0);
            var invertMat = mat.clone().invert();
            var v = feng3d.Vector4.random();
            var v1 = invertMat.transformVector4(mat.transformVector4(v));
            assert.ok(v.equals(v1));
        });
        QUnit.test("setOrtho，测试可视空间的8个顶点是否被正确投影", function (assert) {
            // 生成随机正交矩阵
            var left = Math.random();
            var right = Math.random() + left;
            var top = Math.random();
            var bottom = Math.random() + top;
            var near = Math.random();
            var far = Math.random() + near;
            //
            var mat = new feng3d.Matrix4x4().setOrtho(left, right, top, bottom, near, far);
            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new feng3d.Vector4(left, bottom, near, 1);
            var tv = mat.transformVector4(lbn);
            assert.ok(new feng3d.Vector4(-1, -1, -1, 1).equals(tv));
            var lbf = new feng3d.Vector4(left, bottom, far, 1);
            var tv = mat.transformVector4(lbf);
            assert.ok(new feng3d.Vector4(-1, -1, 1, 1).equals(tv));
            var ltn = new feng3d.Vector4(left, top, near, 1);
            var tv = mat.transformVector4(ltn);
            assert.ok(new feng3d.Vector4(-1, 1, -1, 1).equals(tv));
            var ltf = new feng3d.Vector4(left, top, far, 1);
            var tv = mat.transformVector4(ltf);
            assert.ok(new feng3d.Vector4(-1, 1, 1, 1).equals(tv));
            var rbn = new feng3d.Vector4(right, bottom, near, 1);
            var tv = mat.transformVector4(rbn);
            assert.ok(new feng3d.Vector4(1, -1, -1, 1).equals(tv));
            var rbf = new feng3d.Vector4(right, bottom, far, 1);
            var tv = mat.transformVector4(rbf);
            assert.ok(new feng3d.Vector4(1, -1, 1, 1).equals(tv));
            var rtn = new feng3d.Vector4(right, top, near, 1);
            var tv = mat.transformVector4(rtn);
            assert.ok(new feng3d.Vector4(1, 1, -1, 1).equals(tv));
            var rtf = new feng3d.Vector4(right, top, far, 1);
            var tv = mat.transformVector4(rtf);
            assert.ok(new feng3d.Vector4(1, 1, 1, 1).equals(tv));
        });
        QUnit.test("setPerspectiveFromFOV，测试透视矩阵可逆性", function (assert) {
            var fov = Math.random() * Math.PI * 2;
            var aspect = Math.random();
            var near = Math.random();
            var far = Math.random();
            //
            var mat = new feng3d.Matrix4x4().setPerspectiveFromFOV(fov, aspect, near, far);
            assert.ok(mat.determinant != 0);
            var invertMat = mat.clone().invert();
            var v = feng3d.Vector4.random();
            var v1 = invertMat.transformVector4(mat.transformVector4(v));
            assert.ok(v.equals(v1));
        });
        QUnit.test("setPerspectiveFromFOV，测试可视空间的8个顶点是否被正确投影", function (assert) {
            var fov = Math.random() * 360;
            var aspect = Math.random();
            var near = Math.random();
            var far = Math.random();
            //
            var mat = new feng3d.Matrix4x4().setPerspectiveFromFOV(fov, aspect, near, far);
            var tan = Math.tan(fov * Math.PI / 360);
            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new feng3d.Vector4(-tan * near * aspect, -tan * near, near, 1);
            var tv = mat.transformVector4(lbn);
            assert.equal(tv.w, lbn.z);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(-1, -1, -1, 1).equals(tv));
            var lbf = new feng3d.Vector4(-tan * far * aspect, -tan * far, far, 1);
            var tv = mat.transformVector4(lbf);
            assert.equal(tv.w, lbf.z);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(-1, -1, 1, 1).equals(tv));
            var ltn = new feng3d.Vector4(-tan * near * aspect, tan * near, near, 1);
            var tv = mat.transformVector4(ltn);
            assert.equal(tv.w, ltn.z);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(-1, 1, -1, 1).equals(tv));
            var ltf = new feng3d.Vector4(-tan * far * aspect, tan * far, far, 1);
            var tv = mat.transformVector4(ltf);
            assert.equal(tv.w, ltf.z);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(-1, 1, 1, 1).equals(tv));
            var rbn = new feng3d.Vector4(tan * near * aspect, -tan * near, near, 1);
            var tv = mat.transformVector4(rbn);
            assert.equal(tv.w, rbn.z);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(1, -1, -1, 1).equals(tv));
            var rbf = new feng3d.Vector4(tan * far * aspect, -tan * far, far, 1);
            var tv = mat.transformVector4(rbf);
            assert.equal(tv.w, rbf.z);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(1, -1, 1, 1).equals(tv));
            var rtn = new feng3d.Vector4(tan * near * aspect, tan * near, near, 1);
            var tv = mat.transformVector4(rtn);
            assert.equal(tv.w, rtn.z);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(1, 1, -1, 1).equals(tv));
            var rtf = new feng3d.Vector4(tan * far * aspect, tan * far, far, 1);
            var tv = mat.transformVector4(rtf);
            assert.equal(tv.w, rtf.z);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(1, 1, 1, 1).equals(tv));
        });
        QUnit.test("setPerspective，测试透视矩阵可逆性", function (assert) {
            var left = Math.random();
            var right = Math.random();
            var top = Math.random();
            var bottom = Math.random();
            var near = Math.random();
            var far = Math.random();
            //
            var mat = new feng3d.Matrix4x4().setPerspective(left, right, top, bottom, near, far);
            assert.ok(mat.determinant != 0);
            var invertMat = mat.clone().invert();
            var v = feng3d.Vector4.random();
            var v1 = invertMat.transformVector4(mat.transformVector4(v));
            assert.ok(v.equals(v1));
        });
        QUnit.test("setPerspective,测试可视空间的8个顶点是否被正确投影", function (assert) {
            var left = Math.random();
            var right = Math.random();
            var top = Math.random();
            var bottom = Math.random();
            var near = Math.random();
            var far = Math.random();
            //
            var mat = new feng3d.Matrix4x4().setPerspective(left, right, top, bottom, near, far);
            var tan = (top - bottom) / 2 / near;
            var aspect = (right - left) / (top - bottom);
            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new feng3d.Vector4(-tan * near * aspect, -tan * near, near, 1);
            var tv = mat.transformVector4(lbn);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(-1, -1, -1, 1).equals(tv));
            var lbf = new feng3d.Vector4(-tan * far * aspect, -tan * far, far, 1);
            var tv = mat.transformVector4(lbf);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(-1, -1, 1, 1).equals(tv));
            var ltn = new feng3d.Vector4(-tan * near * aspect, tan * near, near, 1);
            var tv = mat.transformVector4(ltn);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(-1, 1, -1, 1).equals(tv));
            var ltf = new feng3d.Vector4(-tan * far * aspect, tan * far, far, 1);
            var tv = mat.transformVector4(ltf);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(-1, 1, 1, 1).equals(tv));
            var rbn = new feng3d.Vector4(tan * near * aspect, -tan * near, near, 1);
            var tv = mat.transformVector4(rbn);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(1, -1, -1, 1).equals(tv));
            var rbf = new feng3d.Vector4(tan * far * aspect, -tan * far, far, 1);
            var tv = mat.transformVector4(rbf);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(1, -1, 1, 1).equals(tv));
            var rtn = new feng3d.Vector4(tan * near * aspect, tan * near, near, 1);
            var tv = mat.transformVector4(rtn);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(1, 1, -1, 1).equals(tv));
            var rtf = new feng3d.Vector4(tan * far * aspect, tan * far, far, 1);
            var tv = mat.transformVector4(rtf);
            tv.scale(1 / tv.w);
            assert.ok(new feng3d.Vector4(1, 1, 1, 1).equals(tv));
        });
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    QUnit.module("Plane3D", function () {
        QUnit.test("getOrigin", function (assert) {
            var p = feng3d.Plane3D.random();
            assert.ok(p.onWithPoint(p.getOrigin()));
            assert.ok(feng3d.FMath.equals(p.getOrigin().distance(feng3d.Vector3.ZERO), p.distanceWithPoint(feng3d.Vector3.ZERO)));
        });
        QUnit.test("randomPoint", function (assert) {
            var p = feng3d.Plane3D.random();
            assert.ok(p.onWithPoint(p.randomPoint()));
        });
        QUnit.test("distance", function (assert) {
            var plane = new feng3d.Plane3D();
            assert.ok(plane.distanceWithPoint(new feng3d.Vector3()) == plane.d);
            //
            var p = feng3d.Vector3.random().scale(100);
            var n = feng3d.Vector3.random().normalize();
            var length = (0.5 - Math.random()) * 100;
            plane.fromNormalAndPoint(n, p);
            //
            var p0 = n.scaleTo(length).add(p);
            assert.ok(plane.distanceWithPoint(p0).toPrecision(6) == length.toPrecision(6));
        });
        QUnit.test("intersectWithLine3D", function (assert) {
            var line = new feng3d.Line3D().fromPoints(feng3d.Vector3.random(), feng3d.Vector3.random());
            var plane = feng3d.Plane3D.random();
            var p = plane.intersectWithLine3D(line);
            if (p) {
                assert.ok(line.onWithPoint(p));
                assert.ok(plane.onWithPoint(p));
            }
        });
        QUnit.test("intersectWithPlane3D", function (assert) {
            var p0 = feng3d.Vector3.random().scale(100);
            var p1 = feng3d.Vector3.random().scale(100);
            var p2 = feng3d.Vector3.random().scale(100);
            var p3 = feng3d.Vector3.random().scale(100);
            var line = new feng3d.Line3D().fromPoints(p0, p1);
            var plane0 = feng3d.Plane3D.fromPoints(p0, p1, p2);
            var plane1 = feng3d.Plane3D.fromPoints(p0, p1, p3);
            var crossLine = plane0.intersectWithPlane3D(plane1);
            assert.ok(!!crossLine);
            if (crossLine)
                assert.ok(line.equals(crossLine));
        });
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    QUnit.module("Segment3D", function () {
        QUnit.test("onWithPoint", function (assert) {
            var s = feng3d.Segment3D.random();
            for (var i = 0; i < 10; i++) {
                var p = s.getPoint(Math.random());
                assert.ok(s.onWithPoint(p));
            }
        });
        QUnit.test("intersectionWithLine", function (assert) {
            var s = feng3d.Segment3D.random();
            var p = s.getPoint(Math.random());
            var l = feng3d.Line3D.fromPoints(p, feng3d.Vector3.random());
            assert.ok(p.equals(s.intersectionWithLine(l)));
            l.fromPosAndDir(p, s.p1.subTo(s.p0));
            assert.ok(s.equals(s.intersectionWithLine(l)));
        });
        QUnit.test("intersectionWithSegment", function (assert) {
            var s = feng3d.Segment3D.random();
            var p0 = s.getPoint(Math.random());
            var p1 = feng3d.Vector3.random();
            var s0 = feng3d.Segment3D.fromPoints(p0, p1);
            assert.ok(p0.equals(s.intersectionWithSegment(s0)));
            var p2 = s.getPoint(1 + Math.random());
            var s1 = feng3d.Segment3D.fromPoints(p0, p2);
            assert.ok(feng3d.Segment3D.fromPoints(p0, s.p1).equals(s.intersectionWithSegment(s1)));
        });
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    // var oldok = QUnit.assert.ok;
    // QUnit.assert.ok = function (state)
    // {
    //     if (!state)
    //         debugger;
    //     oldok.apply(this, arguments);
    // }
    QUnit.module("Triangle3D", function () {
        QUnit.test("randomPoint", function (assert) {
            var t = feng3d.Triangle3D.random();
            var p = t.randomPoint();
            assert.ok(t.onWithPoint(p));
        });
        QUnit.test("blendWithPoint", function (assert) {
            var t = feng3d.Triangle3D.random();
            var p = t.randomPoint();
            var b = t.blendWithPoint(p);
            assert.ok(t.getPoint(b).equals(p));
        });
        QUnit.test("getCircumcenter", function (assert) {
            var t = feng3d.Triangle3D.random();
            var circumcenter = t.getCircumcenter();
            assert.ok(feng3d.FMath.equals(circumcenter.subTo(t.p0).length, circumcenter.subTo(t.p1).length));
            assert.ok(feng3d.FMath.equals(circumcenter.subTo(t.p0).length, circumcenter.subTo(t.p2).length));
        });
        QUnit.test("getInnercenter", function (assert) {
            var t = feng3d.Triangle3D.random();
            var p = t.getInnercenter();
            var d0 = feng3d.Line3D.fromPoints(t.p0, t.p1).distanceWithPoint(p);
            var d1 = feng3d.Line3D.fromPoints(t.p0, t.p2).distanceWithPoint(p);
            var d2 = feng3d.Line3D.fromPoints(t.p2, t.p1).distanceWithPoint(p);
            assert.ok(t.onWithPoint(p));
            assert.ok(feng3d.FMath.equals(d0, d1));
            assert.ok(feng3d.FMath.equals(d0, d2));
        });
        QUnit.test("getOrthocenter", function (assert) {
            var t = feng3d.Triangle3D.random();
            var p = t.getOrthocenter();
            assert.ok(feng3d.FMath.equals(0, t.p0.subTo(t.p1).dot(p.subTo(t.p2))));
            assert.ok(feng3d.FMath.equals(0, t.p2.subTo(t.p1).dot(p.subTo(t.p0))));
            assert.ok(feng3d.FMath.equals(0, t.p2.subTo(t.p0).dot(p.subTo(t.p1))));
        });
        QUnit.test("decomposeWithPoint", function (assert) {
            //分割后的三角形面积总和与原三角形面积相等
            var t = feng3d.Triangle3D.random();
            var p = t.randomPoint();
            var ts = t.decomposeWithPoint(p);
            assert.ok(ts.length <= 3);
            assert.ok(feng3d.FMath.equals(t.area(), ts.reduce(function (area, t) { return area + t.area(); }, 0), 0.001));
            p = t.getSegments()[0].getPoint(Math.random());
            ts = t.decomposeWithPoint(p);
            assert.ok(ts.length <= 2);
            assert.ok(feng3d.FMath.equals(t.area(), ts.reduce(function (area, t) { return area + t.area(); }, 0), 0.001));
        });
        QUnit.test("intersectionWithLine", function (assert) {
            var t = feng3d.Triangle3D.random();
            var p = t.randomPoint();
            var line = feng3d.Line3D.fromPoints(p, feng3d.Vector3.random());
            assert.ok(p.equals(t.intersectionWithLine(line)));
            var ps = t.getSegments().map(function (s) { return s.getPoint(Math.random()); });
            var l0 = feng3d.Line3D.fromPoints(ps[0], ps[1]);
            assert.ok(feng3d.Segment3D.fromPoints(ps[0], ps[1]).equals(t.intersectionWithLine(l0)));
        });
        QUnit.test("intersectionWithSegment", function (assert) {
            var t = feng3d.Triangle3D.random();
            var s = feng3d.Segment3D.fromPoints(t.p0, t.p1);
            assert.ok(s.equals(t.intersectionWithSegment(s)));
            s = feng3d.Segment3D.fromPoints(t.randomPoint(), t.randomPoint());
            assert.ok(s.equals(t.intersectionWithSegment(s)));
            s = feng3d.Segment3D.fromPoints(t.p0, feng3d.Vector3.random());
            assert.ok(t.p0.equals(t.intersectionWithSegment(s)));
        });
        QUnit.test("decomposeWithSegment", function (assert) {
            var t = feng3d.Triangle3D.random();
            var s = feng3d.Segment3D.fromPoints(t.randomPoint(), t.randomPoint().add(t.getNormal()));
            var ts = t.decomposeWithSegment(s);
            assert.ok(ts.length <= 3);
            assert.ok(feng3d.FMath.equals(ts.reduce(function (v, t) { return v + t.area(); }, 0), t.area(), 0.001));
            s = feng3d.Segment3D.fromPoints(t.randomPoint(), t.randomPoint());
            ts = t.decomposeWithSegment(s);
            assert.ok(ts.length <= 5);
            assert.ok(feng3d.FMath.equals(ts.reduce(function (v, t) { return v + t.area(); }, 0), t.area(), 0.001));
        });
        QUnit.test("decomposeWithLine", function (assert) {
            var t = feng3d.Triangle3D.random();
            var l = feng3d.Line3D.fromPoints(t.randomPoint(), t.randomPoint().add(t.getNormal()));
            var ts = t.decomposeWithLine(l);
            assert.ok(ts.length <= 3);
            assert.ok(feng3d.FMath.equals(ts.reduce(function (v, t) { return v + t.area(); }, 0), t.area(), 0.001));
            l = feng3d.Line3D.fromPoints(t.randomPoint(), t.randomPoint());
            ts = t.decomposeWithLine(l);
            assert.ok(ts.length <= 3);
            assert.ok(feng3d.FMath.equals(ts.reduce(function (v, t) { return v + t.area(); }, 0), t.area(), 0.0001));
        });
        QUnit.test("closestPointWithPoint", function (assert) {
            var t = feng3d.Triangle3D.random();
            var p = t.randomPoint();
            assert.ok(p.equals(t.closestPointWithPoint(p)));
            assert.ok(p.equals(t.closestPointWithPoint(p.addTo(t.getNormal()))));
            p = feng3d.Vector3.random();
            var closest = t.closestPointWithPoint(p);
            assert.ok(t.onWithPoint(closest));
        });
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    QUnit.module("TriangleGeometry", function () {
        QUnit.test("fromBox,getBox", function (assert) {
            var box = feng3d.Box.random();
            var triangleGeometry = feng3d.TriangleGeometry.fromBox(box);
            assert.ok(triangleGeometry.getBox().equals(box));
        });
        QUnit.test("getPoints", function (assert) {
            var box = feng3d.Box.random();
            var triangleGeometry = feng3d.TriangleGeometry.fromBox(box);
            assert.ok(triangleGeometry.getPoints().length == 8);
        });
        QUnit.test("isClosed", function (assert) {
            // var box = Box.random();
            var box = new feng3d.Box(new feng3d.Vector3(), new feng3d.Vector3(1, 1, 1));
            var triangleGeometry = feng3d.TriangleGeometry.fromBox(box);
            assert.ok(triangleGeometry.isClosed());
            triangleGeometry.triangles.pop();
            assert.notOk(triangleGeometry.isClosed());
        });
        QUnit.test("containsPoint", function (assert) {
            var box = feng3d.Box.random();
            var triangleGeometry = feng3d.TriangleGeometry.fromBox(box);
            assert.ok(triangleGeometry.containsPoint(box.randomPoint()));
            assert.ok(box.toPoints().every(function (v) {
                return triangleGeometry.containsPoint(v);
            }));
            assert.ok(!triangleGeometry.containsPoint(box.max.addTo(new feng3d.Vector3(1, 0, 0))));
        });
        QUnit.test("intersectionWithSegment", function (assert) {
            var box = feng3d.Box.random();
            var triangleGeometry = feng3d.TriangleGeometry.fromBox(box);
            var r = triangleGeometry.intersectionWithSegment(feng3d.Segment3D.fromPoints(box.min, box.max));
            assert.ok(r);
            if (r) {
                assert.ok(r.segments.length == 0);
                assert.ok(r.points.length == 2);
                assert.ok(feng3d.Segment3D.fromPoints(r.points[0], r.points[1]).equals(feng3d.Segment3D.fromPoints(box.min, box.max)));
            }
            var p0 = new feng3d.Vector3(box.min.x, box.min.y, feng3d.FMath.lerp(box.min.z, box.max.z, Math.random()));
            var p1 = new feng3d.Vector3(box.min.x, box.min.y, box.max.z + 1);
            var s = feng3d.Segment3D.fromPoints(p0, p1);
            var r1 = triangleGeometry.intersectionWithSegment(s);
            assert.ok(r1);
            if (r1) {
                assert.ok(r1.segments.length == 1);
                assert.ok(r1.points.length == 0);
                assert.ok(feng3d.Segment3D.fromPoints(p0, new feng3d.Vector3(box.min.x, box.min.y, box.max.z)).equals(r1.segments[0]));
            }
        });
    });
})(feng3d || (feng3d = {}));
QUnit.module("Bezier", function () {
    var bezier = feng3d.bezier;
    var equationSolving = feng3d.equationSolving;
    // 允许误差
    var deviation = 0.0000001;
    QUnit.test("bn linear ，使用n次Bézier计算一次Bézier曲线", function (assert) {
        var t = Math.random();
        var ps = [Math.random(), Math.random()];
        var v0 = bezier.linear(t, ps[0], ps[1]);
        var v1 = bezier.bn(t, ps);
        assert.ok(Math.abs(v0 - v1) < deviation);
    });
    QUnit.test("bn quadratic ，使用n次Bézier计算二次Bézier曲线", function (assert) {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random()];
        var v0 = bezier.quadratic(t, ps[0], ps[1], ps[2]);
        var v1 = bezier.bn(t, ps);
        assert.ok(Math.abs(v0 - v1) < deviation);
    });
    QUnit.test("bn cubic ，使用n次Bézier计算三次Bézier曲线", function (assert) {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random(), Math.random()];
        var v0 = bezier.cubic(t, ps[0], ps[1], ps[2], ps[3]);
        var v1 = bezier.bn(t, ps);
        assert.ok(Math.abs(v0 - v1) < deviation);
        var v2 = bezier.getValue(t, ps);
        assert.ok(Math.abs(v0 - v2) < deviation);
    });
    QUnit.test("bnD linearDerivative ，使用n次Bézier导数计算一次Bézier曲线导数", function (assert) {
        var t = Math.random();
        var ps = [Math.random(), Math.random()];
        // 导数
        var d0 = bezier.linearDerivative(t, ps[0], ps[1]);
        var d1 = bezier.bnDerivative(t, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });
    QUnit.test("bnD quadraticDerivative ，使用n次Bézier导数计算二次Bézier曲线导数", function (assert) {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random()];
        // 导数
        var d0 = bezier.quadraticDerivative(t, ps[0], ps[1], ps[2]);
        var d1 = bezier.bnDerivative(t, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });
    QUnit.test("bnD cubicDerivative ，使用n次Bézier导数计算三次Bézier曲线导数", function (assert) {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random(), Math.random()];
        // 导数
        var d0 = bezier.cubicDerivative(t, ps[0], ps[1], ps[2], ps[3]);
        var d1 = bezier.bnDerivative(t, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });
    QUnit.test("bnSD linearSecondDerivative ，使用n次Bézier二阶导数计算一次Bézier曲线二阶导数", function (assert) {
        var t = Math.random();
        var ps = [Math.random(), Math.random()];
        // 导数
        var d0 = bezier.linearSecondDerivative(t, ps[0], ps[1]);
        var d1 = bezier.bnSecondDerivative(t, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });
    QUnit.test("bnSD quadraticSecondDerivative ，使用n次Bézier二阶导数计算二次Bézier曲线二阶导数", function (assert) {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random()];
        // 导数
        var d0 = bezier.quadraticSecondDerivative(t, ps[0], ps[1], ps[2]);
        var d1 = bezier.bnSecondDerivative(t, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });
    QUnit.test("bnSD cubicSecondDerivative ，使用n次Bézier二阶导数计算三次Bézier曲线二阶导数", function (assert) {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random(), Math.random()];
        // 导数
        var d0 = bezier.cubicSecondDerivative(t, ps[0], ps[1], ps[2], ps[3]);
        var d1 = bezier.bnSecondDerivative(t, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });
    QUnit.test("bnND linearDerivative ，使用n次BézierN阶导数计算一次Bézier曲线导数", function (assert) {
        var t = Math.random();
        var ps = [Math.random(), Math.random()];
        // 导数
        var d0 = bezier.linearDerivative(t, ps[0], ps[1]);
        var d1 = bezier.bnND(t, 1, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });
    QUnit.test("bnND quadraticDerivative ，使用n次BézierN阶导数计算二次Bézier曲线导数", function (assert) {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random()];
        // 导数
        var d0 = bezier.quadraticDerivative(t, ps[0], ps[1], ps[2]);
        var d1 = bezier.bnND(t, 1, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });
    QUnit.test("bnND cubicDerivative ，使用n次BézierN阶导数计算三次Bézier曲线导数", function (assert) {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random(), Math.random()];
        // 导数
        var d0 = bezier.cubicDerivative(t, ps[0], ps[1], ps[2], ps[3]);
        var d1 = bezier.bnND(t, 1, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });
    QUnit.test("bnND linearSecondDerivative ，使用n次BézierN阶导数计算一次Bézier曲线二阶导数", function (assert) {
        var t = Math.random();
        var ps = [Math.random(), Math.random()];
        // 导数
        var d0 = bezier.linearSecondDerivative(t, ps[0], ps[1]);
        var d1 = bezier.bnND(t, 2, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });
    QUnit.test("bnND quadraticSecondDerivative ，使用n次BézierN阶导数计算二次Bézier曲线二阶导数", function (assert) {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random()];
        // 导数
        var d0 = bezier.quadraticSecondDerivative(t, ps[0], ps[1], ps[2]);
        var d1 = bezier.bnND(t, 2, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });
    QUnit.test("bnND cubicSecondDerivative ，使用n次BézierN阶导数计算三次Bézier曲线二阶导数", function (assert) {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random(), Math.random()];
        // 导数
        var d0 = bezier.cubicSecondDerivative(t, ps[0], ps[1], ps[2], ps[3]);
        var d1 = bezier.bnND(t, 2, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });
    QUnit.test("getExtremums ，查找区间内极值列表 ", function (assert) {
        for (var j = 0; j < 10; j++) {
            var ps = [Math.random(), Math.random(), Math.random(), Math.random()];
            // 测试高次Bézier曲线
            var n = Math.floor(Math.random() * 5);
            for (var i = 0; i < n; i++) {
                ps.push(Math.random());
            }
            // 查找区间内极值所在插值度列表
            var extremums = bezier.getExtremums(ps, 20, deviation);
            var ts = extremums.ts;
            var vs = extremums.vs;
            for (var i = 0, n_1 = ts.length; i < n_1; i++) {
                assert.ok(0 <= ts[i] && ts[i] <= 1, "\u6781\u503C\u4F4D\u7F6E " + ts[i] + " \u5FC5\u987B\u5728\u533A\u57DF [0,1] \u5185");
                // 极值
                var extremum = vs[i];
                // 极值前面的数据
                var prex = ts[i] - 0.001;
                if (0 < i)
                    prex = bezier.linear(0.999, ts[i - 1], ts[i]);
                var prev = bezier.getValue(prex, ps);
                // 极值后面面的数据
                var nextx = ts[i] + 0.001;
                if (i < n_1 - 1)
                    nextx = bezier.linear(0.001, ts[i], ts[i + 1]);
                var nextv = bezier.getValue(nextx, ps);
                // 斜率
                var derivative = bezier.getDerivative(ts[i], ps);
                assert.ok(Math.abs(derivative) < deviation, ps.length - 1 + "\u6B21B\u00E9zier\u66F2\u7EBF \u7B2C" + i + "\u4E2A\u89E3 \u6781\u503C\u4F4D\u7F6E\uFF1A" + ts[i] + " \u659C\u7387\uFF1A " + derivative + " \n \u524D\u9762\u503C\uFF1A " + prev + " \n \u6781\u503C\uFF1A " + extremum + " \n \u540E\u9762\u7684\u503C " + nextv);
            }
        }
    });
    QUnit.test("getTFromValue ，获取目标值所在的插值度T，返回区间内所有解", function (assert) {
        for (var j = 0; j < 10; j++) {
            var ps = [Math.random(), Math.random(), Math.random(), Math.random()];
            // 测试高次Bézier曲线
            var n = Math.floor(Math.random() * 5);
            for (var i = 0; i < n; i++) {
                ps.push(Math.random());
            }
            // 为了确保有解，去平均值
            var targetV = ps.reduce(function (pre, item) { return pre + item; }, 0) / ps.length;
            var ts = bezier.getTFromValue(targetV, ps, 10, deviation);
            if (ts.length > 0) {
                for (var i = 0; i < ts.length; i++) {
                    var tv = bezier.getValue(ts[i], ps);
                    assert.ok(Math.abs(tv - targetV) < deviation, ps.length - 1 + "\u6B21B\u00E9zier\u66F2\u7EBF \u7B2C" + i + "\u4E2A\u89E3 \u76EE\u6807\u503C\uFF1A" + targetV + " \u67E5\u627E\u5230\u7684\u503C\uFF1A" + tv + " \u67E5\u627E\u5230\u7684\u4F4D\u7F6E\uFF1A" + ts[i]);
                    assert.ok(0 <= ts[i] && ts[i] <= 1, ts[i] + " \u89E3\u5FC5\u987B\u5728 [0,1] \u533A\u95F4\u5185 ");
                }
            }
        }
    });
    QUnit.test("getDerivative ，获取曲线在指定插值度上的导数(斜率)", function (assert) {
        var num = 1000;
        for (var j = 0; j < num; j++) {
            var ps = [Math.random(), Math.random(), Math.random(), Math.random()];
            // 测试高次Bézier曲线
            // var n = Math.floor(Math.random() * 5);
            var n = 5;
            for (var i = 0; i < n; i++) {
                ps.push(Math.random());
            }
            var f = function (x) { return bezier.getValue(x, ps); };
            var f1 = equationSolving.getDerivative(f);
            //
            var t = Math.random();
            var td = bezier.getDerivative(t, ps);
            var td1 = f1(t);
            // 此处比较值不能使用太大
            assert.ok(Math.abs(td - td1) < 0.000001);
        }
    });
});
QUnit.module("EquationSolving", function () {
    var bezier = feng3d.bezier;
    var equationSolving = feng3d.equationSolving;
    var HighFunction = feng3d.HighFunction;
    // 允许误差
    var precision = 0.0000001;
    var testtimes = 100;
    QUnit.test("binary 二分法 求解 f(x) == 0 ", function (assert) {
        for (var i = 0; i < testtimes; i++) {
            var as = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
            var hf = new HighFunction(as);
            var a = Math.random();
            var b = a + Math.random();
            var fa = hf.getValue(a);
            var fb = hf.getValue(b);
            var f = function (x) { return hf.getValue(x) - (fa + fb) / 2; };
            // 求解 ff(x) == 0
            var x = equationSolving.binary(f, a, b, precision);
            var fx = f(x);
            assert.ok(fx < precision);
        }
    });
    QUnit.test("line 连线法 求解 f(x) == 0 ", function (assert) {
        for (var i = 0; i < testtimes; i++) {
            var as = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
            var hf = new HighFunction(as);
            var a = Math.random();
            var b = a + Math.random();
            var fa = hf.getValue(a);
            var fb = hf.getValue(b);
            var f = function (x) { return hf.getValue(x) - (fa + fb) / 2; };
            // 求解 ff(x) == 0
            var x = equationSolving.line(f, a, b, precision);
            var fx = f(x);
            assert.ok(fx < precision);
        }
    });
    QUnit.test("tangent 切线法 求解 f(x) == 0 ", function (assert) {
        for (var i = 0; i < testtimes; i++) {
            var as = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
            var hf = new HighFunction(as);
            var a = Math.random();
            var b = a + Math.random();
            var fa = hf.getValue(a);
            var fb = hf.getValue(b);
            var f = function (x) { return hf.getValue(x) - (fa + fb) / 2; };
            // 导函数
            var f1 = equationSolving.getDerivative(f);
            // 二阶导函数
            var f2 = equationSolving.getDerivative(f1);
            // 求解 ff(x) == 0
            var x = equationSolving.tangent(f, f1, f2, a, b, precision, function (err) {
                assert.ok(true, err.message);
            });
            if (x < a || x > b) {
                assert.ok(true, "\u89E3 " + x + " \u8D85\u51FA\u6C42\u89E3\u533A\u95F4 [" + a + ", " + b + "]");
            }
            else {
                if (x != undefined) {
                    var fx = f(x);
                    assert.ok(fx < precision);
                }
            }
        }
    });
    QUnit.test("secant 割线法（弦截法） 求解 f(x) == 0 ", function (assert) {
        for (var i = 0; i < testtimes; i++) {
            var as = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
            var hf = new HighFunction(as);
            var a = Math.random();
            var b = a + Math.random();
            var fa = hf.getValue(a);
            var fb = hf.getValue(b);
            var f = function (x) { return hf.getValue(x) - (fa + fb) / 2; };
            // 求解 ff(x) == 0
            var x = equationSolving.secant(f, a, b, precision, function (err) {
                assert.ok(true, err.message);
            });
            if (x < a || x > b) {
                assert.ok(true, "\u89E3 " + x + " \u8D85\u51FA\u6C42\u89E3\u533A\u95F4 [" + a + ", " + b + "]");
            }
            else {
                if (x != undefined) {
                    var fx = f(x);
                    assert.ok(fx < precision);
                }
            }
        }
    });
});
QUnit.module("HighFunction", function () {
    var HighFunction = feng3d.HighFunction;
    // 允许误差
    var deviation = 0.0000001;
    QUnit.test("getValue 获取函数 f(x) 的值 ", function (assert) {
        for (var i = 0; i < 100; i++) {
            var as = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
            var f = function (x) {
                return as[0] * x * x * x * x * x +
                    as[1] * x * x * x * x +
                    as[2] * x * x * x +
                    as[3] * x * x +
                    as[4] * x +
                    as[5];
            };
            var hf = new HighFunction(as);
            var x = Math.random();
            var fx = f(x);
            var hfx = hf.getValue(x);
            assert.ok(Math.abs(fx - hfx) < deviation);
        }
    });
});
QUnit.module("PathUtils", function () {
    QUnit.test("getName", function (assert) {
        assert.ok(feng3d.pathUtils.getNameWithExtension("a") == "a");
        assert.ok(feng3d.pathUtils.getNameWithExtension("a.txt") == "a.txt");
        assert.ok(feng3d.pathUtils.getNameWithExtension("a/") == "a");
        assert.ok(feng3d.pathUtils.getNameWithExtension("a.b/") == "a.b");
    });
    QUnit.test("getExtension", function (assert) {
        assert.ok(feng3d.pathUtils.getExtension("a.txt") == "txt");
        assert.ok(feng3d.pathUtils.getExtension("a") == "");
        assert.ok(feng3d.pathUtils.getExtension("a.b/b") == "");
        assert.ok(feng3d.pathUtils.getExtension("a.b/b.txt") == "txt");
        assert.ok(feng3d.pathUtils.getExtension("a.b/.txt") == "txt");
    });
    QUnit.test("getParentPath", function (assert) {
        assert.ok(feng3d.pathUtils.getParentPath("a/a.txt") == "a/");
        assert.ok(feng3d.pathUtils.getParentPath("a/b") == "a/");
        assert.ok(feng3d.pathUtils.getParentPath("a/b/") == "a/");
    });
    QUnit.test("isDirectory", function (assert) {
        assert.ok(feng3d.pathUtils.isDirectory("a/a.txt") == false);
        assert.ok(feng3d.pathUtils.isDirectory("a/b") == false);
        assert.ok(feng3d.pathUtils.isDirectory("a/b/") == true);
    });
    QUnit.test("getDirDepth", function (assert) {
        assert.ok(feng3d.pathUtils.getDirDepth("a") == 0);
        assert.ok(feng3d.pathUtils.getDirDepth("a/") == 0);
        assert.ok(feng3d.pathUtils.getDirDepth("a/a.txt") == 1);
        assert.ok(feng3d.pathUtils.getDirDepth("a/b") == 1);
        assert.ok(feng3d.pathUtils.getDirDepth("a/b/") == 1);
        assert.ok(feng3d.pathUtils.getDirDepth("a/b/a") == 2);
        assert.ok(feng3d.pathUtils.getDirDepth("a/b/a/") == 2);
    });
});
QUnit.module("watcher", function () {
    QUnit.test("watch Object", function (assert) {
        var o = { a: 1 };
        var out = "";
        var f = function (h, p, o) { out += "f"; };
        var f1 = function (h, p, o) { out += "f1"; };
        feng3d.watcher.watch(o, "a", f);
        feng3d.watcher.watch(o, "a", f1);
        o.a = 2;
        feng3d.watcher.unwatch(o, "a", f);
        o.a = 3;
        assert.ok(out == "ff1f1", out);
    });
    QUnit.test("watch custom A", function (assert) {
        var A = /** @class */ (function () {
            function A() {
                this._a = 1;
            }
            Object.defineProperty(A.prototype, "a", {
                get: function () {
                    return this._a;
                },
                set: function (v) {
                    this._a = v;
                    num = v;
                },
                enumerable: true,
                configurable: true
            });
            return A;
        }());
        var o = new A();
        var num = 0;
        var out = "";
        var f = function (h, p, o) { out += "f"; };
        var f1 = function (h, p, o) { out += "f1"; };
        feng3d.watcher.watch(o, "a", f);
        feng3d.watcher.watch(o, "a", f1);
        o.a = 2;
        assert.ok(num == 2);
        feng3d.watcher.unwatch(o, "a", f);
        o.a = 3;
        assert.ok(out == "ff1f1", out);
        assert.ok(num == 3);
    });
    QUnit.test("watch Object 性能", function (assert) {
        var o = { a: 1 };
        var num = 10000000;
        var out = "";
        var f = function () { out += "f"; };
        var s = Date.now();
        for (var i = 0; i < num; i++) {
            o.a = i;
        }
        var t1 = Date.now() - s;
        out = "";
        feng3d.watcher.watch(o, "a", f);
        o.a = 2;
        feng3d.watcher.unwatch(o, "a", f);
        o.a = 3;
        var s = Date.now();
        for (var i = 0; i < num; i++) {
            o.a = i;
        }
        var t2 = Date.now() - s;
        assert.ok(true, t1 + "->" + t2 + " watch\u4E0Eunwatch\u64CD\u4F5C\u540E\u6027\u80FD 1->" + t1 / t2);
    });
    QUnit.test("watch Vector3 性能", function (assert) {
        var o = new feng3d.Vector3();
        var num = 10000000;
        var out = "";
        var f = function () { out += "f"; };
        var s = Date.now();
        for (var i = 0; i < num; i++) {
            o.x = i;
        }
        var t1 = Date.now() - s;
        out = "";
        feng3d.watcher.watch(o, "x", f);
        o.x = 2;
        feng3d.watcher.unwatch(o, "x", f);
        o.x = 3;
        var s = Date.now();
        for (var i = 0; i < num; i++) {
            o.x = i;
        }
        var t2 = Date.now() - s;
        assert.ok(true, t1 + "->" + t2 + " watch\u4E0Eunwatch\u64CD\u4F5C\u540E\u6027\u80FD 1->" + t1 / t2);
    });
    QUnit.test("watchchain Object", function (assert) {
        var o = { a: { b: { c: 1 } } };
        var out = "";
        var f = function (h, p, o) { out += "f"; };
        var f1 = function (h, p, o) { out += "f1"; };
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
        o.a = null;
        o.a = { b: { c: 1 } };
        o.a.b.c = 5;
        assert.ok(out == "fff", out);
    });
});
//# sourceMappingURL=tests.js.map