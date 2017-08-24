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
    var RenderElement = (function (_super) {
        __extends(RenderElement, _super);
        function RenderElement() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        RenderElement.prototype.invalidate = function () {
            this.dispatch("change");
        };
        return RenderElement;
    }(feng3d.Event));
    feng3d.RenderElement = RenderElement;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=RenderElement.js.map