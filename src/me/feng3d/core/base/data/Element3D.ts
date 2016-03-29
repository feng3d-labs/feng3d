package me.feng3d.core.base.data
{
	import flash.geom.Matrix3D;
	import flash.geom.Vector3D;

	import me.feng.component.Component;
	import me.feng3d.events.Transform3DEvent;
	import me.feng3d.mathlib.MathConsts;
	import me.feng3d.mathlib.Matrix3DUtils;

	/**
	 * 位移时抛出
	 */
	[Event(name = "positionChanged", type = "me.feng3d.events.Transform3DEvent")]

	/**
	 * 旋转时抛出
	 */
	[Event(name = "rotationChanged", type = "me.feng3d.events.Transform3DEvent")]

	/**
	 * 缩放时抛出
	 */
	[Event(name = "scaleChanged", type = "me.feng3d.events.Transform3DEvent")]

	/**
	 * 变换状态抛出
	 */
	[Event(name = "transformChanged", type = "me.feng3d.events.Transform3DEvent")]

	/**
	 * 变换已更新
	 */
	[Event(name = "transformUpdated", type = "me.feng3d.events.Transform3DEvent")]


	/**
	 * 3D元素<br/><br/>
	 *
	 * 主要功能:
	 * <ul>
	 *     <li>管理3D元素的位置、旋转、缩放状态</li>
	 * </ul>
	 * @author feng 2014-3-31
	 */
	public class Element3D extends Component
	{
		private var _smallestNumber:Number = 0.0000000000000000000001;
		protected var _transformDirty:Boolean = true;

		private var _positionDirty:Boolean;
		private var _rotationDirty:Boolean;
		private var _scaleDirty:Boolean;

		private var _positionChanged:Transform3DEvent;
		private var _rotationChanged:Transform3DEvent;
		private var _scaleChanged:Transform3DEvent;
		private var _transformChanged:Transform3DEvent;

		private var _eulers:Vector3D = new Vector3D();

		private var _listenToPositionChanged:Boolean;
		private var _listenToRotationChanged:Boolean;
		private var _listenToScaleChanged:Boolean;
		private var _listenToTransformChanged:Boolean;

		protected var _transform:Matrix3D = new Matrix3D();
		protected var _x:Number = 0;
		protected var _y:Number = 0;
		protected var _z:Number = 0;
		protected var _rotationX:Number = 0;
		protected var _rotationY:Number = 0;
		protected var _rotationZ:Number = 0;
		protected var _scaleX:Number = 1;
		protected var _scaleY:Number = 1;
		protected var _scaleZ:Number = 1;
		protected var _pivotPoint:Vector3D = new Vector3D();
		protected var _pivotZero:Boolean = true;
		protected var _pos:Vector3D = new Vector3D();
		protected var _rot:Vector3D = new Vector3D();
		protected var _sca:Vector3D = new Vector3D();
		protected var _transformComponents:Vector.<Vector3D>;

		public function Element3D()
		{
			// Cached vector of transformation components used when
			// recomposing the transform matrix in updateTransform()
			_transformComponents = new Vector.<Vector3D>(3, true);
			_transformComponents[0] = _pos;
			_transformComponents[1] = _rot;
			_transformComponents[2] = _sca;

			_transform.identity();
		}

		/**
		 * 相对父容器的X坐标
		 */
		public function get x():Number
		{
			return _x;
		}

		public function set x(val:Number):void
		{
			if (_x == val)
				return;

			_x = val;

			invalidatePosition();
		}

		/**
		 * 相对父容器的Y坐标
		 */
		public function get y():Number
		{
			return _y;
		}

		public function set y(val:Number):void
		{
			if (_y == val)
				return;

			_y = val;

			invalidatePosition();
		}

		/**
		 * 相对父容器的Z坐标
		 */
		public function get z():Number
		{
			return _z;
		}

		public function set z(val:Number):void
		{
			if (_z == val)
				return;

			_z = val;

			invalidatePosition();
		}

		/**
		 * 绕X轴旋转角度
		 */
		public function get rotationX():Number
		{
			return _rotationX * MathConsts.RADIANS_TO_DEGREES;
		}

		public function set rotationX(val:Number):void
		{
			if (rotationX == val)
				return;

			_rotationX = val * MathConsts.DEGREES_TO_RADIANS;

			invalidateRotation();
		}

		/**
		 * 绕Y轴旋转角度
		 */
		public function get rotationY():Number
		{
			return _rotationY * MathConsts.RADIANS_TO_DEGREES;
		}

		public function set rotationY(val:Number):void
		{
			if (rotationY == val)
				return;

			_rotationY = val * MathConsts.DEGREES_TO_RADIANS;

			invalidateRotation();
		}

		/**
		 * 绕Z轴旋转角度
		 */
		public function get rotationZ():Number
		{
			return _rotationZ * MathConsts.RADIANS_TO_DEGREES;
		}

		public function set rotationZ(val:Number):void
		{
			if (rotationZ == val)
				return;

			_rotationZ = val * MathConsts.DEGREES_TO_RADIANS;

			invalidateRotation();
		}

		/**
		 * X轴旋方向缩放
		 */
		public function get scaleX():Number
		{
			return _scaleX;
		}

		public function set scaleX(val:Number):void
		{
			if (_scaleX == val)
				return;

			_scaleX = val;

			invalidateScale();
		}

		/**
		 * Y轴旋方向缩放
		 */
		public function get scaleY():Number
		{
			return _scaleY;
		}

		public function set scaleY(val:Number):void
		{
			if (_scaleY == val)
				return;

			_scaleY = val;

			invalidateScale();
		}

		/**
		 * Z轴旋方向缩放
		 */
		public function get scaleZ():Number
		{
			return _scaleZ;
		}

		public function set scaleZ(val:Number):void
		{
			if (_scaleZ == val)
				return;

			_scaleZ = val;

			invalidateScale();
		}

		/**
		 * 欧拉角
		 * <ul>
		 *     <li>使用Vector3D对象表示 相对x、y、z轴上的旋转角度</li>
		 * </ul>
		 */
		public function get eulers():Vector3D
		{
			_eulers.x = _rotationX * MathConsts.RADIANS_TO_DEGREES;
			_eulers.y = _rotationY * MathConsts.RADIANS_TO_DEGREES;
			_eulers.z = _rotationZ * MathConsts.RADIANS_TO_DEGREES;

			return _eulers;
		}

		public function set eulers(value:Vector3D):void
		{
			_rotationX = value.x * MathConsts.DEGREES_TO_RADIANS;
			_rotationY = value.y * MathConsts.DEGREES_TO_RADIANS;
			_rotationZ = value.z * MathConsts.DEGREES_TO_RADIANS;

			invalidateRotation();
		}

		/**
		 * 3d元素变换矩阵
		 */
		public function get transform():Matrix3D
		{
			if (_transformDirty)
				updateTransform();

			return _transform;
		}

		public function set transform(val:Matrix3D):void
		{
			//ridiculous matrix error
			var raw:Vector.<Number> = Matrix3DUtils.RAW_DATA_CONTAINER;
			val.copyRawDataTo(raw);
			if (!raw[uint(0)])
			{
				raw[uint(0)] = _smallestNumber;
				val.copyRawDataFrom(raw);
			}

			var elements:Vector.<Vector3D> = Matrix3DUtils.decompose(val);
			var vec:Vector3D;

			vec = elements[0];

			if (_x != vec.x || _y != vec.y || _z != vec.z)
			{
				_x = vec.x;
				_y = vec.y;
				_z = vec.z;

				invalidatePosition();
			}

			vec = elements[1];

			if (_rotationX != vec.x || _rotationY != vec.y || _rotationZ != vec.z)
			{
				_rotationX = vec.x;
				_rotationY = vec.y;
				_rotationZ = vec.z;

				invalidateRotation();
			}

			vec = elements[2];

			if (_scaleX != vec.x || _scaleY != vec.y || _scaleZ != vec.z)
			{
				_scaleX = vec.x;
				_scaleY = vec.y;
				_scaleZ = vec.z;

				invalidateScale();
			}
		}

		/**
		 * 中心点坐标（本地对象旋转点）
		 */
		public function get pivotPoint():Vector3D
		{
			return _pivotPoint;
		}

		public function set pivotPoint(pivot:Vector3D):void
		{
			if (!_pivotPoint)
				_pivotPoint = new Vector3D();
			_pivotPoint.x = pivot.x;
			_pivotPoint.y = pivot.y;
			_pivotPoint.z = pivot.z;

			invalidatePivot();
		}

		/**
		 * 获取在父容器中的坐标
		 */
		public function get position():Vector3D
		{
			transform.copyColumnTo(3, _pos);

			return _pos.clone();
		}

		public function set position(value:Vector3D):void
		{
			_x = value.x;
			_y = value.y;
			_z = value.z;

			invalidatePosition();
		}

		/**
		 * 使位置数据无效
		 */
		protected function invalidatePosition():void
		{
			if (_positionDirty)
				return;

			_positionDirty = true;

			invalidateTransform();

			if (_listenToPositionChanged)
				notifyPositionChanged();
		}

		/**
		 * 发出平移事件
		 */
		private function notifyPositionChanged():void
		{
			if (!_positionChanged)
				_positionChanged = new Transform3DEvent(Transform3DEvent.POSITION_CHANGED, this);

			dispatchEvent(_positionChanged);
		}

		/**
		 * 使变换矩阵失效
		 */
		public function invalidateTransform():void
		{
			_transformDirty = true;

			if (_listenToTransformChanged)
				notifyTransformChanged();
		}

		/**
		 * 发出状态改变消息
		 */
		private function notifyTransformChanged():void
		{
			if (!_transformChanged)
				_transformChanged = new Transform3DEvent(Transform3DEvent.TRANSFORM_CHANGED, this);

			dispatchEvent(_transformChanged);
		}

		/**
		 * 更新变换矩阵
		 */
		protected function updateTransform():void
		{
			_pos.x = _x;
			_pos.y = _y;
			_pos.z = _z;

			_rot.x = _rotationX;
			_rot.y = _rotationY;
			_rot.z = _rotationZ;

			if (!_pivotZero)
			{
				_sca.x = 1;
				_sca.y = 1;
				_sca.z = 1;

				_transform.recompose(_transformComponents);
				_transform.appendTranslation(_pivotPoint.x, _pivotPoint.y, _pivotPoint.z);
				_transform.prependTranslation(-_pivotPoint.x, -_pivotPoint.y, -_pivotPoint.z);
				_transform.prependScale(_scaleX, _scaleY, _scaleZ);

				_sca.x = _scaleX;
				_sca.y = _scaleY;
				_sca.z = _scaleZ;
			}
			else
			{
				_sca.x = _scaleX;
				_sca.y = _scaleY;
				_sca.z = _scaleZ;

				_transform.recompose(_transformComponents);
			}

			_transformDirty = false;
			_positionDirty = false;
			_rotationDirty = false;
			_scaleDirty = false;

			dispatchEvent(new Transform3DEvent(Transform3DEvent.TRANSFORM_UPDATED, this));
		}

		/**
		 * 使中心点无效
		 */
		protected function invalidatePivot():void
		{
			_pivotZero = (_pivotPoint.x == 0) && (_pivotPoint.y == 0) && (_pivotPoint.z == 0);

			invalidateTransform();
		}

		/**
		 * 监听事件
		 * @param type 事件类型
		 * @param listener 回调函数
		 */
		override public function addEventListener(type:String, listener:Function, useCapture:Boolean = false, priority:int = 0, useWeakReference:Boolean = false):void
		{
			super.addEventListener(type, listener, useCapture, priority, useWeakReference);
			switch (type)
			{
				case Transform3DEvent.POSITION_CHANGED:
					_listenToPositionChanged = true;
					break;
				case Transform3DEvent.ROTATION_CHANGED:
					_listenToRotationChanged = true;
					break;
				case Transform3DEvent.SCALE_CHANGED:
					_listenToRotationChanged = true;
					break;
				case Transform3DEvent.TRANSFORM_CHANGED:
					_listenToTransformChanged = true;
					break;
			}
		}

		/**
		 * 移除事件
		 * @param type 事件类型
		 * @param listener 回调函数
		 */
		override public function removeEventListener(type:String, listener:Function, useCapture:Boolean = false):void
		{
			super.removeEventListener(type, listener, useCapture);

			if (hasEventListener(type))
				return;

			switch (type)
			{
				case Transform3DEvent.POSITION_CHANGED:
					_listenToPositionChanged = false;
					break;
				case Transform3DEvent.ROTATION_CHANGED:
					_listenToRotationChanged = false;
					break;
				case Transform3DEvent.SCALE_CHANGED:
					_listenToScaleChanged = false;
					break;
				case Transform3DEvent.TRANSFORM_CHANGED:
					_listenToTransformChanged = false;
					break;
			}
		}

		/**
		 * 使旋转角度无效
		 */
		protected function invalidateRotation():void
		{
			if (_rotationDirty)
				return;

			_rotationDirty = true;

			invalidateTransform();

			if (_listenToRotationChanged)
				notifyRotationChanged();
		}

		/**
		 * 抛出旋转事件
		 */
		private function notifyRotationChanged():void
		{
			if (!_rotationChanged)
				_rotationChanged = new Transform3DEvent(Transform3DEvent.ROTATION_CHANGED, this);

			dispatchEvent(_rotationChanged);
		}

		/**
		 * 使缩放无效
		 */
		protected function invalidateScale():void
		{
			if (_scaleDirty)
				return;

			_scaleDirty = true;

			invalidateTransform();

			if (_listenToScaleChanged)
				notifyScaleChanged();
		}

		/**
		 * 抛出缩放事件
		 */
		private function notifyScaleChanged():void
		{
			if (!_scaleChanged)
				_scaleChanged = new Transform3DEvent(Transform3DEvent.SCALE_CHANGED, this);

			dispatchEvent(_scaleChanged);
		}
	}
}
