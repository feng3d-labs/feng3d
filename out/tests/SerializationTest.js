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
    var ObjectBase = (function () {
        function ObjectBase() {
            this.id = 1;
        }
        return ObjectBase;
    }());
    __decorate([
        feng3d.serialize
    ], ObjectBase.prototype, "id", void 0);
    feng3d.ObjectBase = ObjectBase;
    var C = (function (_super) {
        __extends(C, _super);
        function C() {
            // @serialize()
            // id = 2;
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.a = 1;
            _this.c = 1;
            return _this;
        }
        C.prototype.change = function () {
            console.log("change", this.a, arguments);
        };
        return C;
    }(ObjectBase));
    __decorate([
        feng3d.serialize
    ], C.prototype, "a", void 0);
    __decorate([
        feng3d.serialize
    ], C.prototype, "c", void 0);
    feng3d.C = C;
    var SerializationTest = (function () {
        function SerializationTest() {
            var base = new ObjectBase();
            base.id = Math.random();
            var resultb = feng3d.serialization.serialize(base);
            var base1 = new ObjectBase();
            feng3d.serialization.deserialize(base1);
            console.assert(base.id == base1.id);
            var c = new C();
            c.id = Math.random();
            c.a = Math.random();
            c.c = Math.random();
            var result = feng3d.serialization.serialize(c);
            var c1 = new C();
            feng3d.serialization.deserialize(c1);
            console.assert(c.id == c1.id);
            console.assert(c.a == c1.a);
            console.assert(c.c == c1.c);
        }
        return SerializationTest;
    }());
    feng3d.SerializationTest = SerializationTest;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=SerializationTest.js.map