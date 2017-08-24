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
    var RenderData = (function (_super) {
        __extends(RenderData, _super);
        function RenderData() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._elementMap = {};
            _this._elements = [];
            return _this;
        }
        Object.defineProperty(RenderData.prototype, "elements", {
            get: function () {
                return this._elements.concat();
            },
            enumerable: true,
            configurable: true
        });
        RenderData.prototype.createIndexBuffer = function (indices) {
            var renderData = this._elementMap["index"];
            if (!renderData) {
                this._elementMap["index"] = renderData = new feng3d.IndexRenderData();
                this.addRenderElement(renderData);
            }
            renderData.indices = indices;
            return renderData;
        };
        RenderData.prototype.createUniformData = function (name, data) {
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.UniformData(name, data);
                this.addRenderElement(renderData);
            }
            renderData.data = data;
            return renderData;
        };
        RenderData.prototype.createAttributeRenderData = function (name, data, size, divisor) {
            if (data === void 0) { data = null; }
            if (size === void 0) { size = 3; }
            if (divisor === void 0) { divisor = 0; }
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.AttributeRenderData(name, data, size, divisor);
                this.addRenderElement(renderData);
            }
            renderData.data = data;
            renderData.size = size;
            renderData.divisor = divisor;
            return renderData;
        };
        RenderData.prototype.createShaderCode = function (code) {
            var renderData = this._elementMap["shader"];
            if (!renderData) {
                this._elementMap["shader"] = renderData = new feng3d.ShaderCode(code);
                this.addRenderElement(renderData);
            }
            renderData.code = code;
            return renderData;
        };
        RenderData.prototype.createValueMacro = function (name, value) {
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.ValueMacro(name, value);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        };
        RenderData.prototype.createBoolMacro = function (name, value) {
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.BoolMacro(name, value);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        };
        RenderData.prototype.createAddMacro = function (name, value) {
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.AddMacro(name, value);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        };
        RenderData.prototype.createInstanceCount = function (value) {
            var renderData = this._elementMap["instanceCount"];
            if (!renderData) {
                this._elementMap["instanceCount"] = renderData = new feng3d.RenderInstanceCount();
                this.addRenderElement(renderData);
            }
            renderData.data = value;
            return renderData;
        };
        RenderData.prototype.createShaderParam = function (name, value) {
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.ShaderParam(name);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        };
        RenderData.prototype.addRenderElement = function (element) {
            if (element instanceof feng3d.RenderElement) {
                var index = this._elements.indexOf(element);
                if (index == -1) {
                    this._elements.push(element);
                    this.dispatch("addRenderElement", element);
                }
            }
            else {
                for (var i = 0; i < element.length; i++) {
                    this.addRenderElement(element[i]);
                }
            }
        };
        RenderData.prototype.removeRenderElement = function (element) {
            if (element instanceof feng3d.RenderElement) {
                var index = this._elements.indexOf(element);
                if (index != -1) {
                    this._elements.splice(i, 1);
                    this.dispatch("removeRenderElement", element);
                }
            }
            else {
                for (var i = 0; i < element.length; i++) {
                    this.removeRenderElement(element[i]);
                }
            }
        };
        return RenderData;
    }(feng3d.Event));
    feng3d.RenderData = RenderData;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=RenderData.js.map