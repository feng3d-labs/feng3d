var feng3d;
(function (feng3d) {
    var UnitTest = (function () {
        function UnitTest() {
            console.log("\u6267\u884C\u5355\u5143\u6D4B\u8BD5");
            var start = Date.now();
            this.test();
            console.log("\u901A\u8FC7\u5355\u5143\u6D4B\u8BD5\uFF0C\u8017\u65F6" + (Date.now() - start) / 1000 + "s");
        }
        UnitTest.prototype.test = function () {
            this.testClass([
                feng3d.ArrayListTest,
                feng3d.ClassUtilsTest,
                feng3d.EulerTest,
                feng3d.SerializationTest,
            ]);
        };
        UnitTest.prototype.testClass = function (cls) {
            if (cls instanceof Array) {
                for (var i = 0; i < cls.length; i++) {
                    this.testClass(cls[i]);
                }
                return;
            }
            var classname = cls["name"];
            console.log("\u6267\u884C " + classname + " \u6D4B\u8BD5");
            var start = Date.now();
            new cls();
            console.log(classname + " \u6D4B\u8BD5\u901A\u8FC7\uFF0C\u8017\u65F6" + (Date.now() - start) / 1000 + "s");
        };
        return UnitTest;
    }());
    feng3d.UnitTest = UnitTest;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=UnitTest.js.map