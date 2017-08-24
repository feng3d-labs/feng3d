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
    /**
     * A class to access the Mesh of the mesh filter.
     * Use this with a procedural mesh interface. See Also: Mesh class.
     */
    var MeshFilter = (function (_super) {
        __extends(MeshFilter, _super);
        function MeshFilter(gameObject) {
            return _super.call(this, gameObject) || this;
        }
        Object.defineProperty(MeshFilter.prototype, "mesh", {
            /**
             * Returns the instantiated Mesh assigned to the mesh filter.
             */
            get: function () {
                return this._mesh;
            },
            set: function (value) {
                if (this._mesh == value)
                    return;
                if (this._mesh) {
                    this.removeRenderDataHolder(this._mesh);
                }
                this._mesh = value;
                if (this._mesh) {
                    this.addRenderDataHolder(this._mesh);
                }
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 销毁
         */
        MeshFilter.prototype.dispose = function () {
            this.mesh = null;
            _super.prototype.dispose.call(this);
        };
        return MeshFilter;
    }(feng3d.Component));
    __decorate([
        feng3d.serialize
    ], MeshFilter.prototype, "mesh", null);
    feng3d.MeshFilter = MeshFilter;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=MeshFilter.js.map