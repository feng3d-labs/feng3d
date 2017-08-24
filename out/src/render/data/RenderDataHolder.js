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
    /**
     * 渲染数据拥有者
     * @author feng 2016-6-7
     */
    var RenderDataHolder = (function (_super) {
        __extends(RenderDataHolder, _super);
        /**
         * 创建GL数据缓冲
         */
        function RenderDataHolder() {
            var _this = _super.call(this) || this;
            _this._updateEverytime = false;
            _this._childrenRenderDataHolder = [];
            return _this;
        }
        Object.defineProperty(RenderDataHolder.prototype, "updateEverytime", {
            /**
             * 是否每次必须更新
             */
            get: function () { return this._updateEverytime; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderDataHolder.prototype, "childrenRenderDataHolder", {
            get: function () {
                return this._childrenRenderDataHolder;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        RenderDataHolder.prototype.collectRenderDataHolder = function (renderAtomic) {
            if (renderAtomic === void 0) { renderAtomic = null; }
            renderAtomic.addRenderDataHolder(this);
            for (var i = 0; i < this._childrenRenderDataHolder.length; i++) {
                this._childrenRenderDataHolder[i].collectRenderDataHolder(renderAtomic);
            }
        };
        RenderDataHolder.prototype.addRenderDataHolder = function (renderDataHolder) {
            if (this._childrenRenderDataHolder.indexOf(renderDataHolder) == -1)
                this._childrenRenderDataHolder.push(renderDataHolder);
            this.dispatch("addRenderHolder", renderDataHolder);
        };
        RenderDataHolder.prototype.removeRenderDataHolder = function (renderDataHolder) {
            var index = this._childrenRenderDataHolder.indexOf(renderDataHolder);
            if (index != -1)
                this._childrenRenderDataHolder.splice(index, 1);
            this.dispatch("removeRenderHolder", renderDataHolder);
        };
        /**
         * 更新渲染数据
         */
        RenderDataHolder.prototype.updateRenderData = function (renderContext, renderData) {
        };
        RenderDataHolder.prototype.invalidateRenderHolder = function () {
            this.dispatch("invalidateRenderHolder", this);
        };
        return RenderDataHolder;
    }(feng3d.RenderData));
    feng3d.RenderDataHolder = RenderDataHolder;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=RenderDataHolder.js.map