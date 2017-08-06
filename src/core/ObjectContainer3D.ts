namespace feng3d
{
    export class ObjectContainer3D extends Object3D 
    {
        get scenePosition()
        {
            return this.localToWorldMatrix.position;
        }

        get minX(): number
        {
            var i = 0;
            var len = this.gameObject.numChildren;
            var min = Number.POSITIVE_INFINITY;
            var m = 0;
            while (i < len)
            {
                var child: Transform = this.gameObject.getChildAt(i++).transform;
                m = child.minX + child.x;
                if (m < min)
                    min = m;
            }
            return min;
        }

        get minY(): number
        {
            var i = 0;
            var len = this.gameObject.numChildren;
            var min = Number.POSITIVE_INFINITY;
            var m = 0;
            while (i < len)
            {
                var child: Transform = this.gameObject.getChildAt(i++).transform;
                m = child.minY + child.y;
                if (m < min)
                    min = m;
            }
            return min;
        }

        get minZ(): number
        {
            var i = 0;
            var len = this.gameObject.numChildren;
            var min = Number.POSITIVE_INFINITY;
            var m = 0;
            while (i < len)
            {
                var child: Transform = this.gameObject.getChildAt(i++).transform;
                m = child.minZ + child.z;
                if (m < min)
                    min = m;
            }
            return min;
        }

        get maxX(): number
        {
            var i = 0;
            var len = this.gameObject.numChildren;
            var max = Number.NEGATIVE_INFINITY;
            var m = 0;
            while (i < len)
            {
                var child: Transform = this.gameObject.getChildAt(i++).transform;
                m = child.maxX + child.x;
                if (m > max)
                    max = m;
            }
            return max;
        }

        get maxY(): number
        {
            var i = 0;
            var len = this.gameObject.numChildren;
            var max = Number.NEGATIVE_INFINITY;
            var m = 0;
            while (i < len)
            {
                var child: Transform = this.gameObject.getChildAt(i++).transform;
                m = child.maxY + child.y;
                if (m > max)
                    max = m;
            }
            return max;
        }

        get maxZ(): number
        {
            var i = 0;
            var len = this.gameObject.numChildren;
            var max = Number.NEGATIVE_INFINITY;
            var m = 0;
            while (i < len)
            {
                var child: Transform = this.gameObject.getChildAt(i++).transform;
                m = child.maxZ + child.z;
                if (m > max)
                    max = m;
            }
            return max;
        }

        get parent()
        {
            return this.gameObject.parent && this.gameObject.parent.transform;
        }

        /**
         * Matrix that transforms a point from local space into world space.
         */
        get localToWorldMatrix(): Matrix3D
        {
            if (!this._localToWorldMatrix)
                this.updateLocalToWorldMatrix();
            return this._localToWorldMatrix;
        }

        set localToWorldMatrix(value: Matrix3D)
        {
            value = value.clone();
            this.parent && value.append(this.parent.worldToLocalMatrix);
            this.matrix3d = value;
        }

        /**
         * Matrix that transforms a point from world space into local space (Read Only).
         */
        get worldToLocalMatrix(): Matrix3D
        {
            if (!this._worldToLocalMatrix)
                this._worldToLocalMatrix = this.localToWorldMatrix.clone().invert();
            return this._worldToLocalMatrix;
        }

        get localToWorldRotationMatrix()
        {
            if (!this._localToWorldRotationMatrix)
            {
                this._localToWorldRotationMatrix = this.rotationMatrix.clone();
                if (this.parent)
                    this._localToWorldRotationMatrix.append(this.parent.localToWorldRotationMatrix);
            }
            return this._localToWorldRotationMatrix;
        }

        //------------------------------------------
        // Functions
        //------------------------------------------
        protected constructor(gameObject: GameObject)
        {
            super(gameObject);
        }

        /**
         * Transforms direction from local space to world space.
         */
        transformDirection(direction: Vector3D)
        {
            if (!this.parent)
                return direction.clone();
            var matrix3d = this.parent.localToWorldRotationMatrix;
            direction = matrix3d.transformVector(direction);
            return direction;
        }

        /**
         * Transforms position from local space to world space.
         */
        transformPoint(position: Vector3D)
        {
            if (!this.parent)
                return position.clone();
            var matrix3d = this.parent.localToWorldMatrix;
            position = matrix3d.transformVector(position);
            return position;
        }

        /**
         * Transforms vector from local space to world space.
         */
        transformVector(vector: Vector3D)
        {
            if (!this.parent)
                return vector.clone();
            var matrix3d = this.parent.localToWorldMatrix;
            vector = matrix3d.deltaTransformVector(vector);
            return vector;
        }

        /**
         * Transforms a direction from world space to local space. The opposite of Transform.TransformDirection.
         */
        inverseTransformDirection(direction: Vector3D)
        {
            if (!this.parent)
                return direction.clone();
            var matrix3d = this.parent.localToWorldRotationMatrix.clone().invert();
            direction = matrix3d.transformVector(direction);
            return direction;
        }

        /**
         * Transforms position from world space to local space.
         */
        inverseTransformPoint(position: Vector3D)
        {
            if (!this.parent)
                return position.clone();
            var matrix3d = this.parent.localToWorldMatrix.clone().invert();
            position = matrix3d.transformVector(position);
            return position;
        }

        /**
         * Transforms a vector from world space to local space. The opposite of Transform.TransformVector.
         */
        inverseTransformVector(vector: Vector3D)
        {
            if (!this.parent)
                return vector.clone();
            var matrix3d = this.parent.localToWorldMatrix.clone().invert();
            vector = matrix3d.deltaTransformVector(vector);
            return vector;
        }

        lookAt(target: Vector3D, upAxis: Vector3D = null)
        {
            super.lookAt(target, upAxis);
            this.invalidateSceneTransform();
        }

        translateLocal(axis: Vector3D, distance: number)
        {
            super.translateLocal(axis, distance);
            this.invalidateSceneTransform();
        }

        dispose()
        {
            super.dispose();
        }

        rotate(axis: Vector3D, angle: number, pivotPoint?: Vector3D)
        {
            super.rotate(axis, angle, pivotPoint);
            this.invalidateSceneTransform();
        }

        invalidateTransform()
        {
            super.invalidateTransform();
            this.invalidateSceneTransform();
        }

        //------------------------------------------
        // Protected Properties
        //------------------------------------------


        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        protected updateLocalToWorldMatrix()
        {
            this._localToWorldMatrix = this.matrix3d.clone();
            if (this.parent)
                this._localToWorldMatrix.append(this.parent.localToWorldMatrix);
            this.dispatch("updateLocalToWorldMatrix");
        }

        //------------------------------------------
        // Private Properties
        //------------------------------------------


        //------------------------------------------
        // Private Methods
        //------------------------------------------
        protected invalidateSceneTransform()
        {
            if (!this._localToWorldMatrix)
                return;
            this._localToWorldMatrix = null;
            this._worldToLocalMatrix = null;
            this.dispatch("scenetransformChanged", this);
            //
            for (var i = 0, n = this.gameObject.numChildren; i < n; i++)
            {
                this.gameObject.getChildAt(i).transform.invalidateSceneTransform();
            }
        }
    }
}