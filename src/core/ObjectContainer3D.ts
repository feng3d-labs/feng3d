module feng3d
{
    export class ObjectContainer3D extends Object3D 
    {
        public _ancestorsAllowMouseEnabled: boolean = false;
        public _isRoot: boolean = false;
        protected _scene: Scene3D;
        protected _parent: ObjectContainer3D;
        protected _sceneTransform: Matrix3D = new Matrix3D();
        protected _sceneTransformDirty: boolean = true;
        protected _mouseEnabled: boolean = false;
        private _sceneTransformChanged: Object3DEvent;
        private _scenechanged: Object3DEvent;
        private _children: ObjectContainer3D[] = [];
        private _mouseChildren: boolean = true;
        private _oldScene: Scene3D;
        private _inverseSceneTransform: Matrix3D = new Matrix3D();
        private _inverseSceneTransformDirty: boolean = true;
        private _scenePosition: Vector3D = new Vector3D();
        private _scenePositionDirty: boolean = true;
        private _explicitVisibility: boolean = true;
        private _implicitVisibility: boolean = true;
        private _listenToSceneTransformChanged: boolean = false;
        private _listenToSceneChanged: boolean = false;
        protected _ignoreTransform: boolean = false;
        public get ignoreTransform(): boolean
        {
            return this._ignoreTransform;
        }

        public set ignoreTransform(value: boolean)
        {
            this._ignoreTransform = value;
            this._sceneTransformDirty = <any>!value;
            this._inverseSceneTransformDirty = <any>!value;
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

        public setParent(value: ObjectContainer3D)
        {
            this._parent = value;
            this.updateMouseChildren();
            if (value == null)
            {
                this.scene = null;
                return;
            }
            this.notifySceneTransformChange();
            this.notifySceneChange();
        }

        private notifySceneTransformChange()
        {
            if (this._sceneTransformDirty || this._ignoreTransform)
                return;
            this.invalidateSceneTransform();
            var i: number = 0;
            var len: number = this._children.length;
            while (i < len)
                this._children[i++].notifySceneTransformChange();
            if (this._listenToSceneTransformChanged)
            {
                if (<any>!this._sceneTransformChanged)
                    this._sceneTransformChanged = new Object3DEvent(Object3DEvent.SCENETRANSFORM_CHANGED, this);
                this.dispatchEvent(this._sceneTransformChanged);
            }
        }

        private notifySceneChange()
        {
            this.notifySceneTransformChange();
            var i: number = 0;
            var len: number = this._children.length;
            while (i < len)
                this._children[i++].notifySceneChange();
            if (this._listenToSceneChanged)
            {
                if (<any>!this._scenechanged)
                    this._scenechanged = new Object3DEvent(Object3DEvent.SCENE_CHANGED, this);
                this.dispatchEvent(this._scenechanged);
            }
        }

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

        public get mouseEnabled(): boolean
        {
            return this._mouseEnabled;
        }

        public set mouseEnabled(value: boolean)
        {
            this._mouseEnabled = value;
            this.updateMouseChildren();
        }

        public invalidateTransform()
        {
            super.invalidateTransform();
            this.notifySceneTransformChange();
        }

        protected invalidateSceneTransform()
        {
            this._sceneTransformDirty = <any>!this._ignoreTransform;
            this._inverseSceneTransformDirty = <any>!this._ignoreTransform;
            this._scenePositionDirty = <any>!this._ignoreTransform;
        }

        protected updateSceneTransform()
        {
            if (this._parent && <any>!this._parent._isRoot)
            {
                this._sceneTransform.copyFrom(this._parent.sceneTransform);
                this._sceneTransform.prepend(this.transform);
            }
            else
                this._sceneTransform.copyFrom(this.transform);
            this._sceneTransformDirty = false;
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
                this.sceneTransform.copyColumnTo(3, this._scenePosition);
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
                var child: ObjectContainer3D = this._children[i++];
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
                var child: ObjectContainer3D = this._children[i++];
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
                var child: ObjectContainer3D = this._children[i++];
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
                var child: ObjectContainer3D = this._children[i++];
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
                var child: ObjectContainer3D = this._children[i++];
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
                var child: ObjectContainer3D = this._children[i++];
                m = child.maxZ + child.z;
                if (m > max)
                    max = m;
            }
            return max;
        }

        public get sceneTransform(): Matrix3D
        {
            if (this._sceneTransformDirty)
                this.updateSceneTransform();
            return this._sceneTransform;
        }

        public set sceneTransform(value: Matrix3D)
        {
            value = value.clone();
            this._parent && value.append(this._parent.inverseSceneTransform);
            this.transform = value;
        }

        public get scene(): Scene3D
        {
            return this._scene;
        }

        public set scene(value: Scene3D)
        {
            var i: number = 0;
            var len: number = this._children.length;
            while (i < len)
                this._children[i++].scene = value;
            if (this._scene == value)
                return;
            if (value == null)
                this._oldScene = this._scene;
            if (value)
                this._oldScene = null;
            this._scene = value;
            if (this._scene)
                this._scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.ADDED_TO_SCENE, this));
            else if (this._oldScene)
                this._oldScene.dispatchEvent(new Scene3DEvent(Scene3DEvent.REMOVED_FROM_SCENE, this));
        }

        public get inverseSceneTransform(): Matrix3D
        {
            if (this._inverseSceneTransformDirty)
            {
                this._inverseSceneTransform.copyFrom(this.sceneTransform);
                this._inverseSceneTransform.invert();
                this._inverseSceneTransformDirty = false;
            }
            return this._inverseSceneTransform;
        }

        public get parent(): ObjectContainer3D
        {
            return this._parent;
        }

        public constructor()
        {
            super();
        }

        public contains(child: ObjectContainer3D): boolean
        {
            return this._children.indexOf(child) >= 0;
        }

        public addChild(child: ObjectContainer3D): ObjectContainer3D
        {
            if (child == null)
                throw new Error("Parameter child cannot be null.").message;
            if (child._parent)
                child._parent.removeChild(child);
            child.setParent(this);
            child.scene = this._scene;
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
                var child: ObjectContainer3D = childarray[child_key_a];
                this.addChild(child);
            }
        }

        public setChildAt(child: ObjectContainer3D, index: number)
        {
            if (child == null)
                throw new Error("Parameter child cannot be null.").message;
            if (child._parent)
            {
                if (child._parent != this)
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
                child.setParent(this);
                child.scene = this._scene;
                child.notifySceneTransformChange();
                child.updateMouseChildren();
                child.updateImplicitVisibility();
                this._children[index] = child;
            }
        }

        public removeChild(child: ObjectContainer3D)
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
            var child: ObjectContainer3D = this._children[index];
            this.removeChildInternal(index, child);
        }

        private removeChildInternal(childIndex: number, child: ObjectContainer3D)
        {
            childIndex = childIndex;
            this._children.splice(childIndex, 1);
            child.setParent(null);
        }

        public getChildAt(index: number): ObjectContainer3D
        {
            index = index;
            return this._children[index];
        }

        public get numChildren(): number
        {
            return this._children.length;
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
                this.parent.removeChild(this);
        }

        public disposeWithChildren()
        {
            this.dispose();
            while (this.numChildren > 0)
                this.getChildAt(0).dispose();
        }

        public clone(): ObjectContainer3D
        {
            var clone: ObjectContainer3D = new ObjectContainer3D();
            clone.pivotPoint = this.pivotPoint;
            clone.transform = this.transform;
            clone.name = this.name;
            var len: number = this._children.length;
            for (var i: number = 0; i < len; ++i)
                clone.addChild(this._children[i].clone());
            return clone;
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

        public addEventListener(type: string, listener: (event: Event) => void, thisObject: any, priority: number = 0)
        {
            super.addEventListener(type, listener, thisObject, priority);
            switch (type)
            {
                case Object3DEvent.SCENETRANSFORM_CHANGED:
                    this._listenToSceneTransformChanged = true;
                    break;
                case Object3DEvent.SCENE_CHANGED:
                    this._listenToSceneChanged = true;
                    break;
            }
        }

        public removeEventListener(type: string, listener: (event: Event) => void, thisObject: any)
        {
            var _self__: any = this;
            super.removeEventListener(type, listener, thisObject);
            if (_self__.hasEventListener(type))
                return;
            switch (type)
            {
                case Object3DEvent.SCENETRANSFORM_CHANGED:
                    this._listenToSceneTransformChanged = false;
                    break;
                case Object3DEvent.SCENE_CHANGED:
                    this._listenToSceneChanged = false;
                    break;
            }
        }

        /**
         * 获取子对象列表（备份）
         */
        public getChildren()
        {
            return this._children.concat();
        }

    }
}
