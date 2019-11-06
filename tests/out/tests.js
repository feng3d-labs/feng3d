var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
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
    var NUM = 10;
    QUnit.module("OrthographicLens", function () {
        QUnit.test("project", function (assert) {
            // 生成随机正交矩阵
            var size = Math.random();
            var near = Math.random();
            var far = Math.random() + near;
            var orthographicLens = new feng3d.OrthographicLens(size, 1, near, far);
            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new feng3d.Vector3(-size, -size, near);
            var tv = orthographicLens.project(lbn);
            assert.ok(new feng3d.Vector3(-1, -1, -1).equals(tv));
            var lbf = new feng3d.Vector3(-size, -size, far);
            var tv = orthographicLens.project(lbf);
            assert.ok(new feng3d.Vector3(-1, -1, 1).equals(tv));
            var ltn = new feng3d.Vector3(-size, size, near);
            var tv = orthographicLens.project(ltn);
            assert.ok(new feng3d.Vector3(-1, 1, -1).equals(tv));
            var ltf = new feng3d.Vector3(-size, size, far);
            var tv = orthographicLens.project(ltf);
            assert.ok(new feng3d.Vector3(-1, 1, 1).equals(tv));
            var rbn = new feng3d.Vector3(size, -size, near);
            var tv = orthographicLens.project(rbn);
            assert.ok(new feng3d.Vector3(1, -1, -1).equals(tv));
            var rbf = new feng3d.Vector3(size, -size, far);
            var tv = orthographicLens.project(rbf);
            assert.ok(new feng3d.Vector3(1, -1, 1).equals(tv));
            var rtn = new feng3d.Vector3(size, size, near);
            var tv = orthographicLens.project(rtn);
            assert.ok(new feng3d.Vector3(1, 1, -1).equals(tv));
            var rtf = new feng3d.Vector3(size, size, far);
            var tv = orthographicLens.project(rtf);
            assert.ok(new feng3d.Vector3(1, 1, 1).equals(tv));
        });
        QUnit.test("unproject", function (assert) {
            // 生成随机正交矩阵
            var size = Math.random();
            var near = Math.random();
            var far = Math.random() + near;
            var orthographicLens = new feng3d.OrthographicLens(size, 1, near, far);
            // 测试可视空间的8个顶点是否被正确投影
            var lbn = new feng3d.Vector3(-1, -1, -1);
            var tv = orthographicLens.unproject(lbn);
            assert.ok(new feng3d.Vector3(-size, -size, near).equals(tv));
            var lbf = new feng3d.Vector3(-1, -1, 1);
            var tv = orthographicLens.unproject(lbf);
            assert.ok(new feng3d.Vector3(-size, -size, far).equals(tv));
            var ltn = new feng3d.Vector3(-1, 1, -1);
            var tv = orthographicLens.unproject(ltn);
            assert.ok(new feng3d.Vector3(-size, size, near).equals(tv));
            var ltf = new feng3d.Vector3(-1, 1, 1);
            var tv = orthographicLens.unproject(ltf);
            assert.ok(new feng3d.Vector3(-size, size, far).equals(tv));
            var rbn = new feng3d.Vector3(1, -1, -1);
            var tv = orthographicLens.unproject(rbn);
            assert.ok(new feng3d.Vector3(size, -size, near).equals(tv));
            var rbf = new feng3d.Vector3(1, -1, 1);
            var tv = orthographicLens.unproject(rbf);
            assert.ok(new feng3d.Vector3(size, -size, far).equals(tv));
            var rtn = new feng3d.Vector3(1, 1, -1);
            var tv = orthographicLens.unproject(rtn);
            assert.ok(new feng3d.Vector3(size, size, near).equals(tv));
            var rtf = new feng3d.Vector3(1, 1, 1);
            var tv = orthographicLens.unproject(rtf);
            assert.ok(new feng3d.Vector3(size, size, far).equals(tv));
        });
        QUnit.test("unprojectRay", function (assert) {
            var size = Math.random();
            var near = Math.random();
            var far = Math.random() + near;
            var orthographicLens = new feng3d.OrthographicLens(size, 1, near, far);
            var x = Math.random();
            var y = Math.random();
            for (var i = 0; i < NUM; i++) {
                var ray = orthographicLens.unprojectRay(x, y);
                var p = ray.getPointWithZ(Math.lerp(near, far, Math.random()));
                var pp = orthographicLens.project(p);
                assert.ok(Math.equals(x, pp.x));
                assert.ok(Math.equals(y, pp.y));
            }
        });
        QUnit.test("unprojectWithDepth", function (assert) {
            var size = Math.random();
            var near = Math.random();
            var far = Math.random() + near;
            var orthographicLens = new feng3d.OrthographicLens(size, 1, near, far);
            var x = Math.random();
            var y = Math.random();
            for (var i = 0; i < NUM; i++) {
                var sZ = Math.lerp(near, far, Math.random());
                var p = orthographicLens.unprojectWithDepth(x, y, sZ);
                assert.ok(Math.equals(sZ, p.z));
                var pp = orthographicLens.project(p);
                assert.ok(Math.equals(x, pp.x));
                assert.ok(Math.equals(y, pp.y));
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
                var p = ray.getPointWithZ(Math.lerp(near, far, Math.random()));
                var pp = perspectiveLens.project(p);
                assert.ok(Math.equals(x, pp.x));
                assert.ok(Math.equals(y, pp.y));
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
                var sZ = Math.lerp(near, far, Math.random());
                var p = perspectiveLens.unprojectWithDepth(x, y, sZ);
                assert.ok(Math.equals(sZ, p.z));
                var pp = perspectiveLens.project(p);
                assert.ok(Math.equals(x, pp.x));
                assert.ok(Math.equals(y, pp.y));
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
            var c = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "t" }).addComponent(feng3d.Camera);
            var e = c.dispatch("lensChanged");
            c.dispatchEvent(e);
            assert.ok(e.targets[0] == c);
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
            var g = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "t" });
            var e = g.dispatch("click");
            g.dispatchEvent(e);
            assert.ok(e.targets[0] == g);
            g.components.forEach(function (element) {
                assert.ok(e.targets.indexOf(element) != -1);
            });
        });
    });
})(feng3d || (feng3d = {}));
QUnit.module('AvlTree', function () {
    QUnit.test('should do simple left-left rotation', function (assert) {
        var tree = new feng3d.AvlTree();
        tree.insert(4);
        tree.insert(3);
        tree.insert(2);
        assert.deepEqual(tree.toString(), '2,3,4');
        assert.deepEqual(tree.root.value, 3);
        assert.deepEqual(tree.root.height, 1);
        tree.insert(1);
        assert.deepEqual(tree.toString(), '1,2,3,4');
        assert.deepEqual(tree.root.value, 3);
        assert.deepEqual(tree.root.height, 2);
        tree.insert(0);
        assert.deepEqual(tree.toString(), '0,1,2,3,4');
        assert.deepEqual(tree.root.value, 3);
        assert.deepEqual(tree.root.left.value, 1);
        assert.deepEqual(tree.root.height, 2);
    });
    QUnit.test('should do complex left-left rotation', function (assert) {
        var tree = new feng3d.AvlTree();
        tree.insert(30);
        tree.insert(20);
        tree.insert(40);
        tree.insert(10);
        assert.deepEqual(tree.root.value, 30);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '10,20,30,40');
        tree.insert(25);
        assert.deepEqual(tree.root.value, 30);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '10,20,25,30,40');
        tree.insert(5);
        assert.deepEqual(tree.root.value, 20);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '5,10,20,25,30,40');
    });
    QUnit.test('should do simple right-right rotation', function (assert) {
        var tree = new feng3d.AvlTree();
        tree.insert(2);
        tree.insert(3);
        tree.insert(4);
        assert.deepEqual(tree.toString(), '2,3,4');
        assert.deepEqual(tree.root.value, 3);
        assert.deepEqual(tree.root.height, 1);
        tree.insert(5);
        assert.deepEqual(tree.toString(), '2,3,4,5');
        assert.deepEqual(tree.root.value, 3);
        assert.deepEqual(tree.root.height, 2);
        tree.insert(6);
        assert.deepEqual(tree.toString(), '2,3,4,5,6');
        assert.deepEqual(tree.root.value, 3);
        assert.deepEqual(tree.root.right.value, 5);
        assert.deepEqual(tree.root.height, 2);
    });
    QUnit.test('should do complex right-right rotation', function (assert) {
        var tree = new feng3d.AvlTree();
        tree.insert(30);
        tree.insert(20);
        tree.insert(40);
        tree.insert(50);
        assert.deepEqual(tree.root.value, 30);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '20,30,40,50');
        tree.insert(35);
        assert.deepEqual(tree.root.value, 30);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '20,30,35,40,50');
        tree.insert(55);
        assert.deepEqual(tree.root.value, 40);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '20,30,35,40,50,55');
    });
    QUnit.test('should do left-right rotation', function (assert) {
        var tree = new feng3d.AvlTree();
        tree.insert(30);
        tree.insert(20);
        tree.insert(25);
        assert.deepEqual(tree.root.height, 1);
        assert.deepEqual(tree.root.value, 25);
        assert.deepEqual(tree.toString(), '20,25,30');
    });
    QUnit.test('should do right-left rotation', function (assert) {
        var tree = new feng3d.AvlTree();
        tree.insert(30);
        tree.insert(40);
        tree.insert(35);
        assert.deepEqual(tree.root.height, 1);
        assert.deepEqual(tree.root.value, 35);
        assert.deepEqual(tree.toString(), '30,35,40');
    });
    QUnit.test('should create balanced tree: case #1', function (assert) {
        // @see: https://www.youtube.com/watch?v=rbg7Qf8GkQ4&t=839s
        var tree = new feng3d.AvlTree();
        tree.insert(1);
        tree.insert(2);
        tree.insert(3);
        assert.deepEqual(tree.root.value, 2);
        assert.deepEqual(tree.root.height, 1);
        assert.deepEqual(tree.toString(), '1,2,3');
        tree.insert(6);
        assert.deepEqual(tree.root.value, 2);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '1,2,3,6');
        tree.insert(15);
        assert.deepEqual(tree.root.value, 2);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '1,2,3,6,15');
        tree.insert(-2);
        assert.deepEqual(tree.root.value, 2);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '-2,1,2,3,6,15');
        tree.insert(-5);
        assert.deepEqual(tree.root.value, 2);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '-5,-2,1,2,3,6,15');
        tree.insert(-8);
        assert.deepEqual(tree.root.value, 2);
        assert.deepEqual(tree.root.height, 3);
        assert.deepEqual(tree.toString(), '-8,-5,-2,1,2,3,6,15');
    });
    QUnit.test('should create balanced tree: case #2', function (assert) {
        // @see https://www.youtube.com/watch?v=7m94k2Qhg68
        var tree = new feng3d.AvlTree();
        tree.insert(43);
        tree.insert(18);
        tree.insert(22);
        tree.insert(9);
        tree.insert(21);
        tree.insert(6);
        assert.deepEqual(tree.root.value, 18);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '6,9,18,21,22,43');
        tree.insert(8);
        assert.deepEqual(tree.root.value, 18);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.toString(), '6,8,9,18,21,22,43');
    });
    QUnit.test('should do left right rotation and keeping left right node safe', function (assert) {
        var tree = new feng3d.AvlTree();
        tree.insert(30);
        tree.insert(15);
        tree.insert(40);
        tree.insert(10);
        tree.insert(18);
        tree.insert(35);
        tree.insert(45);
        tree.insert(5);
        tree.insert(12);
        assert.deepEqual(tree.toString(), '5,10,12,15,18,30,35,40,45');
        assert.deepEqual(tree.root.height, 3);
        tree.insert(11);
        assert.deepEqual(tree.toString(), '5,10,11,12,15,18,30,35,40,45');
        assert.deepEqual(tree.root.height, 3);
    });
    QUnit.test('should do left right rotation and keeping left right node safe', function (assert) {
        var tree = new feng3d.AvlTree();
        tree.insert(30);
        tree.insert(15);
        tree.insert(40);
        tree.insert(10);
        tree.insert(18);
        tree.insert(35);
        tree.insert(45);
        tree.insert(42);
        tree.insert(47);
        assert.deepEqual(tree.toString(), '10,15,18,30,35,40,42,45,47');
        assert.deepEqual(tree.root.height, 3);
        tree.insert(43);
        assert.deepEqual(tree.toString(), '10,15,18,30,35,40,42,43,45,47');
        assert.deepEqual(tree.root.height, 3);
    });
    QUnit.test('should remove values from the tree with right-right rotation', function (assert) {
        var tree = new feng3d.AvlTree();
        tree.insert(10);
        tree.insert(20);
        tree.insert(30);
        tree.insert(40);
        assert.deepEqual(tree.toString(), '10,20,30,40');
        tree.remove(10);
        assert.deepEqual(tree.toString(), '20,30,40');
        assert.deepEqual(tree.root.value, 30);
        assert.deepEqual(tree.root.left.value, 20);
        assert.deepEqual(tree.root.right.value, 40);
        assert.deepEqual(tree.root.balanceFactor, 0);
    });
    QUnit.test('should remove values from the tree with left-left rotation', function (assert) {
        var tree = new feng3d.AvlTree();
        tree.insert(10);
        tree.insert(20);
        tree.insert(30);
        tree.insert(5);
        assert.deepEqual(tree.toString(), '5,10,20,30');
        tree.remove(30);
        assert.deepEqual(tree.toString(), '5,10,20');
        assert.deepEqual(tree.root.value, 10);
        assert.deepEqual(tree.root.left.value, 5);
        assert.deepEqual(tree.root.right.value, 20);
        assert.deepEqual(tree.root.balanceFactor, 0);
    });
    QUnit.test('should keep balance after removal', function (assert) {
        var tree = new feng3d.AvlTree();
        tree.insert(1);
        tree.insert(2);
        tree.insert(3);
        tree.insert(4);
        tree.insert(5);
        tree.insert(6);
        tree.insert(7);
        tree.insert(8);
        tree.insert(9);
        assert.deepEqual(tree.toString(), '1,2,3,4,5,6,7,8,9');
        assert.deepEqual(tree.root.value, 4);
        assert.deepEqual(tree.root.height, 3);
        assert.deepEqual(tree.root.balanceFactor, -1);
        tree.remove(8);
        assert.deepEqual(tree.root.value, 4);
        assert.deepEqual(tree.root.balanceFactor, -1);
        tree.remove(9);
        assert.deepEqual(tree.contains(8), false);
        assert.deepEqual(tree.contains(9), false);
        assert.deepEqual(tree.toString(), '1,2,3,4,5,6,7');
        assert.deepEqual(tree.root.value, 4);
        assert.deepEqual(tree.root.height, 2);
        assert.deepEqual(tree.root.balanceFactor, 0);
    });
});
QUnit.module('BinarySearchTree', function () {
    QUnit.test('should create binary search tree', function (assert) {
        var bst = new feng3d.BinarySearchTree();
        assert.deepEqual(bst.root.value, null);
        assert.deepEqual(bst.root.left, null);
        assert.deepEqual(bst.root.right, null);
    });
    QUnit.test('should insert values', function (assert) {
        var bst = new feng3d.BinarySearchTree();
        var insertedNode1 = bst.insert(10);
        var insertedNode2 = bst.insert(20);
        bst.insert(5);
        assert.deepEqual(bst.toString(), '5,10,20');
        assert.deepEqual(insertedNode1.value, 10);
        assert.deepEqual(insertedNode2.value, 20);
    });
    QUnit.test('should check if value exists', function (assert) {
        var bst = new feng3d.BinarySearchTree();
        bst.insert(10);
        bst.insert(20);
        bst.insert(5);
        assert.deepEqual(bst.contains(20), true);
        assert.deepEqual(bst.contains(40), false);
    });
    QUnit.test('should remove nodes', function (assert) {
        var bst = new feng3d.BinarySearchTree();
        bst.insert(10);
        bst.insert(20);
        bst.insert(5);
        assert.deepEqual(bst.toString(), '5,10,20');
        var removed1 = bst.remove(5);
        assert.deepEqual(bst.toString(), '10,20');
        assert.deepEqual(removed1, true);
        var removed2 = bst.remove(20);
        assert.deepEqual(bst.toString(), '10');
        assert.deepEqual(removed2, true);
    });
    QUnit.test('should insert object values', function (assert) {
        var nodeValueCompareFunction = function (a, b) {
            var normalizedA = a || { value: null };
            var normalizedB = b || { value: null };
            if (normalizedA.value === normalizedB.value) {
                return 0;
            }
            return normalizedA.value < normalizedB.value ? -1 : 1;
        };
        var obj1 = { key: 'obj1', value: 1, toString: function () { return 'obj1'; } };
        var obj2 = { key: 'obj2', value: 2, toString: function () { return 'obj2'; } };
        var obj3 = { key: 'obj3', value: 3, toString: function () { return 'obj3'; } };
        var bst = new feng3d.BinarySearchTree(nodeValueCompareFunction);
        bst.insert(obj2);
        bst.insert(obj3);
        bst.insert(obj1);
        assert.deepEqual(bst.toString(), 'obj1,obj2,obj3');
    });
    QUnit.test('should be traversed to sorted array', function (assert) {
        var bst = new feng3d.BinarySearchTree();
        bst.insert(10);
        bst.insert(-10);
        bst.insert(20);
        bst.insert(-20);
        bst.insert(25);
        bst.insert(6);
        assert.deepEqual(bst.toString(), '-20,-10,6,10,20,25');
        assert.deepEqual(bst.root.height, 2);
        bst.insert(4);
        assert.deepEqual(bst.toString(), '-20,-10,4,6,10,20,25');
        assert.deepEqual(bst.root.height, 3);
    });
});
QUnit.module('BinarySearchTreeNode', function () {
    QUnit.test('should create binary search tree', function (assert) {
        var bstNode = new feng3d.BinarySearchTreeNode(2);
        assert.deepEqual(bstNode.value, 2);
        assert.deepEqual(bstNode.left, null);
        assert.deepEqual(bstNode.right, null);
    });
    QUnit.test('should insert in itself if it is empty', function (assert) {
        var bstNode = new feng3d.BinarySearchTreeNode();
        bstNode.insert(1);
        assert.deepEqual(bstNode.value, 1);
        assert.deepEqual(bstNode.left, null);
        assert.deepEqual(bstNode.right, null);
    });
    QUnit.test('should insert nodes in correct order', function (assert) {
        var bstNode = new feng3d.BinarySearchTreeNode(2);
        var insertedNode1 = bstNode.insert(1);
        assert.deepEqual(insertedNode1.value, 1);
        assert.deepEqual(bstNode.toString(), '1,2');
        assert.deepEqual(bstNode.contains(1), true);
        assert.deepEqual(bstNode.contains(3), false);
        var insertedNode2 = bstNode.insert(3);
        assert.deepEqual(insertedNode2.value, 3);
        assert.deepEqual(bstNode.toString(), '1,2,3');
        assert.deepEqual(bstNode.contains(3), true);
        assert.deepEqual(bstNode.contains(4), false);
        bstNode.insert(7);
        assert.deepEqual(bstNode.toString(), '1,2,3,7');
        assert.deepEqual(bstNode.contains(7), true);
        assert.deepEqual(bstNode.contains(8), false);
        bstNode.insert(4);
        assert.deepEqual(bstNode.toString(), '1,2,3,4,7');
        assert.deepEqual(bstNode.contains(4), true);
        assert.deepEqual(bstNode.contains(8), false);
        bstNode.insert(6);
        assert.deepEqual(bstNode.toString(), '1,2,3,4,6,7');
        assert.deepEqual(bstNode.contains(6), true);
        assert.deepEqual(bstNode.contains(8), false);
    });
    QUnit.test('should not insert duplicates', function (assert) {
        var bstNode = new feng3d.BinarySearchTreeNode(2);
        bstNode.insert(1);
        assert.deepEqual(bstNode.toString(), '1,2');
        assert.deepEqual(bstNode.contains(1), true);
        assert.deepEqual(bstNode.contains(3), false);
        bstNode.insert(1);
        assert.deepEqual(bstNode.toString(), '1,2');
        assert.deepEqual(bstNode.contains(1), true);
        assert.deepEqual(bstNode.contains(3), false);
    });
    QUnit.test('should find min node', function (assert) {
        var node = new feng3d.BinarySearchTreeNode(10);
        node.insert(20);
        node.insert(30);
        node.insert(5);
        node.insert(40);
        node.insert(1);
        assert.deepEqual(node.findMin() != null, true);
        assert.deepEqual(node.findMin().value, 1);
    });
    QUnit.test('should be possible to attach meta information to binary search tree nodes', function (assert) {
        var node = new feng3d.BinarySearchTreeNode(10);
        node.insert(20);
        var node1 = node.insert(30);
        node.insert(5);
        node.insert(40);
        var node2 = node.insert(1);
        node.meta.set('color', 'red');
        node1.meta.set('color', 'black');
        node2.meta.set('color', 'white');
        assert.deepEqual(node.meta.get('color'), 'red');
        assert.deepEqual(node.findMin() != null, true);
        assert.deepEqual(node.findMin().value, 1);
        assert.deepEqual(node.findMin().meta.get('color'), 'white');
        assert.deepEqual(node.find(30).meta.get('color'), 'black');
    });
    QUnit.test('should find node', function (assert) {
        var node = new feng3d.BinarySearchTreeNode(10);
        node.insert(20);
        node.insert(30);
        node.insert(5);
        node.insert(40);
        node.insert(1);
        assert.deepEqual(node.find(6), null);
        assert.deepEqual(node.find(5) != null, true);
        assert.deepEqual(node.find(5).value, 5);
    });
    QUnit.test('should remove leaf nodes', function (assert) {
        var bstRootNode = new feng3d.BinarySearchTreeNode();
        bstRootNode.insert(10);
        bstRootNode.insert(20);
        bstRootNode.insert(5);
        assert.deepEqual(bstRootNode.toString(), '5,10,20');
        var removed1 = bstRootNode.remove(5);
        assert.deepEqual(bstRootNode.toString(), '10,20');
        assert.deepEqual(removed1, true);
        var removed2 = bstRootNode.remove(20);
        assert.deepEqual(bstRootNode.toString(), '10');
        assert.deepEqual(removed2, true);
    });
    QUnit.test('should remove nodes with one child', function (assert) {
        var bstRootNode = new feng3d.BinarySearchTreeNode();
        bstRootNode.insert(10);
        bstRootNode.insert(20);
        bstRootNode.insert(5);
        bstRootNode.insert(30);
        assert.deepEqual(bstRootNode.toString(), '5,10,20,30');
        bstRootNode.remove(20);
        assert.deepEqual(bstRootNode.toString(), '5,10,30');
        bstRootNode.insert(1);
        assert.deepEqual(bstRootNode.toString(), '1,5,10,30');
        bstRootNode.remove(5);
        assert.deepEqual(bstRootNode.toString(), '1,10,30');
    });
    QUnit.test('should remove nodes with two children', function (assert) {
        var bstRootNode = new feng3d.BinarySearchTreeNode();
        bstRootNode.insert(10);
        bstRootNode.insert(20);
        bstRootNode.insert(5);
        bstRootNode.insert(30);
        bstRootNode.insert(15);
        bstRootNode.insert(25);
        assert.deepEqual(bstRootNode.toString(), '5,10,15,20,25,30');
        assert.deepEqual(bstRootNode.find(20).left.value, 15);
        assert.deepEqual(bstRootNode.find(20).right.value, 30);
        bstRootNode.remove(20);
        assert.deepEqual(bstRootNode.toString(), '5,10,15,25,30');
        bstRootNode.remove(15);
        assert.deepEqual(bstRootNode.toString(), '5,10,25,30');
        bstRootNode.remove(10);
        assert.deepEqual(bstRootNode.toString(), '5,25,30');
        assert.deepEqual(bstRootNode.value, 25);
        bstRootNode.remove(25);
        assert.deepEqual(bstRootNode.toString(), '5,30');
        bstRootNode.remove(5);
        assert.deepEqual(bstRootNode.toString(), '30');
    });
    QUnit.test('should remove node with no parent', function (assert) {
        var bstRootNode = new feng3d.BinarySearchTreeNode();
        assert.deepEqual(bstRootNode.toString(), '');
        bstRootNode.insert(1);
        bstRootNode.insert(2);
        assert.deepEqual(bstRootNode.toString(), '1,2');
        bstRootNode.remove(1);
        assert.deepEqual(bstRootNode.toString(), '2');
        bstRootNode.remove(2);
        assert.deepEqual(bstRootNode.toString(), '');
    });
    QUnit.test('should throw error when trying to remove not existing node', function (assert) {
        var bstRootNode = new feng3d.BinarySearchTreeNode();
        bstRootNode.insert(10);
        bstRootNode.insert(20);
        function removeNotExistingElementFromTree() {
            bstRootNode.remove(30);
        }
        var error0 = false;
        try {
            removeNotExistingElementFromTree();
        }
        catch (error) {
            error0 = true;
        }
        assert.deepEqual(error0, true);
    });
    QUnit.test('should be possible to use objects as node values', function (assert) {
        var nodeValueComparatorCallback = function (a, b) {
            var normalizedA = a || { value: null };
            var normalizedB = b || { value: null };
            if (normalizedA.value === normalizedB.value) {
                return 0;
            }
            return normalizedA.value < normalizedB.value ? -1 : 1;
        };
        var obj1 = { key: 'obj1', value: 1, toString: function () { return 'obj1'; } };
        var obj2 = { key: 'obj2', value: 2, toString: function () { return 'obj2'; } };
        var obj3 = { key: 'obj3', value: 3, toString: function () { return 'obj3'; } };
        var bstNode = new feng3d.BinarySearchTreeNode(obj2, nodeValueComparatorCallback);
        bstNode.insert(obj1);
        assert.deepEqual(bstNode.toString(), 'obj1,obj2');
        assert.deepEqual(bstNode.contains(obj1), true);
        assert.deepEqual(bstNode.contains(obj3), false);
        bstNode.insert(obj3);
        assert.deepEqual(bstNode.toString(), 'obj1,obj2,obj3');
        assert.deepEqual(bstNode.contains(obj3), true);
        assert.deepEqual(bstNode.findMin().value, obj1);
    });
    QUnit.test('should abandon removed node', function (assert) {
        var rootNode = new feng3d.BinarySearchTreeNode('foo');
        rootNode.insert('bar');
        var childNode = rootNode.find('bar');
        rootNode.remove('bar');
        assert.deepEqual(childNode.parent, null);
    });
});
QUnit.module('BinaryTreeNode', function () {
    QUnit.test('should create node', function (assert) {
        var node = new feng3d.BinaryTreeNode();
        assert.deepEqual(node.value, null);
        assert.deepEqual(node.left, null);
        assert.deepEqual(node.right, null);
        var leftNode = new feng3d.BinaryTreeNode(1);
        var rightNode = new feng3d.BinaryTreeNode(3);
        var rootNode = new feng3d.BinaryTreeNode(2);
        rootNode
            .setLeft(leftNode)
            .setRight(rightNode);
        assert.deepEqual(rootNode.value, 2);
        assert.deepEqual(rootNode.left.value, 1);
        assert.deepEqual(rootNode.right.value, 3);
    });
    QUnit.test('should set parent', function (assert) {
        var leftNode = new feng3d.BinaryTreeNode(1);
        var rightNode = new feng3d.BinaryTreeNode(3);
        var rootNode = new feng3d.BinaryTreeNode(2);
        rootNode
            .setLeft(leftNode)
            .setRight(rightNode);
        assert.deepEqual(rootNode.parent, null);
        assert.deepEqual(rootNode.left.parent.value, 2);
        assert.deepEqual(rootNode.right.parent.value, 2);
        assert.deepEqual(rootNode.right.parent, rootNode);
    });
    QUnit.test('should traverse node', function (assert) {
        var leftNode = new feng3d.BinaryTreeNode(1);
        var rightNode = new feng3d.BinaryTreeNode(3);
        var rootNode = new feng3d.BinaryTreeNode(2);
        rootNode
            .setLeft(leftNode)
            .setRight(rightNode);
        assert.deepEqual(rootNode.traverseInOrder(), [1, 2, 3]);
        assert.deepEqual(rootNode.toString(), '1,2,3');
    });
    QUnit.test('should remove child node', function (assert) {
        var leftNode = new feng3d.BinaryTreeNode(1);
        var rightNode = new feng3d.BinaryTreeNode(3);
        var rootNode = new feng3d.BinaryTreeNode(2);
        rootNode
            .setLeft(leftNode)
            .setRight(rightNode);
        assert.deepEqual(rootNode.traverseInOrder(), [1, 2, 3]);
        assert.deepEqual(rootNode.removeChild(rootNode.left), true);
        assert.deepEqual(rootNode.traverseInOrder(), [2, 3]);
        assert.deepEqual(rootNode.removeChild(rootNode.right), true);
        assert.deepEqual(rootNode.traverseInOrder(), [2]);
        assert.deepEqual(rootNode.removeChild(rootNode.right), false);
        assert.deepEqual(rootNode.traverseInOrder(), [2]);
    });
    QUnit.test('should replace child node', function (assert) {
        var leftNode = new feng3d.BinaryTreeNode(1);
        var rightNode = new feng3d.BinaryTreeNode(3);
        var rootNode = new feng3d.BinaryTreeNode(2);
        rootNode
            .setLeft(leftNode)
            .setRight(rightNode);
        assert.deepEqual(rootNode.traverseInOrder(), [1, 2, 3]);
        var replacementNode = new feng3d.BinaryTreeNode(5);
        rightNode.setRight(replacementNode);
        assert.deepEqual(rootNode.traverseInOrder(), [1, 2, 3, 5]);
        assert.deepEqual(rootNode.replaceChild(rootNode.right, rootNode.right.right), true);
        assert.deepEqual(rootNode.right.value, 5);
        assert.deepEqual(rootNode.right.right, null);
        assert.deepEqual(rootNode.traverseInOrder(), [1, 2, 5]);
        assert.deepEqual(rootNode.replaceChild(rootNode.right, rootNode.right.right), false);
        assert.deepEqual(rootNode.traverseInOrder(), [1, 2, 5]);
        assert.deepEqual(rootNode.replaceChild(rootNode.right, replacementNode), true);
        assert.deepEqual(rootNode.traverseInOrder(), [1, 2, 5]);
        assert.deepEqual(rootNode.replaceChild(rootNode.left, replacementNode), true);
        assert.deepEqual(rootNode.traverseInOrder(), [5, 2, 5]);
        assert.deepEqual(rootNode.replaceChild(new feng3d.BinaryTreeNode(), new feng3d.BinaryTreeNode()), false);
    });
    QUnit.test('should calculate node height', function (assert) {
        var root = new feng3d.BinaryTreeNode(1);
        var left = new feng3d.BinaryTreeNode(3);
        var right = new feng3d.BinaryTreeNode(2);
        var grandLeft = new feng3d.BinaryTreeNode(5);
        var grandRight = new feng3d.BinaryTreeNode(6);
        var grandGrandLeft = new feng3d.BinaryTreeNode(7);
        assert.deepEqual(root.height, 0);
        assert.deepEqual(root.balanceFactor, 0);
        root
            .setLeft(left)
            .setRight(right);
        assert.deepEqual(root.height, 1);
        assert.deepEqual(left.height, 0);
        assert.deepEqual(root.balanceFactor, 0);
        left
            .setLeft(grandLeft)
            .setRight(grandRight);
        assert.deepEqual(root.height, 2);
        assert.deepEqual(left.height, 1);
        assert.deepEqual(grandLeft.height, 0);
        assert.deepEqual(grandRight.height, 0);
        assert.deepEqual(root.balanceFactor, 1);
        grandLeft.setLeft(grandGrandLeft);
        assert.deepEqual(root.height, 3);
        assert.deepEqual(left.height, 2);
        assert.deepEqual(grandLeft.height, 1);
        assert.deepEqual(grandRight.height, 0);
        assert.deepEqual(grandGrandLeft.height, 0);
        assert.deepEqual(root.balanceFactor, 2);
    });
    QUnit.test('should calculate node height for right nodes as well', function (assert) {
        var root = new feng3d.BinaryTreeNode(1);
        var right = new feng3d.BinaryTreeNode(2);
        root.setRight(right);
        assert.deepEqual(root.height, 1);
        assert.deepEqual(right.height, 0);
        assert.deepEqual(root.balanceFactor, -1);
    });
    QUnit.test('should set null for left and right node', function (assert) {
        var root = new feng3d.BinaryTreeNode(2);
        var left = new feng3d.BinaryTreeNode(1);
        var right = new feng3d.BinaryTreeNode(3);
        root.setLeft(left);
        root.setRight(right);
        assert.deepEqual(root.left.value, 1);
        assert.deepEqual(root.right.value, 3);
        root.setLeft(null);
        root.setRight(null);
        assert.deepEqual(root.left, null);
        assert.deepEqual(root.right, null);
    });
    QUnit.test('should be possible to create node with object as a value', function (assert) {
        var obj1 = { key: 'object_1', toString: function () { return 'object_1'; } };
        var obj2 = { key: 'object_2' };
        var node1 = new feng3d.BinaryTreeNode(obj1);
        var node2 = new feng3d.BinaryTreeNode(obj2);
        node1.setLeft(node2);
        assert.deepEqual(node1.value, obj1);
        assert.deepEqual(node2.value, obj2);
        assert.deepEqual(node1.left.value, obj2);
        node1.removeChild(node2);
        assert.deepEqual(node1.value, obj1);
        assert.deepEqual(node2.value, obj2);
        assert.deepEqual(node1.left, null);
        assert.deepEqual(node1.toString(), 'object_1');
        assert.deepEqual(node2.toString(), '[object Object]');
    });
    QUnit.test('should be possible to attach meta information to the node', function (assert) {
        var redNode = new feng3d.BinaryTreeNode(1);
        var blackNode = new feng3d.BinaryTreeNode(2);
        redNode.meta.set('color', 'red');
        blackNode.meta.set('color', 'black');
        assert.deepEqual(redNode.meta.get('color'), 'red');
        assert.deepEqual(blackNode.meta.get('color'), 'black');
    });
    QUnit.test('should detect right uncle', function (assert) {
        var grandParent = new feng3d.BinaryTreeNode('grand-parent');
        var parent = new feng3d.BinaryTreeNode('parent');
        var uncle = new feng3d.BinaryTreeNode('uncle');
        var child = new feng3d.BinaryTreeNode('child');
        assert.deepEqual(grandParent.uncle, undefined);
        assert.deepEqual(parent.uncle, undefined);
        grandParent.setLeft(parent);
        assert.deepEqual(parent.uncle, undefined);
        assert.deepEqual(child.uncle, undefined);
        parent.setLeft(child);
        assert.deepEqual(child.uncle, undefined);
        grandParent.setRight(uncle);
        assert.deepEqual(parent.uncle, undefined);
        assert.deepEqual(child.uncle != undefined, true);
        assert.deepEqual(child.uncle, uncle);
    });
    QUnit.test('should detect left uncle', function (assert) {
        var grandParent = new feng3d.BinaryTreeNode('grand-parent');
        var parent = new feng3d.BinaryTreeNode('parent');
        var uncle = new feng3d.BinaryTreeNode('uncle');
        var child = new feng3d.BinaryTreeNode('child');
        assert.deepEqual(grandParent.uncle, undefined);
        assert.deepEqual(parent.uncle, undefined);
        grandParent.setRight(parent);
        assert.deepEqual(parent.uncle, undefined);
        assert.deepEqual(child.uncle, undefined);
        parent.setRight(child);
        assert.deepEqual(child.uncle, undefined);
        grandParent.setLeft(uncle);
        assert.deepEqual(parent.uncle, undefined);
        assert.deepEqual(child.uncle != undefined, true);
        assert.deepEqual(child.uncle, uncle);
    });
    QUnit.test('should be possible to set node values', function (assert) {
        var node = new feng3d.BinaryTreeNode('initial_value');
        assert.deepEqual(node.value, 'initial_value');
        node.setValue('new_value');
        assert.deepEqual(node.value, 'new_value');
    });
    QUnit.test('should be possible to copy node', function (assert) {
        var root = new feng3d.BinaryTreeNode('root');
        var left = new feng3d.BinaryTreeNode('left');
        var right = new feng3d.BinaryTreeNode('right');
        root
            .setLeft(left)
            .setRight(right);
        assert.deepEqual(root.toString(), 'left,root,right');
        var newRoot = new feng3d.BinaryTreeNode('new_root');
        var newLeft = new feng3d.BinaryTreeNode('new_left');
        var newRight = new feng3d.BinaryTreeNode('new_right');
        newRoot
            .setLeft(newLeft)
            .setRight(newRight);
        assert.deepEqual(newRoot.toString(), 'new_left,new_root,new_right');
        feng3d.BinaryTreeNode.copyNode(root, newRoot);
        assert.deepEqual(root.toString(), 'left,root,right');
        assert.deepEqual(newRoot.toString(), 'left,root,right');
    });
});
QUnit.module('BloomFilter', function () {
    var bloomFilter;
    var people = [
        'Bruce Wayne',
        'Clark Kent',
        'Barry Allen',
    ];
    QUnit.test('should have methods named "insert" and "mayContain"', function (assert) {
        var bloomFilter = new feng3d.BloomFilter();
        assert.deepEqual(typeof bloomFilter.insert, 'function');
        assert.deepEqual(typeof bloomFilter.mayContain, 'function');
    });
    QUnit.test('should create a new filter store with the appropriate methods', function (assert) {
        var bloomFilter = new feng3d.BloomFilter();
        var store = bloomFilter.createStore(18);
        assert.deepEqual(typeof store.getValue, 'function');
        assert.deepEqual(typeof store.setValue, 'function');
    });
    QUnit.test('should hash deterministically with all 3 hash functions', function (assert) {
        var bloomFilter = new feng3d.BloomFilter();
        var str1 = 'apple';
        assert.deepEqual(bloomFilter.hash1(str1), bloomFilter.hash1(str1));
        assert.deepEqual(bloomFilter.hash2(str1), bloomFilter.hash2(str1));
        assert.deepEqual(bloomFilter.hash3(str1), bloomFilter.hash3(str1));
        assert.deepEqual(bloomFilter.hash1(str1), 14);
        assert.deepEqual(bloomFilter.hash2(str1), 43);
        assert.deepEqual(bloomFilter.hash3(str1), 10);
        var str2 = 'orange';
        assert.deepEqual(bloomFilter.hash1(str2), bloomFilter.hash1(str2));
        assert.deepEqual(bloomFilter.hash2(str2), bloomFilter.hash2(str2));
        assert.deepEqual(bloomFilter.hash3(str2), bloomFilter.hash3(str2));
        assert.deepEqual(bloomFilter.hash1(str2), 0);
        assert.deepEqual(bloomFilter.hash2(str2), 61);
        assert.deepEqual(bloomFilter.hash3(str2), 10);
    });
    QUnit.test('should create an array with 3 hash values', function (assert) {
        var bloomFilter = new feng3d.BloomFilter();
        assert.deepEqual(bloomFilter.getHashValues('abc').length, 3);
        assert.deepEqual(bloomFilter.getHashValues('abc'), [66, 63, 54]);
    });
    QUnit.test('should insert strings correctly and return true when checking for inserted values', function (assert) {
        var bloomFilter = new feng3d.BloomFilter();
        people.forEach(function (person) { return bloomFilter.insert(person); });
        assert.deepEqual(bloomFilter.mayContain('Bruce Wayne'), true);
        assert.deepEqual(bloomFilter.mayContain('Clark Kent'), true);
        assert.deepEqual(bloomFilter.mayContain('Barry Allen'), true);
        assert.deepEqual(bloomFilter.mayContain('Tony Stark'), false);
    });
});
QUnit.module('DisjointSet', function () {
    QUnit.test('should throw error when trying to union and check not existing sets', function (assert) {
        function mergeNotExistingSets() {
            var disjointSet = new feng3d.DisjointSet();
            disjointSet.union('A', 'B');
        }
        function checkNotExistingSets() {
            var disjointSet = new feng3d.DisjointSet();
            disjointSet.inSameSet('A', 'B');
        }
        var error0 = false, error1 = false;
        try {
            mergeNotExistingSets();
        }
        catch (error) {
            error0 = true;
        }
        try {
            checkNotExistingSets();
        }
        catch (error) {
            error1 = true;
        }
        assert.deepEqual(error0, true);
        assert.deepEqual(error1, true);
    });
    QUnit.test('should do basic manipulations on disjoint set', function (assert) {
        var disjointSet = new feng3d.DisjointSet();
        assert.deepEqual(disjointSet.find('A'), null);
        assert.deepEqual(disjointSet.find('B'), null);
        disjointSet.makeSet('A');
        assert.deepEqual(disjointSet.find('A'), 'A');
        assert.deepEqual(disjointSet.find('B'), null);
        disjointSet.makeSet('B');
        assert.deepEqual(disjointSet.find('A'), 'A');
        assert.deepEqual(disjointSet.find('B'), 'B');
        disjointSet.makeSet('C');
        assert.deepEqual(disjointSet.inSameSet('A', 'B'), false);
        disjointSet.union('A', 'B');
        assert.deepEqual(disjointSet.find('A'), 'A');
        assert.deepEqual(disjointSet.find('B'), 'A');
        assert.deepEqual(disjointSet.inSameSet('A', 'B'), true);
        assert.deepEqual(disjointSet.inSameSet('B', 'A'), true);
        assert.deepEqual(disjointSet.inSameSet('A', 'C'), false);
        disjointSet.union('A', 'A');
        disjointSet.union('B', 'C');
        assert.deepEqual(disjointSet.find('A'), 'A');
        assert.deepEqual(disjointSet.find('B'), 'A');
        assert.deepEqual(disjointSet.find('C'), 'A');
        assert.deepEqual(disjointSet.inSameSet('A', 'B'), true);
        assert.deepEqual(disjointSet.inSameSet('B', 'C'), true);
        assert.deepEqual(disjointSet.inSameSet('A', 'C'), true);
        disjointSet
            .makeSet('E')
            .makeSet('F')
            .makeSet('G')
            .makeSet('H')
            .makeSet('I');
        disjointSet
            .union('E', 'F')
            .union('F', 'G')
            .union('G', 'H')
            .union('H', 'I');
        assert.deepEqual(disjointSet.inSameSet('A', 'I'), false);
        assert.deepEqual(disjointSet.inSameSet('E', 'I'), true);
        disjointSet.union('I', 'C');
        assert.deepEqual(disjointSet.find('I'), 'E');
        assert.deepEqual(disjointSet.inSameSet('A', 'I'), true);
    });
    QUnit.test('should union smaller set with bigger one making bigger one to be new root', function (assert) {
        var disjointSet = new feng3d.DisjointSet();
        disjointSet
            .makeSet('A')
            .makeSet('B')
            .makeSet('C')
            .union('B', 'C')
            .union('A', 'C');
        assert.deepEqual(disjointSet.find('A'), 'B');
    });
    QUnit.test('should do basic manipulations on disjoint set with custom key extractor', function (assert) {
        var keyExtractor = function (value) { return value.key; };
        var disjointSet = new feng3d.DisjointSet(keyExtractor);
        var itemA = { key: 'A', value: 1 };
        var itemB = { key: 'B', value: 2 };
        var itemC = { key: 'C', value: 3 };
        assert.deepEqual(disjointSet.find(itemA), null);
        assert.deepEqual(disjointSet.find(itemB), null);
        disjointSet.makeSet(itemA);
        assert.deepEqual(disjointSet.find(itemA), 'A');
        assert.deepEqual(disjointSet.find(itemB), null);
        disjointSet.makeSet(itemB);
        assert.deepEqual(disjointSet.find(itemA), 'A');
        assert.deepEqual(disjointSet.find(itemB), 'B');
        disjointSet.makeSet(itemC);
        assert.deepEqual(disjointSet.inSameSet(itemA, itemB), false);
        disjointSet.union(itemA, itemB);
        assert.deepEqual(disjointSet.find(itemA), 'A');
        assert.deepEqual(disjointSet.find(itemB), 'A');
        assert.deepEqual(disjointSet.inSameSet(itemA, itemB), true);
        assert.deepEqual(disjointSet.inSameSet(itemB, itemA), true);
        assert.deepEqual(disjointSet.inSameSet(itemA, itemC), false);
        disjointSet.union(itemA, itemC);
        assert.deepEqual(disjointSet.find(itemA), 'A');
        assert.deepEqual(disjointSet.find(itemB), 'A');
        assert.deepEqual(disjointSet.find(itemC), 'A');
        assert.deepEqual(disjointSet.inSameSet(itemA, itemB), true);
        assert.deepEqual(disjointSet.inSameSet(itemB, itemC), true);
        assert.deepEqual(disjointSet.inSameSet(itemA, itemC), true);
    });
});
QUnit.module('DisjointSetNode', function () {
    QUnit.test('should do basic manipulation with disjoint set item', function (assert) {
        var itemA = new feng3d.DisjointSetNode('A');
        var itemB = new feng3d.DisjointSetNode('B');
        var itemC = new feng3d.DisjointSetNode('C');
        var itemD = new feng3d.DisjointSetNode('D');
        assert.deepEqual(itemA.getRank(), 0);
        assert.deepEqual(itemA.getChildren(), []);
        assert.deepEqual(itemA.getKey(), 'A');
        assert.deepEqual(itemA.getRoot(), itemA);
        assert.deepEqual(itemA.isRoot(), true);
        assert.deepEqual(itemB.isRoot(), true);
        itemA.addChild(itemB);
        itemD.setParent(itemC);
        assert.deepEqual(itemA.getRank(), 1);
        assert.deepEqual(itemC.getRank(), 1);
        assert.deepEqual(itemB.getRank(), 0);
        assert.deepEqual(itemD.getRank(), 0);
        assert.deepEqual(itemA.getChildren().length, 1);
        assert.deepEqual(itemC.getChildren().length, 1);
        assert.deepEqual(itemA.getChildren()[0], itemB);
        assert.deepEqual(itemC.getChildren()[0], itemD);
        assert.deepEqual(itemB.getChildren().length, 0);
        assert.deepEqual(itemD.getChildren().length, 0);
        assert.deepEqual(itemA.getRoot(), itemA);
        assert.deepEqual(itemB.getRoot(), itemA);
        assert.deepEqual(itemC.getRoot(), itemC);
        assert.deepEqual(itemD.getRoot(), itemC);
        assert.deepEqual(itemA.isRoot(), true);
        assert.deepEqual(itemB.isRoot(), false);
        assert.deepEqual(itemC.isRoot(), true);
        assert.deepEqual(itemD.isRoot(), false);
        itemA.addChild(itemC);
        assert.deepEqual(itemA.isRoot(), true);
        assert.deepEqual(itemB.isRoot(), false);
        assert.deepEqual(itemC.isRoot(), false);
        assert.deepEqual(itemD.isRoot(), false);
        assert.deepEqual(itemA.getRank(), 3);
        assert.deepEqual(itemB.getRank(), 0);
        assert.deepEqual(itemC.getRank(), 1);
    });
    QUnit.test('should do basic manipulation with disjoint set item with custom key extractor', function (assert) {
        var keyExtractor = function (value) {
            return value.key;
        };
        var itemA = new feng3d.DisjointSetNode({ key: 'A', value: 1 }, keyExtractor);
        var itemB = new feng3d.DisjointSetNode({ key: 'B', value: 2 }, keyExtractor);
        var itemC = new feng3d.DisjointSetNode({ key: 'C', value: 3 }, keyExtractor);
        var itemD = new feng3d.DisjointSetNode({ key: 'D', value: 4 }, keyExtractor);
        assert.deepEqual(itemA.getRank(), 0);
        assert.deepEqual(itemA.getChildren(), []);
        assert.deepEqual(itemA.getKey(), 'A');
        assert.deepEqual(itemA.getRoot(), itemA);
        assert.deepEqual(itemA.isRoot(), true);
        assert.deepEqual(itemB.isRoot(), true);
        itemA.addChild(itemB);
        itemD.setParent(itemC);
        assert.deepEqual(itemA.getRank(), 1);
        assert.deepEqual(itemC.getRank(), 1);
        assert.deepEqual(itemB.getRank(), 0);
        assert.deepEqual(itemD.getRank(), 0);
        assert.deepEqual(itemA.getChildren().length, 1);
        assert.deepEqual(itemC.getChildren().length, 1);
        assert.deepEqual(itemA.getChildren()[0], itemB);
        assert.deepEqual(itemC.getChildren()[0], itemD);
        assert.deepEqual(itemB.getChildren().length, 0);
        assert.deepEqual(itemD.getChildren().length, 0);
        assert.deepEqual(itemA.getRoot(), itemA);
        assert.deepEqual(itemB.getRoot(), itemA);
        assert.deepEqual(itemC.getRoot(), itemC);
        assert.deepEqual(itemD.getRoot(), itemC);
        assert.deepEqual(itemA.isRoot(), true);
        assert.deepEqual(itemB.isRoot(), false);
        assert.deepEqual(itemC.isRoot(), true);
        assert.deepEqual(itemD.isRoot(), false);
        itemA.addChild(itemC);
        assert.deepEqual(itemA.isRoot(), true);
        assert.deepEqual(itemB.isRoot(), false);
        assert.deepEqual(itemC.isRoot(), false);
        assert.deepEqual(itemD.isRoot(), false);
        assert.deepEqual(itemA.getRank(), 3);
        assert.deepEqual(itemB.getRank(), 0);
        assert.deepEqual(itemC.getRank(), 1);
    });
});
QUnit.module("DoublyLinkedList", function () {
    QUnit.test("DoublyLinkedList", function (assert) {
        var ll = new feng3d.DoublyLinkedList();
        assert.deepEqual(ll.deleteHead(), undefined);
        assert.deepEqual(ll.deleteTail(), undefined);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("empty", function (assert) {
        var ll = new feng3d.DoublyLinkedList();
        ll.fromArray([Math.random(), Math.random(), Math.random()]);
        ll.empty();
        assert.deepEqual(ll.toArray().length, 0);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("addHead", function (assert) {
        var ll = new feng3d.DoublyLinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        arr.concat().reverse().forEach(function (element) {
            ll.addHead(element);
        });
        assert.deepEqual(ll.toArray(), arr);
        ll.addHead(1);
        arr.unshift(1);
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("addTail", function (assert) {
        var ll = new feng3d.DoublyLinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        arr.forEach(function (element) {
            ll.addTail(element);
        });
        assert.deepEqual(ll.toArray(), arr);
        ll.addTail(1);
        arr.push(1);
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("delete", function (assert) {
        var ll = new feng3d.DoublyLinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        arr = arr.concat(arr);
        arr.forEach(function (element) {
            ll.addTail(element);
        });
        assert.deepEqual(ll.toArray(), arr);
        var deleteItem = arr[3];
        arr.splice(arr.indexOf(deleteItem), 1);
        ll.delete(deleteItem);
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("deleteAll", function (assert) {
        var ll = new feng3d.DoublyLinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        arr = arr.concat(arr);
        arr.forEach(function (element) {
            ll.addTail(element);
        });
        assert.deepEqual(ll.toArray(), arr);
        var deleteItem = arr[3];
        var index = arr.indexOf(deleteItem);
        while (index != -1) {
            arr.splice(index, 1);
            index = arr.indexOf(deleteItem);
        }
        ll.deleteAll(deleteItem);
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("deleteHead", function (assert) {
        var ll = new feng3d.DoublyLinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        ll.fromArray(arr);
        assert.deepEqual(ll.deleteHead(), arr.shift());
        assert.deepEqual(ll.deleteHead(), arr.shift());
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("deleteTail", function (assert) {
        var ll = new feng3d.DoublyLinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        ll.fromArray(arr);
        assert.deepEqual(ll.deleteTail(), arr.pop());
        assert.deepEqual(ll.deleteTail(), arr.pop());
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("toArray", function (assert) {
        var ll = new feng3d.DoublyLinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        ll.fromArray(arr);
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("fromArray", function (assert) {
        var ll = new feng3d.DoublyLinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        ll.fromArray(arr);
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("toString", function (assert) {
        var ll = new feng3d.DoublyLinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        ll.fromArray(arr);
        assert.ok(true, ll.toString(function (v) { return v.toFixed(3); }));
        assert.ok(ll.checkStructure());
    });
    QUnit.test("reverse", function (assert) {
        var ll = new feng3d.DoublyLinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        ll.fromArray(arr);
        ll.reverse();
        arr.reverse();
        assert.deepEqual(ll.toArray(), arr);
        arr.length = 1;
        ll.fromArray(arr);
        ll.reverse();
        arr.reverse();
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
});
QUnit.module('Graph', function () {
    QUnit.test('should add vertices to graph', function (assert) {
        var graph = new feng3d.Graph();
        var vertexA = new feng3d.GraphVertex('A');
        var vertexB = new feng3d.GraphVertex('B');
        graph
            .addVertex(vertexA)
            .addVertex(vertexB);
        assert.deepEqual(graph.toString(), 'A,B');
        assert.deepEqual(graph.getVertexByKey(vertexA.getKey()), vertexA);
        assert.deepEqual(graph.getVertexByKey(vertexB.getKey()), vertexB);
    });
    QUnit.test('should add edges to undirected graph', function (assert) {
        var graph = new feng3d.Graph();
        var vertexA = new feng3d.GraphVertex('A');
        var vertexB = new feng3d.GraphVertex('B');
        var edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        graph.addEdge(edgeAB);
        assert.deepEqual(graph.getAllVertices().length, 2);
        assert.deepEqual(graph.getAllVertices()[0], vertexA);
        assert.deepEqual(graph.getAllVertices()[1], vertexB);
        var graphVertexA = graph.getVertexByKey(vertexA.getKey());
        var graphVertexB = graph.getVertexByKey(vertexB.getKey());
        assert.deepEqual(graph.toString(), 'A,B');
        assert.deepEqual(graphVertexA != undefined, true);
        assert.deepEqual(graphVertexB != undefined, true);
        assert.deepEqual(graph.getVertexByKey('not existing') == undefined, true);
        assert.deepEqual(graphVertexA.getNeighbors().length, 1);
        assert.deepEqual(graphVertexA.getNeighbors()[0], vertexB);
        assert.deepEqual(graphVertexA.getNeighbors()[0], graphVertexB);
        assert.deepEqual(graphVertexB.getNeighbors().length, 1);
        assert.deepEqual(graphVertexB.getNeighbors()[0], vertexA);
        assert.deepEqual(graphVertexB.getNeighbors()[0], graphVertexA);
    });
    QUnit.test('should add edges to directed graph', function (assert) {
        var graph = new feng3d.Graph(true);
        var vertexA = new feng3d.GraphVertex('A');
        var vertexB = new feng3d.GraphVertex('B');
        var edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        graph.addEdge(edgeAB);
        var graphVertexA = graph.getVertexByKey(vertexA.getKey());
        var graphVertexB = graph.getVertexByKey(vertexB.getKey());
        assert.deepEqual(graph.toString(), 'A,B');
        assert.deepEqual(graphVertexA != undefined, true);
        assert.deepEqual(graphVertexB != undefined, true);
        assert.deepEqual(graphVertexA.getNeighbors().length, 1);
        assert.deepEqual(graphVertexA.getNeighbors()[0], vertexB);
        assert.deepEqual(graphVertexA.getNeighbors()[0], graphVertexB);
        assert.deepEqual(graphVertexB.getNeighbors().length, 0);
    });
    QUnit.test('should find edge by vertices in undirected graph', function (assert) {
        var graph = new feng3d.Graph();
        var vertexA = new feng3d.GraphVertex('A');
        var vertexB = new feng3d.GraphVertex('B');
        var vertexC = new feng3d.GraphVertex('C');
        var edgeAB = new feng3d.GraphEdge(vertexA, vertexB, 10);
        graph.addEdge(edgeAB);
        var graphEdgeAB = graph.findEdge(vertexA, vertexB);
        var graphEdgeBA = graph.findEdge(vertexB, vertexA);
        var graphEdgeAC = graph.findEdge(vertexA, vertexC);
        var graphEdgeCA = graph.findEdge(vertexC, vertexA);
        assert.deepEqual(graphEdgeAC, null);
        assert.deepEqual(graphEdgeCA, null);
        assert.deepEqual(graphEdgeAB, edgeAB);
        assert.deepEqual(graphEdgeBA, edgeAB);
        assert.deepEqual(graphEdgeAB.weight, 10);
    });
    QUnit.test('should find edge by vertices in directed graph', function (assert) {
        var graph = new feng3d.Graph(true);
        var vertexA = new feng3d.GraphVertex('A');
        var vertexB = new feng3d.GraphVertex('B');
        var vertexC = new feng3d.GraphVertex('C');
        var edgeAB = new feng3d.GraphEdge(vertexA, vertexB, 10);
        graph.addEdge(edgeAB);
        var graphEdgeAB = graph.findEdge(vertexA, vertexB);
        var graphEdgeBA = graph.findEdge(vertexB, vertexA);
        var graphEdgeAC = graph.findEdge(vertexA, vertexC);
        var graphEdgeCA = graph.findEdge(vertexC, vertexA);
        assert.deepEqual(graphEdgeAC, null);
        assert.deepEqual(graphEdgeCA, null);
        assert.deepEqual(graphEdgeBA, null);
        assert.deepEqual(graphEdgeAB, edgeAB);
        assert.deepEqual(graphEdgeAB.weight, 10);
    });
    QUnit.test('should return vertex neighbors', function (assert) {
        var graph = new feng3d.Graph(true);
        var vertexA = new feng3d.GraphVertex('A');
        var vertexB = new feng3d.GraphVertex('B');
        var vertexC = new feng3d.GraphVertex('C');
        var edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        var edgeAC = new feng3d.GraphEdge(vertexA, vertexC);
        graph
            .addEdge(edgeAB)
            .addEdge(edgeAC);
        var neighbors = graph.getNeighbors(vertexA);
        assert.deepEqual(neighbors.length, 2);
        assert.deepEqual(neighbors[0], vertexB);
        assert.deepEqual(neighbors[1], vertexC);
    });
    QUnit.test('should throw an error when trying to add edge twice', function (assert) {
        function addSameEdgeTwice() {
            var graph = new feng3d.Graph(true);
            var vertexA = new feng3d.GraphVertex('A');
            var vertexB = new feng3d.GraphVertex('B');
            var edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
            graph
                .addEdge(edgeAB)
                .addEdge(edgeAB);
        }
        var error0 = false;
        try {
            addSameEdgeTwice();
        }
        catch (error) {
            error0 = true;
        }
        assert.deepEqual(error0, true);
    });
    QUnit.test('should return the list of all added edges', function (assert) {
        var graph = new feng3d.Graph(true);
        var vertexA = new feng3d.GraphVertex('A');
        var vertexB = new feng3d.GraphVertex('B');
        var vertexC = new feng3d.GraphVertex('C');
        var edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        var edgeBC = new feng3d.GraphEdge(vertexB, vertexC);
        graph
            .addEdge(edgeAB)
            .addEdge(edgeBC);
        var edges = graph.getAllEdges();
        assert.deepEqual(edges.length, 2);
        assert.deepEqual(edges[0], edgeAB);
        assert.deepEqual(edges[1], edgeBC);
    });
    QUnit.test('should calculate total graph weight for default graph', function (assert) {
        var graph = new feng3d.Graph();
        var vertexA = new feng3d.GraphVertex('A');
        var vertexB = new feng3d.GraphVertex('B');
        var vertexC = new feng3d.GraphVertex('C');
        var vertexD = new feng3d.GraphVertex('D');
        var edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        var edgeBC = new feng3d.GraphEdge(vertexB, vertexC);
        var edgeCD = new feng3d.GraphEdge(vertexC, vertexD);
        var edgeAD = new feng3d.GraphEdge(vertexA, vertexD);
        graph
            .addEdge(edgeAB)
            .addEdge(edgeBC)
            .addEdge(edgeCD)
            .addEdge(edgeAD);
        assert.deepEqual(graph.getWeight(), 0);
    });
    QUnit.test('should calculate total graph weight for weighted graph', function (assert) {
        var graph = new feng3d.Graph();
        var vertexA = new feng3d.GraphVertex('A');
        var vertexB = new feng3d.GraphVertex('B');
        var vertexC = new feng3d.GraphVertex('C');
        var vertexD = new feng3d.GraphVertex('D');
        var edgeAB = new feng3d.GraphEdge(vertexA, vertexB, 1);
        var edgeBC = new feng3d.GraphEdge(vertexB, vertexC, 2);
        var edgeCD = new feng3d.GraphEdge(vertexC, vertexD, 3);
        var edgeAD = new feng3d.GraphEdge(vertexA, vertexD, 4);
        graph
            .addEdge(edgeAB)
            .addEdge(edgeBC)
            .addEdge(edgeCD)
            .addEdge(edgeAD);
        assert.deepEqual(graph.getWeight(), 10);
    });
    QUnit.test('should be possible to delete edges from graph', function (assert) {
        var graph = new feng3d.Graph();
        var vertexA = new feng3d.GraphVertex('A');
        var vertexB = new feng3d.GraphVertex('B');
        var vertexC = new feng3d.GraphVertex('C');
        var edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        var edgeBC = new feng3d.GraphEdge(vertexB, vertexC);
        var edgeAC = new feng3d.GraphEdge(vertexA, vertexC);
        graph
            .addEdge(edgeAB)
            .addEdge(edgeBC)
            .addEdge(edgeAC);
        assert.deepEqual(graph.getAllEdges().length, 3);
        graph.deleteEdge(edgeAB);
        assert.deepEqual(graph.getAllEdges().length, 2);
        assert.deepEqual(graph.getAllEdges()[0].getKey(), edgeBC.getKey());
        assert.deepEqual(graph.getAllEdges()[1].getKey(), edgeAC.getKey());
    });
    QUnit.test('should should throw an error when trying to delete not existing edge', function (assert) {
        function deleteNotExistingEdge() {
            var graph = new feng3d.Graph();
            var vertexA = new feng3d.GraphVertex('A');
            var vertexB = new feng3d.GraphVertex('B');
            var vertexC = new feng3d.GraphVertex('C');
            var edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
            var edgeBC = new feng3d.GraphEdge(vertexB, vertexC);
            graph.addEdge(edgeAB);
            graph.deleteEdge(edgeBC);
        }
        var error0 = false;
        try {
            deleteNotExistingEdge();
        }
        catch (error) {
            error0 = true;
        }
        assert.deepEqual(error0, true);
    });
    QUnit.test('should be possible to reverse graph', function (assert) {
        var vertexA = new feng3d.GraphVertex('A');
        var vertexB = new feng3d.GraphVertex('B');
        var vertexC = new feng3d.GraphVertex('C');
        var vertexD = new feng3d.GraphVertex('D');
        var edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        var edgeAC = new feng3d.GraphEdge(vertexA, vertexC);
        var edgeCD = new feng3d.GraphEdge(vertexC, vertexD);
        var graph = new feng3d.Graph(true);
        graph
            .addEdge(edgeAB)
            .addEdge(edgeAC)
            .addEdge(edgeCD);
        assert.deepEqual(graph.toString(), 'A,B,C,D');
        assert.deepEqual(graph.getAllEdges().length, 3);
        assert.deepEqual(graph.getNeighbors(vertexA).length, 2);
        assert.deepEqual(graph.getNeighbors(vertexA)[0].getKey(), vertexB.getKey());
        assert.deepEqual(graph.getNeighbors(vertexA)[1].getKey(), vertexC.getKey());
        assert.deepEqual(graph.getNeighbors(vertexB).length, 0);
        assert.deepEqual(graph.getNeighbors(vertexC).length, 1);
        assert.deepEqual(graph.getNeighbors(vertexC)[0].getKey(), vertexD.getKey());
        assert.deepEqual(graph.getNeighbors(vertexD).length, 0);
        graph.reverse();
        assert.deepEqual(graph.toString(), 'A,B,C,D');
        assert.deepEqual(graph.getAllEdges().length, 3);
        assert.deepEqual(graph.getNeighbors(vertexA).length, 0);
        assert.deepEqual(graph.getNeighbors(vertexB).length, 1);
        assert.deepEqual(graph.getNeighbors(vertexB)[0].getKey(), vertexA.getKey());
        assert.deepEqual(graph.getNeighbors(vertexC).length, 1);
        assert.deepEqual(graph.getNeighbors(vertexC)[0].getKey(), vertexA.getKey());
        assert.deepEqual(graph.getNeighbors(vertexD).length, 1);
        assert.deepEqual(graph.getNeighbors(vertexD)[0].getKey(), vertexC.getKey());
    });
    QUnit.test('should return vertices indices', function (assert) {
        var vertexA = new feng3d.GraphVertex('A');
        var vertexB = new feng3d.GraphVertex('B');
        var vertexC = new feng3d.GraphVertex('C');
        var vertexD = new feng3d.GraphVertex('D');
        var edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        var edgeBC = new feng3d.GraphEdge(vertexB, vertexC);
        var edgeCD = new feng3d.GraphEdge(vertexC, vertexD);
        var edgeBD = new feng3d.GraphEdge(vertexB, vertexD);
        var graph = new feng3d.Graph();
        graph
            .addEdge(edgeAB)
            .addEdge(edgeBC)
            .addEdge(edgeCD)
            .addEdge(edgeBD);
        var verticesIndices = graph.getVerticesIndices();
        assert.deepEqual(verticesIndices, {
            A: 0,
            B: 1,
            C: 2,
            D: 3,
        });
    });
    QUnit.test('should generate adjacency matrix for undirected graph', function (assert) {
        var vertexA = new feng3d.GraphVertex('A');
        var vertexB = new feng3d.GraphVertex('B');
        var vertexC = new feng3d.GraphVertex('C');
        var vertexD = new feng3d.GraphVertex('D');
        var edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        var edgeBC = new feng3d.GraphEdge(vertexB, vertexC);
        var edgeCD = new feng3d.GraphEdge(vertexC, vertexD);
        var edgeBD = new feng3d.GraphEdge(vertexB, vertexD);
        var graph = new feng3d.Graph();
        graph
            .addEdge(edgeAB)
            .addEdge(edgeBC)
            .addEdge(edgeCD)
            .addEdge(edgeBD);
        var adjacencyMatrix = graph.getAdjacencyMatrix();
        assert.deepEqual(adjacencyMatrix, [
            [Infinity, 0, Infinity, Infinity],
            [0, Infinity, 0, 0],
            [Infinity, 0, Infinity, 0],
            [Infinity, 0, 0, Infinity],
        ]);
    });
    QUnit.test('should generate adjacency matrix for directed graph', function (assert) {
        var vertexA = new feng3d.GraphVertex('A');
        var vertexB = new feng3d.GraphVertex('B');
        var vertexC = new feng3d.GraphVertex('C');
        var vertexD = new feng3d.GraphVertex('D');
        var edgeAB = new feng3d.GraphEdge(vertexA, vertexB, 2);
        var edgeBC = new feng3d.GraphEdge(vertexB, vertexC, 1);
        var edgeCD = new feng3d.GraphEdge(vertexC, vertexD, 5);
        var edgeBD = new feng3d.GraphEdge(vertexB, vertexD, 7);
        var graph = new feng3d.Graph(true);
        graph
            .addEdge(edgeAB)
            .addEdge(edgeBC)
            .addEdge(edgeCD)
            .addEdge(edgeBD);
        var adjacencyMatrix = graph.getAdjacencyMatrix();
        assert.deepEqual(adjacencyMatrix, [
            [Infinity, 2, Infinity, Infinity],
            [Infinity, Infinity, 1, 7],
            [Infinity, Infinity, Infinity, 5],
            [Infinity, Infinity, Infinity, Infinity],
        ]);
    });
});
QUnit.module('HashTable', function (assert) {
    QUnit.test('should create hash table of certain size', function (assert) {
        var defaultHashTable = new feng3d.HashTable();
        assert.deepEqual(defaultHashTable.buckets.length, 32);
        var biggerHashTable = new feng3d.HashTable(64);
        assert.deepEqual(biggerHashTable.buckets.length, 64);
    });
    QUnit.test('should generate proper hash for specified keys', function (assert) {
        var hashTable = new feng3d.HashTable();
        assert.deepEqual(hashTable.hash('a'), 1);
        assert.deepEqual(hashTable.hash('b'), 2);
        assert.deepEqual(hashTable.hash('abc'), 6);
    });
    QUnit.test('should set, read and delete data with collisions', function (assert) {
        var hashTable = new feng3d.HashTable(3);
        assert.deepEqual(hashTable.hash('a'), 1);
        assert.deepEqual(hashTable.hash('b'), 2);
        assert.deepEqual(hashTable.hash('c'), 0);
        assert.deepEqual(hashTable.hash('d'), 1);
        hashTable.set('a', 'sky-old');
        hashTable.set('a', 'sky');
        hashTable.set('b', 'sea');
        hashTable.set('c', 'earth');
        hashTable.set('d', 'ocean');
        assert.deepEqual(hashTable.has('x'), false);
        assert.deepEqual(hashTable.has('b'), true);
        assert.deepEqual(hashTable.has('c'), true);
        var stringifier = function (value) { return value.key + ":" + value.value; };
        assert.deepEqual(hashTable.buckets[0].toString(stringifier), 'c:earth');
        assert.deepEqual(hashTable.buckets[1].toString(stringifier), 'a:sky,d:ocean');
        assert.deepEqual(hashTable.buckets[2].toString(stringifier), 'b:sea');
        assert.deepEqual(hashTable.get('a'), 'sky');
        assert.deepEqual(hashTable.get('d'), 'ocean');
        assert.deepEqual(hashTable.get('x'), undefined);
        hashTable.delete('a');
        assert.deepEqual(hashTable.delete('not-existing'), null);
        assert.deepEqual(hashTable.get('a'), undefined);
        assert.deepEqual(hashTable.get('d'), 'ocean');
        hashTable.set('d', 'ocean-new');
        assert.deepEqual(hashTable.get('d'), 'ocean-new');
    });
    QUnit.test('should be possible to add objects to hash table', function (assert) {
        var hashTable = new feng3d.HashTable();
        hashTable.set('objectKey', { prop1: 'a', prop2: 'b' });
        var object = hashTable.get('objectKey');
        assert.deepEqual(object.prop1, 'a');
        assert.deepEqual(object.prop2, 'b');
    });
    QUnit.test('should track actual keys', function (assert) {
        var hashTable = new feng3d.HashTable(3);
        hashTable.set('a', 'sky-old');
        hashTable.set('a', 'sky');
        hashTable.set('b', 'sea');
        hashTable.set('c', 'earth');
        hashTable.set('d', 'ocean');
        assert.deepEqual(hashTable.getKeys(), ['a', 'b', 'c', 'd']);
        assert.deepEqual(hashTable.has('a'), true);
        assert.deepEqual(hashTable.has('x'), false);
        hashTable.delete('a');
        assert.deepEqual(hashTable.has('a'), false);
        assert.deepEqual(hashTable.has('b'), true);
        assert.deepEqual(hashTable.has('x'), false);
    });
});
QUnit.module("LinkedList", function () {
    QUnit.test("LinkedList", function (assert) {
        var ll = new feng3d.LinkedList();
        assert.deepEqual(ll.deleteHead(), null);
        assert.deepEqual(ll.deleteTail(), null);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("addHead", function (assert) {
        var ll = new feng3d.LinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        arr.concat().reverse().forEach(function (element) {
            ll.addHead(element);
        });
        assert.deepEqual(ll.toArray(), arr);
        ll.addHead(1);
        arr.unshift(1);
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("addTail", function (assert) {
        var ll = new feng3d.LinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        arr.forEach(function (element) {
            ll.addTail(element);
        });
        assert.deepEqual(ll.toArray(), arr);
        ll.addTail(1);
        arr.push(1);
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("delete", function (assert) {
        var ll = new feng3d.LinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        arr = arr.concat(arr);
        arr.forEach(function (element) {
            ll.addTail(element);
        });
        assert.deepEqual(ll.toArray(), arr);
        var deleteItem = arr[3];
        arr.splice(arr.indexOf(deleteItem), 1);
        ll.delete(deleteItem);
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("deleteAll", function (assert) {
        var ll = new feng3d.LinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        arr = arr.concat(arr);
        arr.forEach(function (element) {
            ll.addTail(element);
        });
        assert.deepEqual(ll.toArray(), arr);
        var deleteItem = arr[3];
        var index = arr.indexOf(deleteItem);
        while (index != -1) {
            arr.splice(index, 1);
            index = arr.indexOf(deleteItem);
        }
        ll.deleteAll(deleteItem);
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("deleteHead", function (assert) {
        var ll = new feng3d.LinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        ll.fromArray(arr);
        assert.deepEqual(ll.deleteHead(), arr.shift());
        assert.deepEqual(ll.deleteHead(), arr.shift());
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("deleteTail", function (assert) {
        var ll = new feng3d.LinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        ll.fromArray(arr);
        assert.deepEqual(ll.deleteTail(), arr.pop());
        assert.deepEqual(ll.deleteTail(), arr.pop());
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("toArray", function (assert) {
        var ll = new feng3d.LinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        ll.fromArray(arr);
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("fromArray", function (assert) {
        var ll = new feng3d.LinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        ll.fromArray(arr);
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
    QUnit.test("toString", function (assert) {
        var ll = new feng3d.LinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        ll.fromArray(arr);
        assert.ok(true, ll.toString(function (v) { return v.toFixed(3); }));
        assert.ok(ll.checkStructure());
    });
    QUnit.test("reverse", function (assert) {
        var ll = new feng3d.LinkedList();
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        ll.fromArray(arr);
        ll.reverse();
        arr.reverse();
        assert.deepEqual(ll.toArray(), arr);
        arr.length = 1;
        ll.fromArray(arr);
        ll.reverse();
        arr.reverse();
        assert.deepEqual(ll.toArray(), arr);
        assert.ok(ll.checkStructure());
    });
});
QUnit.module("MaxHeap", function () {
    QUnit.test("MaxHeap", function (assert) {
        var maxHeap = new feng3d.MaxHeap();
        assert.deepEqual(maxHeap.peek(), null);
        assert.deepEqual(maxHeap.isEmpty(), true);
    });
    QUnit.test("should add items to the heap and heapify it up", function (assert) {
        var maxHeap = new feng3d.MaxHeap();
        maxHeap.add(5);
        assert.deepEqual(maxHeap.isEmpty(), false);
        assert.deepEqual(maxHeap.peek(), 5);
        assert.deepEqual(maxHeap.toString(), '5');
        maxHeap.add(3);
        assert.deepEqual(maxHeap.peek(), 5);
        assert.deepEqual(maxHeap.toString(), '5,3');
        maxHeap.add(10);
        assert.deepEqual(maxHeap.peek(), 10);
        assert.deepEqual(maxHeap.toString(), '10,3,5');
        maxHeap.add(1);
        assert.deepEqual(maxHeap.peek(), 10);
        assert.deepEqual(maxHeap.toString(), '10,3,5,1');
        maxHeap.add(1);
        assert.deepEqual(maxHeap.peek(), 10);
        assert.deepEqual(maxHeap.toString(), '10,3,5,1,1');
        assert.deepEqual(maxHeap.poll(), 10);
        assert.deepEqual(maxHeap.toString(), '5,3,1,1');
        assert.deepEqual(maxHeap.poll(), 5);
        assert.deepEqual(maxHeap.toString(), '3,1,1');
        assert.deepEqual(maxHeap.poll(), 3);
        assert.deepEqual(maxHeap.toString(), '1,1');
    });
    QUnit.test('should poll items from the heap and heapify it down', function (assert) {
        var maxHeap = new feng3d.MaxHeap();
        maxHeap.add(5);
        maxHeap.add(3);
        maxHeap.add(10);
        maxHeap.add(11);
        maxHeap.add(1);
        assert.deepEqual(maxHeap.toString(), '11,10,5,3,1');
        assert.deepEqual(maxHeap.poll(), 11);
        assert.deepEqual(maxHeap.toString(), '10,3,5,1');
        assert.deepEqual(maxHeap.poll(), 10);
        assert.deepEqual(maxHeap.toString(), '5,3,1');
        assert.deepEqual(maxHeap.poll(), 5);
        assert.deepEqual(maxHeap.toString(), '3,1');
        assert.deepEqual(maxHeap.poll(), 3);
        assert.deepEqual(maxHeap.toString(), '1');
        assert.deepEqual(maxHeap.poll(), 1);
        assert.deepEqual(maxHeap.toString(), '');
        assert.deepEqual(maxHeap.poll(), null);
        assert.deepEqual(maxHeap.toString(), '');
    });
    QUnit.test('should heapify down through the right branch as well', function (assert) {
        var maxHeap = new feng3d.MaxHeap();
        maxHeap.add(3);
        maxHeap.add(12);
        maxHeap.add(10);
        assert.deepEqual(maxHeap.toString(), '12,3,10');
        maxHeap.add(11);
        assert.deepEqual(maxHeap.toString(), '12,11,10,3');
        assert.deepEqual(maxHeap.poll(), 12);
        assert.deepEqual(maxHeap.toString(), '11,3,10');
    });
    QUnit.test('should be possible to find item indices in heap', function (assert) {
        var maxHeap = new feng3d.MaxHeap();
        maxHeap.add(3);
        maxHeap.add(12);
        maxHeap.add(10);
        maxHeap.add(11);
        maxHeap.add(11);
        assert.deepEqual(maxHeap.toString(), '12,11,10,3,11');
        assert.deepEqual(maxHeap.find(5), []);
        assert.deepEqual(maxHeap.find(12), [0]);
        assert.deepEqual(maxHeap.find(11), [1, 4]);
    });
    QUnit.test('should be possible to remove items from heap with heapify down', function (assert) {
        var maxHeap = new feng3d.MaxHeap();
        maxHeap.add(3);
        maxHeap.add(12);
        maxHeap.add(10);
        maxHeap.add(11);
        maxHeap.add(11);
        assert.deepEqual(maxHeap.toString(), '12,11,10,3,11');
        assert.deepEqual(maxHeap.remove(12).toString(), '11,11,10,3');
        assert.deepEqual(maxHeap.remove(12).peek(), 11);
        assert.deepEqual(maxHeap.remove(11).toString(), '10,3');
        assert.deepEqual(maxHeap.remove(10).peek(), 3);
    });
    QUnit.test('should be possible to remove items from heap with heapify up', function (assert) {
        var maxHeap = new feng3d.MaxHeap();
        maxHeap.add(3);
        maxHeap.add(10);
        maxHeap.add(5);
        maxHeap.add(6);
        maxHeap.add(7);
        maxHeap.add(4);
        maxHeap.add(6);
        maxHeap.add(8);
        maxHeap.add(2);
        maxHeap.add(1);
        assert.deepEqual(maxHeap.toString(), '10,8,6,7,6,4,5,3,2,1');
        assert.deepEqual(maxHeap.remove(4).toString(), '10,8,6,7,6,1,5,3,2');
        assert.deepEqual(maxHeap.remove(3).toString(), '10,8,6,7,6,1,5,2');
        assert.deepEqual(maxHeap.remove(5).toString(), '10,8,6,7,6,1,2');
        assert.deepEqual(maxHeap.remove(10).toString(), '8,7,6,2,6,1');
        assert.deepEqual(maxHeap.remove(6).toString(), '8,7,1,2');
        assert.deepEqual(maxHeap.remove(2).toString(), '8,7,1');
        assert.deepEqual(maxHeap.remove(1).toString(), '8,7');
        assert.deepEqual(maxHeap.remove(7).toString(), '8');
        assert.deepEqual(maxHeap.remove(8).toString(), '');
    });
    QUnit.test('should be possible to remove items from heap with custom finding comparator', function (assert) {
        var maxHeap = new feng3d.MaxHeap();
        maxHeap.add('a');
        maxHeap.add('bb');
        maxHeap.add('ccc');
        maxHeap.add('dddd');
        assert.deepEqual(maxHeap.toString(), 'dddd,ccc,bb,a');
        var comparator = new feng3d.Comparator(function (a, b) {
            if (a.length === b.length) {
                return 0;
            }
            return a.length < b.length ? -1 : 1;
        });
        maxHeap.remove('hey', comparator);
        assert.deepEqual(maxHeap.toString(), 'dddd,a,bb');
    });
});
QUnit.module('MinHeap', function (assert) {
    QUnit.test('should create an empty min heap', function (assert) {
        var minHeap = new feng3d.MinHeap();
        assert.deepEqual(minHeap.peek(), null);
        assert.deepEqual(minHeap.isEmpty(), true);
    });
    QUnit.test('should add items to the heap and heapify it up', function (assert) {
        var minHeap = new feng3d.MinHeap();
        minHeap.add(5);
        assert.deepEqual(minHeap.isEmpty(), false);
        assert.deepEqual(minHeap.peek(), 5);
        assert.deepEqual(minHeap.toString(), '5');
        minHeap.add(3);
        assert.deepEqual(minHeap.peek(), 3);
        assert.deepEqual(minHeap.toString(), '3,5');
        minHeap.add(10);
        assert.deepEqual(minHeap.peek(), 3);
        assert.deepEqual(minHeap.toString(), '3,5,10');
        minHeap.add(1);
        assert.deepEqual(minHeap.peek(), 1);
        assert.deepEqual(minHeap.toString(), '1,3,10,5');
        minHeap.add(1);
        assert.deepEqual(minHeap.peek(), 1);
        assert.deepEqual(minHeap.toString(), '1,1,10,5,3');
        assert.deepEqual(minHeap.poll(), 1);
        assert.deepEqual(minHeap.toString(), '1,3,10,5');
        assert.deepEqual(minHeap.poll(), 1);
        assert.deepEqual(minHeap.toString(), '3,5,10');
        assert.deepEqual(minHeap.poll(), 3);
        assert.deepEqual(minHeap.toString(), '5,10');
    });
    QUnit.test('should poll items from the heap and heapify it down', function (assert) {
        var minHeap = new feng3d.MinHeap();
        minHeap.add(5);
        minHeap.add(3);
        minHeap.add(10);
        minHeap.add(11);
        minHeap.add(1);
        assert.deepEqual(minHeap.toString(), '1,3,10,11,5');
        assert.deepEqual(minHeap.poll(), 1);
        assert.deepEqual(minHeap.toString(), '3,5,10,11');
        assert.deepEqual(minHeap.poll(), 3);
        assert.deepEqual(minHeap.toString(), '5,11,10');
        assert.deepEqual(minHeap.poll(), 5);
        assert.deepEqual(minHeap.toString(), '10,11');
        assert.deepEqual(minHeap.poll(), 10);
        assert.deepEqual(minHeap.toString(), '11');
        assert.deepEqual(minHeap.poll(), 11);
        assert.deepEqual(minHeap.toString(), '');
        assert.deepEqual(minHeap.poll(), null);
        assert.deepEqual(minHeap.toString(), '');
    });
    QUnit.test('should heapify down through the right branch as well', function (assert) {
        var minHeap = new feng3d.MinHeap();
        minHeap.add(3);
        minHeap.add(12);
        minHeap.add(10);
        assert.deepEqual(minHeap.toString(), '3,12,10');
        minHeap.add(11);
        assert.deepEqual(minHeap.toString(), '3,11,10,12');
        assert.deepEqual(minHeap.poll(), 3);
        assert.deepEqual(minHeap.toString(), '10,11,12');
    });
    QUnit.test('should be possible to find item indices in heap', function (assert) {
        var minHeap = new feng3d.MinHeap();
        minHeap.add(3);
        minHeap.add(12);
        minHeap.add(10);
        minHeap.add(11);
        minHeap.add(11);
        assert.deepEqual(minHeap.toString(), '3,11,10,12,11');
        assert.deepEqual(minHeap.find(5), []);
        assert.deepEqual(minHeap.find(3), [0]);
        assert.deepEqual(minHeap.find(11), [1, 4]);
    });
    QUnit.test('should be possible to remove items from heap with heapify down', function (assert) {
        var minHeap = new feng3d.MinHeap();
        minHeap.add(3);
        minHeap.add(12);
        minHeap.add(10);
        minHeap.add(11);
        minHeap.add(11);
        assert.deepEqual(minHeap.toString(), '3,11,10,12,11');
        assert.deepEqual(minHeap.remove(3).toString(), '10,11,11,12');
        assert.deepEqual(minHeap.remove(3).peek(), 10);
        assert.deepEqual(minHeap.remove(11).toString(), '10,12');
        assert.deepEqual(minHeap.remove(3).peek(), 10);
    });
    QUnit.test('should be possible to remove items from heap with heapify up', function (assert) {
        var minHeap = new feng3d.MinHeap();
        minHeap.add(3);
        minHeap.add(10);
        minHeap.add(5);
        minHeap.add(6);
        minHeap.add(7);
        minHeap.add(4);
        minHeap.add(6);
        minHeap.add(8);
        minHeap.add(2);
        minHeap.add(1);
        assert.deepEqual(minHeap.toString(), '1,2,4,6,3,5,6,10,8,7');
        assert.deepEqual(minHeap.remove(8).toString(), '1,2,4,6,3,5,6,10,7');
        assert.deepEqual(minHeap.remove(7).toString(), '1,2,4,6,3,5,6,10');
        assert.deepEqual(minHeap.remove(1).toString(), '2,3,4,6,10,5,6');
        assert.deepEqual(minHeap.remove(2).toString(), '3,6,4,6,10,5');
        assert.deepEqual(minHeap.remove(6).toString(), '3,5,4,10');
        assert.deepEqual(minHeap.remove(10).toString(), '3,5,4');
        assert.deepEqual(minHeap.remove(5).toString(), '3,4');
        assert.deepEqual(minHeap.remove(3).toString(), '4');
        assert.deepEqual(minHeap.remove(4).toString(), '');
    });
    QUnit.test('should be possible to remove items from heap with custom finding comparator', function (assert) {
        var minHeap = new feng3d.MinHeap();
        minHeap.add('dddd');
        minHeap.add('ccc');
        minHeap.add('bb');
        minHeap.add('a');
        assert.deepEqual(minHeap.toString(), 'a,bb,ccc,dddd');
        var comparator = new feng3d.Comparator(function (a, b) {
            if (a.length === b.length) {
                return 0;
            }
            return a.length < b.length ? -1 : 1;
        });
        minHeap.remove('hey', comparator);
        assert.deepEqual(minHeap.toString(), 'a,bb,dddd');
    });
    QUnit.test('should remove values from heap and correctly re-order the tree', function (assert) {
        var minHeap = new feng3d.MinHeap();
        minHeap.add(1);
        minHeap.add(2);
        minHeap.add(3);
        minHeap.add(4);
        minHeap.add(5);
        minHeap.add(6);
        minHeap.add(7);
        minHeap.add(8);
        minHeap.add(9);
        assert.deepEqual(minHeap.toString(), '1,2,3,4,5,6,7,8,9');
        minHeap.remove(2);
        assert.deepEqual(minHeap.toString(), '1,4,3,8,5,6,7,9');
        minHeap.remove(4);
        assert.deepEqual(minHeap.toString(), '1,5,3,8,9,6,7');
    });
});
QUnit.module("PriorityQueue", function () {
    QUnit.test("push", function (assert) {
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        var compare = function (a, b) { return a - b; };
        var q = new feng3d.PriorityQueue(compare);
        q.push.apply(q, arr);
        var sortarr = arr.concat().sort(compare);
        assert.deepEqual(q.toArray(), sortarr);
        arr.push(1);
        q.push(1);
        sortarr = arr.concat().sort();
        assert.deepEqual(q.toArray(), sortarr);
    });
    QUnit.test("shift", function (assert) {
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        var compare = function (a, b) { return a - b; };
        var q = new feng3d.PriorityQueue(compare);
        q.push.apply(q, arr);
        var sortarr = arr.concat().sort(compare);
        for (var i = sortarr.length - 1; i >= 0; i--) {
            assert.deepEqual(q.shift(), sortarr.shift());
        }
    });
    QUnit.test("toArray", function (assert) {
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        var compare = function (a, b) { return a - b; };
        var q = new feng3d.PriorityQueue(compare);
        q.push.apply(q, arr);
        var sortarr = arr.concat().sort(compare);
        assert.deepEqual(q.toArray(), sortarr);
    });
    QUnit.test("fromArray", function (assert) {
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        var compare = function (a, b) { return a - b; };
        var q = new feng3d.PriorityQueue(compare);
        q.fromArray(arr);
        var sortarr = arr.concat().sort(compare);
        assert.deepEqual(q.toArray(), sortarr);
    });
});
QUnit.module('PriorityQueue1', function () {
    QUnit.test('should create default priority queue', function (assert) {
        var priorityQueue = new feng3d.PriorityQueue1();
        assert.deepEqual(priorityQueue != null, true);
    });
    QUnit.test('should insert items to the queue and respect priorities', function (assert) {
        var priorityQueue = new feng3d.PriorityQueue1();
        priorityQueue.add(10, 1);
        assert.deepEqual(priorityQueue.peek(), 10);
        priorityQueue.add(5, 2);
        assert.deepEqual(priorityQueue.peek(), 10);
        priorityQueue.add(100, 0);
        assert.deepEqual(priorityQueue.peek(), 100);
    });
    QUnit.test('should poll from queue with respect to priorities', function (assert) {
        var priorityQueue = new feng3d.PriorityQueue1();
        priorityQueue.add(10, 1);
        priorityQueue.add(5, 2);
        priorityQueue.add(100, 0);
        priorityQueue.add(200, 0);
        assert.deepEqual(priorityQueue.poll(), 100);
        assert.deepEqual(priorityQueue.poll(), 200);
        assert.deepEqual(priorityQueue.poll(), 10);
        assert.deepEqual(priorityQueue.poll(), 5);
    });
    QUnit.test('should be possible to change priority of internal nodes', function (assert) {
        var priorityQueue = new feng3d.PriorityQueue1();
        priorityQueue.add(10, 1);
        priorityQueue.add(5, 2);
        priorityQueue.add(100, 0);
        priorityQueue.add(200, 0);
        priorityQueue.changePriority(100, 10);
        priorityQueue.changePriority(10, 20);
        assert.deepEqual(priorityQueue.poll(), 200);
        assert.deepEqual(priorityQueue.poll(), 5);
        assert.deepEqual(priorityQueue.poll(), 100);
        assert.deepEqual(priorityQueue.poll(), 10);
    });
    QUnit.test('should be possible to change priority of head node', function (assert) {
        var priorityQueue = new feng3d.PriorityQueue1();
        priorityQueue.add(10, 1);
        priorityQueue.add(5, 2);
        priorityQueue.add(100, 0);
        priorityQueue.add(200, 0);
        priorityQueue.changePriority(200, 10);
        priorityQueue.changePriority(10, 20);
        assert.deepEqual(priorityQueue.poll(), 100);
        assert.deepEqual(priorityQueue.poll(), 5);
        assert.deepEqual(priorityQueue.poll(), 200);
        assert.deepEqual(priorityQueue.poll(), 10);
    });
    QUnit.test('should be possible to change priority along with node addition', function (assert) {
        var priorityQueue = new feng3d.PriorityQueue1();
        priorityQueue.add(10, 1);
        priorityQueue.add(5, 2);
        priorityQueue.add(100, 0);
        priorityQueue.add(200, 0);
        priorityQueue.changePriority(200, 10);
        priorityQueue.changePriority(10, 20);
        priorityQueue.add(15, 15);
        assert.deepEqual(priorityQueue.poll(), 100);
        assert.deepEqual(priorityQueue.poll(), 5);
        assert.deepEqual(priorityQueue.poll(), 200);
        assert.deepEqual(priorityQueue.poll(), 15);
        assert.deepEqual(priorityQueue.poll(), 10);
    });
    QUnit.test('should be possible to search in priority queue by value', function (assert) {
        var priorityQueue = new feng3d.PriorityQueue1();
        priorityQueue.add(10, 1);
        priorityQueue.add(5, 2);
        priorityQueue.add(100, 0);
        priorityQueue.add(200, 0);
        priorityQueue.add(15, 15);
        assert.deepEqual(priorityQueue.hasValue(70), false);
        assert.deepEqual(priorityQueue.hasValue(15), true);
    });
});
QUnit.module("Queue", function () {
    QUnit.test("isEmpty", function (assert) {
        var q = new feng3d.Queue();
        assert.deepEqual(q.isEmpty(), true);
    });
    QUnit.test("empty", function (assert) {
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        var q = new feng3d.Queue();
        arr.forEach(function (element) {
            q.enqueue(element);
        });
        q.empty();
        assert.deepEqual(q.isEmpty(), true);
    });
    QUnit.test("peek", function (assert) {
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        var q = new feng3d.Queue();
        arr.forEach(function (element) {
            q.enqueue(element);
        });
        assert.deepEqual(q.peek(), arr[0]);
    });
    QUnit.test("enqueue", function (assert) {
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        var q = new feng3d.Queue();
        arr.forEach(function (element) {
            q.enqueue(element);
        });
        assert.deepEqual(q.peek(), arr[0]);
    });
    QUnit.test("enqueue", function (assert) {
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        var q = new feng3d.Queue();
        arr.forEach(function (element) {
            q.enqueue(element);
        });
        while (!q.isEmpty()) {
            assert.deepEqual(q.dequeue(), arr.shift());
        }
    });
    QUnit.test("toString", function (assert) {
        var arr = feng3d.utils.createArray(10, function () { return Math.random(); });
        var q = new feng3d.Queue();
        arr.forEach(function (element) {
            q.enqueue(element);
        });
        assert.ok(true, q.toString(function (v) { return v.toFixed(3); }));
    });
});
QUnit.module("Utils", function () {
    QUnit.test("arrayFrom", function (assert) {
        var arr = feng3d.utils.createArray(100, function () { return Math.floor(Math.random() * 100); });
        var float32Array = new Float32Array(arr);
        var arr0 = feng3d.utils.arrayFrom(float32Array);
        assert.deepEqual(arr, arr0);
    });
    QUnit.test("arrayUnique", function (assert) {
        var arr = feng3d.utils.createArray(100, function () { return Math.floor(Math.random() * 100); });
        feng3d.utils.arrayUnique(arr);
        assert.deepEqual(feng3d.utils.arrayIsUnique(arr), true);
    });
    QUnit.test("arrayIsUnique", function (assert) {
        assert.deepEqual(feng3d.utils.arrayIsUnique([1, 2, 3]), true);
        assert.deepEqual(feng3d.utils.arrayIsUnique([1, 2, 2]), false);
    });
    QUnit.test("createArray", function (assert) {
        var arr = feng3d.utils.createArray(100, function (i) { return i; });
        for (var i = 0; i < arr.length; i++) {
            assert.deepEqual(i, arr[i]);
        }
    });
    QUnit.test("binarySearch", function (assert) {
        var arr = feng3d.utils.createArray(100, function () { return Math.floor(Math.random() * 100); });
        var compareFn = function (a, b) { return a - b; };
        arr.sort(compareFn);
        var index = Math.floor(arr.length * Math.random());
        var find = feng3d.utils.binarySearch(arr, arr[index], compareFn);
        assert.deepEqual(find <= index, true);
        assert.deepEqual(arr[index], arr[find]);
        if (find > 0)
            assert.equal(arr[find] - arr[find - 1] > 0, true);
        if (find < arr.length - 1)
            assert.equal(arr[find] - arr[find + 1] <= 0, true);
        assert.deepEqual(-1, feng3d.utils.binarySearch(arr, -1, compareFn));
    });
    QUnit.test("binarySearchInsert", function (assert) {
        var arr = feng3d.utils.createArray(100, function () { return Math.floor(Math.random() * 100); });
        var compareFn = function (a, b) { return a - b; };
        arr.sort(compareFn);
        var index = Math.floor(arr.length * Math.random());
        var find = feng3d.utils.binarySearchInsert(arr, arr[index], compareFn);
        assert.deepEqual(find <= index, true);
        assert.deepEqual(0, feng3d.utils.binarySearchInsert(arr, -1, compareFn));
        assert.deepEqual(100, feng3d.utils.binarySearchInsert(arr, 10000, compareFn));
    });
});
var feng3d;
(function (feng3d) {
    QUnit.module("AABB", function () {
        QUnit.test("intersectsTriangle", function (assert) {
            var aabb = feng3d.AABB.random();
            var triangle = feng3d.Triangle3D.fromPoints(aabb.randomPoint(), aabb.randomPoint(), aabb.randomPoint());
            assert.ok(aabb.intersectsTriangle(triangle));
            var triangle1 = feng3d.Triangle3D.fromPoints(aabb.randomPoint(), aabb.randomPoint().addNumber(5), aabb.randomPoint().addNumber(6));
            assert.ok(aabb.intersectsTriangle(triangle1));
            //
            var aabb2 = new feng3d.AABB(new feng3d.Vector3(-1, -1, -1), new feng3d.Vector3(1, 1, 1));
            var triangle2 = new feng3d.Triangle3D(new feng3d.Vector3(1.5, 0, 0), new feng3d.Vector3(0, 1.5, 0), new feng3d.Vector3(1.5, 1.5, 0));
            assert.ok(aabb2.intersectsTriangle(triangle2));
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
            var n = feng3d.Vector3.random().cross(l.direction).scaleNumber(100);
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
            assert.ok(Math.equals(p.getOrigin().distance(feng3d.Vector3.ZERO), p.distanceWithPoint(feng3d.Vector3.ZERO)));
        });
        QUnit.test("randomPoint", function (assert) {
            var p = feng3d.Plane3D.random();
            assert.ok(p.onWithPoint(p.randomPoint()));
        });
        QUnit.test("distance", function (assert) {
            var plane = new feng3d.Plane3D();
            assert.ok(plane.distanceWithPoint(new feng3d.Vector3()) == plane.d);
            //
            var p = feng3d.Vector3.random().scaleNumber(100);
            var n = feng3d.Vector3.random().normalize();
            var length = (0.5 - Math.random()) * 100;
            plane.fromNormalAndPoint(n, p);
            //
            var p0 = n.scaleNumberTo(length).add(p);
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
            var p0 = feng3d.Vector3.random().scaleNumber(100);
            var p1 = feng3d.Vector3.random().scaleNumber(100);
            var p2 = feng3d.Vector3.random().scaleNumber(100);
            var p3 = feng3d.Vector3.random().scaleNumber(100);
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
    QUnit.module("Quaternion", function () {
        QUnit.test("rotatePoint", function (assert) {
            var quat = feng3d.Quaternion.random();
            var v = feng3d.Vector3.random();
            var v1 = quat.rotatePoint(v);
            var v2 = quat.toMatrix3D().transformVector(v);
            assert.ok(v1.equals(v2));
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
            assert.ok(Math.equals(circumcenter.subTo(t.p0).length, circumcenter.subTo(t.p1).length));
            assert.ok(Math.equals(circumcenter.subTo(t.p0).length, circumcenter.subTo(t.p2).length));
        });
        QUnit.test("getInnercenter", function (assert) {
            var t = feng3d.Triangle3D.random();
            var p = t.getInnercenter();
            var d0 = feng3d.Line3D.fromPoints(t.p0, t.p1).distanceWithPoint(p);
            var d1 = feng3d.Line3D.fromPoints(t.p0, t.p2).distanceWithPoint(p);
            var d2 = feng3d.Line3D.fromPoints(t.p2, t.p1).distanceWithPoint(p);
            assert.ok(t.onWithPoint(p));
            assert.ok(Math.equals(d0, d1));
            assert.ok(Math.equals(d0, d2));
        });
        QUnit.test("getOrthocenter", function (assert) {
            var t = feng3d.Triangle3D.random();
            var p = t.getOrthocenter();
            assert.ok(Math.equals(0, t.p0.subTo(t.p1).dot(p.subTo(t.p2))));
            assert.ok(Math.equals(0, t.p2.subTo(t.p1).dot(p.subTo(t.p0))));
            assert.ok(Math.equals(0, t.p2.subTo(t.p0).dot(p.subTo(t.p1))));
        });
        QUnit.test("decomposeWithPoint", function (assert) {
            //分割后的三角形面积总和与原三角形面积相等
            var t = feng3d.Triangle3D.random();
            var p = t.randomPoint();
            var ts = t.decomposeWithPoint(p);
            assert.ok(ts.length <= 3);
            assert.ok(Math.equals(t.area(), ts.reduce(function (area, t) { return area + t.area(); }, 0), 0.001));
            p = t.getSegments()[0].getPoint(Math.random());
            ts = t.decomposeWithPoint(p);
            assert.ok(ts.length <= 2);
            assert.ok(Math.equals(t.area(), ts.reduce(function (area, t) { return area + t.area(); }, 0), 0.001));
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
            assert.ok(Math.equals(ts.reduce(function (v, t) { return v + t.area(); }, 0), t.area(), 0.001));
            s = feng3d.Segment3D.fromPoints(t.randomPoint(), t.randomPoint());
            ts = t.decomposeWithSegment(s);
            assert.ok(ts.length <= 5);
            assert.ok(Math.equals(ts.reduce(function (v, t) { return v + t.area(); }, 0), t.area(), 0.001));
        });
        QUnit.test("decomposeWithLine", function (assert) {
            var t = feng3d.Triangle3D.random();
            var l = feng3d.Line3D.fromPoints(t.randomPoint(), t.randomPoint().add(t.getNormal()));
            var ts = t.decomposeWithLine(l);
            assert.ok(ts.length <= 3);
            assert.ok(Math.equals(ts.reduce(function (v, t) { return v + t.area(); }, 0), t.area(), 0.001));
            l = feng3d.Line3D.fromPoints(t.randomPoint(), t.randomPoint());
            ts = t.decomposeWithLine(l);
            assert.ok(ts.length <= 3);
            assert.ok(Math.equals(ts.reduce(function (v, t) { return v + t.area(); }, 0), t.area(), 0.0001));
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
        QUnit.test("rasterize 栅格化为点阵", function (assert) {
            var t = feng3d.Triangle3D.random(10);
            var ps = t.rasterize();
            if (ps.length == 0)
                assert.ok(true);
            ps.forEach(function (v, i) {
                if (i % 3 == 0) {
                    assert.ok(t.onWithPoint(new feng3d.Vector3(ps[i], ps[i + 1], ps[i + 2]), 0.5));
                }
            });
        });
        QUnit.test("rasterizeCustom 栅格化为点阵", function (assert) {
            var t = feng3d.Triangle3D.random(10);
            var ps = t.rasterizeCustom(feng3d.Vector3.random(0.5).addNumber(0.25), feng3d.Vector3.random());
            if (ps.length == 0)
                assert.ok(true);
            ps.forEach(function (v) {
                assert.ok(t.onWithPoint(new feng3d.Vector3(v.xv, v.yv, v.zv), 0.5));
            });
        });
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    QUnit.module("TriangleGeometry", function () {
        QUnit.test("fromBox,getBox", function (assert) {
            var box = feng3d.AABB.random();
            var triangleGeometry = feng3d.TriangleGeometry.fromBox(box);
            assert.ok(triangleGeometry.getBox().equals(box));
        });
        QUnit.test("getPoints", function (assert) {
            var box = feng3d.AABB.random();
            var triangleGeometry = feng3d.TriangleGeometry.fromBox(box);
            assert.ok(triangleGeometry.getPoints().length == 8);
        });
        QUnit.test("isClosed", function (assert) {
            // var box = Box.random();
            var box = new feng3d.AABB(new feng3d.Vector3(), new feng3d.Vector3(1, 1, 1));
            var triangleGeometry = feng3d.TriangleGeometry.fromBox(box);
            assert.ok(triangleGeometry.isClosed());
            triangleGeometry.triangles.pop();
            assert.notOk(triangleGeometry.isClosed());
        });
        QUnit.test("containsPoint", function (assert) {
            var box = feng3d.AABB.random();
            var triangleGeometry = feng3d.TriangleGeometry.fromBox(box);
            assert.ok(triangleGeometry.containsPoint(box.randomPoint()));
            assert.ok(box.toPoints().every(function (v) {
                return triangleGeometry.containsPoint(v);
            }));
            assert.ok(!triangleGeometry.containsPoint(box.max.addTo(new feng3d.Vector3(1, 0, 0))));
        });
        QUnit.test("intersectionWithSegment", function (assert) {
            var box = feng3d.AABB.random();
            var triangleGeometry = feng3d.TriangleGeometry.fromBox(box);
            var r = triangleGeometry.intersectionWithSegment(feng3d.Segment3D.fromPoints(box.min, box.max));
            assert.ok(r);
            if (r) {
                assert.ok(r.segments.length == 0);
                assert.ok(r.points.length == 2);
                assert.ok(feng3d.Segment3D.fromPoints(r.points[0], r.points[1]).equals(feng3d.Segment3D.fromPoints(box.min, box.max)));
            }
            var p0 = new feng3d.Vector3(box.min.x, box.min.y, Math.lerp(box.min.z, box.max.z, Math.random()));
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
    var bezier = feng3d.bezierCurve;
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
    var bezier = feng3d.bezierCurve;
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
QUnit.module("Transform", function () {
    QUnit.test("toMatrix3D,pointToWorldFrame", function (assert) {
        var trans = new CANNON.Transform();
        trans.position = feng3d.Vector3.random();
        trans.quaternion = feng3d.Quaternion.random();
        var mat = trans.toMatrix3D();
        var v = feng3d.Vector3.random();
        var v1 = new feng3d.Vector3();
        var v2 = new feng3d.Vector3();
        trans.pointToWorldFrame(v, v1);
        mat.transformVector(v, v2);
        assert.ok(v1.equals(v2));
    });
    QUnit.test("pointToLocalFrame,pointToWorldFrame", function (assert) {
        var trans = new CANNON.Transform();
        trans.position = feng3d.Vector3.random();
        trans.quaternion = feng3d.Quaternion.random();
        var v = feng3d.Vector3.random();
        var v1 = trans.pointToWorldFrame(v);
        var v2 = trans.pointToLocalFrame(v1);
        assert.ok(v.equals(v2));
    });
    QUnit.test("vectorToWorldFrame,vectorToLocalFrame", function (assert) {
        var trans = new CANNON.Transform();
        trans.position = feng3d.Vector3.random();
        trans.quaternion = feng3d.Quaternion.random();
        var v = feng3d.Vector3.random();
        var v1 = trans.vectorToWorldFrame(v);
        var v2 = trans.vectorToLocalFrame(v1);
        assert.ok(v.equals(v2));
        var mat = trans.toMatrix3D();
        var v3 = mat.deltaTransformVector(v);
        mat.invert();
        var v4 = mat.deltaTransformVector(v3);
        assert.ok(v.equals(v4));
        assert.ok(v1.equals(v3));
        assert.ok(v2.equals(v4));
    });
});
QUnit.module("Array", function () {
    QUnit.test("equal", function (assert) {
        assert.ok([1, 2, 3].equal([1, 2, 3]));
        assert.ok(![{}, 2, 3].equal([{}, 2, 3]));
        var obj = {};
        assert.ok([obj, 2, 3].equal([obj, 2, 3]));
    });
    QUnit.test("concatToSelf", function (assert) {
        var arr = [0];
        arr.concatToSelf(1, 2, 3, [4, 5, 6], 7, 8, 9);
        var arr1 = Array(10).fill(0).map(function (v, i) { return i; });
        assert.ok(arr.equal(arr1));
    });
    QUnit.test("unique", function (assert) {
        var arr1 = Array(10000).fill(0).map(function (v, i) { return (Math.random() < 0.1 ? null : Math.floor(10 * Math.random())); });
        arr1.unique();
        assert.ok(arr1.length == 11);
        var arrObj = Array(10).fill(0).map(function (v) { return ({}); });
        var arr2 = Array(10000).fill(0).map(function (v, i) { return (arrObj[Math.floor(10 * Math.random())]); });
        arr2.unique();
        assert.ok(arr2.length == 10);
    });
    QUnit.test("delete", function (assert) {
        var arr1 = Array(10).fill(0).map(function (v, i) { return i; });
        arr1.delete(arr1[Math.floor(10 * Math.random())]);
        assert.ok(arr1.length == 9);
        var arr2 = Array(10).fill(0).map(function (v) { return ({}); });
        arr2.delete(arr2[Math.floor(10 * Math.random())]);
        assert.ok(arr2.length == 9);
    });
});
QUnit.module("Object", function () {
    QUnit.test("assignShallow", function (assert) {
        var o = { a: 1, b: 2 };
        Object.assignShallow(o, { a: 1 });
        assert.ok(o.a == 1);
        var o1 = { a: 1, v2: new feng3d.Vector2() };
        var v2 = new feng3d.Vector2();
        Object.assignShallow(o1, { v2: v2 });
        assert.ok(o1.v2 == v2);
    });
    QUnit.test("assignDeep", function (assert) {
        var o = { a: 1, b: 2 };
        Object.assignDeep(o, { a: 1 });
        assert.ok(o.a == 1);
        var v20 = new feng3d.Vector2();
        var o1 = { a: 1, v2: v20, str: "" };
        var v21 = new feng3d.Vector2();
        Object.assignDeep(o1, { v2: v21, str: "asjdlskj" });
        assert.ok(o1.v2 == v21);
        var v3 = new feng3d.Vector3();
        var o2 = { a: 1, v2: v20, v3: v3 };
        Object.assignDeep(o2, { v2: { x: 1, y: 2 }, v3: { __class__: "feng3d.Vector3", x: 1 } }, function (target, source, key, replacers, deep) {
            if (Object.isObject(source[key]) && source[key]["__class__"] == "feng3d.Vector3") {
                target[key] = new feng3d.Vector3();
            }
            return false;
        });
        assert.ok(o2.v2 == v20);
        assert.ok(o2.v2.y == 2);
        assert.ok(o2.v3 != v3);
        assert.ok(o2.v3.x == 1);
        // function
        var fo = { f: function () { return 1; } };
        var o3 = { a: 3, fo: fo };
        Object.assignDeep(o3, { fo: { f: function () { return 3; } } });
        assert.ok(o3.fo == fo);
        assert.ok(o3.fo.f() == 3);
    });
    QUnit.test("isObject", function (assert) {
        var A = /** @class */ (function () {
            function A() {
            }
            return A;
        }());
        assert.ok(!Object.isObject(1));
        assert.ok(!Object.isObject([]));
        assert.ok(!Object.isObject(new A()));
        assert.ok(!Object.isObject(false));
        assert.ok(!Object.isObject(window));
        assert.ok(!Object.isObject("window"));
        assert.ok(Object.isObject({}));
        assert.ok(Object.isObject({ a: 1 }));
        // 测试 参考：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
        var iframe = document.createElement('iframe');
        iframe.name = "test Object.isObject IFrame";
        document.body.appendChild(iframe);
        var xObject = window.frames[window.frames.length - 1]["Object"];
        var obj = new xObject();
        assert.ok(Object.isObject(obj));
        assert.ok(Object != obj.constructor);
        iframe.remove();
    });
    QUnit.test("equalDeep", function (assert) {
        var o = { a: 1, b: { c: true, d: [1, 2, true, "abc"], e: "f" } };
        var o1 = JSON.parse(JSON.stringify(o));
        assert.ok(Object.equalDeep(o, o1));
        o.b.e = "a";
        assert.ok(!Object.equalDeep(o, o1));
        var v = new feng3d.Vector3(1, 2, 3);
        var v1 = new feng3d.Vector3(1, 2, 3);
        assert.ok(Object.equalDeep(v, v1));
        v1.z = 4;
        assert.ok(!Object.equalDeep(v, v1));
    });
    QUnit.test("getPropertyValue", function (assert) {
        // 对象
        var o = { a: 1, b: { c: true, d: [1, 2, true, "abc"], e: "f" } };
        assert.ok(Object.getPropertyValue(o, "b.e") == o.b.e);
        assert.ok(Object.getPropertyValue(o, ["b", "e"]) == o.b.e);
        assert.ok(Object.getPropertyValue(o, "b.f") == undefined);
        // 数组
        var arr = [[1, 2, [3, 4, 5, [6, 7]]]];
        assert.ok(Object.getPropertyValue(arr, "0.1") == 2);
        assert.ok(Object.getPropertyValue(arr, ["0", "1"]) == 2);
        assert.ok(Object.getPropertyValue(arr, "0.2.3.1") == 7);
        assert.ok(Object.getPropertyValue(arr, ["0", "2", "3", "1"]) == 7);
        assert.ok(Object.getPropertyValue(arr, "2.2.3.1") == undefined);
    });
    QUnit.test("getPropertyChains", function (assert) {
        // 对象
        var o = { a: 1, b: { c: true, d: [1, 2, true, "abc"], e: "f" } };
        var chains = Object.getPropertyChains(o);
        assert.equal(chains.length, 7);
        var o1 = { a: 1, b: { c: true } };
        var chains1 = Object.getPropertyChains(o1);
        assert.equal(chains1.length, 2);
        assert.ok(chains1.indexOf("a") != -1);
        assert.ok(chains1.indexOf("b.c") != -1);
    });
});
QUnit.module("FunctionWrap", function () {
    QUnit.test("wrap & unwrap ", function (assert) {
        var o = {
            v: 1, f: function (a) {
                this.v = this.v + a;
            }
        };
        function wrapFunc(a) {
            this.v = 0;
        }
        // 添加函数在指定函数之前执行
        feng3d.functionwrap.wrap(o, "f", wrapFunc);
        var v = Math.random();
        o.f(v);
        assert.ok(o.v == v);
        // 添加函数在指定函数之后执行
        feng3d.functionwrap.wrap(o, "f", wrapFunc, false);
        var v = Math.random();
        o.f(v);
        assert.ok(o.v == 0);
        assert.ok(o[feng3d.__functionwrap__]);
        feng3d.functionwrap.unwrap(o, "f", wrapFunc);
        assert.ok(!o[feng3d.__functionwrap__]);
        o.v = 0;
        var v = Math.random();
        o.f(v);
        assert.ok(o.v == v);
        var vec2 = new feng3d.Vector2();
        var propertyDescriptor = Object.getOwnPropertyDescriptor(vec2, "sub");
        feng3d.functionwrap.wrap(vec2, "sub", function (v) { v.init(0, 0); return null; });
        assert.ok(vec2[feng3d.__functionwrap__]);
        feng3d.functionwrap.unwrap(vec2, "sub");
        assert.ok(!vec2[feng3d.__functionwrap__]);
        var propertyDescriptor1 = Object.getOwnPropertyDescriptor(vec2, "sub");
        assert.deepEqual(propertyDescriptor, propertyDescriptor1);
    });
    QUnit.test("wrapAsyncFunc", function (assert) {
        var done = assert.async();
        // 执行次数
        var executions = 0;
        // 异步函数
        function af(a, callback) {
            if (callback === void 0) { callback = (function () { }); }
            setTimeout(function () {
                executions++;
                callback(a * a);
            }, Math.randInt(10, 50));
        }
        // 包装后的函数
        function wrapFunc(a, callback) {
            feng3d.functionwrap.wrapAsyncFunc(null, af, [1], callback);
        }
        // 测试同时调用五次 af 函数
        function testAfs(callback) {
            executions = 0;
            var callbackTime = 0;
            var fns = new Array(5).fill(5).map(function (v) { return function (callback) { return af(v, function () {
                callbackTime++;
                callback();
            }); }; });
            // 同时调用五次函数并等待完成
            feng3d.task.parallel(fns)(function () {
                // af 函数 执行5次
                assert.equal(executions, 5);
                // 回调执行5次
                assert.equal(callbackTime, 5);
                callback();
            });
        }
        // 测试同时五次调用 wrapFunc 函数
        function testWrapFuncs(callback) {
            executions = 0;
            var callbackTime = 0;
            var fns = new Array(5).fill(5).map(function (v) { return function (callback) { return wrapFunc(v, function () {
                callbackTime++;
                callback();
            }); }; });
            // 同时调用五次函数并等待完成
            feng3d.task.parallel(fns)(function () {
                // af 函数 执行1次
                assert.equal(executions, 1);
                // 回调执行5次
                assert.equal(callbackTime, 5);
                callback();
            });
        }
        // 串联（依次）执行两个测试函数
        feng3d.task.series([testAfs, testWrapFuncs])(function () {
            done();
        });
    });
});
// QUnit.module("Path", () =>
// {
//     var path = feng3d.path;
//     QUnit.test("basename", (assert) =>
//     {
//         // assert.strictEqual(path.basename(__filename), 'test-path-basename.js');
//         // assert.strictEqual(path.basename(__filename, '.js'), 'test-path-basename');
//         assert.strictEqual(path.basename('.js', '.js'), '');
//         assert.strictEqual(path.basename(''), '');
//         assert.strictEqual(path.basename('/dir/basename.ext'), 'basename.ext');
//         assert.strictEqual(path.basename('/basename.ext'), 'basename.ext');
//         assert.strictEqual(path.basename('basename.ext'), 'basename.ext');
//         assert.strictEqual(path.basename('basename.ext/'), 'basename.ext');
//         assert.strictEqual(path.basename('basename.ext//'), 'basename.ext');
//         assert.strictEqual(path.basename('aaa/bbb', '/bbb'), 'bbb');
//         assert.strictEqual(path.basename('aaa/bbb', 'a/bbb'), 'bbb');
//         assert.strictEqual(path.basename('aaa/bbb', 'bbb'), 'bbb');
//         assert.strictEqual(path.basename('aaa/bbb//', 'bbb'), 'bbb');
//         assert.strictEqual(path.basename('aaa/bbb', 'bb'), 'b');
//         assert.strictEqual(path.basename('aaa/bbb', 'b'), 'bb');
//         assert.strictEqual(path.basename('/aaa/bbb', '/bbb'), 'bbb');
//         assert.strictEqual(path.basename('/aaa/bbb', 'a/bbb'), 'bbb');
//         assert.strictEqual(path.basename('/aaa/bbb', 'bbb'), 'bbb');
//         assert.strictEqual(path.basename('/aaa/bbb//', 'bbb'), 'bbb');
//         assert.strictEqual(path.basename('/aaa/bbb', 'bb'), 'b');
//         assert.strictEqual(path.basename('/aaa/bbb', 'b'), 'bb');
//         assert.strictEqual(path.basename('/aaa/bbb'), 'bbb');
//         assert.strictEqual(path.basename('/aaa/'), 'aaa');
//         assert.strictEqual(path.basename('/aaa/b'), 'b');
//         assert.strictEqual(path.basename('/a/b'), 'b');
//         assert.strictEqual(path.basename('//a'), 'a');
//         assert.strictEqual(path.basename('a', 'a'), '');
//         // On Windows a backslash acts as a path separator.
//         assert.strictEqual(path.win32.basename('\\dir\\basename.ext'), 'basename.ext');
//         assert.strictEqual(path.win32.basename('\\basename.ext'), 'basename.ext');
//         assert.strictEqual(path.win32.basename('basename.ext'), 'basename.ext');
//         assert.strictEqual(path.win32.basename('basename.ext\\'), 'basename.ext');
//         assert.strictEqual(path.win32.basename('basename.ext\\\\'), 'basename.ext');
//         assert.strictEqual(path.win32.basename('foo'), 'foo');
//         assert.strictEqual(path.win32.basename('aaa\\bbb', '\\bbb'), 'bbb');
//         assert.strictEqual(path.win32.basename('aaa\\bbb', 'a\\bbb'), 'bbb');
//         assert.strictEqual(path.win32.basename('aaa\\bbb', 'bbb'), 'bbb');
//         assert.strictEqual(path.win32.basename('aaa\\bbb\\\\\\\\', 'bbb'), 'bbb');
//         assert.strictEqual(path.win32.basename('aaa\\bbb', 'bb'), 'b');
//         assert.strictEqual(path.win32.basename('aaa\\bbb', 'b'), 'bb');
//         assert.strictEqual(path.win32.basename('C:'), '');
//         assert.strictEqual(path.win32.basename('C:.'), '.');
//         assert.strictEqual(path.win32.basename('C:\\'), '');
//         assert.strictEqual(path.win32.basename('C:\\dir\\base.ext'), 'base.ext');
//         assert.strictEqual(path.win32.basename('C:\\basename.ext'), 'basename.ext');
//         assert.strictEqual(path.win32.basename('C:basename.ext'), 'basename.ext');
//         assert.strictEqual(path.win32.basename('C:basename.ext\\'), 'basename.ext');
//         assert.strictEqual(path.win32.basename('C:basename.ext\\\\'), 'basename.ext');
//         assert.strictEqual(path.win32.basename('C:foo'), 'foo');
//         assert.strictEqual(path.win32.basename('file:stream'), 'file:stream');
//         assert.strictEqual(path.win32.basename('a', 'a'), '');
//         // On unix a backslash is just treated as any other character.
//         assert.strictEqual(path.posix.basename('\\dir\\basename.ext'),
//             '\\dir\\basename.ext');
//         assert.strictEqual(path.posix.basename('\\basename.ext'), '\\basename.ext');
//         assert.strictEqual(path.posix.basename('basename.ext'), 'basename.ext');
//         assert.strictEqual(path.posix.basename('basename.ext\\'), 'basename.ext\\');
//         assert.strictEqual(path.posix.basename('basename.ext\\\\'), 'basename.ext\\\\');
//         assert.strictEqual(path.posix.basename('foo'), 'foo');
//         // POSIX filenames may include control characters
//         // c.f. http://www.dwheeler.com/essays/fixing-unix-linux-filenames.html
//         const controlCharFilename = `Icon${String.fromCharCode(13)}`;
//         assert.strictEqual(path.posix.basename(`/a/b/${controlCharFilename}`),
//             controlCharFilename);
//     });
//     QUnit.test("dirname", (assert) =>
//     {
//         // assert.strictEqual(path.dirname(__filename).substr(-13),
//         //                    common.isWindows ? 'test\\parallel' : 'test/parallel');
//         assert.strictEqual(path.posix.dirname('/a/b/'), '/a');
//         assert.strictEqual(path.posix.dirname('/a/b'), '/a');
//         assert.strictEqual(path.posix.dirname('/a'), '/');
//         assert.strictEqual(path.posix.dirname(''), '.');
//         assert.strictEqual(path.posix.dirname('/'), '/');
//         assert.strictEqual(path.posix.dirname('////'), '/');
//         assert.strictEqual(path.posix.dirname('//a'), '//');
//         assert.strictEqual(path.posix.dirname('foo'), '.');
//         assert.strictEqual(path.win32.dirname('c:\\'), 'c:\\');
//         assert.strictEqual(path.win32.dirname('c:\\foo'), 'c:\\');
//         assert.strictEqual(path.win32.dirname('c:\\foo\\'), 'c:\\');
//         assert.strictEqual(path.win32.dirname('c:\\foo\\bar'), 'c:\\foo');
//         assert.strictEqual(path.win32.dirname('c:\\foo\\bar\\'), 'c:\\foo');
//         assert.strictEqual(path.win32.dirname('c:\\foo\\bar\\baz'), 'c:\\foo\\bar');
//         assert.strictEqual(path.win32.dirname('\\'), '\\');
//         assert.strictEqual(path.win32.dirname('\\foo'), '\\');
//         assert.strictEqual(path.win32.dirname('\\foo\\'), '\\');
//         assert.strictEqual(path.win32.dirname('\\foo\\bar'), '\\foo');
//         assert.strictEqual(path.win32.dirname('\\foo\\bar\\'), '\\foo');
//         assert.strictEqual(path.win32.dirname('\\foo\\bar\\baz'), '\\foo\\bar');
//         assert.strictEqual(path.win32.dirname('c:'), 'c:');
//         assert.strictEqual(path.win32.dirname('c:foo'), 'c:');
//         assert.strictEqual(path.win32.dirname('c:foo\\'), 'c:');
//         assert.strictEqual(path.win32.dirname('c:foo\\bar'), 'c:foo');
//         assert.strictEqual(path.win32.dirname('c:foo\\bar\\'), 'c:foo');
//         assert.strictEqual(path.win32.dirname('c:foo\\bar\\baz'), 'c:foo\\bar');
//         assert.strictEqual(path.win32.dirname('file:stream'), '.');
//         assert.strictEqual(path.win32.dirname('dir\\file:stream'), 'dir');
//         assert.strictEqual(path.win32.dirname('\\\\unc\\share'),
//             '\\\\unc\\share');
//         assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo'),
//             '\\\\unc\\share\\');
//         assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\'),
//             '\\\\unc\\share\\');
//         assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\bar'),
//             '\\\\unc\\share\\foo');
//         assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\bar\\'),
//             '\\\\unc\\share\\foo');
//         assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\bar\\baz'),
//             '\\\\unc\\share\\foo\\bar');
//         assert.strictEqual(path.win32.dirname('/a/b/'), '/a');
//         assert.strictEqual(path.win32.dirname('/a/b'), '/a');
//         assert.strictEqual(path.win32.dirname('/a'), '/');
//         assert.strictEqual(path.win32.dirname(''), '.');
//         assert.strictEqual(path.win32.dirname('/'), '/');
//         assert.strictEqual(path.win32.dirname('////'), '/');
//         assert.strictEqual(path.win32.dirname('foo'), '.');
//     });
//     QUnit.test("dirname", (assert) =>
//     {
//         // assert.strictEqual(path.dirname(__filename).substr(-13),
//         //                    common.isWindows ? 'test\\parallel' : 'test/parallel');
//         assert.strictEqual(path.posix.dirname('/a/b/'), '/a');
//         assert.strictEqual(path.posix.dirname('/a/b'), '/a');
//         assert.strictEqual(path.posix.dirname('/a'), '/');
//         assert.strictEqual(path.posix.dirname(''), '.');
//         assert.strictEqual(path.posix.dirname('/'), '/');
//         assert.strictEqual(path.posix.dirname('////'), '/');
//         assert.strictEqual(path.posix.dirname('//a'), '//');
//         assert.strictEqual(path.posix.dirname('foo'), '.');
//         assert.strictEqual(path.win32.dirname('c:\\'), 'c:\\');
//         assert.strictEqual(path.win32.dirname('c:\\foo'), 'c:\\');
//         assert.strictEqual(path.win32.dirname('c:\\foo\\'), 'c:\\');
//         assert.strictEqual(path.win32.dirname('c:\\foo\\bar'), 'c:\\foo');
//         assert.strictEqual(path.win32.dirname('c:\\foo\\bar\\'), 'c:\\foo');
//         assert.strictEqual(path.win32.dirname('c:\\foo\\bar\\baz'), 'c:\\foo\\bar');
//         assert.strictEqual(path.win32.dirname('\\'), '\\');
//         assert.strictEqual(path.win32.dirname('\\foo'), '\\');
//         assert.strictEqual(path.win32.dirname('\\foo\\'), '\\');
//         assert.strictEqual(path.win32.dirname('\\foo\\bar'), '\\foo');
//         assert.strictEqual(path.win32.dirname('\\foo\\bar\\'), '\\foo');
//         assert.strictEqual(path.win32.dirname('\\foo\\bar\\baz'), '\\foo\\bar');
//         assert.strictEqual(path.win32.dirname('c:'), 'c:');
//         assert.strictEqual(path.win32.dirname('c:foo'), 'c:');
//         assert.strictEqual(path.win32.dirname('c:foo\\'), 'c:');
//         assert.strictEqual(path.win32.dirname('c:foo\\bar'), 'c:foo');
//         assert.strictEqual(path.win32.dirname('c:foo\\bar\\'), 'c:foo');
//         assert.strictEqual(path.win32.dirname('c:foo\\bar\\baz'), 'c:foo\\bar');
//         assert.strictEqual(path.win32.dirname('file:stream'), '.');
//         assert.strictEqual(path.win32.dirname('dir\\file:stream'), 'dir');
//         assert.strictEqual(path.win32.dirname('\\\\unc\\share'),
//             '\\\\unc\\share');
//         assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo'),
//             '\\\\unc\\share\\');
//         assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\'),
//             '\\\\unc\\share\\');
//         assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\bar'),
//             '\\\\unc\\share\\foo');
//         assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\bar\\'),
//             '\\\\unc\\share\\foo');
//         assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\bar\\baz'),
//             '\\\\unc\\share\\foo\\bar');
//         assert.strictEqual(path.win32.dirname('/a/b/'), '/a');
//         assert.strictEqual(path.win32.dirname('/a/b'), '/a');
//         assert.strictEqual(path.win32.dirname('/a'), '/');
//         assert.strictEqual(path.win32.dirname(''), '.');
//         assert.strictEqual(path.win32.dirname('/'), '/');
//         assert.strictEqual(path.win32.dirname('////'), '/');
//         assert.strictEqual(path.win32.dirname('foo'), '.');
//     });
//     QUnit.test("extname", (assert) =>
//     {
//         const failures: string[] = [];
//         const slashRE = /\//g;
//         [
//             // [__filename, '.js'],
//             ['', ''],
//             ['/path/to/file', ''],
//             ['/path/to/file.ext', '.ext'],
//             ['/path.to/file.ext', '.ext'],
//             ['/path.to/file', ''],
//             ['/path.to/.file', ''],
//             ['/path.to/.file.ext', '.ext'],
//             ['/path/to/f.ext', '.ext'],
//             ['/path/to/..ext', '.ext'],
//             ['/path/to/..', ''],
//             ['file', ''],
//             ['file.ext', '.ext'],
//             ['.file', ''],
//             ['.file.ext', '.ext'],
//             ['/file', ''],
//             ['/file.ext', '.ext'],
//             ['/.file', ''],
//             ['/.file.ext', '.ext'],
//             ['.path/file.ext', '.ext'],
//             ['file.ext.ext', '.ext'],
//             ['file.', '.'],
//             ['.', ''],
//             ['./', ''],
//             ['.file.ext', '.ext'],
//             ['.file', ''],
//             ['.file.', '.'],
//             ['.file..', '.'],
//             ['..', ''],
//             ['../', ''],
//             ['..file.ext', '.ext'],
//             ['..file', '.file'],
//             ['..file.', '.'],
//             ['..file..', '.'],
//             ['...', '.'],
//             ['...ext', '.ext'],
//             ['....', '.'],
//             ['file.ext/', '.ext'],
//             ['file.ext//', '.ext'],
//             ['file/', ''],
//             ['file//', ''],
//             ['file./', '.'],
//             ['file.//', '.'],
//         ].forEach((test) =>
//         {
//             const expected = test[1];
//             [path.posix.extname, path.win32.extname].forEach((extname) =>
//             {
//                 let input = test[0];
//                 let os;
//                 if (extname === path.win32.extname)
//                 {
//                     input = input.replace(slashRE, '\\');
//                     os = 'win32';
//                 } else
//                 {
//                     os = 'posix';
//                 }
//                 const actual = extname(input);
//                 const message = `path.${os}.extname(${JSON.stringify(input)})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
//                 if (actual !== expected)
//                     failures.push(`\n${message}`);
//             });
//             {
//                 const input = `C:${test[0].replace(slashRE, '\\')}`;
//                 const actual = path.win32.extname(input);
//                 const message = `path.win32.extname(${JSON.stringify(input)})\n  expect=${
//                     JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
//                 if (actual !== expected)
//                     failures.push(`\n${message}`);
//             }
//         });
//         assert.strictEqual(failures.length, 0, failures.join(''));
//         // On Windows, backslash is a path separator.
//         assert.strictEqual(path.win32.extname('.\\'), '');
//         assert.strictEqual(path.win32.extname('..\\'), '');
//         assert.strictEqual(path.win32.extname('file.ext\\'), '.ext');
//         assert.strictEqual(path.win32.extname('file.ext\\\\'), '.ext');
//         assert.strictEqual(path.win32.extname('file\\'), '');
//         assert.strictEqual(path.win32.extname('file\\\\'), '');
//         assert.strictEqual(path.win32.extname('file.\\'), '.');
//         assert.strictEqual(path.win32.extname('file.\\\\'), '.');
//         // On *nix, backslash is a valid name component like any other character.
//         assert.strictEqual(path.posix.extname('.\\'), '');
//         assert.strictEqual(path.posix.extname('..\\'), '.\\');
//         assert.strictEqual(path.posix.extname('file.ext\\'), '.ext\\');
//         assert.strictEqual(path.posix.extname('file.ext\\\\'), '.ext\\\\');
//         assert.strictEqual(path.posix.extname('file\\'), '');
//         assert.strictEqual(path.posix.extname('file\\\\'), '');
//         assert.strictEqual(path.posix.extname('file.\\'), '.\\');
//         assert.strictEqual(path.posix.extname('file.\\\\'), '.\\\\');
//     });
//     QUnit.test("isAbsolute", (assert) =>
//     {
//         assert.strictEqual(path.win32.isAbsolute('/'), true);
//         assert.strictEqual(path.win32.isAbsolute('//'), true);
//         assert.strictEqual(path.win32.isAbsolute('//server'), true);
//         assert.strictEqual(path.win32.isAbsolute('//server/file'), true);
//         assert.strictEqual(path.win32.isAbsolute('\\\\server\\file'), true);
//         assert.strictEqual(path.win32.isAbsolute('\\\\server'), true);
//         assert.strictEqual(path.win32.isAbsolute('\\\\'), true);
//         assert.strictEqual(path.win32.isAbsolute('c'), false);
//         assert.strictEqual(path.win32.isAbsolute('c:'), false);
//         assert.strictEqual(path.win32.isAbsolute('c:\\'), true);
//         assert.strictEqual(path.win32.isAbsolute('c:/'), true);
//         assert.strictEqual(path.win32.isAbsolute('c://'), true);
//         assert.strictEqual(path.win32.isAbsolute('C:/Users/'), true);
//         assert.strictEqual(path.win32.isAbsolute('C:\\Users\\'), true);
//         assert.strictEqual(path.win32.isAbsolute('C:cwd/another'), false);
//         assert.strictEqual(path.win32.isAbsolute('C:cwd\\another'), false);
//         assert.strictEqual(path.win32.isAbsolute('directory/directory'), false);
//         assert.strictEqual(path.win32.isAbsolute('directory\\directory'), false);
//         assert.strictEqual(path.posix.isAbsolute('/home/foo'), true);
//         assert.strictEqual(path.posix.isAbsolute('/home/foo/..'), true);
//         assert.strictEqual(path.posix.isAbsolute('bar/'), false);
//         assert.strictEqual(path.posix.isAbsolute('./baz'), false);
//     });
//     QUnit.test("join", (assert) =>
//     {
//         const failures: string[] = [];
//         const backslashRE = /\\/g;
//         const joinTests: any = [
//             [[path.posix.join, path.win32.join],
//             // arguments                     result
//             [[['.', 'x/b', '..', '/b/c.js'], 'x/b/c.js'],
//             [[], '.'],
//             [['/.', 'x/b', '..', '/b/c.js'], '/x/b/c.js'],
//             [['/foo', '../../../bar'], '/bar'],
//             [['foo', '../../../bar'], '../../bar'],
//             [['foo/', '../../../bar'], '../../bar'],
//             [['foo/x', '../../../bar'], '../bar'],
//             [['foo/x', './bar'], 'foo/x/bar'],
//             [['foo/x/', './bar'], 'foo/x/bar'],
//             [['foo/x/', '.', 'bar'], 'foo/x/bar'],
//             [['./'], './'],
//             [['.', './'], './'],
//             [['.', '.', '.'], '.'],
//             [['.', './', '.'], '.'],
//             [['.', '/./', '.'], '.'],
//             [['.', '/////./', '.'], '.'],
//             [['.'], '.'],
//             [['', '.'], '.'],
//             [['', 'foo'], 'foo'],
//             [['foo', '/bar'], 'foo/bar'],
//             [['', '/foo'], '/foo'],
//             [['', '', '/foo'], '/foo'],
//             [['', '', 'foo'], 'foo'],
//             [['foo', ''], 'foo'],
//             [['foo/', ''], 'foo/'],
//             [['foo', '', '/bar'], 'foo/bar'],
//             [['./', '..', '/foo'], '../foo'],
//             [['./', '..', '..', '/foo'], '../../foo'],
//             [['.', '..', '..', '/foo'], '../../foo'],
//             [['', '..', '..', '/foo'], '../../foo'],
//             [['/'], '/'],
//             [['/', '.'], '/'],
//             [['/', '..'], '/'],
//             [['/', '..', '..'], '/'],
//             [[''], '.'],
//             [['', ''], '.'],
//             [[' /foo'], ' /foo'],
//             [[' ', 'foo'], ' /foo'],
//             [[' ', '.'], ' '],
//             [[' ', '/'], ' /'],
//             [[' ', ''], ' '],
//             [['/', 'foo'], '/foo'],
//             [['/', '/foo'], '/foo'],
//             [['/', '//foo'], '/foo'],
//             [['/', '', '/foo'], '/foo'],
//             [['', '/', 'foo'], '/foo'],
//             [['', '/', '/foo'], '/foo']
//             ]
//             ]
//         ];
//         // Windows-specific join tests
//         joinTests.push([
//             path.win32.join,
//             joinTests[0][1].slice(0).concat(
//                 [// arguments                     result
//                     // UNC path expected
//                     [['//foo/bar'], '\\\\foo\\bar\\'],
//                     [['\\/foo/bar'], '\\\\foo\\bar\\'],
//                     [['\\\\foo/bar'], '\\\\foo\\bar\\'],
//                     // UNC path expected - server and share separate
//                     [['//foo', 'bar'], '\\\\foo\\bar\\'],
//                     [['//foo/', 'bar'], '\\\\foo\\bar\\'],
//                     [['//foo', '/bar'], '\\\\foo\\bar\\'],
//                     // UNC path expected - questionable
//                     [['//foo', '', 'bar'], '\\\\foo\\bar\\'],
//                     [['//foo/', '', 'bar'], '\\\\foo\\bar\\'],
//                     [['//foo/', '', '/bar'], '\\\\foo\\bar\\'],
//                     // UNC path expected - even more questionable
//                     [['', '//foo', 'bar'], '\\\\foo\\bar\\'],
//                     [['', '//foo/', 'bar'], '\\\\foo\\bar\\'],
//                     [['', '//foo/', '/bar'], '\\\\foo\\bar\\'],
//                     // No UNC path expected (no double slash in first component)
//                     [['\\', 'foo/bar'], '\\foo\\bar'],
//                     [['\\', '/foo/bar'], '\\foo\\bar'],
//                     [['', '/', '/foo/bar'], '\\foo\\bar'],
//                     // No UNC path expected (no non-slashes in first component -
//                     // questionable)
//                     [['//', 'foo/bar'], '\\foo\\bar'],
//                     [['//', '/foo/bar'], '\\foo\\bar'],
//                     [['\\\\', '/', '/foo/bar'], '\\foo\\bar'],
//                     [['//'], '\\'],
//                     // No UNC path expected (share name missing - questionable).
//                     [['//foo'], '\\foo'],
//                     [['//foo/'], '\\foo\\'],
//                     [['//foo', '/'], '\\foo\\'],
//                     [['//foo', '', '/'], '\\foo\\'],
//                     // No UNC path expected (too many leading slashes - questionable)
//                     [['///foo/bar'], '\\foo\\bar'],
//                     [['////foo', 'bar'], '\\foo\\bar'],
//                     [['\\\\\\/foo/bar'], '\\foo\\bar'],
//                     // Drive-relative vs drive-absolute paths. This merely describes the
//                     // status quo, rather than being obviously right
//                     [['c:'], 'c:.'],
//                     [['c:.'], 'c:.'],
//                     [['c:', ''], 'c:.'],
//                     [['', 'c:'], 'c:.'],
//                     [['c:.', '/'], 'c:.\\'],
//                     [['c:.', 'file'], 'c:file'],
//                     [['c:', '/'], 'c:\\'],
//                     [['c:', 'file'], 'c:\\file']
//                 ]
//             )
//         ]);
//         joinTests.forEach((test: any) =>
//         {
//             if (!Array.isArray(test[0]))
//                 test[0] = [test[0]];
//             test[0].forEach((join: any) =>
//             {
//                 test[1].forEach((test: any) =>
//                 {
//                     const actual = join.apply(null, test[0]);
//                     const expected = test[1];
//                     // For non-Windows specific tests with the Windows join(), we need to try
//                     // replacing the slashes since the non-Windows specific tests' `expected`
//                     // use forward slashes
//                     let actualAlt;
//                     let os;
//                     if (join === path.win32.join)
//                     {
//                         actualAlt = actual.replace(backslashRE, '/');
//                         os = 'win32';
//                     } else
//                     {
//                         os = 'posix';
//                     }
//                     const message =
//                         `path.${os}.join(${test[0].map(JSON.stringify).join(',')})\n  expect=${
//                         JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
//                     if (actual !== expected && actualAlt !== expected)
//                         failures.push(`\n${message}`);
//                 });
//             });
//         });
//         assert.strictEqual(failures.length, 0, failures.join(''));
//     });
//     QUnit.test("normalize", (assert) =>
//     {
//         assert.strictEqual(path.win32.normalize('./fixtures///b/../b/c.js'),
//             'fixtures\\b\\c.js');
//         assert.strictEqual(path.win32.normalize('/foo/../../../bar'), '\\bar');
//         assert.strictEqual(path.win32.normalize('a//b//../b'), 'a\\b');
//         assert.strictEqual(path.win32.normalize('a//b//./c'), 'a\\b\\c');
//         assert.strictEqual(path.win32.normalize('a//b//.'), 'a\\b');
//         assert.strictEqual(path.win32.normalize('//server/share/dir/file.ext'),
//             '\\\\server\\share\\dir\\file.ext');
//         assert.strictEqual(path.win32.normalize('/a/b/c/../../../x/y/z'), '\\x\\y\\z');
//         assert.strictEqual(path.win32.normalize('C:'), 'C:.');
//         assert.strictEqual(path.win32.normalize('C:..\\abc'), 'C:..\\abc');
//         assert.strictEqual(path.win32.normalize('C:..\\..\\abc\\..\\def'),
//             'C:..\\..\\def');
//         assert.strictEqual(path.win32.normalize('C:\\.'), 'C:\\');
//         assert.strictEqual(path.win32.normalize('file:stream'), 'file:stream');
//         assert.strictEqual(path.win32.normalize('bar\\foo..\\..\\'), 'bar\\');
//         assert.strictEqual(path.win32.normalize('bar\\foo..\\..'), 'bar');
//         assert.strictEqual(path.win32.normalize('bar\\foo..\\..\\baz'), 'bar\\baz');
//         assert.strictEqual(path.win32.normalize('bar\\foo..\\'), 'bar\\foo..\\');
//         assert.strictEqual(path.win32.normalize('bar\\foo..'), 'bar\\foo..');
//         assert.strictEqual(path.win32.normalize('..\\foo..\\..\\..\\bar'),
//             '..\\..\\bar');
//         assert.strictEqual(path.win32.normalize('..\\...\\..\\.\\...\\..\\..\\bar'),
//             '..\\..\\bar');
//         assert.strictEqual(path.win32.normalize('../../../foo/../../../bar'),
//             '..\\..\\..\\..\\..\\bar');
//         assert.strictEqual(path.win32.normalize('../../../foo/../../../bar/../../'),
//             '..\\..\\..\\..\\..\\..\\');
//         assert.strictEqual(
//             path.win32.normalize('../foobar/barfoo/foo/../../../bar/../../'),
//             '..\\..\\'
//         );
//         assert.strictEqual(
//             path.win32.normalize('../.../../foobar/../../../bar/../../baz'),
//             '..\\..\\..\\..\\baz'
//         );
//         assert.strictEqual(path.win32.normalize('foo/bar\\baz'), 'foo\\bar\\baz');
//         assert.strictEqual(path.posix.normalize('./fixtures///b/../b/c.js'),
//             'fixtures/b/c.js');
//         assert.strictEqual(path.posix.normalize('/foo/../../../bar'), '/bar');
//         assert.strictEqual(path.posix.normalize('a//b//../b'), 'a/b');
//         assert.strictEqual(path.posix.normalize('a//b//./c'), 'a/b/c');
//         assert.strictEqual(path.posix.normalize('a//b//.'), 'a/b');
//         assert.strictEqual(path.posix.normalize('/a/b/c/../../../x/y/z'), '/x/y/z');
//         assert.strictEqual(path.posix.normalize('///..//./foo/.//bar'), '/foo/bar');
//         assert.strictEqual(path.posix.normalize('bar/foo../../'), 'bar/');
//         assert.strictEqual(path.posix.normalize('bar/foo../..'), 'bar');
//         assert.strictEqual(path.posix.normalize('bar/foo../../baz'), 'bar/baz');
//         assert.strictEqual(path.posix.normalize('bar/foo../'), 'bar/foo../');
//         assert.strictEqual(path.posix.normalize('bar/foo..'), 'bar/foo..');
//         assert.strictEqual(path.posix.normalize('../foo../../../bar'), '../../bar');
//         assert.strictEqual(path.posix.normalize('../.../.././.../../../bar'),
//             '../../bar');
//         assert.strictEqual(path.posix.normalize('../../../foo/../../../bar'),
//             '../../../../../bar');
//         assert.strictEqual(path.posix.normalize('../../../foo/../../../bar/../../'),
//             '../../../../../../');
//         assert.strictEqual(
//             path.posix.normalize('../foobar/barfoo/foo/../../../bar/../../'),
//             '../../'
//         );
//         assert.strictEqual(
//             path.posix.normalize('../.../../foobar/../../../bar/../../baz'),
//             '../../../../baz'
//         );
//         assert.strictEqual(path.posix.normalize('foo/bar\\baz'), 'foo/bar\\baz');
//     });
//     QUnit.test("parse-format", (assert) =>
//     {
//         const winPaths: [string, string][] = [
//             // [path, root]
//             ['C:\\path\\dir\\index.html', 'C:\\'],
//             ['C:\\another_path\\DIR\\1\\2\\33\\\\index', 'C:\\'],
//             ['another_path\\DIR with spaces\\1\\2\\33\\index', ''],
//             ['\\', '\\'],
//             ['\\foo\\C:', '\\'],
//             ['file', ''],
//             ['file:stream', ''],
//             ['.\\file', ''],
//             ['C:', 'C:'],
//             ['C:.', 'C:'],
//             ['C:..', 'C:'],
//             ['C:abc', 'C:'],
//             ['C:\\', 'C:\\'],
//             ['C:\\abc', 'C:\\'],
//             ['', ''],
//             // unc
//             ['\\\\server\\share\\file_path', '\\\\server\\share\\'],
//             ['\\\\server two\\shared folder\\file path.zip',
//                 '\\\\server two\\shared folder\\'],
//             ['\\\\teela\\admin$\\system32', '\\\\teela\\admin$\\'],
//             ['\\\\?\\UNC\\server\\share', '\\\\?\\UNC\\']
//         ];
//         const winSpecialCaseParseTests: [string, { root: string }][] = [
//             ['/foo/bar', { root: '/' }],
//         ];
//         const winSpecialCaseFormatTests: [feng3d.FormatInputPathObject, string][] = [
//             [{ dir: 'some\\dir' }, 'some\\dir\\'],
//             [{ base: 'index.html' }, 'index.html'],
//             [{ root: 'C:\\' }, 'C:\\'],
//             [{ name: 'index', ext: '.html' }, 'index.html'],
//             [{ dir: 'some\\dir', name: 'index', ext: '.html' }, 'some\\dir\\index.html'],
//             [{ root: 'C:\\', name: 'index', ext: '.html' }, 'C:\\index.html'],
//             [{}, '']
//         ];
//         const unixPaths: [string, string][] = [
//             // [path, root]
//             ['/home/user/dir/file.txt', '/'],
//             ['/home/user/a dir/another File.zip', '/'],
//             ['/home/user/a dir//another&File.', '/'],
//             ['/home/user/a$$$dir//another File.zip', '/'],
//             ['user/dir/another File.zip', ''],
//             ['file', ''],
//             ['.\\file', ''],
//             ['./file', ''],
//             ['C:\\foo', ''],
//             ['/', '/'],
//             ['', ''],
//             ['.', ''],
//             ['..', ''],
//             ['/foo', '/'],
//             ['/foo.', '/'],
//             ['/foo.bar', '/'],
//             ['/.', '/'],
//             ['/.foo', '/'],
//             ['/.foo.bar', '/'],
//             ['/foo/bar.baz', '/']
//         ];
//         const unixSpecialCaseFormatTests = [
//             [{ dir: 'some/dir' }, 'some/dir/'],
//             [{ base: 'index.html' }, 'index.html'],
//             [{ root: '/' }, '/'],
//             [{ name: 'index', ext: '.html' }, 'index.html'],
//             [{ dir: 'some/dir', name: 'index', ext: '.html' }, 'some/dir/index.html'],
//             [{ root: '/', name: 'index', ext: '.html' }, '/index.html'],
//             [{}, '']
//         ];
//         // const expectedMessage = common.expectsError({
//         //     code: 'ERR_INVALID_ARG_TYPE',
//         //     type: TypeError
//         // }, 18);
//         // const errors = [
//         //     { method: 'parse', input: [null], message: expectedMessage },
//         //     { method: 'parse', input: [{}], message: expectedMessage },
//         //     { method: 'parse', input: [true], message: expectedMessage },
//         //     { method: 'parse', input: [1], message: expectedMessage },
//         //     { method: 'parse', input: [], message: expectedMessage },
//         //     { method: 'format', input: [null], message: expectedMessage },
//         //     { method: 'format', input: [''], message: expectedMessage },
//         //     { method: 'format', input: [true], message: expectedMessage },
//         //     { method: 'format', input: [1], message: expectedMessage },
//         // ];
//         checkParseFormat(path.win32, winPaths);
//         checkParseFormat(path.posix, unixPaths);
//         checkSpecialCaseParseFormat(path.win32, winSpecialCaseParseTests);
//         // checkErrors(path.win32);
//         // checkErrors(path.posix);
//         // checkFormat(path.win32, winSpecialCaseFormatTests);
//         // checkFormat(path.posix, unixSpecialCaseFormatTests);
//         // Test removal of trailing path separators
//         const trailingTests = [
//             [path.win32.parse,
//             [['.\\', { root: '', dir: '', base: '.', ext: '', name: '.' }],
//             ['\\\\', { root: '\\', dir: '\\', base: '', ext: '', name: '' }],
//             ['\\\\', { root: '\\', dir: '\\', base: '', ext: '', name: '' }],
//             ['c:\\foo\\\\\\',
//                 { root: 'c:\\', dir: 'c:\\', base: 'foo', ext: '', name: 'foo' }],
//             ['D:\\foo\\\\\\bar.baz',
//                 {
//                     root: 'D:\\',
//                     dir: 'D:\\foo\\\\',
//                     base: 'bar.baz',
//                     ext: '.baz',
//                     name: 'bar'
//                 }
//             ]
//             ]
//             ],
//             [path.posix.parse,
//             [['./', { root: '', dir: '', base: '.', ext: '', name: '.' }],
//             ['//', { root: '/', dir: '/', base: '', ext: '', name: '' }],
//             ['///', { root: '/', dir: '/', base: '', ext: '', name: '' }],
//             ['/foo///', { root: '/', dir: '/', base: 'foo', ext: '', name: 'foo' }],
//             ['/foo///bar.baz',
//                 { root: '/', dir: '/foo//', base: 'bar.baz', ext: '.baz', name: 'bar' }
//             ]
//             ]
//             ]
//         ];
//         const failures: string[] = [];
//         trailingTests.forEach(function (test: any[])
//         {
//             const parse = test[0];
//             const os = parse === path.win32.parse ? 'win32' : 'posix';
//             test[1].forEach(function (test: any)
//             {
//                 const actual = parse(test[0]);
//                 const expected = test[1];
//                 const message = `path.${os}.parse(${JSON.stringify(test[0])})\n  expect=${
//                     JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
//                 const actualKeys = Object.keys(actual);
//                 const expectedKeys = Object.keys(expected);
//                 let failed = (actualKeys.length !== expectedKeys.length);
//                 if (!failed)
//                 {
//                     for (let i = 0; i < actualKeys.length; ++i)
//                     {
//                         const key = actualKeys[i];
//                         if (!expectedKeys.includes(key) || actual[key] !== expected[key])
//                         {
//                             failed = true;
//                             break;
//                         }
//                     }
//                 }
//                 if (failed)
//                     failures.push(`\n${message}`);
//             });
//         });
//         assert.strictEqual(failures.length, 0, failures.join(''));
//         // function checkErrors(path: any)
//         // {
//         //     errors.forEach(function (errorCase)
//         //     {
//         //         assert.throws(() =>
//         //         {
//         //             path[<any>errorCase.method].apply(path, errorCase.input);
//         //         }, errorCase.message);
//         //     });
//         // }
//         function checkParseFormat(path: feng3d.Path, paths: [string, string][])
//         {
//             paths.forEach(function ([element, root])
//             {
//                 const output = path.parse(element);
//                 assert.strictEqual(typeof output.root, 'string');
//                 assert.strictEqual(typeof output.dir, 'string');
//                 assert.strictEqual(typeof output.base, 'string');
//                 assert.strictEqual(typeof output.ext, 'string');
//                 assert.strictEqual(typeof output.name, 'string');
//                 assert.strictEqual(path.format(output), element);
//                 assert.strictEqual(output.root, root);
//                 assert.ok(output.dir.startsWith(output.root));
//                 assert.strictEqual(output.dir, output.dir ? path.dirname(element) : '');
//                 assert.strictEqual(output.base, path.basename(element));
//                 assert.strictEqual(output.ext, path.extname(element));
//             });
//         }
//         function checkSpecialCaseParseFormat(path: feng3d.Path, testCases: [string, { root: string; }][])
//         {
//             testCases.forEach(function (testCase)
//             {
//                 const element = testCase[0];
//                 const expect: any = testCase[1];
//                 const output: any = path.parse(element);
//                 Object.keys(expect).forEach(function (key)
//                 {
//                     assert.strictEqual(output[key], expect[key]);
//                 });
//             });
//         }
//         // function checkFormat(path: feng3d.Path, testCases: any)
//         // {
//         //     testCases.forEach(function (testCase: any)
//         //     {
//         //         assert.strictEqual(path.format(testCase[0]), testCase[1]);
//         //     });
//         //     [null, undefined, 1, true, false, 'string'].forEach((pathObject: any) =>
//         //     {
//         //         common.expectsError(() =>
//         //         {
//         //             path.format(pathObject);
//         //         }, {
//         //                 code: 'ERR_INVALID_ARG_TYPE',
//         //                 type: TypeError,
//         //                 message: 'The "pathObject" argument must be of type Object. ' +
//         //                     `Received type ${typeof pathObject}`
//         //             });
//         //     });
//         // }
//     });
//     QUnit.test("relative", (assert) =>
//     {
//         const failures: string[] = [];
//         const relativeTests: [(from: string, to: string) => string, string[][]][] = [
//             [path.win32.relative,
//             // arguments                     result
//             [['c:/blah\\blah', 'd:/games', 'd:\\games'],
//             ['c:/aaaa/bbbb', 'c:/aaaa', '..'],
//             ['c:/aaaa/bbbb', 'c:/cccc', '..\\..\\cccc'],
//             ['c:/aaaa/bbbb', 'c:/aaaa/bbbb', ''],
//             ['c:/aaaa/bbbb', 'c:/aaaa/cccc', '..\\cccc'],
//             ['c:/aaaa/', 'c:/aaaa/cccc', 'cccc'],
//             ['c:/', 'c:\\aaaa\\bbbb', 'aaaa\\bbbb'],
//             ['c:/aaaa/bbbb', 'd:\\', 'd:\\'],
//             ['c:/AaAa/bbbb', 'c:/aaaa/bbbb', ''],
//             ['c:/aaaaa/', 'c:/aaaa/cccc', '..\\aaaa\\cccc'],
//             ['C:\\foo\\bar\\baz\\quux', 'C:\\', '..\\..\\..\\..'],
//             ['C:\\foo\\test', 'C:\\foo\\test\\bar\\package.json', 'bar\\package.json'],
//             ['C:\\foo\\bar\\baz-quux', 'C:\\foo\\bar\\baz', '..\\baz'],
//             ['C:\\foo\\bar\\baz', 'C:\\foo\\bar\\baz-quux', '..\\baz-quux'],
//             ['\\\\foo\\bar', '\\\\foo\\bar\\baz', 'baz'],
//             ['\\\\foo\\bar\\baz', '\\\\foo\\bar', '..'],
//             ['\\\\foo\\bar\\baz-quux', '\\\\foo\\bar\\baz', '..\\baz'],
//             ['\\\\foo\\bar\\baz', '\\\\foo\\bar\\baz-quux', '..\\baz-quux'],
//             ['C:\\baz-quux', 'C:\\baz', '..\\baz'],
//             ['C:\\baz', 'C:\\baz-quux', '..\\baz-quux'],
//             ['\\\\foo\\baz-quux', '\\\\foo\\baz', '..\\baz'],
//             ['\\\\foo\\baz', '\\\\foo\\baz-quux', '..\\baz-quux'],
//             ['C:\\baz', '\\\\foo\\bar\\baz', '\\\\foo\\bar\\baz'],
//             ['\\\\foo\\bar\\baz', 'C:\\baz', 'C:\\baz']
//             ]
//             ],
//             [path.posix.relative,
//             // arguments          result
//             [['/var/lib', '/var', '..'],
//             ['/var/lib', '/bin', '../../bin'],
//             ['/var/lib', '/var/lib', ''],
//             ['/var/lib', '/var/apache', '../apache'],
//             ['/var/', '/var/lib', 'lib'],
//             ['/', '/var/lib', 'var/lib'],
//             ['/foo/test', '/foo/test/bar/package.json', 'bar/package.json'],
//             ['/Users/a/web/b/test/mails', '/Users/a/web/b', '../..'],
//             ['/foo/bar/baz-quux', '/foo/bar/baz', '../baz'],
//             ['/foo/bar/baz', '/foo/bar/baz-quux', '../baz-quux'],
//             ['/baz-quux', '/baz', '../baz'],
//             ['/baz', '/baz-quux', '../baz-quux']
//             ]
//             ]
//         ];
//         relativeTests.forEach((test) =>
//         {
//             const relative = test[0];
//             test[1].forEach((test) =>
//             {
//                 const actual = relative(test[0], test[1]);
//                 const expected = test[2];
//                 const os = relative === path.win32.relative ? 'win32' : 'posix';
//                 const message = `path.${os}.relative(${
//                     test.slice(0, 2).map(<any>JSON.stringify).join(',')})\n  expect=${
//                     JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
//                 if (actual !== expected)
//                     failures.push(`\n${message}`);
//             });
//         });
//         assert.strictEqual(failures.length, 0, failures.join(''));
//     });
//     QUnit.test("resolve", (assert) =>
//     {
//         const failures: string[] = [];
//         const slashRE = /\//g;
//         const backslashRE = /\\/g;
//         const resolveTests: [(...pathSegments: string[]) => string, [string[], string][]][] = [
//             [path.win32.resolve,
//             // arguments                               result
//             [[['c:/blah\\blah', 'd:/games', 'c:../a'], 'c:\\blah\\a'],
//             [['c:/ignore', 'd:\\a/b\\c/d', '\\e.exe'], 'd:\\e.exe'],
//             [['c:/ignore', 'c:/some/file'], 'c:\\some\\file'],
//             [['d:/ignore', 'd:some/dir//'], 'd:\\ignore\\some\\dir'],
//             // [['.'], process.cwd()],
//             [['//server/share', '..', 'relative\\'], '\\\\server\\share\\relative'],
//             [['c:/', '//'], 'c:\\'],
//             [['c:/', '//dir'], 'c:\\dir'],
//             [['c:/', '//server/share'], '\\\\server\\share\\'],
//             [['c:/', '//server//share'], '\\\\server\\share\\'],
//             [['c:/', '///some//dir'], 'c:\\some\\dir'],
//             [['C:\\foo\\tmp.3\\', '..\\tmp.3\\cycles\\root.js'],
//                 'C:\\foo\\tmp.3\\cycles\\root.js']
//             ]
//             ],
//             [path.posix.resolve,
//             // arguments                    result
//             [[['/var/lib', '../', 'file/'], '/var/file'],
//             [['/var/lib', '/../', 'file/'], '/file'],
//             // [['a/b/c/', '../../..'], process.cwd()],
//             // [['.'], process.cwd()],
//             [['/some/dir', '.', '/absolute/'], '/absolute'],
//             [['/foo/tmp.3/', '../tmp.3/cycles/root.js'], '/foo/tmp.3/cycles/root.js']
//             ]
//             ]
//         ];
//         resolveTests.forEach((test) =>
//         {
//             // add
//             const common = { isWindows: true };
//             //
//             const resolve = test[0];
//             test[1].forEach((test) =>
//             {
//                 const actual = resolve.apply(null, test[0]);
//                 let actualAlt;
//                 const os = resolve === path.win32.resolve ? 'win32' : 'posix';
//                 if (resolve === path.win32.resolve && !common.isWindows)
//                     actualAlt = actual.replace(backslashRE, '/');
//                 else if (resolve !== path.win32.resolve && common.isWindows)
//                     actualAlt = actual.replace(slashRE, '\\');
//                 const expected = test[1];
//                 const message =
//                     `path.${os}.resolve(${test[0].map(<any>JSON.stringify).join(',')})\n  expect=${
//                     JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
//                 if (actual !== expected && actualAlt !== expected)
//                     failures.push(`\n${message}`);
//             });
//         });
//         assert.strictEqual(failures.length, 0, failures.join(''));
//         // if (common.isWindows)
//         // {
//         //     // Test resolving the current Windows drive letter from a spawned process.
//         //     // See https://github.com/nodejs/node/issues/7215
//         //     const currentDriveLetter = path.parse(process.cwd()).root.substring(0, 2);
//         //     const resolveFixture = fixtures.path('path-resolve.js');
//         //     const spawnResult = child.spawnSync(
//         //         process.argv[0], [resolveFixture, currentDriveLetter]);
//         //     const resolvedPath = spawnResult.stdout.toString().trim();
//         //     assert.strictEqual(resolvedPath.toLowerCase(), process.cwd().toLowerCase());
//         // }
//     });
//     QUnit.test("zero-length-strings", (assert) =>
//     {
//         // Join will internally ignore all the zero-length strings and it will return
//         // '.' if the joined string is a zero-length string.
//         assert.strictEqual(path.posix.join(''), '.');
//         assert.strictEqual(path.posix.join('', ''), '.');
//         assert.strictEqual(path.win32.join(''), '.');
//         assert.strictEqual(path.win32.join('', ''), '.');
//         // assert.strictEqual(path.join(pwd), pwd);
//         // assert.strictEqual(path.join(pwd, ''), pwd);
//         // Normalize will return '.' if the input is a zero-length string
//         assert.strictEqual(path.posix.normalize(''), '.');
//         assert.strictEqual(path.win32.normalize(''), '.');
//         // assert.strictEqual(path.normalize(pwd), pwd);
//         // Since '' is not a valid path in any of the common environments, return false
//         assert.strictEqual(path.posix.isAbsolute(''), false);
//         assert.strictEqual(path.win32.isAbsolute(''), false);
//         // Resolve, internally ignores all the zero-length strings and returns the
//         // current working directory
//         // assert.strictEqual(path.resolve(''), pwd);
//         // assert.strictEqual(path.resolve('', ''), pwd);
//         // Relative, internally calls resolve. So, '' is actually the current directory
//         // assert.strictEqual(path.relative('', pwd), '');
//         // assert.strictEqual(path.relative(pwd, ''), '');
//         // assert.strictEqual(path.relative(pwd, pwd), '');
//     });
// });
QUnit.module("PathUtils", function () {
    QUnit.test("getName", function (assert) {
        assert.ok(feng3d.pathUtils.getNameWithExtension("a") == "a");
        assert.ok(feng3d.pathUtils.getNameWithExtension("a.txt") == "a.txt");
        assert.ok(feng3d.pathUtils.getNameWithExtension("a/") == "a");
        assert.ok(feng3d.pathUtils.getNameWithExtension("a.b/") == "a.b");
    });
    QUnit.test("getExtension", function (assert) {
        assert.ok(feng3d.pathUtils.getExtension("a.txt") == ".txt");
        assert.ok(feng3d.pathUtils.getExtension("a") == "");
        assert.ok(feng3d.pathUtils.getExtension("a.b/b") == "");
        assert.ok(feng3d.pathUtils.getExtension("a.b/b.txt") == ".txt");
        assert.ok(feng3d.pathUtils.getExtension("a.b/.txt") == ".txt");
    });
    QUnit.test("getParentPath", function (assert) {
        assert.ok(feng3d.pathUtils.getParentPath("a/a.txt") == "a");
        assert.ok(feng3d.pathUtils.getParentPath("a/b") == "a");
        assert.ok(feng3d.pathUtils.getParentPath("a/b/") == "a");
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
QUnit.module("Pool", function () {
    QUnit.test("测试性能", function (assert) {
        var NUM = 1000000;
        var pool = new feng3d.Pool(feng3d.Vector3);
        // var arr = pool.getArray(NUM);
        // pool.releaseArray(arr);
        var t = Date.now();
        for (var i = 0; i < NUM; i++) {
            new feng3d.Vector3();
        }
        var time0 = Date.now() - t;
        var t = Date.now();
        for (var i = 0; i < NUM; i++) {
            var v = pool.get();
            pool.release(v);
        }
        var time1 = Date.now() - t;
        console.log("\u6B63\u5E38: " + time0 + "\uFF0Cpool: " + time1);
        assert.ok(time0 < time1);
        //
        // var t = Date.now();
        // for (let i = 0; i < NUM; i++)
        // {
        //     new feng3d.Vector3();
        // }
        // var time0 = Date.now() - t;
        // var vec3 = new feng3d.Vector3();
        // var t = Date.now();
        // for (let i = 0; i < NUM; i++)
        // {
        //     vec3.init(0, 0, 0);
        // }
        // var time1 = Date.now() - t;
        // console.log(`正常: ${time0}，pool: ${time1}`);
    });
});
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
            _this.o = { a: 1, b: true, c: { d: "string" } };
            return _this;
        }
        C.prototype.change = function () {
            console.log("change", this.a, arguments);
        };
        __decorate([
            feng3d.serialize
        ], C.prototype, "a", void 0);
        __decorate([
            feng3d.serialize
        ], C.prototype, "c", void 0);
        __decorate([
            feng3d.serialize
        ], C.prototype, "o", void 0);
        return C;
    }(ObjectBase));
    feng3d.C = C;
    QUnit.module("Serialization", function () {
        QUnit.test("serialize&deserialize 函数", function (assert) {
            function add(a, b) {
                return a + b;
            }
            var result = feng3d.serialization.serialize(add);
            var result1 = feng3d.serialization.deserialize(result);
            var a = Math.random();
            var b = Math.random();
            assert.ok(result1 != add);
            assert.ok(result1(a, b) == add(a, b));
            // 序列化反序列化 serialization 工具中的函数列表
            var r = feng3d.serialization.serialize(feng3d.serialization.serializeHandlers);
            var serializeReplacers = feng3d.serialization.deserialize(r);
            var r = feng3d.serialization.serialize(feng3d.serialization.deserializeHandlers);
            var deserializeReplacers = feng3d.serialization.deserialize(r);
            //
            var mySerialization = new feng3d.Serialization();
            mySerialization.serializeHandlers = serializeReplacers;
            mySerialization.deserializeHandlers = deserializeReplacers;
            // 使用序列化反序列化后的 serialization 工具进行序列化函数测试
            var result = mySerialization.serialize(add);
            var result1 = mySerialization.deserialize(result);
            var a = Math.random();
            var b = Math.random();
            assert.ok(result1 != add);
            assert.ok(result1(a, b) == add(a, b));
        });
        QUnit.test("serialize&deserialize 基础类型", function (assert) {
            var arr = [1, "abc", true, null, undefined];
            var r = arr.map(function (v) { return feng3d.serialization.serialize(v); });
            assert.deepEqual(arr, r);
            var r1 = r.map(function (v) { return feng3d.serialization.deserialize(v); });
            assert.deepEqual(arr, r1);
        });
        QUnit.test("serialize&deserialize 带serializable属性对象", function (assert) {
            var obj = { serializable: false, a: 1 };
            var r = feng3d.serialization.serialize(obj);
            assert.ok(r == undefined);
            obj.serializable = true;
            var r = feng3d.serialization.serialize(obj);
            assert.ok(r.a == obj.a);
            delete obj.serializable;
            var r = feng3d.serialization.serialize(obj);
            assert.ok(r.a == obj.a);
        });
        QUnit.test("serialize&deserialize Feng3dObject对象", function (assert) {
            var obj = new feng3d.Feng3dObject();
            obj.hideFlags = feng3d.HideFlags.DontSave;
            var r = feng3d.serialization.serialize(obj);
            assert.ok(r == undefined);
            obj.hideFlags = feng3d.HideFlags.None;
            var r = feng3d.serialization.serialize(obj);
            assert.deepEqual(r, { __class__: "feng3d.Feng3dObject" }); // 忽略默认值 hideFlags: HideFlags.None
            var obj1 = feng3d.serialization.deserialize(r);
            assert.deepEqual(obj, obj1);
        });
        QUnit.test("serialize&deserialize 拥有自定义serialize函数的对象", function (assert) {
            var obj = {
                a: 1,
                serialize: function (obj) {
                    obj.a = this.a * 2;
                },
            };
            var r = feng3d.serialization.serialize(obj);
            assert.ok(r.a == obj.a * 2);
            delete obj.serialize;
            var r = feng3d.serialization.serialize(obj);
            assert.ok(r.a == 1);
            var r0 = feng3d.serialization.deserialize(r);
            assert.ok(r0.a == 1);
        });
        QUnit.test("serialize&deserialize Array", function (assert) {
            var arr = [1, 2, 3, "a", "b"];
            var result = feng3d.serialization.serialize(arr);
            var result1 = feng3d.serialization.deserialize(result);
            assert.deepEqual(arr, result1);
        });
        QUnit.test("serialize&deserialize Object", function (assert) {
            var obj = { a: 1, b: 2, c: { f: 3, d: "a", e: "b" } };
            var result = feng3d.serialization.serialize(obj);
            var result1 = feng3d.serialization.deserialize(result);
            assert.deepEqual(obj, result1);
        });
        QUnit.test("serialize&deserialize 自定义对象", function (assert) {
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
            assert.deepEqual(c, c1);
            // 检查 serialize 过程中使用 different 减少数据量
            var o2 = new feng3d.Vector2();
            var r2 = feng3d.serialization.serialize(o2);
            assert.deepEqual(r2, { __class__: "feng3d.Vector2" });
            o2.x = 1;
            var r2 = feng3d.serialization.serialize(o2);
            assert.deepEqual(r2, { __class__: "feng3d.Vector2", x: 1 });
            //
            var obj = new feng3d.GameObject();
            var diff2 = feng3d.serialization.serialize(obj);
            assert.deepEqual(diff2, { __class__: "feng3d.GameObject" });
            //
            var obj2 = feng3d.serialization.deserialize(diff2);
            var diff = feng3d.serialization.different(obj, obj2);
            assert.deepEqual(diff, {});
            obj.transform.x = 1;
            var r3 = feng3d.serialization.serialize(obj);
            assert.deepEqual(r3, { __class__: "feng3d.GameObject", components: [{ x: 1 }] });
            //
            var obj3 = feng3d.serialization.deserialize(r3);
            var diff1 = feng3d.serialization.different(obj, obj3);
            assert.deepEqual(diff1, {});
            var gameobject = feng3d.serialization.setValue(new feng3d.GameObject(), {
                name: "gameobject",
                components: [{ __class__: "feng3d.MeshModel", geometry: feng3d.Geometry.plane },]
            });
            assert.equal(gameobject.numComponents, 2);
            var model = gameobject.getComponent(feng3d.MeshModel);
            assert.notEqual(model, null);
        });
        QUnit.test("different 相等对象", function (assert) {
            var o = { a: 1, b: { c: true, d: { e: "str" } } };
            var o1 = { a: 1, b: { c: true, d: { e: "str" } } };
            var diff = feng3d.serialization.different(o, o1);
            assert.deepEqual(diff, {});
            var v = new feng3d.Vector2();
            var v1 = new feng3d.Vector2();
            var diff1 = feng3d.serialization.different(v, v1);
            assert.deepEqual(diff1, {});
            var c = new C();
            var nc = new C();
            var diff2 = feng3d.serialization.different(c, nc);
            assert.deepEqual(diff2, {});
        });
        QUnit.test("different 目标数据为null时", function (assert) {
            var o = { a: 1, b: null };
            var o1 = { a: 1, b: { c: true, d: { e: "str" } } };
            var diff = feng3d.serialization.different(o, o1);
            assert.deepEqual(diff, { b: null });
            var diff = feng3d.serialization.different(o1, o);
            assert.deepEqual(diff, { b: { c: true, d: { e: "str" } } });
            var o2 = { v: new feng3d.Vector2() };
            var o3 = { v: null };
            var diff1 = feng3d.serialization.different(o2, o3);
            assert.deepEqual(diff1, { v: { __class__: "feng3d.Vector2" } });
            var diff1 = feng3d.serialization.different(o3, o2);
            assert.deepEqual(diff1, { v: null });
        });
        QUnit.test("different 基础类型", function (assert) {
            var o = { a: 1, b: true, c: "str", d: null, e: undefined, f: NaN };
            var o1 = { a: 2, b: false, c: "str1", d: 1, e: 1, f: 1 };
            var diff = feng3d.serialization.different(o, o1);
            assert.deepEqual(diff, o);
            var diff = feng3d.serialization.different(o1, o);
            assert.deepEqual(diff, o1);
        });
        QUnit.test("different 数组", function (assert) {
            var arr = [1, true, "str", null, undefined, NaN];
            var arr1 = [1, false, "str1", 1, 1, 1];
            //
            var diff = feng3d.serialization.different(arr, arr1);
            var expectDiff = [];
            arr.forEach(function (v, i) {
                if (arr[i] != arr1[i])
                    expectDiff[i] = arr[i];
            });
            assert.deepEqual(diff, expectDiff); // 此处有 expectDiff[0] 未定义
            //
            var diff1 = feng3d.serialization.different(arr1, arr);
            var expectDiff1 = [];
            arr.forEach(function (v, i) {
                if (arr[i] != arr1[i])
                    expectDiff1[i] = arr1[i];
            });
            assert.deepEqual(diff1, expectDiff1);
        });
        QUnit.test("different 不同对象类型", function (assert) {
            var o = { v: new feng3d.Vector2() };
            var o1 = { v: new feng3d.Vector3() };
            var serO = feng3d.serialization.serialize(o);
            var serO1 = feng3d.serialization.serialize(o1);
            var diff = feng3d.serialization.different(o, o1);
            assert.deepEqual(diff, serO);
            var diff = feng3d.serialization.different(o1, o);
            assert.deepEqual(diff, serO1);
        });
        QUnit.test("different 资源", function (assert) {
            var o = feng3d.Material.default; //默认材质资源
            var o1 = new feng3d.Material();
            var diff = feng3d.serialization.different(o, o1);
            assert.deepEqual(diff, { name: "Default-Material", assetId: "Default-Material", hideFlags: feng3d.HideFlags.NotEditable });
            var o2 = { v: feng3d.Material.default }; //默认材质资源
            var o3 = { v: new feng3d.Material() };
            var expectDiff = feng3d.serialization.serialize(o2);
            var diff1 = feng3d.serialization.different(o2, o3);
            assert.deepEqual(diff1, expectDiff);
        });
        QUnit.test("different 默认处理", function (assert) {
            var o = { a: 1, b: true, c: "abc" };
            var o1 = { a: 2, b: true, c: "abc" };
            var diff = feng3d.serialization.different(o, o1);
            assert.deepEqual(diff, { a: 1 });
            var o2 = new feng3d.Vector3();
            var o3 = new feng3d.Vector3(1, 2, 3);
            var diff1 = feng3d.serialization.different(o2, o3);
            assert.deepEqual(diff1, { x: 0, y: 0, z: 0 });
            //
            var diff2 = feng3d.serialization.different(new feng3d.GameObject(), new feng3d.GameObject());
            assert.deepEqual(diff2, {});
        });
        QUnit.test("serialization.setValue", function (assert) {
            // todo
            feng3d.serialization.setValue;
            assert.ok(true);
        });
    });
})(feng3d || (feng3d = {}));
QUnit.module("Task", function () {
    QUnit.test("series", function (assert) {
        var result = [];
        var arr = [1, 2, 3, 4, 5];
        var funcs = arr.map(function (v) {
            return function (callback) {
                result.push(v);
                setTimeout(function () {
                    callback();
                }, 1000);
            };
        });
        feng3d.task.series(funcs)(function () {
            console.assert(JSON.stringify(arr) == JSON.stringify(result));
        });
        assert.ok(true);
    });
});
QUnit.module("watcher", function () {
    QUnit.test("watch Object", function (assert) {
        var o = { a: 1 };
        var out = "";
        var f = function (h, p, o) { out += "f"; };
        var f1 = function (h, p, o) { out += "f1"; };
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
    QUnit.test("watch Object 性能", function (assert) {
        var o = { a: 1 };
        var num = 1000000;
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
        var num = 1000000;
        var s = Date.now();
        for (var i = 0; i < num; i++) {
            o.x = i;
        }
        var t0 = Date.now() - s;
        delete o.x;
        o.x = 0;
        var s = Date.now();
        for (var i = 0; i < num; i++) {
            o.x = i;
        }
        var t1 = Date.now() - s;
        var f = function () { };
        feng3d.watcher.watch(o, "x", f);
        o.x = 2;
        feng3d.watcher.unwatch(o, "x", f);
        o.x = 3;
        var s = Date.now();
        for (var i = 0; i < num; i++) {
            o.x = i;
        }
        var t2 = Date.now() - s;
        delete o.x;
        o.x = 0;
        var s = Date.now();
        for (var i = 0; i < num; i++) {
            o.x = i;
        }
        var t3 = Date.now() - s;
        assert.ok(true, t0 + "->" + t1 + "->" + t2 + "->" + t3 + " watch\u4E0Eunwatch\u64CD\u4F5C\u540E\u6027\u80FD 1->" + t0 / t1 + "->" + t0 / t2 + "->" + t0 / t3);
    });
    QUnit.test("watchchain Object", function (assert) {
        var o = { a: { b: { c: 1 } } };
        var out = "";
        var f = function (h, p, o) { out += "f"; };
        var f1 = function (h, p, o) { out += "f1"; };
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
        o.a.b.c = 3; // 调用一次 函数f
        assert.ok(out == "ff", "out:" + out);
        //
        out = "";
        feng3d.watcher.unwatchchain(o, "a.b.c", f);
        o.a.b.c = 4; // 取消监听后 不会触发函数f
        assert.ok(out == "", "out:" + out);
        //
        out = "";
        feng3d.watcher.watchchain(o, "a.b.c", f);
        o.a = null; // 触发一次函数f
        o.a = { b: { c: 1 } }; // 触发一次函数f
        o.a.b.c = 5; // 触发一次函数f
        assert.ok(out == "fff", out);
        //
        var obj = {};
        out = "";
        feng3d.watcher.watchchain(obj, "a.b.c", f); // 监听不存在的属性
        obj.a = { b: { c: 1 } }; //obj.a.b.c从undefined变为1，  调用一次 函数f
        obj.a = null; //obj.a.b.c从undefined变为1，  调用一次 函数f
        assert.ok(out == "ff", out);
    });
    QUnit.test("watchobject", function (assert) {
        var o = { a: { b: { c: 1 }, d: 2 } };
        var out = "";
        var f = function (h, p, o) { out += "f"; };
        feng3d.watcher.watchobject(o, { a: { b: { c: null }, d: null } }, f);
        // 添加监听后会自动生成 属性__watchchains__
        assert.ok(!!o[feng3d.__watchchains__]);
        var out = "";
        o.a.b.c = 10; // 调用一次函数f
        o.a.d = 10; // 调用一次函数f
        assert.equal(out, "ff");
        feng3d.watcher.unwatchobject(o, { a: { b: { c: null }, d: null } }, f);
        // 添加监听后会自动生成 属性__watchchains__
        assert.ok(!o[feng3d.__watchchains__]);
        var out = "";
        o.a.b.c = 10; // 调用一次函数f
        o.a.d = 10; // 调用一次函数f
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
//# sourceMappingURL=tests.js.map
console.log("feng3d-tests-0.0.3");
(function universalModuleDefinition(root, factory)
{
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define([], factory);
    else if (typeof exports === 'object')
        exports["tests"] = factory();
    else
        root["tests"] = factory();
    
    var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
    globalObject["tests"] = factory();
})(this, function ()
{
    return feng3d;
});
