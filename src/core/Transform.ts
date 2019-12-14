namespace feng3d
{
    export interface GameObjectEventMap
    {
        /**
         * 变换矩阵变化
         */
        transformChanged
        /**
         * 
         */
        updateLocalToWorldMatrix

        /**
         * 场景矩阵变化
         */
        scenetransformChanged: Transform;
    }

    export interface ComponentMap { Transfrom: Transform; }

	/**
     * 变换
     * 
	 * 物体的位置、旋转和比例。
     * 
	 * 场景中的每个对象都有一个变换。它用于存储和操作对象的位置、旋转和缩放。每个转换都可以有一个父元素，它允许您分层应用位置、旋转和缩放
	 */
    export class Transform extends Component
    {
        __class__: "feng3d.Transform";

        get single() { return true; }

		/**
		 * 创建一个实体，该类为虚类
		 */
        constructor()
        {
            super();

            watcher.watch(this._position, "x", this._positionChanged, this);
            watcher.watch(this._position, "y", this._positionChanged, this);
            watcher.watch(this._position, "z", this._positionChanged, this);
            watcher.watch(this._rotation, "x", this._rotationChanged, this);
            watcher.watch(this._rotation, "y", this._rotationChanged, this);
            watcher.watch(this._rotation, "z", this._rotationChanged, this);
            watcher.watch(this._scale, "x", this._scaleChanged, this);
            watcher.watch(this._scale, "y", this._scaleChanged, this);
            watcher.watch(this._scale, "z", this._scaleChanged, this);

            this._renderAtomic.uniforms.u_modelMatrix = () => this.localToWorldMatrix;
            this._renderAtomic.uniforms.u_ITModelMatrix = () => this.ITlocalToWorldMatrix;
        }

        /**
         * 世界坐标
         */
        get worldPosition()
        {
            return this.localToWorldMatrix.getPosition();
        }

        get parent()
        {
            return this.gameObject.parent && this.gameObject.parent.transform;
        }

        /**
         * X轴坐标。
         */
        @serialize
        get x() { return this._position.x; }
        set x(v) { this._position.x = v; }

        /**
         * Y轴坐标。
         */
        @serialize
        get y() { return this._position.y; }
        set y(v) { this._position.y = v; }

        /**
         * Z轴坐标。
         */
        @serialize
        get z() { return this._position.z; }
        set z(v) { this._position.z = v; }

        /**
         * X轴旋转角度。
         */
        @serialize
        get rx() { return this._rotation.x; }
        set rx(v) { this._rotation.x = v; }

        /**
         * Y轴旋转角度。
         */
        @serialize
        get ry() { return this._rotation.y; }
        set ry(v) { this._rotation.y = v; }

        /**
         * Z轴旋转角度。
         */
        @serialize
        get rz() { return this._rotation.z; }
        set rz(v) { this._rotation.z = v; }

        /**
         * X轴缩放。
         */
        @serialize
        get sx() { return this._scale.x; }
        set sx(v) { this._scale.x = v; }

        /**
         * Y轴缩放。
         */
        @serialize
        get sy() { return this._scale.y; }
        set sy(v) { this._scale.y = v; }

        /**
         * Z轴缩放。
         */
        @serialize
        get sz() { return this._scale.z; }
        set sz(v) { this._scale.z = v; }

        /**
         * 本地位移
         */
        @oav({ tooltip: "本地位移" })
        get position() { return this._position; }
        set position(v) { this._position.copy(v); }

        /**
         * 本地旋转
         */
        @oav({ tooltip: "本地旋转", component: "OAVVector3", componentParam: { step: 0.001, stepScale: 30, stepDownup: 1 } })
        get rotation() { return this._rotation; }
        set rotation(v) { this._rotation.copy(v); }

        /**
         * 本地四元素旋转
         */
        get orientation()
        {
            this._orientation.fromMatrix(this.matrix3d);
            return this._orientation;
        }

        set orientation(value)
        {
            var angles = value.toEulerAngles();
            angles.scaleNumber(Math.RAD2DEG);
            this.rotation = angles;
        }

        /**
         * 本地缩放
         */
        @oav({ tooltip: "本地缩放" })
        get scale() { return this._scale; }
        set scale(v) { this._scale.copy(v); }

        /**
         * 本地变换矩阵
         */
        get matrix3d(): Matrix4x4
        {
            return this._updateMatrix3D();
        }

        set matrix3d(v: Matrix4x4)
        {
            v.decompose(this._position, this._rotation, this._scale);
            this._matrix3d.copyRawDataFrom(v.rawData);
            this._matrix3dInvalid = false;
        }

        /**
         * 本地旋转矩阵
         */
        get rotationMatrix()
        {
            if (this._rotationMatrix3dInvalid)
            {
                this._rotationMatrix3d.setRotation(this._rotation);
                this._rotationMatrix3dInvalid = false;
            }
            return this._rotationMatrix3d;
        }

        /**
         * 向前向量
         */
        get forwardVector() { return this.matrix3d.forward; }

        /**
         * 向右向量
         */
        get rightVector() { return this.matrix3d.right; }

        /**
         * 向上向量
         */
        get upVector() { return this.matrix3d.up; }

        /**
         * 向后向量
         */
        get backVector()
        {
            this.matrix3d.back

            var director: Vector3 = this.matrix3d.forward;
            director.negate();
            return director;
        }

        get leftVector(): Vector3
        {
            var director: Vector3 = this.matrix3d.left;
            director.negate();
            return director;
        }

        get downVector(): Vector3
        {
            var director: Vector3 = this.matrix3d.up;
            director.negate();
            return director;
        }

        moveForward(distance: number)
        {
            this.translateLocal(Vector3.Z_AXIS, distance);
        }

        moveBackward(distance: number)
        {
            this.translateLocal(Vector3.Z_AXIS, -distance);
        }

        moveLeft(distance: number)
        {
            this.translateLocal(Vector3.X_AXIS, -distance);
        }

        moveRight(distance: number)
        {
            this.translateLocal(Vector3.X_AXIS, distance);
        }

        moveUp(distance: number)
        {
            this.translateLocal(Vector3.Y_AXIS, distance);
        }

        moveDown(distance: number)
        {
            this.translateLocal(Vector3.Y_AXIS, -distance);
        }

        translate(axis: Vector3, distance: number)
        {
            var x = <any>axis.x, y = <any>axis.y, z = <any>axis.z;
            var len = distance / Math.sqrt(x * x + y * y + z * z);
            this.x += x * len;
            this.y += y * len;
            this.z += z * len;
        }

        translateLocal(axis: Vector3, distance: number)
        {
            var x = <any>axis.x, y = <any>axis.y, z = <any>axis.z;
            var len = distance / Math.sqrt(x * x + y * y + z * z);
            var matrix3d = this.matrix3d.clone();
            matrix3d.prependTranslation(x * len, y * len, z * len);
            var p = matrix3d.getPosition();
            this.x = p.x;
            this.y = p.y;
            this.z = p.z;
            this._invalidateSceneTransform();
        }

        pitch(angle: number)
        {
            this.rotate(Vector3.X_AXIS, angle);
        }

        yaw(angle: number)
        {
            this.rotate(Vector3.Y_AXIS, angle);
        }

        roll(angle: number)
        {
            this.rotate(Vector3.Z_AXIS, angle);
        }

        rotateTo(ax: number, ay: number, az: number)
        {
            this._rotation.set(ax, ay, az);
        }

        /**
         * 绕指定轴旋转，不受位移与缩放影响
         * @param    axis               旋转轴
         * @param    angle              旋转角度
         * @param    pivotPoint         旋转中心点
         * 
         */
        rotate(axis: Vector3, angle: number, pivotPoint?: Vector3): void
        {
            //转换位移
            var positionMatrix3d = Matrix4x4.fromPosition(this.position.x, this.position.y, this.position.z);
            positionMatrix3d.appendRotation(axis, angle, pivotPoint);
            this.position = positionMatrix3d.getPosition();
            //转换旋转
            var rotationMatrix3d = Matrix4x4.fromRotation(this.rx, this.ry, this.rz);
            rotationMatrix3d.appendRotation(axis, angle, pivotPoint);
            var newrotation = rotationMatrix3d.decompose()[1];
            var v = Math.round((newrotation.x - this.rx) / 180);
            if (v % 2 != 0)
            {
                newrotation.x += 180;
                newrotation.y = 180 - newrotation.y;
                newrotation.z += 180;
            }
            //
            var toRound = (a: number, b: number, c = 360) =>
            {
                return Math.round((b - a) / c) * c + a;
            }
            newrotation.x = toRound(newrotation.x, this.rx);
            newrotation.y = toRound(newrotation.y, this.ry);
            newrotation.z = toRound(newrotation.z, this.rz);
            this.rotation = newrotation;
            this._invalidateSceneTransform();
        }

        /**
         * 看向目标位置
         * 
         * @param target    目标位置
         * @param upAxis    向上朝向
         */
        lookAt(target: Vector3, upAxis?: Vector3)
        {
            this._updateMatrix3D();
            this._matrix3d.lookAt(target, upAxis);
            this._matrix3d.decompose(this._position, this._rotation, this._scale);
            this._matrix3dInvalid = false;
        }

        /**
         * 将一个点从局部空间变换到世界空间的矩阵。
         */
        get localToWorldMatrix(): Matrix4x4
        {
            return this._updateLocalToWorldMatrix();
        }

        set localToWorldMatrix(value: Matrix4x4)
        {
            value = value.clone();
            this.parent && value.append(this.parent.worldToLocalMatrix);
            this.matrix3d = value;
        }

        /**
         * 本地转世界逆转置矩阵
         */
        get ITlocalToWorldMatrix()
        {
            return this._updateITlocalToWorldMatrix();
        }

        /**
         * 将一个点从世界空间转换为局部空间的矩阵。
         */
        get worldToLocalMatrix(): Matrix4x4
        {
            return this._updateWorldToLocalMatrix();
        }

        get localToWorldRotationMatrix()
        {
            return this._upDateLocalToWorldRotationMatrix();
        }

        get worldToLocalRotationMatrix()
        {
            var mat = this.localToWorldRotationMatrix.clone();
            mat.invert();
            return mat;
        }

        /**
         * 将方向从局部空间转换到世界空间。
         */
        transformDirection(direction: Vector3)
        {
            if (!this.parent)
                return direction.clone();
            var matrix3d = this.parent.localToWorldRotationMatrix;
            direction = matrix3d.transformVector(direction);
            return direction;
        }

        /**
         * 将位置从局部空间转换为世界空间。
         */
        transformPoint(position: Vector3)
        {
            if (!this.parent)
                return position.clone();
            var matrix3d = this.parent.localToWorldMatrix;
            position = matrix3d.transformVector(position);
            return position;
        }

        /**
         * 将向量从局部空间变换到世界空间。
         */
        transformVector(vector: Vector3)
        {
            if (!this.parent)
                return vector.clone();
            var matrix3d = this.parent.localToWorldMatrix;
            vector = matrix3d.deltaTransformVector(vector);
            return vector;
        }

        /**
         * 将一个方向从世界空间转换到局部空间。
         */
        inverseTransformDirection(direction: Vector3)
        {
            if (!this.parent)
                return direction.clone();
            var matrix3d = this.parent.localToWorldRotationMatrix.clone().invert();
            direction = matrix3d.transformVector(direction);
            return direction;
        }

        /**
         * 将位置从世界空间转换为局部空间。
         */
        inverseTransformPoint(position: Vector3)
        {
            if (!this.parent)
                return position.clone();
            var matrix3d = this.parent.localToWorldMatrix.clone().invert();
            position = matrix3d.transformVector(position);
            return position;
        }

        /**
         * 将向量从世界空间转换为局部空间
         */
        inverseTransformVector(vector: Vector3)
        {
            if (!this.parent)
                return vector.clone();
            var matrix3d = this.parent.localToWorldMatrix.clone().invert();
            vector = matrix3d.deltaTransformVector(vector);
            return vector;
        }

        beforeRender(gl: GL, renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
        {
            Object.assign(renderAtomic.uniforms, this._renderAtomic.uniforms);
        }

        private readonly _position = new Vector3();
        private readonly _rotation = new Vector3();
        private readonly _orientation = new Quaternion();
        private readonly _scale = new Vector3(1, 1, 1);

        protected readonly _matrix3d = new Matrix4x4();
        protected _matrix3dInvalid = false;

        protected readonly _rotationMatrix3d = new Matrix4x4();
        protected _rotationMatrix3dInvalid = false;

        protected readonly _localToWorldMatrix = new Matrix4x4();
        protected _localToWorldMatrixInvalid = false;

        protected readonly _ITlocalToWorldMatrix = new Matrix4x4();
        protected _ITlocalToWorldMatrixInvalid = false;

        protected readonly _worldToLocalMatrix = new Matrix4x4();
        protected _worldToLocalMatrixInvalid = false;

        protected readonly _localToWorldRotationMatrix = new Matrix4x4();
        protected _localToWorldRotationMatrixInvalid = false;

        private _renderAtomic = new RenderAtomic();

        private _positionChanged(object: Vector3, property: string, oldvalue: number)
        {
            if (!Math.equals(object[property], oldvalue))
                this._invalidateTransform();
        }

        private _rotationChanged(object: Vector3, property: string, oldvalue: number)
        {
            if (!Math.equals(object[property], oldvalue))
            {
                this._invalidateTransform();
                this._rotationMatrix3dInvalid = true;
            }
        }

        private _scaleChanged(object: Vector3, property: string, oldvalue: number)
        {
            if (!Math.equals(object[property], oldvalue))
                this._invalidateTransform();
        }

        private _invalidateTransform()
        {
            if (!this._matrix3dInvalid)
                this._matrix3dInvalid = true;

            this.dispatch("transformChanged", this);
            this._invalidateSceneTransform();
        }

        private _invalidateSceneTransform()
        {
            if (this._localToWorldMatrixInvalid) return;

            this._localToWorldMatrixInvalid = true;
            this._worldToLocalMatrixInvalid = true;
            this._ITlocalToWorldMatrixInvalid = true;
            this._localToWorldRotationMatrixInvalid = true;

            this.dispatch("scenetransformChanged", this);
            //
            if (this.gameObject)
            {
                for (var i = 0, n = this.gameObject.numChildren; i < n; i++)
                {
                    this.gameObject.getChildAt(i).transform._invalidateSceneTransform();
                }
            }
        }

        private _updateMatrix3D()
        {
            if (this._matrix3dInvalid)
            {
                this._matrix3d.recompose(this._position, this._rotation, this._scale);
                this._matrix3dInvalid = false;
            }
            return this._matrix3d;
        }

        private _updateLocalToWorldMatrix()
        {
            if (this._localToWorldMatrixInvalid)
            {
                this._localToWorldMatrix.copyFrom(this.matrix3d);
                if (this.parent)
                    this._localToWorldMatrix.append(this.parent.localToWorldMatrix);
                this._localToWorldMatrixInvalid = false;
                this.dispatch("updateLocalToWorldMatrix");
                console.assert(!isNaN(this._localToWorldMatrix.rawData[0]));
            }
            return this._localToWorldMatrix;
        }

        private _updateWorldToLocalMatrix()
        {
            if (this._worldToLocalMatrixInvalid)
            {
                this._worldToLocalMatrix.copyFrom(this.localToWorldMatrix).invert();
                this._worldToLocalMatrixInvalid = false;
            }
            return this._worldToLocalMatrix;
        }

        private _updateITlocalToWorldMatrix()
        {
            if (this._ITlocalToWorldMatrixInvalid)
            {
                this._ITlocalToWorldMatrix.copyFrom(this.localToWorldMatrix)
                this._ITlocalToWorldMatrix.invert().transpose();
                this._ITlocalToWorldMatrixInvalid = false;
            }
            return this._ITlocalToWorldMatrix;
        }

        private _upDateLocalToWorldRotationMatrix()
        {
            if (this._localToWorldRotationMatrixInvalid)
            {
                this._localToWorldRotationMatrix.copyFrom(this.rotationMatrix);
                if (this.parent)
                    this._localToWorldRotationMatrix.append(this.parent.localToWorldRotationMatrix);

                this._localToWorldRotationMatrixInvalid = false;
            }
            return this._localToWorldRotationMatrix;
        }
    }
}
