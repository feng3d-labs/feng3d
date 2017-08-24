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
    var Object3DRenderAtomic = (function (_super) {
        __extends(Object3DRenderAtomic, _super);
        function Object3DRenderAtomic() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._invalidateRenderDataHolderList = [];
            _this.renderHolderInvalid = true;
            _this.renderDataHolders = [];
            _this.updateEverytimeList = [];
            return _this;
        }
        Object3DRenderAtomic.prototype.onInvalidate = function (event) {
            var renderDataHolder = event.target;
            this.addInvalidateHolders(renderDataHolder);
        };
        Object3DRenderAtomic.prototype.onAddElement = function (event) {
            this.addRenderElement(event.data);
        };
        Object3DRenderAtomic.prototype.onRemoveElement = function (event) {
            this.removeRenderElement(event.data);
        };
        Object3DRenderAtomic.prototype.onInvalidateShader = function (event) {
            var renderDataHolder = event.target;
            this.addInvalidateShader(renderDataHolder);
        };
        Object3DRenderAtomic.prototype.onAddRenderHolder = function (event) {
            this.renderHolderInvalid = true;
            this.addRenderDataHolder(event.data);
        };
        Object3DRenderAtomic.prototype.onRemoveRenderHolder = function (event) {
            this.renderHolderInvalid = true;
            this.removeRenderDataHolder(event.data);
        };
        Object3DRenderAtomic.prototype.addInvalidateHolders = function (renderDataHolder) {
            if (this._invalidateRenderDataHolderList.indexOf(renderDataHolder) == -1) {
                this._invalidateRenderDataHolderList.push(renderDataHolder);
            }
        };
        Object3DRenderAtomic.prototype.addInvalidateShader = function (renderDataHolder) {
            this.invalidateShader();
        };
        Object3DRenderAtomic.prototype.addRenderDataHolder = function (renderDataHolder) {
            if (renderDataHolder instanceof feng3d.RenderDataHolder) {
                this.addRenderDataHolder(renderDataHolder.childrenRenderDataHolder);
                var index = this.renderDataHolders.indexOf(renderDataHolder);
                if (index != -1)
                    return;
                this.renderDataHolders.push(renderDataHolder);
                if (renderDataHolder.updateEverytime) {
                    this.updateEverytimeList.push(renderDataHolder);
                }
                this.addRenderElement(renderDataHolder.elements);
                this.addInvalidateShader(renderDataHolder);
                this.addInvalidateHolders(renderDataHolder);
                renderDataHolder.on("addRenderElement", this.onAddElement, this);
                renderDataHolder.on("removeRenderElement", this.onRemoveElement, this);
                renderDataHolder.on("addRenderHolder", this.onAddRenderHolder, this);
                renderDataHolder.on("removeRenderHolder", this.onRemoveRenderHolder, this);
                renderDataHolder.on("invalidateRenderHolder", this.onInvalidate, this);
            }
            else {
                for (var i = 0; i < renderDataHolder.length; i++) {
                    this.addRenderDataHolder(renderDataHolder[i]);
                }
            }
        };
        Object3DRenderAtomic.prototype.removeRenderDataHolder = function (renderDataHolder) {
            if (renderDataHolder instanceof Array) {
                for (var i = 0; i < renderDataHolder.length; i++) {
                    this.removeRenderDataHolder(renderDataHolder[i]);
                }
            }
            else {
                this.removeRenderDataHolder(renderDataHolder.childrenRenderDataHolder);
                var index = this.renderDataHolders.indexOf(renderDataHolder);
                if (index != -1)
                    this.renderDataHolders.splice(index, 1);
                if (renderDataHolder.updateEverytime) {
                    var index_1 = this.updateEverytimeList.indexOf(renderDataHolder);
                    if (index_1 != -1)
                        this.updateEverytimeList.splice(index_1, 1);
                }
                this.removeRenderElement(renderDataHolder.elements);
                this.addInvalidateShader(renderDataHolder);
                renderDataHolder.off("addRenderElement", this.onAddElement, this);
                renderDataHolder.off("removeRenderElement", this.onRemoveElement, this);
                renderDataHolder.off("addRenderHolder", this.onAddRenderHolder, this);
                renderDataHolder.off("removeRenderHolder", this.onRemoveRenderHolder, this);
            }
        };
        Object3DRenderAtomic.prototype.update = function (renderContext) {
            var _this = this;
            renderContext.updateRenderData1();
            this.addRenderDataHolder(renderContext);
            if (this.updateEverytimeList.length > 0) {
                this.updateEverytimeList.forEach(function (element) {
                    element.updateRenderData(renderContext, _this);
                });
            }
            if (this._invalidateRenderDataHolderList.length > 0) {
                this._invalidateRenderDataHolderList.forEach(function (element) {
                    element.updateRenderData(renderContext, _this);
                });
                this._invalidateRenderDataHolderList.length = 0;
            }
        };
        Object3DRenderAtomic.prototype.clear = function () {
            var _this = this;
            this.renderDataHolders.forEach(function (element) {
                _this.removeRenderDataHolder(element);
            });
        };
        return Object3DRenderAtomic;
    }(feng3d.RenderAtomic));
    feng3d.Object3DRenderAtomic = Object3DRenderAtomic;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=Object3DRenderAtomic.js.map