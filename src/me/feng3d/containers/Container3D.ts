module feng3d {

	/**
	 * 3d对象容器
	 * @author feng 2014-3-21
	 */
    export class Container3D extends InteractiveObject3D implements IAsset {
        public namedAsset: NamedAsset;
        /** 容器内对象列表 */
        protected _children: Object3D[] = [];

        private _mouseChildren: boolean = true;

        /** 是否给根容器 */
        public _isRoot: boolean = false;

        constructor() {
            super();
            this.namedAsset = new NamedAsset(this, AssetType.CONTAINER);

            this.addComponent(new ContainerTransform3D());
        }

		/**
		 * 添加子对象
		 * @param child		子对象
		 * @return			新增的子对象
		 */
        public addChild(child: Object3D): Object3D {
            if (!child._explicitPartition)
                child.implicitPartition = this._implicitPartition;

            child.parent = this;
            child.scene = this.scene;
            this._children.push(child);
            return child;
        }

		/**
		 * 移出指定索引的子对象
		 * @param childIndex	子对象索引
		 * @return				被移除对象
		 */
        public removeChildAt(childIndex: number): Object3D {
            var child: Object3D = this.getChildAt(childIndex);
            this.removeChildInternal(childIndex, child);
            return child;
        }

		/**
		 * 移除子对象
		 * @param child		子对象
		 */
        public removeChild(child: Object3D): void {
            var childIndex: number = this._children.indexOf(child);
            if (childIndex != -1) {
                this.removeChildInternal(childIndex, child);
            }
        }

		/**
		 * 移除所有子对象
		 */
        public removeAllChild(): void {
            for (var i: number = this._children.length - 1; i >= 0; i--) {
                this.removeChildAt(i);
            }
        }

		/**
		 * 内部移除子对象
		 * @param childIndex	移除子对象所在索引
		 * @param child			移除子对象
		 */
        private removeChildInternal(childIndex: number, child: Object3D): void {
            this._children.splice(childIndex, 1);

            child.parent = null;
            child.scene = null;
        }

        public set scene(scene: Scene3D) {
            super.scene = scene;

            var len: number = this._children.length;
            for (var i: number = 0; i < len; i++) {
                this._children[i].scene = scene;
            }
        }

		/**
		 * 子对象个数
		 */
        public get numChildren(): number {
            return this._children.length;
        }

		/**
		 * 获取子对象
		 * @param index
		 * @return
		 */
        public getChildAt(index: number): Object3D {
            return this._children[index];
        }

		/**
		 * 是否包含该对象
		 * @param child
		 * @return
		 */
        public contains(child: Object3D): boolean {
            return this._children.indexOf(child) >= 0;
        }

		/**
		 * 确定对象的子级是否支持鼠标或用户输入设备。
		 */
        public get mouseChildren(): boolean {
            return this._mouseChildren;
        }

        public set mouseChildren(value: boolean) {
            this._mouseChildren = value;
        }

		/**
		 * 祖先是否允许鼠标事件
		 */
        public get ancestorsAllowMouseEnabled(): boolean {
            return this.mouseChildren && (this.parent ? this.parent.ancestorsAllowMouseEnabled : true);
        }

		/**
		 * @inheritDoc
		 */
        public set implicitPartition(value: Partition3D) {
            if (value == this._implicitPartition)
                return;

            this._implicitPartition = value;

            var i: number;
            var len: number = this._children.length;
            var child: Object3D;

            while (i < len) {
                child = this._children[i];
                i++;

                if (!child._explicitPartition)
                    child.implicitPartition = value;
            }
        }

		/**
		 * The minimum extremum of the object along the X-axis.
		 */
        public get minX(): number {
            var i: number;
            var len: number = this._children.length;
            var min: number = Number.POSITIVE_INFINITY;
            var m: number;

            while (i < len) {
                var child: Object3D = this._children[i++];
                m = child.minX + child.transform3D.x;
                if (m < min)
                    min = m;
            }

            return min;
        }

		/**
		 * The minimum extremum of the object along the Y-axis.
		 */
        public get minY(): number {
            var i: number;
            var len: number = this._children.length;
            var min: number = Number.POSITIVE_INFINITY;
            var m: number;

            while (i < len) {
                var child: Object3D = this._children[i++];
                m = child.minY + child.transform3D.y;
                if (m < min)
                    min = m;
            }

            return min;
        }

		/**
		 * The minimum extremum of the object along the Z-axis.
		 */
        public get minZ(): number {
            var i: number;
            var len: number = this._children.length;
            var min: number = Number.POSITIVE_INFINITY;
            var m: number;

            while (i < len) {
                var child: Object3D = this._children[i++];
                m = child.minZ + child.transform3D.z;
                if (m < min)
                    min = m;
            }

            return min;
        }

		/**
		 * The maximum extremum of the object along the X-axis.
		 */
        public get maxX(): number {
            // todo: this isn't right, doesn't take into account transforms
            var i: number;
            var len: number = this._children.length;
            var max: number = Number.NEGATIVE_INFINITY;
            var m: number;

            while (i < len) {
                var child: Object3D = this._children[i++];
                m = child.maxX + child.transform3D.x;
                if (m > max)
                    max = m;
            }

            return max;
        }

		/**
		 * The maximum extremum of the object along the Y-axis.
		 */
        public get maxY(): number {
            var i: number;
            var len: number = this._children.length;
            var max: number = Number.NEGATIVE_INFINITY;
            var m: number;

            while (i < len) {
                var child: Object3D = this._children[i++];
                m = child.maxY + child.transform3D.y;
                if (m > max)
                    max = m;
            }

            return max;
        }

		/**
		 * The maximum extremum of the object along the Z-axis.
		 */
        public get maxZ(): number {
            var i: number;
            var len: number = this._children.length;
            var max: number = Number.NEGATIVE_INFINITY;
            var m: number;

            while (i < len) {
                var child: Object3D = this._children[i++];
                m = child.maxZ + child.transform3D.z;
                if (m > max)
                    max = m;
            }

            return max;
        }

		/**
		 * @inheritDoc
		 */
        public dispose(): void {
            if (this.parent)
                this.parent.removeChild(this);
        }

    }
}
