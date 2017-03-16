module feng3d
{
    /**
     * 3D对象
     * @author feng 2016-04-26
     */
    export class Object3D extends RenderDataHolder
    {        
        public renderData = new Object3DRenderAtomic();

        //-序列化
        /**
		 * 是否开启鼠标事件
		 */
        protected mouseEnabled: boolean = true;
        /**
		 * 是否可见
		 */
        public visible = true;
        /**
		 * 组件列表
		 */
        protected components_: Object3DComponent[] = [];
        /**
         * 子对象列表
         */
        private children_: Object3D[] = [];

        //-非序列化
        private _object3DID: number;

        private _transform: Transform;
        /**
         * 父对象
         */
        private _parent: Object3D = null;

        private _scene: Scene3D;

        public updateRender(renderContext: RenderContext)
        {
            this.renderData.clear();
            this.collectRenderDataHolder(this.renderData);
            this.renderData.update(renderContext);
        }

        public get object3DID()
        {
            return this._object3DID;
        }

        /**
         * 变换
         */
        public get transform(): Transform
        {
            return this._transform;
        }

        public set transform(value: Transform)
        {
            assert(value != null, "3D空间不能为null");
            this._transform && this.removeComponent(this._transform);
            this._transform = value;
            this._transform && this.addComponentAt(this._transform, 0);
        }

        /**
         * 构建3D对象
         */
        constructor(name = "object")
        {
            super();

            this._object3DID = object3DAutoID++;
            object3DMap[this._object3DID] = this;
            this.name = name;
            //
            this.transform = new Transform();
            //
            this.addEventListener(Object3DEvent.ADDED, this.onAdded, this);
            this.addEventListener(Object3DEvent.REMOVED, this.onRemoved, this);
            this.addEventListener(ComponentEvent.ADDED_COMPONENT, this.onAddedComponent, this);
            this.addEventListener(ComponentEvent.REMOVED_COMPONENT, this.onRemovedComponent, this);
        }

		/**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            //
            renderData.uniforms[RenderDataID.u_objectID] = this._object3DID;
        }

        /**
         * 父对象
         */
        public get parent()
        {
            return this._parent;
        }

        private _setParent(value: Object3D)
        {
            if (this._parent == value)
                return;
            this._parent = value;

            if (this._parent == null)
                this._setScene(null);
            else if (ClassUtils.is(this.parent, Scene3D))
                this._setScene(<Scene3D>this.parent);
            else
                this._setScene(this.parent.scene);
        }

        /**
         * 场景
         */
        public get scene()
        {
            return this._scene;
        }

        private _setScene(value: Scene3D)
        {
            if (this._scene == value)
                return;

            if (this._scene)
            {
                this.dispatchEvent(new Scene3DEvent(Scene3DEvent.REMOVED_FROM_SCENE, { object3d: this, scene: this._scene }));
                this._scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.REMOVED_FROM_SCENE, { object3d: this, scene: this._scene }));
            }
            this._scene = value;
            if (this._scene)
            {
                this.dispatchEvent(new Scene3DEvent(Scene3DEvent.ADDED_TO_SCENE, { object3d: this, scene: this._scene }));
                this._scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.ADDED_TO_SCENE, { object3d: this, scene: this._scene }));
            }
            this.children_.forEach(child =>
            {
                child._setScene(this._scene);
            });
        }

        /**
         * 真实是否支持鼠标事件
         */
        public get realMouseEnable()
        {
            return this.mouseEnabled && (this.parent ? this.parent.realMouseEnable : true);
        }

        /**
         * 真实是否可见
         */
        public get realVisible()
        {
            return this.visible && (this.parent ? this.parent.realVisible : true);
        }

        /**
		 * 添加子对象
		 * @param child		子对象
		 * @return			新增的子对象
		 */
        public addChild(child: Object3D): void
        {
            this.addChildAt(child, this.children_.length);
        }

        /**
         * 添加子对象到指定位置
         * @param   child   子对象
         * @param   index   添加到的位置
         */
        public addChildAt(child: Object3D, index: number): void
        {
            debuger && console.assert(index >= 0 && index <= this.children_.length);
            var childIndex = this.children_.indexOf(child);
            if (childIndex != -1)
            {
                this.children_.splice(childIndex, 1);
                this.children_.splice(index, 0, child);
            } else
            {
                this.children_.splice(index, 0, child);
                child.dispatchEvent(new Object3DEvent(Object3DEvent.ADDED, { parent: this, child: child }, true));
            }
        }

        /**
         * 设置子对象在指定位置
         * @param child 子对象
         * @param index 索引
         */
        public setChildAt(child: Object3D, index: number): void
        {
            if (-1 < index && index < this.children_.length)
            {
                this.removeChildAt(index);
            }

            this.addChildAt(child, index);
        }

        /**
         * 移除子对象
         * @param   child   子对象
         * @return			被移除子对象索引
         */
        public removeChild(child: Object3D): number
        {
            var childIndex = this.children_.indexOf(child);
            this.removeChildAt(childIndex);
            return childIndex;
        }

        /**
         * 获取子对象索引
         * @param   child   子对象
         * @return  子对象位置
         */
        public getChildIndex(child: Object3D): number
        {
            return this.children_.indexOf(child);
        }

        /**
		 * 移出指定索引的子对象
		 * @param index         子对象索引
		 * @return				被移除对象
		 */
        public removeChildAt(index: number): Object3D
        {
            debuger && console.assert(-1 < index && index < this.children_.length);
            var child: Object3D = this.children_[index];
            this.children_.splice(index, 1);
            child.dispatchEvent(new Object3DEvent(Object3DEvent.REMOVED, { parent: this, child: child }, true));
            return child;
        }

		/**
		 * 获取子对象
		 * @param index         子对象索引
		 * @return              指定索引的子对象
		 */
        public getChildAt(index: number): Object3D
        {
            debuger && console.assert(-1 < index && index < this.children_.length);
            return this.children_[index];
        }

        /**
         * 获取子对象数量
         */
        public get numChildren(): number
        {
            return this.children_.length;
        }

        /**
         * 处理添加子对象事件
         */
        private onAdded(event: Object3DEvent): void
        {
            if (event.data.child == this)
            {
                this._setParent(event.data.parent);
            }
        }

        /**
         * 处理删除子对象事件
         */
        private onRemoved(event: Object3DEvent): void
        {
            if (event.data.child == this)
            {
                this._setParent(null);
            }
        }

        /**
         * 处理新增组件事件
         */
        protected onAddedComponent(event: ComponentEvent)
        {
            if (event.data.container == this)
            {
                if (event.data.child instanceof Transform)
                {
                    this._transform = event.data.child;
                }
            }
        }

        /**
         * 处理移除组件事件
         */
        protected onRemovedComponent(event: ComponentEvent)
        {
            if (event.data.container == this)
            {
                if (event.data.child instanceof Transform)
                {
                    this._transform = null;
                }
            }
        }

        public static getObject3D(id: number)
        {
            return object3DMap[id];
        }
    }

    var object3DAutoID = 1;//索引从1开始，因为索引拾取中默认值为0
    var object3DMap: { [id: number]: Object3D } = {};
}