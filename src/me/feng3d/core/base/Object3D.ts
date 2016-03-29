module feng3d {

	/**
	 * 3D对象<br/><br/>
	 * 主要功能:
	 * <ul>
	 *     <li>能够被addChild添加到3d场景中</li>
	 *     <li>维护场景变换矩阵sceneTransform、inverseSceneTransform</li>
	 *     <li>维护父对象parent</li>
	 * </ul>
	 *
	 * @author feng
	 */
    export class Object3D extends Component {
        private _transform3D: Transform3D;

        protected _parent: Container3D;

        protected _sceneTransform: Matrix3D = new Matrix3D();
        protected _sceneTransformDirty: boolean = true;

        private _inverseSceneTransform: Matrix3D = new Matrix3D();
        private _inverseSceneTransformDirty: boolean = true;

        private _scenePosition: Vector3D = new Vector3D();
        private _scenePositionDirty: boolean = true;

        public _explicitPartition: Partition3D; // what the user explicitly set as the partition
        protected _implicitPartition: Partition3D; // what is inherited from the parents if it doesn't have its own explicitPartition

        private _visible: boolean = true;

        private _sceneTransformChanged: Transform3DEvent;

        private _listenToSceneTransformChanged: boolean;

        public _scene: Scene3D;

        protected _zOffset: number = 0;

		/**
		 * 创建3D对象
		 */
        constructor() {
            super();
            this.transform3D = new Transform3D();
        }

        public get transform3D(): Transform3D {
            return this._transform3D;
        }

        public set transform3D(value: Transform3D) {
            if (this.transform3D != null) {
                this.transform3D.removeEventListener(Transform3DEvent.TRANSFORM_CHANGED, this.onTransformChanged);
                this.transform3D.removeEventListener(Transform3DEvent.POSITION_CHANGED, this.onPositionChanged);
            }

            this._transform3D = value;

            this.transform3D.addEventListener(Transform3DEvent.TRANSFORM_CHANGED, this.onTransformChanged);
            this.transform3D.addEventListener(Transform3DEvent.POSITION_CHANGED, this.onPositionChanged);
        }

		/**
		 * 场景
		 */
        public get scene(): Scene3D {
            return this._scene;
        }

        public set scene(value: Scene3D) {
            if (this._scene != value) {
                if (this._scene)
                    this._scene.removedObject3d(this);
                this._scene = value;
                if (this._scene)
                    this._scene.addedObject3d(this);
            }
        }

		/**
		 * 克隆3D对象
		 */
        public clone(): Object3D {
            var clone1 = new Object3D();
            clone1.transform3D = new Transform3D();
            clone1.transform3D.pivotPoint = this.transform3D.pivotPoint;
            clone1.transform3D.transform = this.transform3D.transform;
            return clone1;
        }

		/**
		 * 场景变换逆矩阵，场景空间转模型空间
		 */
        public get inverseSceneTransform(): Matrix3D {
            if (this._inverseSceneTransformDirty) {
                this._inverseSceneTransform.copyFrom(this.sceneTransform);
                this._inverseSceneTransform.invert();
                this._inverseSceneTransformDirty = false;
            }

            return this._inverseSceneTransform;
        }

		/**
		 * 场景变换矩阵，模型空间转场景空间
		 */
        public get sceneTransform(): Matrix3D {
            if (this._sceneTransformDirty)
                this.updateSceneTransform();
            return this._sceneTransform;
        }

		/**
		 * 更新场景变换矩阵
		 */
        protected updateSceneTransform() {
            if (this._parent && !this._parent._isRoot) {
                this._sceneTransform.copyFrom(this._parent.sceneTransform);
                this._sceneTransform.prepend(this.transform3D.transform);
            }
            else
                this._sceneTransform.copyFrom(this.transform3D.transform);

            this._sceneTransformDirty = false;
        }

		/**
		 * 使变换矩阵失效，场景变换矩阵也将失效
		 */
        protected onTransformChanged(event: Transform3DEvent) {
            this.notifySceneTransformChange();
        }

		/**
		 * 场景变化失效
		 */
        protected invalidateSceneTransform() {
            this._sceneTransformDirty = true;
            this._inverseSceneTransformDirty = true;
            this._scenePositionDirty = true;
        }

		/**
		 * 通知场景变换改变
		 */
        private notifySceneTransformChange() {
            if (this._sceneTransformDirty)
                return;

            //处理场景变换事件
            if (this._listenToSceneTransformChanged) {
                if (!this._sceneTransformChanged)
                    this._sceneTransformChanged = new Transform3DEvent(Transform3DEvent.SCENETRANSFORM_CHANGED, this.transform3D);
                this.dispatchEvent(this._sceneTransformChanged);
            }

            this.invalidateSceneTransform();
        }

		/**
		 * 父容器
		 */
        public get parent(): Container3D {
            return this._parent;
        }

        public set parent(value: Container3D) {
            if (this._parent != null)
                this._parent.removeChild(this);

            this._parent = value;

            this.transform3D.invalidateTransform();
        }

		/**
		 * 获取场景坐标
		 */
        public get scenePosition(): Vector3D {
            if (this._scenePositionDirty) {
                this.sceneTransform.copyColumnTo(3, this._scenePosition);
                this._scenePositionDirty = false;
            }

            return this._scenePosition;
        }

		/**
		 * 本地坐标转换为世界坐标
		 * @param localVector3D 本地坐标
		 * @return
		 */
        public positionLocalToGlobal(localPosition: Vector3D): Vector3D {
            var globalPosition: Vector3D = this.sceneTransform.transformVector(localPosition);
            return globalPosition;
        }

		/**
		 * 世界坐标转换为本地坐标
		 * @param globalPosition 世界坐标
		 * @return
		 */
        public positionGlobalToLocal(globalPosition: Vector3D): Vector3D {
            var localPosition: Vector3D = this.inverseSceneTransform.transformVector(globalPosition);
            return localPosition;
        }

		/**
		 * 本地方向转换为世界方向
		 * @param localDirection 本地方向
		 * @return
		 */
        public directionLocalToGlobal(localDirection: Vector3D): Vector3D {
            var globalDirection: Vector3D = this.sceneTransform.deltaTransformVector(localDirection);
            return globalDirection;
        }

		/**
		 * 世界方向转换为本地方向
		 * @param globalDirection 世界方向
		 * @return
		 */
        public directionGlobalToLocal(globalDirection: Vector3D): Vector3D {
            var localDirection: Vector3D = this.inverseSceneTransform.deltaTransformVector(globalDirection);
            return localDirection;
        }

		/**
		 * @inheritDoc
		 */
        public dispatchEvent(event: Event): boolean {
            if ((getQualifiedClassName(event) == "MouseEvent3D") && this.parent && !this.parent.ancestorsAllowMouseEnabled) {
                if (this.parent) {
                    return this.parent.dispatchEvent(event);
                }
                return false;
            }
            return super.dispatchEvent(event);
        }

		/**
		 * 是否可见
		 */
        public get visible(): boolean {
            return this._visible;
        }

        public set visible(value: boolean) {
            this._visible = value;
        }

		/**
		 * 是否在场景上可见
		 */
        public get sceneVisible(): boolean {
            //从这里开始一直找父容器到场景了，且visible全为true则为场景上可见
            return this.visible && (this.scene != null) && ((this.parent == this.scene) ? true : (this.parent ? this.parent.sceneVisible : false));
        }

		/**
		 * @inheritDoc
		 */
        public addEventListener(type: string, listener: Function, priority: number = 0, useWeakReference: boolean = false) {
            super.addEventListener(type, listener, priority, useWeakReference);

            switch (type) {
                case Transform3DEvent.SCENETRANSFORM_CHANGED:
                    this._listenToSceneTransformChanged = true;
                    break;
            }
        }

		/**
		 * @inheritDoc
		 */
        public removeEventListener(type: string, listener: Function, useCapture: boolean = false) {
            super.removeEventListener(type, listener);

            if (this.hasEventListener(type))
                return;

            switch (type) {
                case Transform3DEvent.SCENETRANSFORM_CHANGED:
                    this._listenToSceneTransformChanged = false;
                    break;
            }
        }

		/**
		 * 空间分区
		 */
        public get partition(): Partition3D {
            return this._explicitPartition;
        }

        public set partition(value: Partition3D) {
            this._explicitPartition = value;

            this.implicitPartition = value ? value : (this._parent ? this._parent.implicitPartition : null);
        }

		/**
		 * 隐式空间分区
		 */
        public get implicitPartition(): Partition3D {
            return this._implicitPartition;
        }

        public set implicitPartition(value: Partition3D) {
            if (value == this._implicitPartition)
                return;

            this._implicitPartition = value;
        }

		/**
		 * Z偏移值
		 */
        public get zOffset(): number {
            return this._zOffset;
        }

        public set zOffset(value: number) {
            this._zOffset = value;
        }

        protected onPositionChanged(event: Transform3DEvent) {
            this.notifySceneTransformChange();
        }

		/**
		 * The minimum extremum of the object along the X-axis.
		 */
        public get minX(): number {
            return 0;
        }

		/**
		 * The minimum extremum of the object along the Y-axis.
		 */
        public get minY(): number {
            return 0;
        }

		/**
		 * The minimum extremum of the object along the Z-axis.
		 */
        public get minZ(): number {
            return 0;
        }

		/**
		 * The maximum extremum of the object along the X-axis.
		 */
        public get maxX(): number {
            return 0;
        }

		/**
		 * The maximum extremum of the object along the Y-axis.
		 */
        public get maxY(): number {
            return 0;
        }

		/**
		 * The maximum extremum of the object along the Z-axis.
		 */
        public get maxZ(): number {
            return 0;
        }

		/**
		 * Cleans up any resources used by the current object.
		 */
        public dispose() {
        }
    }
}
