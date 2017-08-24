declare namespace feng3d {
    class ObjectContainer3D extends Object3D {
        readonly scenePosition: Vector3D;
        readonly minX: number;
        readonly minY: number;
        readonly minZ: number;
        readonly maxX: number;
        readonly maxY: number;
        readonly maxZ: number;
        readonly parent: Transform;
        /**
         * Matrix that transforms a point from local space into world space.
         */
        localToWorldMatrix: Matrix3D;
        /**
         * Matrix that transforms a point from world space into local space (Read Only).
         */
        readonly worldToLocalMatrix: Matrix3D;
        readonly localToWorldRotationMatrix: Matrix3D;
        protected constructor(gameObject: GameObject);
        /**
         * Transforms direction from local space to world space.
         */
        transformDirection(direction: Vector3D): Vector3D;
        /**
         * Transforms position from local space to world space.
         */
        transformPoint(position: Vector3D): Vector3D;
        /**
         * Transforms vector from local space to world space.
         */
        transformVector(vector: Vector3D): Vector3D;
        /**
         * Transforms a direction from world space to local space. The opposite of Transform.TransformDirection.
         */
        inverseTransformDirection(direction: Vector3D): Vector3D;
        /**
         * Transforms position from world space to local space.
         */
        inverseTransformPoint(position: Vector3D): Vector3D;
        /**
         * Transforms a vector from world space to local space. The opposite of Transform.TransformVector.
         */
        inverseTransformVector(vector: Vector3D): Vector3D;
        lookAt(target: Vector3D, upAxis?: Vector3D): void;
        translateLocal(axis: Vector3D, distance: number): void;
        dispose(): void;
        rotate(axis: Vector3D, angle: number, pivotPoint?: Vector3D): void;
        invalidateTransform(): void;
        protected updateLocalToWorldMatrix(): void;
        protected invalidateSceneTransform(): void;
    }
}
