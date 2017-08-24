declare namespace feng3d {
    /**
     * Position, rotation and scale of an object.
     */
    class Object3D extends Component {
        x: number;
        y: number;
        z: number;
        rx: number;
        ry: number;
        rz: number;
        sx: number;
        sy: number;
        sz: number;
        /**
         * @private
         */
        matrix3d: Matrix3D;
        /**
         * 旋转矩阵
         */
        readonly rotationMatrix: Matrix3D;
        /**
         * 返回保存位置数据的Vector3D对象
         */
        position: Vector3D;
        rotation: Vector3D;
        scale: Vector3D;
        readonly forwardVector: Vector3D;
        readonly rightVector: Vector3D;
        readonly upVector: Vector3D;
        readonly backVector: Vector3D;
        readonly leftVector: Vector3D;
        readonly downVector: Vector3D;
        protected constructor(gameObject: GameObject);
        moveForward(distance: number): void;
        moveBackward(distance: number): void;
        moveLeft(distance: number): void;
        moveRight(distance: number): void;
        moveUp(distance: number): void;
        moveDown(distance: number): void;
        translate(axis: Vector3D, distance: number): void;
        translateLocal(axis: Vector3D, distance: number): void;
        pitch(angle: number): void;
        yaw(angle: number): void;
        roll(angle: number): void;
        rotateTo(ax: number, ay: number, az: number): void;
        /**
         * 绕指定轴旋转，不受位移与缩放影响
         * @param    axis               旋转轴
         * @param    angle              旋转角度
         * @param    pivotPoint         旋转中心点
         *
         */
        rotate(axis: Vector3D, angle: number, pivotPoint?: Vector3D): void;
        lookAt(target: Vector3D, upAxis?: Vector3D): void;
        disposeAsset(): void;
        invalidateTransform(): void;
        protected updateMatrix3D(): void;
        protected _smallestNumber: number;
        protected _x: number;
        protected _y: number;
        protected _z: number;
        protected _rx: number;
        protected _ry: number;
        protected _rz: number;
        protected _sx: number;
        protected _sy: number;
        protected _sz: number;
        protected _position: Vector3D;
        protected _rotation: Vector3D;
        protected _scale: Vector3D;
        protected _matrix3d: Matrix3D;
        protected _rotationMatrix3d: Matrix3D;
        protected _localToWorldMatrix: Matrix3D;
        protected _worldToLocalMatrix: Matrix3D;
        protected _localToWorldRotationMatrix: Matrix3D;
        private invalidateRotation();
        private invalidateScale();
        private invalidatePosition();
    }
}
