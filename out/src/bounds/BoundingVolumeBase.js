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
     * 包围盒基类
     * @author feng 2014-4-27
     */
    var BoundingVolumeBase = (function (_super) {
        __extends(BoundingVolumeBase, _super);
        /**
         * 创建包围盒
         */
        function BoundingVolumeBase() {
            var _this = _super.call(this) || this;
            _this._aabbPointsDirty = true;
            _this._min = new feng3d.Vector3D();
            _this._max = new feng3d.Vector3D();
            return _this;
        }
        Object.defineProperty(BoundingVolumeBase.prototype, "geometry", {
            /**
             * 用于生产包围盒的几何体
             */
            get: function () {
                return this._geometry;
            },
            set: function (value) {
                if (this._geometry) {
                    this._geometry.off("boundsInvalid", this.onGeometryBoundsInvalid, this);
                }
                this._geometry = value;
                this.fromGeometry(this._geometry);
                if (this._geometry) {
                    this._geometry.on("boundsInvalid", this.onGeometryBoundsInvalid, this);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoundingVolumeBase.prototype, "max", {
            /**
             * The maximum extreme of the bounds
             */
            get: function () {
                return this._max;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoundingVolumeBase.prototype, "min", {
            /**
             * The minimum extreme of the bounds
             */
            get: function () {
                return this._min;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 处理几何体包围盒失效
         */
        BoundingVolumeBase.prototype.onGeometryBoundsInvalid = function () {
            this.fromGeometry(this.geometry);
            this.dispatch("change");
        };
        /**
         * 根据几何结构更新边界
         */
        BoundingVolumeBase.prototype.fromGeometry = function (geometry) {
            var minX, minY, minZ;
            var maxX, maxY, maxZ;
            if (!geometry || !geometry.positions) {
                this.fromExtremes(0, 0, 0, 0, 0, 0);
                return;
            }
            var vertices = geometry.positions;
            var i = 0;
            minX = maxX = vertices[i];
            minY = maxY = vertices[i + 1];
            minZ = maxZ = vertices[i + 2];
            var vertexDataLen = vertices.length;
            i = 0;
            var stride = 3;
            while (i < vertexDataLen) {
                var v = vertices[i];
                if (v < minX)
                    minX = v;
                else if (v > maxX)
                    maxX = v;
                v = vertices[i + 1];
                if (v < minY)
                    minY = v;
                else if (v > maxY)
                    maxY = v;
                v = vertices[i + 2];
                if (v < minZ)
                    minZ = v;
                else if (v > maxZ)
                    maxZ = v;
                i += stride;
            }
            this.fromExtremes(minX, minY, minZ, maxX, maxY, maxZ);
        };
        /**
         * 根据所给极值设置边界
         * @param minX 边界最小X坐标
         * @param minY 边界最小Y坐标
         * @param minZ 边界最小Z坐标
         * @param maxX 边界最大X坐标
         * @param maxY 边界最大Y坐标
         * @param maxZ 边界最大Z坐标
         */
        BoundingVolumeBase.prototype.fromExtremes = function (minX, minY, minZ, maxX, maxY, maxZ) {
            this._min.x = minX;
            this._min.y = minY;
            this._min.z = minZ;
            this._max.x = maxX;
            this._max.y = maxY;
            this._max.z = maxZ;
        };
        /**
         * 检测射线是否与边界交叉
         * @param ray3D						射线
         * @param targetNormal				交叉点法线值
         * @return							射线起点到交点距离
         */
        BoundingVolumeBase.prototype.rayIntersection = function (ray3D, targetNormal) {
            return -1;
        };
        /**
         * 检测是否包含指定点
         * @param position 		被检测点
         * @return				true：包含指定点
         */
        BoundingVolumeBase.prototype.containsPoint = function (position) {
            return false;
        };
        /**
         * 从给出的球体设置边界
         * @param center 		球心坐标
         * @param radius 		球体半径
         */
        BoundingVolumeBase.prototype.fromSphere = function (center, radius) {
            this.fromExtremes(center.x - radius, center.y - radius, center.z - radius, center.x + radius, center.y + radius, center.z + radius);
        };
        return BoundingVolumeBase;
    }(feng3d.Event));
    feng3d.BoundingVolumeBase = BoundingVolumeBase;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=BoundingVolumeBase.js.map