module feng3d
{
	/**
	 * 3D元素<br/><br/>
	 *
	 * 主要功能:
	 * <ul>
	 *     <li>管理3D元素的位置、旋转、缩放状态</li>
	 * </ul>
	 * @author feng 2014-3-31
	 */
	export class Element3D extends Component
	{
		private _smallestNumber:number = 0.0000000000000000000001;
		protected _transformDirty:boolean = true;

		private _positionDirty:boolean;
		private _rotationDirty:boolean;
		private _scaleDirty:boolean;

		private _positionChanged:Transform3DEvent;
		private _rotationChanged:Transform3DEvent;
		private _scaleChanged:Transform3DEvent;
		private _transformChanged:Transform3DEvent;

		private _eulers:Vector3D = new Vector3D();

		private _listenToPositionChanged:boolean;
		private _listenToRotationChanged:boolean;
		private _listenToScaleChanged:boolean;
		private _listenToTransformChanged:boolean;

		protected _transform:Matrix3D = new Matrix3D();
		protected _x:number = 0;
		protected _y:number = 0;
		protected _z:number = 0;
		protected _rotationX:number = 0;
		protected _rotationY:number = 0;
		protected _rotationZ:number = 0;
		protected _scaleX:number = 1;
		protected _scaleY:number = 1;
		protected _scaleZ:number = 1;
		protected _pivotPoint:Vector3D = new Vector3D();
		protected _pivotZero:boolean = true;
		protected _pos:Vector3D = new Vector3D();
		protected _rot:Vector3D = new Vector3D();
		protected _sca:Vector3D = new Vector3D();
		protected _transformComponents:Vector3D[];

		constructor()
		{
            super();
			// Cached vector of transformation components used when
			// recomposing the transform matrix in updateTransform()
			this._transformComponents = [];
			this._transformComponents[0] = this._pos;
			this._transformComponents[1] = this._rot;
			this._transformComponents[2] = this._sca;

			this._transform.identity();
		}

		/**
		 * 相对父容器的X坐标
		 */
		public get x():number
		{
			return this._x;
		}

		public set x(val:number)
		{
			if (this._x == val)
				return;

			this._x = val;

			this.invalidatePosition();
		}

		/**
		 * 相对父容器的Y坐标
		 */
		public get y():number
		{
			return this._y;
		}

		public set y(val:number)
		{
			if (this._y == val)
				return;

			this._y = val;

			this.invalidatePosition();
		}

		/**
		 * 相对父容器的Z坐标
		 */
		public get z():number
		{
			return this._z;
		}

		public set z(val:number)
		{
			if (this._z == val)
				return;

			this._z = val;

			this.invalidatePosition();
		}

		/**
		 * 绕X轴旋转角度
		 */
		public get rotationX():number
		{
			return this._rotationX * MathConsts.RADIANS_TO_DEGREES;
		}

		public set rotationX(val:number)
		{
			if (this.rotationX == val)
				return;

			this._rotationX = val * MathConsts.DEGREES_TO_RADIANS;

			this.invalidateRotation();
		}

		/**
		 * 绕Y轴旋转角度
		 */
		public get rotationY():number
		{
			return this._rotationY * MathConsts.RADIANS_TO_DEGREES;
		}

		public set rotationY(val:number)
		{
			if (this.rotationY == val)
				return;

			this._rotationY = val * MathConsts.DEGREES_TO_RADIANS;

			this.invalidateRotation();
		}

		/**
		 * 绕Z轴旋转角度
		 */
		public get rotationZ():number
		{
			return this._rotationZ * MathConsts.RADIANS_TO_DEGREES;
		}

		public set rotationZ(val:number)
		{
			if (this.rotationZ == val)
				return;

			this._rotationZ = val * MathConsts.DEGREES_TO_RADIANS;

			this.invalidateRotation();
		}

		/**
		 * X轴旋方向缩放
		 */
		public get scaleX():number
		{
			return this._scaleX;
		}

		public set scaleX(val:number)
		{
			if (this._scaleX == val)
				return;

			this._scaleX = val;

			this.invalidateScale();
		}

		/**
		 * Y轴旋方向缩放
		 */
		public get scaleY():number
		{
			return this._scaleY;
		}

		public set scaleY(val:number)
		{
			if (this._scaleY == val)
				return;

			this._scaleY = val;

			this.invalidateScale();
		}

