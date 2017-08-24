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
    var ObjectContainer3D = (function (_super) {
        __extends(ObjectContainer3D, _super);
        //------------------------------------------
        // Functions
        //------------------------------------------
        function ObjectContainer3D(gameObject) {
            return _super.call(this, gameObject) || this;
        }
        Object.defineProperty(ObjectContainer3D.prototype, "scenePosition", {
            get: function () {
                return this.localToWorldMatrix.position;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "minX", {
            get: function () {
                var i = 0;
                var len = this.gameObject.numChildren;
                var min = Number.POSITIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this.gameObject.getChildAt(i++).transform;
                    m = child.minX + child.x;
                    if (m < min)
                        min = m;
                }
                return min;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "minY", {
            get: function () {
                var i = 0;
                var len = this.gameObject.numChildren;
                var min = Number.POSITIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this.gameObject.getChildAt(i++).transform;
                    m = child.minY + child.y;
                    if (m < min)
                        min = m;
                }
                return min;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "minZ", {
            get: function () {
                var i = 0;
                var len = this.gameObject.numChildren;
                var min = Number.POSITIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this.gameObject.getChildAt(i++).transform;
                    m = child.minZ + child.z;
                    if (m < min)
                        min = m;
                }
                return min;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "maxX", {
            get: function () {
                var i = 0;
                var len = this.gameObject.numChildren;
                var max = Number.NEGATIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this.gameObject.getChildAt(i++).transform;
                    m = child.maxX + child.x;
                    if (m > max)
                        max = m;
                }
                return max;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "maxY", {
            get: function () {
                var i = 0;
                var len = this.gameObject.numChildren;
                var max = Number.NEGATIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this.gameObject.getChildAt(i++).transform;
                    m = child.maxY + child.y;
                    if (m > max)
                        max = m;
                }
                return max;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "maxZ", {
            get: function () {
                var i = 0;
                var len = this.gameObject.numChildren;
                var max = Number.NEGATIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this.gameObject.getChildAt(i++).transform;
                    m = child.maxZ + child.z;
                    if (m > max)
                        max = m;
                }
                return max;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "parent", {
            get: function () {
                return this.gameObject.parent && this.gameObject.parent.transform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "localToWorldMatrix", {
            /**
             * Matrix that transforms a point from local space into world space.
             */
            get: function () {
                if (!this._localToWorldMatrix)
                    this.updateLocalToWorldMatrix();
                return this._localToWorldMatrix;
            },
            set: function (value) {
                value = value.clone();
                this.parent && value.append(this.parent.worldToLocalMatrix);
                this.matrix3d = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "worldToLocalMatrix", {
            /**
             * Matrix that transforms a point from world space into local space (Read Only).
             */
            get: function () {
                if (!this._worldToLocalMatrix)
                    this._worldToLocalMatrix = this.localToWorldMatrix.clone().invert();
                return this._worldToLocalMatrix;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "localToWorldRotationMatrix", {
            get: function () {
                if (!this._localToWorldRotationMatrix) {
                    this._localToWorldRotationMatrix = this.rotationMatrix.clone();
                    if (this.parent)
                        this._localToWorldRotationMatrix.append(this.parent.localToWorldRotationMatrix);
                }
                return this._localToWorldRotationMatrix;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Transforms direction from local space to world space.
         */
        ObjectContainer3D.prototype.transformDirection = function (direction) {
            if (!this.parent)
                return direction.clone();
            var matrix3d = this.parent.localToWorldRotationMatrix;
            direction = matrix3d.transformVector(direction);
            return direction;
        };
        /**
         * Transforms position from local space to world space.
         */
        ObjectContainer3D.prototype.transformPoint = function (position) {
            if (!this.parent)
                return position.clone();
            var matrix3d = this.parent.localToWorldMatrix;
            position = matrix3d.transformVector(position);
            return position;
        };
        /**
         * Transforms vector from local space to world space.
         */
        ObjectContainer3D.prototype.transformVector = function (vector) {
            if (!this.parent)
                return vector.clone();
            var matrix3d = this.parent.localToWorldMatrix;
            vector = matrix3d.deltaTransformVector(vector);
            return vector;
        };
        /**
         * Transforms a direction from world space to local space. The opposite of Transform.TransformDirection.
         */
        ObjectContainer3D.prototype.inverseTransformDirection = function (direction) {
            if (!this.parent)
                return direction.clone();
            var matrix3d = this.parent.localToWorldRotationMatrix.clone().invert();
            direction = matrix3d.transformVector(direction);
            return direction;
        };
        /**
         * Transforms position from world space to local space.
         */
        ObjectContainer3D.prototype.inverseTransformPoint = function (position) {
            if (!this.parent)
                return position.clone();
            var matrix3d = this.parent.localToWorldMatrix.clone().invert();
            position = matrix3d.transformVector(position);
            return position;
        };
        /**
         * Transforms a vector from world space to local space. The opposite of Transform.TransformVector.
         */
        ObjectContainer3D.prototype.inverseTransformVector = function (vector) {
            if (!this.parent)
                return vector.clone();
            var matrix3d = this.parent.localToWorldMatrix.clone().invert();
            vector = matrix3d.deltaTransformVector(vector);
            return vector;
        };
        ObjectContainer3D.prototype.lookAt = function (target, upAxis) {
            if (upAxis === void 0) { upAxis = null; }
            _super.prototype.lookAt.call(this, target, upAxis);
            this.invalidateSceneTransform();
        };
        ObjectContainer3D.prototype.translateLocal = function (axis, distance) {
            _super.prototype.translateLocal.call(this, axis, distance);
            this.invalidateSceneTransform();
        };
        ObjectContainer3D.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
        };
        ObjectContainer3D.prototype.rotate = function (axis, angle, pivotPoint) {
            _super.prototype.rotate.call(this, axis, angle, pivotPoint);
            this.invalidateSceneTransform();
        };
        ObjectContainer3D.prototype.invalidateTransform = function () {
            _super.prototype.invalidateTransform.call(this);
            this.invalidateSceneTransform();
        };
        //------------------------------------------
        // Protected Properties
        //------------------------------------------
        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        ObjectContainer3D.prototype.updateLocalToWorldMatrix = function () {
            this._localToWorldMatrix = this.matrix3d.clone();
            if (this.parent)
                this._localToWorldMatrix.append(this.parent.localToWorldMatrix);
            this.dispatch("updateLocalToWorldMatrix");
        };
        //------------------------------------------
        // Private Properties
        //------------------------------------------
        //------------------------------------------
        // Private Methods
        //------------------------------------------
        ObjectContainer3D.prototype.invalidateSceneTransform = function () {
            if (!this._localToWorldMatrix)
                return;
            this._localToWorldMatrix = null;
            this._worldToLocalMatrix = null;
            this.dispatch("scenetransformChanged", this);
            //
            for (var i = 0, n = this.gameObject.numChildren; i < n; i++) {
                this.gameObject.getChildAt(i).transform.invalidateSceneTransform();
            }
        };
        return ObjectContainer3D;
    }(feng3d.Object3D));
    feng3d.ObjectContainer3D = ObjectContainer3D;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=ObjectContainer3D.js.map