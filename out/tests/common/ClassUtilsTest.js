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
var feng3d;
(function (feng3d) {
    var ClassUtilsTest = (function () {
        function ClassUtilsTest() {
            this.init();
        }
        ClassUtilsTest.prototype.init = function () {
            this.testGetQualifiedClassName();
            this.testGetQualifiedSuperclassName();
        };
        ClassUtilsTest.prototype.testGetQualifiedClassName = function () {
            var className = feng3d.ClassUtils.getQualifiedClassName(feng3d.Event);
            console.assert(className == "feng3d.Event");
            var className = feng3d.ClassUtils.getQualifiedClassName(true);
            console.assert(className == "Boolean");
            var className = feng3d.ClassUtils.getQualifiedClassName(Boolean);
            console.assert(className == "Boolean");
            var className = feng3d.ClassUtils.getQualifiedClassName("1");
            console.assert(className == "String");
            var className = feng3d.ClassUtils.getQualifiedClassName(String);
            console.assert(className == "String");
            var className = feng3d.ClassUtils.getQualifiedClassName(123);
            console.assert(className == "Number");
            var className = feng3d.ClassUtils.getQualifiedClassName(Number);
            console.assert(className == "Number");
        };
        ClassUtilsTest.prototype.testGetQualifiedSuperclassName = function () {
            var className = feng3d.ClassUtils.getQualifiedSuperclassName(new ChildClassTest());
            console.assert(className == "feng3d.SuperClassTest");
            var className = feng3d.ClassUtils.getQualifiedSuperclassName(ChildClassTest);
            console.assert(className == "feng3d.SuperClassTest");
        };
        return ClassUtilsTest;
    }());
    feng3d.ClassUtilsTest = ClassUtilsTest;
    var SuperClassTest = (function () {
        function SuperClassTest() {
        }
        return SuperClassTest;
    }());
    feng3d.SuperClassTest = SuperClassTest;
    var ChildClassTest = (function (_super) {
        __extends(ChildClassTest, _super);
        function ChildClassTest() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return ChildClassTest;
    }(SuperClassTest));
    feng3d.ChildClassTest = ChildClassTest;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=ClassUtilsTest.js.map