		/**
		 * Z轴旋方向缩放
		 */
		public get scaleZ():number
		{
			return this._scaleZ;
		}

		public set scaleZ(val:number)
		{
			if (this._scaleZ == val)
				return;

			this._scaleZ = val;

			this.invalidateScale();
		}

		/**
		 * 欧拉角
		 * <ul>
		 *     <li>使用Vector3D对象表示 相对x、y、z轴上的旋转角度</li>
		 * </ul>
		 */
		public get eulers():Vector3D
		{
			this._eulers.x = this._rotationX * MathConsts.RADIANS_TO_DEGREES;
			this._eulers.y = this._rotationY * MathConsts.RADIANS_TO_DEGREES;
			this._eulers.z = this._rotationZ * MathConsts.RADIANS_TO_DEGREES;

			return this._eulers;
		}

		public set eulers(value:Vector3D)
		{
			this._rotationX = value.x * MathConsts.DEGREES_TO_RADIANS;
			this._rotationY = value.y * MathConsts.DEGREES_TO_RADIANS;
			this._rotationZ = value.z * MathConsts.DEGREES_TO_RADIANS;

			this.invalidateRotation();
		}

		/**
		 * 3d元素变换矩阵
		 */
		public get transform():Matrix3D
		{
			if (this._transformDirty)
				this.updateTransform();

			return this._transform;
		}

		public set transform(val:Matrix3D)
		{
			//ridiculous matrix error
			var raw:number[] = [];
			val.copyRawDataTo(raw);
			if (!raw[0])
			{
				raw[0] = this._smallestNumber;
				val.copyRawDataFrom(raw);
			}

			var elements:Vector3D[] = val.decompose();
			var vec:Vector3D;

			vec = elements[0];

			if (this._x != vec.x || this._y != vec.y || this._z != vec.z)
			{
				this._x = vec.x;
				this._y = vec.y;
				this._z = vec.z;

				this.invalidatePosition();
			}

			vec = elements[1];

			if (this._rotationX != vec.x || this._rotationY != vec.y || this._rotationZ != vec.z)
			{
				this._rotationX = vec.x;
				this._rotationY = vec.y;
				this._rotationZ = vec.z;

				this.invalidateRotation();
			}

			vec = elements[2];

			if (this._scaleX != vec.x || this._scaleY != vec.y || this._scaleZ != vec.z)
			{
				this._scaleX = vec.x;
				this._scaleY = vec.y;
				this._scaleZ = vec.z;

				this.invalidateScale();
			}
		}

		/**
		 * 中心点坐标（本地对象旋转点）
		 */
		public get pivotPoint():Vector3D
		{
			return this._pivotPoint;
		}

		public set pivotPoint(pivot:Vector3D)
		{
			if (!this._pivotPoint)
				this._pivotPoint = new Vector3D();
			this._pivotPoint.x = pivot.x;
			this._pivotPoint.y = pivot.y;
			this._pivotPoint.z = pivot.z;

			this.invalidatePivot();
		}

		/**
		 * 获取在父容器中的坐标
		 */
		public get position():Vector3D
		{
			this.transform.copyColumnTo(3, this._pos);

			return this._pos.clone();
		}

		public set position(value:Vector3D)
		{
			this._x = value.x;
			this._y = value.y;
			this._z = value.z;

			this.invalidatePosition();
		}

		/**
		 * 使位置数据无效
		 */
		protected invalidatePosition():void
		{
			if (this._positionDirty)
				return;

			this._positionDirty = true;

			this.invalidateTransform();

			if (this._listenToPositionChanged)
				this.notifyPositionChanged();
		}

		/**
		 * 发出平移事件
		 */
		private notifyPositionChanged():void
		{
			if (!this._positionChanged)
				this._positionChanged = new Transform3DEvent(Transform3DEvent.POSITION_CHANGED, this);

			this.dispatchEvent(this._positionChanged);
		}

		/**
		 * 使变换矩阵失效
		 */
		public invalidateTransform():void
		{
			this._transformDirty = true;

			if (this._listenToTransformChanged)
				this.notifyTransformChanged();
		}

		/**
		 * 发出状态改变消息
		 */
		private notifyTransformChanged():void
		{
			if (!this._transformChanged)
				this._transformChanged = new Transform3DEvent(Transform3DEvent.TRANSFORM_CHANGED, this);

			this.dispatchEvent(this._transformChanged);
		}

