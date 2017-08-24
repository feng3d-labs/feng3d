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
     * Position, rotation and scale of an object.
     */
    var Object3D = (function (_super) {
        __extends(Object3D, _super);
        //------------------------------------------
        // Functions
        //------------------------------------------
        function Object3D(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            //------------------------------------------
            // Private Properties
            //------------------------------------------
            _this._smallestNumber = 0.0000000000000000000001;
            _this._x = 0;
            _this._y = 0;
            _this._z = 0;
            _this._rx = 0;
            _this._ry = 0;
            _this._rz = 0;
            _this._sx = 1;
            _this._sy = 1;
            _this._sz = 1;
            return _this;
        }
        Object.defineProperty(Object3D.prototype, "x", {
            //------------------------------------------
            // Variables
            //------------------------------------------
            get: function () {
                return this._x;
            },
            set: function (val) {
                if (this._x == val)
                    return;
                this._x = val;
                this.invalidatePosition();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "y", {
            get: function () {
                return this._y;
            },
            set: function (val) {
                if (this._y == val)
                    return;
                this._y = val;
                this.invalidatePosition();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "z", {
            get: function () {
                return this._z;
            },
            set: function (val) {
                if (this._z == val)
                    return;
                this._z = val;
                this.invalidatePosition();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "rx", {
            get: function () {
                return this._rx;
            },
            set: function (val) {
                if (this.rx == val)
                    return;
                this._rx = val;
                this.invalidateRotation();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "ry", {
            get: function () {
                return this._ry;
            },
            set: function (val) {
                if (this.ry == val)
                    return;
                this._ry = val;
                this.invalidateRotation();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "rz", {
            get: function () {
                return this._rz;
            },
            set: function (val) {
                if (this.rz == val)
                    return;
                this._rz = val;
                this.invalidateRotation();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "sx", {
            get: function () {
                return this._sx;
            },
            set: function (val) {
                if (this._sx == val)
                    return;
                this._sx = val;
                this.invalidateScale();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "sy", {
            get: function () {
                return this._sy;
            },
            set: function (val) {
                if (this._sy == val)
                    return;
                this._sy = val;
                this.invalidateScale();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "sz", {
            get: function () {
                return this._sz;
            },
            set: function (val) {
                if (this._sz == val)
                    return;
                this._sz = val;
                this.invalidateScale();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "matrix3d", {
            /**
             * @private
             */
            get: function () {
                if (!this._matrix3d)
                    this.updateMatrix3D();
                return this._matrix3d;
            },
            set: function (val) {
                var raw = feng3d.Matrix3D.RAW_DATA_CONTAINER;
                val.copyRawDataTo(raw);
                if (!raw[0]) {
                    raw[0] = this._smallestNumber;
                    val.copyRawDataFrom(raw);
                }
                var elements = val.decompose();
                var vec;
                this.position = elements[0];
                this.rotation = elements[1].scaleBy(180 / Math.PI);
                this.scale = elements[2];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "rotationMatrix", {
            /**
             * 旋转矩阵
             */
            get: function () {
                if (!this._rotationMatrix3d)
                    this._rotationMatrix3d = feng3d.Matrix3D.fromRotation(this._rx, this._ry, this._rz);
                return this._rotationMatrix3d;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "position", {
            /**
             * 返回保存位置数据的Vector3D对象
             */
            get: function () {
                return new feng3d.Vector3D(this._x, this._y, this._z);
            },
            set: function (_a) {
                var _b = _a.x, x = _b === void 0 ? 1 : _b, _c = _a.y, y = _c === void 0 ? 1 : _c, _d = _a.z, z = _d === void 0 ? 1 : _d;
                if (this._x != x || this._y != y || this._z != z) {
                    this._x = x;
                    this._y = y;
                    this._z = z;
                    this.invalidatePosition();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "rotation", {
            get: function () {
                return new feng3d.Vector3D(this._rx, this._ry, this._rz);
            },
            set: function (_a) {
                var _b = _a.x, x = _b === void 0 ? 1 : _b, _c = _a.y, y = _c === void 0 ? 1 : _c, _d = _a.z, z = _d === void 0 ? 1 : _d;
                if (this._rx != x || this._ry != y || this._rz != z) {
                    this._rx = x;
                    this._ry = y;
                    this._rz = z;
                    this.invalidateRotation();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "scale", {
            get: function () {
                return new feng3d.Vector3D(this._sx, this._sy, this._sz);
            },
            set: function (_a) {
                var _b = _a.x, x = _b === void 0 ? 1 : _b, _c = _a.y, y = _c === void 0 ? 1 : _c, _d = _a.z, z = _d === void 0 ? 1 : _d;
                if (this._sx != x || this._sy != y || this._sz != z) {
                    this._sx = x;
                    this._sy = y;
                    this._sz = z;
                    this.invalidateScale();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "forwardVector", {
            get: function () {
                return this.matrix3d.forward;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "rightVector", {
            get: function () {
                return this.matrix3d.right;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "upVector", {
            get: function () {
                return this.matrix3d.up;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "backVector", {
            get: function () {
                var director = this.matrix3d.forward;
                director.negate();
                return director;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "leftVector", {
            get: function () {
                var director = this.matrix3d.left;
                director.negate();
                return director;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "downVector", {
            get: function () {
                var director = this.matrix3d.up;
                director.negate();
                return director;
            },
            enumerable: true,
            configurable: true
        });
        Object3D.prototype.moveForward = function (distance) {
            this.translateLocal(feng3d.Vector3D.Z_AXIS, distance);
        };
        Object3D.prototype.moveBackward = function (distance) {
            this.translateLocal(feng3d.Vector3D.Z_AXIS, -distance);
        };
        Object3D.prototype.moveLeft = function (distance) {
            this.translateLocal(feng3d.Vector3D.X_AXIS, -distance);
        };
        Object3D.prototype.moveRight = function (distance) {
            this.translateLocal(feng3d.Vector3D.X_AXIS, distance);
        };
        Object3D.prototype.moveUp = function (distance) {
            this.translateLocal(feng3d.Vector3D.Y_AXIS, distance);
        };
        Object3D.prototype.moveDown = function (distance) {
            this.translateLocal(feng3d.Vector3D.Y_AXIS, -distance);
        };
        Object3D.prototype.translate = function (axis, distance) {
            var x = axis.x, y = axis.y, z = axis.z;
            var len = distance / Math.sqrt(x * x + y * y + z * z);
            this._x += x * len;
            this._y += y * len;
            this._z += z * len;
            this.invalidatePosition();
        };
        Object3D.prototype.translateLocal = function (axis, distance) {
            var x = axis.x, y = axis.y, z = axis.z;
            var len = distance / Math.sqrt(x * x + y * y + z * z);
            var matrix3d = this.matrix3d.clone();
            matrix3d.prependTranslation(x * len, y * len, z * len);
            this._x = matrix3d.position.x;
            this._y = matrix3d.position.y;
            this._z = matrix3d.position.z;
            this.invalidatePosition();
        };
        Object3D.prototype.pitch = function (angle) {
            this.rotate(feng3d.Vector3D.X_AXIS, angle);
        };
        Object3D.prototype.yaw = function (angle) {
            this.rotate(feng3d.Vector3D.Y_AXIS, angle);
        };
        Object3D.prototype.roll = function (angle) {
            this.rotate(feng3d.Vector3D.Z_AXIS, angle);
        };
        Object3D.prototype.rotateTo = function (ax, ay, az) {
            this._rx = ax;
            this._ry = ay;
            this._rz = az;
            this.invalidateRotation();
        };
        /**
         * 绕指定轴旋转，不受位移与缩放影响
         * @param    axis               旋转轴
         * @param    angle              旋转角度
         * @param    pivotPoint         旋转中心点
         *
         */
        Object3D.prototype.rotate = function (axis, angle, pivotPoint) {
            //转换位移
            var positionMatrix3d = feng3d.Matrix3D.fromPosition(this.position);
            positionMatrix3d.appendRotation(axis, angle, pivotPoint);
            this.position = positionMatrix3d.position;
            //转换旋转
            var rotationMatrix3d = feng3d.Matrix3D.fromRotation(this.rx, this.ry, this.rz);
            rotationMatrix3d.appendRotation(axis, angle, pivotPoint);
            var newrotation = rotationMatrix3d.decompose()[1];
            newrotation.scaleBy(180 / Math.PI);
            var v = Math.round((newrotation.x - this.rx) / 180);
            if (v % 2 != 0) {
                newrotation.x += 180;
                newrotation.y = 180 - newrotation.y;
                newrotation.z += 180;
            }
            //
            var toRound = function (a, b, c) {
                if (c === void 0) { c = 360; }
                return Math.round((b - a) / c) * c + a;
            };
            newrotation.x = toRound(newrotation.x, this.rx);
            newrotation.y = toRound(newrotation.y, this.ry);
            newrotation.z = toRound(newrotation.z, this.rz);
            this.rotation = newrotation;
        };
        Object3D.prototype.lookAt = function (target, upAxis) {
            if (upAxis === void 0) { upAxis = null; }
            var xAxis = new feng3d.Vector3D();
            var yAxis = new feng3d.Vector3D();
            var zAxis = new feng3d.Vector3D();
            var raw;
            upAxis = upAxis || feng3d.Vector3D.Y_AXIS;
            if (!this._matrix3d) {
                this.updateMatrix3D();
            }
            zAxis.x = target.x - this._x;
            zAxis.y = target.y - this._y;
            zAxis.z = target.z - this._z;
            zAxis.normalize();
            xAxis.x = upAxis.y * zAxis.z - upAxis.z * zAxis.y;
            xAxis.y = upAxis.z * zAxis.x - upAxis.x * zAxis.z;
            xAxis.z = upAxis.x * zAxis.y - upAxis.y * zAxis.x;
            xAxis.normalize();
            if (xAxis.length < .05) {
                xAxis.x = upAxis.y;
                xAxis.y = upAxis.x;
                xAxis.z = 0;
                xAxis.normalize();
            }
            yAxis.x = zAxis.y * xAxis.z - zAxis.z * xAxis.y;
            yAxis.y = zAxis.z * xAxis.x - zAxis.x * xAxis.z;
            yAxis.z = zAxis.x * xAxis.y - zAxis.y * xAxis.x;
            raw = feng3d.Matrix3D.RAW_DATA_CONTAINER;
            raw[0] = this._sx * xAxis.x;
            raw[1] = this._sx * xAxis.y;
            raw[2] = this._sx * xAxis.z;
            raw[3] = 0;
            raw[4] = this._sy * yAxis.x;
            raw[5] = this._sy * yAxis.y;
            raw[6] = this._sy * yAxis.z;
            raw[7] = 0;
            raw[8] = this._sz * zAxis.x;
            raw[9] = this._sz * zAxis.y;
            raw[10] = this._sz * zAxis.z;
            raw[11] = 0;
            raw[12] = this._x;
            raw[13] = this._y;
            raw[14] = this._z;
            raw[15] = 1;
            this._matrix3d.copyRawDataFrom(raw);
            this.matrix3d = this.matrix3d;
            if (zAxis.z < 0) {
                this.ry = (180 - this.ry);
                this.rx -= 180;
                this.rz -= 180;
            }
        };
        Object3D.prototype.disposeAsset = function () {
            this.dispose();
        };
        Object3D.prototype.invalidateTransform = function () {
            if (!this._matrix3d)
                return;
            this._matrix3d = null;
            this.dispatch("transformChanged", this);
        };
        //------------------------------------------
        // Protected Properties
        //------------------------------------------
        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        Object3D.prototype.updateMatrix3D = function () {
            if (!this._position)
                this._position = new feng3d.Vector3D(this._x, this._y, this._z);
            if (!this._rotation)
                this._rotation = new feng3d.Vector3D(this._rx, this._ry, this._rz);
            if (!this._scale)
                this._scale = new feng3d.Vector3D(this._sx, this._sy, this._sz);
            this._matrix3d = new feng3d.Matrix3D().recompose([this._position, this._rotation.clone().scaleBy(Math.PI / 180), this._scale]);
        };
        //------------------------------------------
        // Private Methods
        //------------------------------------------
        Object3D.prototype.invalidateRotation = function () {
            if (!this._rotation)
                return;
            this._rotation = null;
            this._rotationMatrix3d = null;
            this._localToWorldRotationMatrix = null;
            this.dispatch("rotationChanged", this);
            this.invalidateTransform();
        };
        Object3D.prototype.invalidateScale = function () {
            if (!this._scale)
                return;
            this._scale = null;
            this.dispatch("scaleChanged", this);
            this.invalidateTransform();
        };
        Object3D.prototype.invalidatePosition = function () {
            if (!this._position)
                return;
            this._position = null;
            this.dispatch("positionChanged", this);
            this.invalidateTransform();
        };
        return Object3D;
    }(feng3d.Component));
    __decorate([
        feng3d.serialize
    ], Object3D.prototype, "x", null);
    __decorate([
        feng3d.serialize
    ], Object3D.prototype, "y", null);
    __decorate([
        feng3d.serialize
    ], Object3D.prototype, "z", null);
    __decorate([
        feng3d.serialize
    ], Object3D.prototype, "rx", null);
    __decorate([
        feng3d.serialize
    ], Object3D.prototype, "ry", null);
    __decorate([
        feng3d.serialize
    ], Object3D.prototype, "rz", null);
    __decorate([
        feng3d.serialize
    ], Object3D.prototype, "sx", null);
    __decorate([
        feng3d.serialize
    ], Object3D.prototype, "sy", null);
    __decorate([
        feng3d.serialize
    ], Object3D.prototype, "sz", null);
    feng3d.Object3D = Object3D;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=Object3D.js.map