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
    var UniformData = (function (_super) {
        __extends(UniformData, _super);
        function UniformData(name, data) {
            var _this = _super.call(this) || this;
            _this.name = name;
            _this.data = data;
            return _this;
        }
        return UniformData;
    }(feng3d.RenderElement));
    feng3d.UniformData = UniformData;
    var RenderInstanceCount = (function (_super) {
        __extends(RenderInstanceCount, _super);
        function RenderInstanceCount() {
            var _this = _super.call(this) || this;
            _this.name = "instanceCount";
            return _this;
        }
        return RenderInstanceCount;
    }(feng3d.RenderElement));
    feng3d.RenderInstanceCount = RenderInstanceCount;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=UniformData.js.map