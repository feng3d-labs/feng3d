namespace feng3d
{
    export class ObjectContainer3D extends Object3D 
    {
        /**
         * 子对象
         */
        @serialize
        get children()
        {
            return this._children.concat();
        }

        set children(value)
        {
            for (var i = 0, n = this._children.length; i < n; i++)
            {
                this.removeChildAt(i)
            }
            for (var i = 0; i < value.length; i++)
            {
                this.addChild(value[i]);
            }
        }

        get numChildren(): number
        {
            return this._children.length;
        }

        get scenePosition()
        {
            return this.localToWorldMatrix.position;
        }

        get minX(): number
        {
            var i = 0;
            var len = this._children.length;
            var min = Number.POSITIVE_INFINITY;
            var m = 0;
            while (i < len)
            {
                var child: Transform = this._children[i++];
                m = child.minX + child.x;
                if (m < min)
                    min = m;
            }
            return min;
        }

        get minY(): number
        {
            var i = 0;
            var len = this._children.length;
            var min = Number.POSITIVE_INFINITY;
            var m = 0;
            while (i < len)
            {
                var child: Transform = this._children[i++];
                m = child.minY + child.y;
                if (m < min)
                    min = m;
            }
            return min;
        }

        get minZ(): number
        {
            var i = 0;
            var len = this._children.length;
            var min = Number.POSITIVE_INFINITY;
            var m = 0;
            while (i < len)
            {
                var child: Transform = this._children[i++];
                m = child.minZ + child.z;
                if (m < min)
                    min = m;
            }
            return min;
        }

        get maxX(): number
        {
            var i = 0;
            var len = this._children.length;
            var max = Number.NEGATIVE_INFINITY;
            var m = 0;
            while (i < len)
            {
                var child: Transform = this._children[i++];
                m = child.maxX + child.x;
                if (m > max)
                    max = m;
            }
            return max;
        }

        get maxY(): number
        {
            var i = 0;
            var len = this._children.length;
            var max = Number.NEGATIVE_INFINITY;
            var m = 0;
            while (i < len)
            {
                var child: Transform = this._children[i++];
                m = child.maxY + child.y;
                if (m > max)
                    max = m;
            }
            return max;
        }

        get maxZ(): number
        {
            var i = 0;
            var len = this._children.length;
            var max = Number.NEGATIVE_INFINITY;
            var m = 0;
            while (i < len)
            {
                var child: Transform = this._children[i++];
                m = child.maxZ + child.z;
                if (m > max)
                    max = m;
            }
            return max;
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
            this._parent && value.append(this._parent.worldToLocalMatrix);
            this.matrix3d = value;
        }

        get scene(): Scene3D
        {
            return this._scene;
        }

        private updateScene()
        {
            var newScene = this._parent ? this._parent._scene : null;
            if (this._scene == newScene)
                return;
            if (this._scene)
                Event.dispatch(this, <any>Scene3DEvent.REMOVED_FROM_SCENE, this);
            this._scene = newScene;
            if (this._scene)
                Event.dispatch(this, <any>Scene3DEvent.ADDED_TO_SCENE, this);
            for (let i = 0, n = this._children.length; i < n; i++)
            {
                this._children[i].updateScene();
            }
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
                if (this._parent)
                    this._localToWorldRotationMatrix.append(this._parent.localToWorldRotationMatrix);
            }
            return this._localToWorldRotationMatrix;
        }

        get parent(): Transform
        {
            return this._parent;
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
            if (!this._parent)
                return direction.clone();
            var matrix3d = this._parent.localToWorldRotationMatrix;
            direction = matrix3d.transformVector(direction);
            return direction;
        }

        /**
         * Transforms position from local space to world space.
         */
        transformPoint(position: Vector3D)
        {
            if (!this._parent)
                return position.clone();
            var matrix3d = this._parent.localToWorldMatrix;
            position = matrix3d.transformVector(position);
            return position;
        }

        /**
         * Transforms vector from local space to world space.
         */
        transformVector(vector: Vector3D)
        {
            if (!this._parent)
                return vector.clone();
            var matrix3d = this._parent.localToWorldMatrix;
            vector = matrix3d.deltaTransformVector(vector);
            return vector;
        }

        /**
         * Transforms a direction from world space to local space. The opposite of Transform.TransformDirection.
         */
        inverseTransformDirection(direction: Vector3D)
        {
            if (!this._parent)
                return direction.clone();
            var matrix3d = this._parent.localToWorldRotationMatrix.clone().invert();
            direction = matrix3d.transformVector(direction);
            return direction;
        }

        /**
         * Transforms position from world space to local space.
         */
        inverseTransformPoint(position: Vector3D)
        {
            if (!this._parent)
                return position.clone();
            var matrix3d = this._parent.localToWorldMatrix.clone().invert();
            position = matrix3d.transformVector(position);
            return position;
        }

        /**
         * Transforms a vector from world space to local space. The opposite of Transform.TransformVector.
         */
        inverseTransformVector(vector: Vector3D)
        {
            if (!this._parent)
                return vector.clone();
            var matrix3d = this._parent.localToWorldMatrix.clone().invert();
            vector = matrix3d.deltaTransformVector(vector);
            return vector;
        }

        contains(child: Transform): boolean
        {
            return this._children.indexOf(child) >= 0;
        }

        addChild(child: Transform): Transform
        {
            if (child == null)
                throw new Error("Parameter child cannot be null.").message;
            if (child._parent)
                child._parent.removeChild(child);
            child._setParent(<any>this);
            child.notifySceneTransformChange();
            this._children.push(child);
            return child;
        }

        addChildren(...childarray)
        {
            for (var child_key_a in childarray)
            {
                var child: Transform = childarray[child_key_a];
                this.addChild(child);
            }
        }

        setChildAt(child: Transform, index: number)
        {
            if (child == null)
                throw new Error("Parameter child cannot be null.").message;
            if (child._parent)
            {
                if (child._parent != <Transform><any>this)
                {
                    child._parent.removeChild(child);
                }
                else
                {
                    var oldIndex = this._children.indexOf(child);
                    this._children.splice(oldIndex, 1);
                    this._children.splice(index, 0, child);
                }
            }
            else
            {
                child._setParent(<any>this);
                child.notifySceneTransformChange();
                this._children[index] = child;
            }
        }

        removeChild(child: Transform)
        {
            if (child == null)
                throw new Error("Parameter child cannot be null").message;
            var childIndex = this._children.indexOf(child);
            if (childIndex == -1)
                throw new Error("Parameter is not a child of the caller").message;
            this.removeChildInternal(childIndex, child);
        }

        removeChildAt(index: number)
        {
            var child: Transform = this._children[index];
            this.removeChildInternal(index, child);
        }

        private _setParent(value: Transform)
        {
            this._parent = value;
            this.updateScene();
            this.notifySceneTransformChange();
            this.notifySceneChange();
        }

        getChildAt(index: number): Transform
        {
            index = index;
            return this._children[index];
        }

        lookAt(target: Vector3D, upAxis: Vector3D = null)
        {
            super.lookAt(target, upAxis);
            this.notifySceneTransformChange();
        }

        translateLocal(axis: Vector3D, distance: number)
        {
            super.translateLocal(axis, distance);
            this.notifySceneTransformChange();
        }

        dispose()
        {
            if (this.parent)
                this.parent.removeChild(<any>this);
        }

        disposeWithChildren()
        {
            this.dispose();
            while (this.numChildren > 0)
                this.getChildAt(0).dispose();
        }

        rotate(axis: Vector3D, angle: number, pivotPoint?: Vector3D)
        {
            super.rotate(axis, angle, pivotPoint);
            this.notifySceneTransformChange();
        }

        /**
         * 获取子对象列表（备份）
         */
        getChildren()
        {
            return this._children.concat();
        }

        invalidateTransform()
        {
            super.invalidateTransform();
            this.notifySceneTransformChange();
        }

        //------------------------------------------
        // Protected Properties
        //------------------------------------------


        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        protected invalidateSceneTransform()
        {
            this._localToWorldMatrix = null;
            this._worldToLocalMatrix = null;
        }

        protected updateLocalToWorldMatrix()
        {
            this._localToWorldMatrix = this.matrix3d.clone();
            if (this._parent)
                this._localToWorldMatrix.append(this._parent.localToWorldMatrix);
        }

        //------------------------------------------
        // Private Properties
        //------------------------------------------


        //------------------------------------------
        // Private Methods
        //------------------------------------------
        private notifySceneTransformChange()
        {
            if (!this._localToWorldMatrix)
                return;
            this.invalidateSceneTransform();
            var i = 0;
            var len = this._children.length;
            while (i < len)
                this._children[i++].notifySceneTransformChange();
            Event.dispatch(this, <any>Object3DEvent.SCENETRANSFORM_CHANGED, this);
        }

        private notifySceneChange()
        {
            this.notifySceneTransformChange();
            var i = 0;
            var len = this._children.length;
            while (i < len)
                this._children[i++].notifySceneChange();
            Event.dispatch(this, <any>Object3DEvent.SCENE_CHANGED, this);
        }

        private removeChildInternal(childIndex: number, child: Transform)
        {
            childIndex = childIndex;
            this._children.splice(childIndex, 1);
            child._setParent(null);
        }
    }
}