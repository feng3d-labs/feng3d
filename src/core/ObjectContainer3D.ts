namespace feng3d
{
    export class ObjectContainer3D extends Object3D 
    {
        //------------------------------------------
        // Variables
        //------------------------------------------
        public _ancestorsAllowMouseEnabled: boolean = false;
        public _isRoot: boolean = false;

        public get childCount(): number
        {
            return this._children.length;
        }

        public get ignoreTransform(): boolean
        {
            return this._ignoreTransform;
        }

        public set ignoreTransform(value: boolean)
        {
            this._ignoreTransform = value;
            this._sceneTransformDirty = <any>!value;
            this._worldToLocalMatrixDirty = <any>!value;
            this._scenePositionDirty = <any>!value;
            if (<any>!value)
            {
                this._sceneTransform.identity();
                this._scenePosition.setTo(0, 0, 0);
            }
        }

        public get isVisible(): boolean
        {
            return this._implicitVisibility && this._explicitVisibility;
        }

        public get mouseEnabled(): boolean
        {
            return this._mouseEnabled;
        }

        public set mouseEnabled(value: boolean)
        {
            this._mouseEnabled = value;
            this.updateMouseChildren();
        }
        public get mouseChildren(): boolean
        {
            return this._mouseChildren;
        }

        public set mouseChildren(value: boolean)
        {
            this._mouseChildren = value;
            this.updateMouseChildren();
        }

        public get visible(): boolean
        {
            return this._explicitVisibility;
        }

        public set visible(value: boolean)
        {
            var len: number = this._children.length;
            this._explicitVisibility = value;
            for (var i: number = 0; i < len; ++i)
                this._children[i].updateImplicitVisibility();
        }

        public get scenePosition(): Vector3D
        {
            if (this._scenePositionDirty)
            {
                this.localToWorldMatrix.copyColumnTo(3, this._scenePosition);
                this._scenePositionDirty = false;
            }
            return this._scenePosition;
        }

        public get minX(): number
        {
            var i: number = 0;
            var len: number = this._children.length;
            var min: number = Number.POSITIVE_INFINITY;
            var m: number = 0;
            while (i < len)
            {
                var child: Transform = this._children[i++];
                m = child.minX + child.x;
                if (m < min)
                    min = m;
            }
            return min;
        }

        public get minY(): number
        {
            var i: number = 0;
            var len: number = this._children.length;
            var min: number = Number.POSITIVE_INFINITY;
            var m: number = 0;
            while (i < len)
            {
                var child: Transform = this._children[i++];
                m = child.minY + child.y;
                if (m < min)
                    min = m;
            }
            return min;
        }

        public get minZ(): number
        {
            var i: number = 0;
            var len: number = this._children.length;
            var min: number = Number.POSITIVE_INFINITY;
            var m: number = 0;
            while (i < len)
            {
                var child: Transform = this._children[i++];
                m = child.minZ + child.z;
                if (m < min)
                    min = m;
            }
            return min;
        }

        public get maxX(): number
        {
            var i: number = 0;
            var len: number = this._children.length;
            var max: number = Number.NEGATIVE_INFINITY;
            var m: number = 0;
            while (i < len)
            {
                var child: Transform = this._children[i++];
                m = child.maxX + child.x;
                if (m > max)
                    max = m;
            }
            return max;
        }

        public get maxY(): number
        {
            var i: number = 0;
            var len: number = this._children.length;
            var max: number = Number.NEGATIVE_INFINITY;
            var m: number = 0;
            while (i < len)
            {
                var child: Transform = this._children[i++];
                m = child.maxY + child.y;
                if (m > max)
                    max = m;
            }
            return max;
        }

        public get maxZ(): number
        {
            var i: number = 0;
            var len: number = this._children.length;
            var max: number = Number.NEGATIVE_INFINITY;
            var m: number = 0;
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
        public get localToWorldMatrix(): Matrix3D
        {
            if (this._sceneTransformDirty)
                this.updateLocalToWorldMatrix();
            return this._sceneTransform;
        }

        public set localToWorldMatrix(value: Matrix3D)
        {
            value = value.clone();
            this._parent && value.append(this._parent.worldToLocalMatrix);
            this.matrix3d = value;
        }

        public get scene(): Scene3D
        {
            return this._scene;
        }

        private updateScene()
        {
            var newScene = this._parent ? this._parent._scene : null;
            if (this._scene == newScene)
                return;
            if (this._scene)
                Event.dispatch(this,<any>Scene3DEvent.REMOVED_FROM_SCENE, this);
            this._scene = newScene;
            if (this._scene)
                Event.dispatch(this,<any>Scene3DEvent.ADDED_TO_SCENE, this);
            for (let i = 0, n = this._children.length; i < n; i++)
            {
                this._children[i].updateScene();
            }
        }

        /**
         * Matrix that transforms a point from world space into local space (Read Only).
         */
        public get worldToLocalMatrix(): Matrix3D
        {
            if (this._worldToLocalMatrixDirty)
            {
                this._worldToLocalMatrix.copyFrom(this.localToWorldMatrix);
                this._worldToLocalMatrix.invert();
                this._worldToLocalMatrixDirty = false;
            }
            return this._worldToLocalMatrix;
        }

        public get parent(): Transform
        {
            return this._parent;
        }

        //------------------------------------------
        // Public Functions
        //------------------------------------------
        public constructor(gameObject: GameObject)
        {
            super(gameObject);
        }

        public contains(child: Transform): boolean
        {
            return this._children.indexOf(child) >= 0;
        }

        public addChild(child: Transform): Transform
        {
            if (child == null)
                throw new Error("Parameter child cannot be null.").message;
            if (child._parent)
                child._parent.removeChild(child);
            child._setParent(<any>this);
            child.notifySceneTransformChange();
            child.updateMouseChildren();
            child.updateImplicitVisibility();
            this._children.push(child);
            return child;
        }

        public addChildren(...childarray)
        {
            for (var child_key_a in childarray)
            {
                var child: Transform = childarray[child_key_a];
                this.addChild(child);
            }
        }

        public setChildAt(child: Transform, index: number)
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
                child.updateMouseChildren();
                child.updateImplicitVisibility();
                this._children[index] = child;
            }
        }

        public removeChild(child: Transform)
        {
            if (child == null)
                throw new Error("Parameter child cannot be null").message;
            var childIndex: number = this._children.indexOf(child);
            if (childIndex == -1)
                throw new Error("Parameter is not a child of the caller").message;
            this.removeChildInternal(childIndex, child);
        }

        public removeChildAt(index: number)
        {
            index = index;
            var child: Transform = this._children[index];
            this.removeChildInternal(index, child);
        }

        private _setParent(value: Transform)
        {
            this._parent = value;
            this.updateMouseChildren();
            this.updateScene();
            this.notifySceneTransformChange();
            this.notifySceneChange();
        }

        public getChildAt(index: number): Transform
        {
            index = index;
            return this._children[index];
        }

        public lookAt(target: Vector3D, upAxis: Vector3D = null)
        {
            super.lookAt(target, upAxis);
            this.notifySceneTransformChange();
        }

        public translateLocal(axis: Vector3D, distance: number)
        {
            super.translateLocal(axis, distance);
            this.notifySceneTransformChange();
        }

        public dispose()
        {
            if (this.parent)
                this.parent.removeChild(<any>this);
        }

        public disposeWithChildren()
        {
            this.dispose();
            while (this.childCount > 0)
                this.getChildAt(0).dispose();
        }

        public rotate(axis: Vector3D, angle: number)
        {
            super.rotate(axis, angle);
            this.notifySceneTransformChange();
        }

        public updateImplicitVisibility()
        {
            var len: number = this._children.length;
            this._implicitVisibility = this._parent._explicitVisibility && this._parent._implicitVisibility;
            for (var i: number = 0; i < len; ++i)
                this._children[i].updateImplicitVisibility();
        }

        /**
         * 获取子对象列表（备份）
         */
        public getChildren()
        {
            return this._children.concat();
        }

        public invalidateTransform()
        {
            super.invalidateTransform();
            this.notifySceneTransformChange();
        }

        //------------------------------------------
        // Protected Properties
        //------------------------------------------
        protected _scene: Scene3D;
        protected _parent: Transform;
        protected _sceneTransform: Matrix3D = new Matrix3D();
        protected _sceneTransformDirty: boolean = true;
        protected _mouseEnabled: boolean = true;
        protected _ignoreTransform: boolean = false;

        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        protected updateMouseChildren()
        {
            if (this._parent && <any>!this._parent._isRoot)
            {
                this._ancestorsAllowMouseEnabled = this.parent._ancestorsAllowMouseEnabled && this._parent.mouseChildren;
            }
            else
                this._ancestorsAllowMouseEnabled = this.mouseChildren;
            var len: number = this._children.length;
            for (var i: number = 0; i < len; ++i)
                this._children[i].updateMouseChildren();
        }

        protected invalidateSceneTransform()
        {
            this._sceneTransformDirty = <any>!this._ignoreTransform;
            this._worldToLocalMatrixDirty = <any>!this._ignoreTransform;
            this._scenePositionDirty = <any>!this._ignoreTransform;
        }

        protected updateLocalToWorldMatrix()
        {
            if (this._parent && <any>!this._parent._isRoot)
            {
                this._sceneTransform.copyFrom(this._parent.localToWorldMatrix);
                this._sceneTransform.prepend(this.matrix3d);
            }
            else
                this._sceneTransform.copyFrom(this.matrix3d);
            this._sceneTransformDirty = false;
        }

        //------------------------------------------
        // Private Properties
        //------------------------------------------
        private _children: Transform[] = [];
        private _mouseChildren: boolean = true;
        private _worldToLocalMatrix: Matrix3D = new Matrix3D();
        private _worldToLocalMatrixDirty: boolean = true;
        private _scenePosition: Vector3D = new Vector3D();
        private _scenePositionDirty: boolean = true;
        private _explicitVisibility: boolean = true;
        private _implicitVisibility: boolean = true;

        //------------------------------------------
        // Private Methods
        //------------------------------------------
        private notifySceneTransformChange()
        {
            if (this._sceneTransformDirty || this._ignoreTransform)
                return;
            this.invalidateSceneTransform();
            var i: number = 0;
            var len: number = this._children.length;
            while (i < len)
                this._children[i++].notifySceneTransformChange();
            Event.dispatch(this,<any>Object3DEvent.SCENETRANSFORM_CHANGED, this);
        }

        private notifySceneChange()
        {
            this.notifySceneTransformChange();
            var i: number = 0;
            var len: number = this._children.length;
            while (i < len)
                this._children[i++].notifySceneChange();
            Event.dispatch(this,<any>Object3DEvent.SCENE_CHANGED, this);
        }

        private removeChildInternal(childIndex: number, child: Transform)
        {
            childIndex = childIndex;
            this._children.splice(childIndex, 1);
            child._setParent(null);
        }
    }
}