		/**
		 * 更新变换矩阵
		 */
		protected updateTransform():void
		{
			this._pos.x = this._x;
			this._pos.y = this._y;
			this._pos.z = this._z;

			this._rot.x = this._rotationX;
			this._rot.y = this._rotationY;
			this._rot.z = this._rotationZ;

			if (!this._pivotZero)
			{
				this._sca.x = 1;
				this._sca.y = 1;
				this._sca.z = 1;

				this._transform.recompose(this._transformComponents);
				this._transform.appendTranslation(this._pivotPoint.x, this._pivotPoint.y, this._pivotPoint.z);
				this._transform.prependTranslation(-this._pivotPoint.x, -this._pivotPoint.y, -this._pivotPoint.z);
				this._transform.prependScale(this._scaleX, this._scaleY, this._scaleZ);

				this._sca.x = this._scaleX;
				this._sca.y = this._scaleY;
				this._sca.z = this._scaleZ;
			}
			else
			{
				this._sca.x = this._scaleX;
				this._sca.y = this._scaleY;
				this._sca.z = this._scaleZ;

				this._transform.recompose(this._transformComponents);
			}

			this._transformDirty = false;
			this._positionDirty = false;
			this._rotationDirty = false;
			this._scaleDirty = false;

			this.dispatchEvent(new Transform3DEvent(Transform3DEvent.TRANSFORM_UPDATED, this));
		}

		/**
		 * 使中心点无效
		 */
		protected invalidatePivot():void
		{
			this._pivotZero = (this._pivotPoint.x == 0) && (this._pivotPoint.y == 0) && (this._pivotPoint.z == 0);

			this.invalidateTransform();
		}

		/**
		 * 监听事件
		 * @param type 事件类型
		 * @param listener 回调函数
		 */
		public addEventListener(type:string, listener:Function, priority:number = 0, useWeakReference:boolean = false):void
		{
			super.addEventListener(type, listener, priority, useWeakReference);
			switch (type)
			{
				case Transform3DEvent.POSITION_CHANGED:
					this._listenToPositionChanged = true;
					break;
				case Transform3DEvent.ROTATION_CHANGED:
					this._listenToRotationChanged = true;
					break;
				case Transform3DEvent.SCALE_CHANGED:
					this._listenToRotationChanged = true;
					break;
				case Transform3DEvent.TRANSFORM_CHANGED:
					this._listenToTransformChanged = true;
					break;
			}
		}

		/**
		 * 移除事件
		 * @param type 事件类型
		 * @param listener 回调函数
		 */
		public removeEventListener(type:string, listener:Function):void
		{
			super.removeEventListener(type, listener);

			if (this.hasEventListener(type))
				return;

			switch (type)
			{
				case Transform3DEvent.POSITION_CHANGED:
					this._listenToPositionChanged = false;
					break;
				case Transform3DEvent.ROTATION_CHANGED:
					this._listenToRotationChanged = false;
					break;
				case Transform3DEvent.SCALE_CHANGED:
					this._listenToScaleChanged = false;
					break;
				case Transform3DEvent.TRANSFORM_CHANGED:
					this._listenToTransformChanged = false;
					break;
			}
		}

		/**
		 * 使旋转角度无效
		 */
		protected invalidateRotation():void
		{
			if (this._rotationDirty)
				return;

			this._rotationDirty = true;

			this.invalidateTransform();

			if (this._listenToRotationChanged)
				this.notifyRotationChanged();
		}

		/**
		 * 抛出旋转事件
		 */
		private notifyRotationChanged():void
		{
			if (!this._rotationChanged)
				this._rotationChanged = new Transform3DEvent(Transform3DEvent.ROTATION_CHANGED, this);

			this.dispatchEvent(this._rotationChanged);
		}

		/**
		 * 使缩放无效
		 */
		protected invalidateScale():void
		{
			if (this._scaleDirty)
				return;

			this._scaleDirty = true;

			this.invalidateTransform();

			if (this._listenToScaleChanged)
				this.notifyScaleChanged();
		}

		/**
		 * 抛出缩放事件
		 */
		private notifyScaleChanged():void
		{
			if (!this._scaleChanged)
				this._scaleChanged = new Transform3DEvent(Transform3DEvent.SCALE_CHANGED, this);

			this.dispatchEvent(this._scaleChanged);
		}
	}
}
