"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
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
QUnit.module("Array", function () {
    QUnit.test("unique", function (assert) {
        var n = 100;
        var arr = [];
        while (n-- > 0) {
            arr.push(Math.floor(Math.random() * 10));
        }
        arr.unique();
        assert.ok(arr.unique());
        var arr0 = [];
        while (n-- > 0) {
            arr0.push({ n: Math.floor(Math.random() * 10) });
        }
        arr0.unique(function (a, b) { return a.n == b.n; });
        assert.ok(arr0.unique(function (a, b) { return a.n == b.n; }));
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

(function universalModuleDefinition(root, factory)
{
    if (root && root["feng3d"])
    {
        return;
    }
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define([], factory);
    else if (typeof exports === 'object')
        exports["feng3d"] = factory();
    else
    {
        root["feng3d"] = factory();
    }
})(this, function ()
{
    return feng3d;
});