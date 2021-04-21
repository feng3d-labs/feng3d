namespace feng3d
{
    export interface EntityEventMap
    {
        /**
         * 尺寸变化事件
         */
        sizeChanged: TransformLayout;

        /**
         * 中心点变化事件
         */
        pivotChanged: TransformLayout;
    }

    export interface ComponentMap { TransformLayout: TransformLayout; }

    /**
     * 变换布局
     * 
     * 提供了比Transform更加适用于2D元素的API
     * 
     * 通过修改Transform的数值实现
     */
    @AddComponentMenu("Layout/TransformLayout")
    @RegisterComponent({ single: true })
    export class TransformLayout extends Component3D
    {
		/**
		 * 创建一个实体，该类为虚类
		 */
        constructor()
        {
            super();

            watcher.watch(this._position, "x", this._invalidateLayout, this);
            watcher.watch(this._position, "y", this._invalidateLayout, this);
            watcher.watch(this._position, "z", this._invalidateLayout, this);
            watcher.watch(this.anchorMin, "x", this._invalidateLayout, this);
            watcher.watch(this.anchorMin, "y", this._invalidateLayout, this);
            watcher.watch(this.anchorMin, "z", this._invalidateLayout, this);
            watcher.watch(this.anchorMax, "x", this._invalidateLayout, this);
            watcher.watch(this.anchorMax, "y", this._invalidateLayout, this);
            watcher.watch(this.anchorMax, "z", this._invalidateLayout, this);
            //
            watcher.watch(this._leftTop, "x", this._invalidateSize, this);
            watcher.watch(this._leftTop, "y", this._invalidateSize, this);
            watcher.watch(this._leftTop, "z", this._invalidateSize, this);
            watcher.watch(this._rightBottom, "x", this._invalidateSize, this);
            watcher.watch(this._rightBottom, "y", this._invalidateSize, this);
            watcher.watch(this._rightBottom, "z", this._invalidateSize, this);
            //
            watcher.watch(this._size, "x", this._invalidateSize, this);
            watcher.watch(this._size, "y", this._invalidateSize, this);
            watcher.watch(this._size, "z", this._invalidateSize, this);
            watcher.watch(this.pivot, "x", this._invalidatePivot, this);
            watcher.watch(this.pivot, "y", this._invalidatePivot, this);
            watcher.watch(this.pivot, "z", this._invalidatePivot, this);
            //
            this.on("added", this._onAdded, this);
            this.on("removed", this._onRemoved, this);
        }

        private _onAdded(event: Event<{ parent: Node3D; }>)
        {
            event.data.parent.on("sizeChanged", this._invalidateLayout, this);
            event.data.parent.on("pivotChanged", this._invalidateLayout, this);
            this._invalidateLayout();
        }

        private _onRemoved(event: Event<{ parent: Node3D; }>)
        {
            event.data.parent.off("sizeChanged", this._invalidateLayout, this);
            event.data.parent.off("pivotChanged", this._invalidateLayout, this);
        }

        /**
         * 位移
         */
        @oav({ tooltip: "当anchorMin.x == anchorMax.x时对position.x赋值生效，当 anchorMin.y == anchorMax.y 时对position.y赋值生效，否则赋值无效，自动被覆盖。", componentParam: { step: 1, stepScale: 1, stepDownup: 1 } })
        @serialize
        get position()
        {
            this._updateLayout();
            return this._position;
        }
        set position(v) { this._position.copy(v); }
        private readonly _position = new Vector3();

        /**
         * 尺寸，宽高。
         */
        @oav({ tooltip: "宽度，不会影响到缩放值。当 anchorMin.x == anchorMax.x 时对 size.x 赋值生效，当anchorMin.y == anchorMax.y时对 size.y 赋值生效，否则赋值无效，自动被覆盖。", componentParam: { step: 1, stepScale: 1, stepDownup: 1 } })
        @serialize
        get size()
        {
            this._updateLayout();
            return this._size;
        }
        set size(v) { this._size.copy(v); }
        private _size = new Vector3(1, 1, 1);

        /**
         * 与最小最大锚点形成的边框的left、right、top、bottom距离。当 anchorMin.x != anchorMax.x 时对 layout.x layout.y 赋值生效，当 anchorMin.y != anchorMax.y 时对 layout.z layout.w 赋值生效，否则赋值无效，自动被覆盖。
         */
        @oav({ tooltip: "与最小最大锚点形成的边框的left、right、top、bottom距离。当 anchorMin.x != anchorMax.x 时对 layout.x layout.y 赋值生效，当 anchorMin.y != anchorMax.y 时对 layout.z layout.w 赋值生效，否则赋值无效，自动被覆盖。", componentParam: { step: 1, stepScale: 1, stepDownup: 1 } })
        @serialize
        get leftTop()
        {
            return this._leftTop;
        }
        set leftTop(v)
        {
            this._leftTop.copy(v);
        }
        private _leftTop = new Vector3(0, 0, 0);

        /**
         * 与最小最大锚点形成的边框的left、right、top、bottom距离。当 anchorMin.x != anchorMax.x 时对 layout.x layout.y 赋值生效，当 anchorMin.y != anchorMax.y 时对 layout.z layout.w 赋值生效，否则赋值无效，自动被覆盖。
         */
        @oav({ tooltip: "与最小最大锚点形成的边框的left、right、top、bottom距离。当 anchorMin.x != anchorMax.x 时对 layout.x layout.y 赋值生效，当 anchorMin.y != anchorMax.y 时对 layout.z layout.w 赋值生效，否则赋值无效，自动被覆盖。", componentParam: { step: 1, stepScale: 1, stepDownup: 1 } })
        @serialize
        get rightBottom()
        {
            return this._rightBottom;
        }
        set rightBottom(v)
        {
            this._rightBottom.copy(v);
        }
        private _rightBottom = new Vector3(0, 0, 0);

        /**
         * 最小锚点，父Transform2D中左上角锚定的规范化位置。
         */
        @oav({ tooltip: "父Transform2D中左上角锚定的规范化位置。", componentParam: { step: 0.01, stepScale: 0.01, stepDownup: 0.01 } })
        @serialize
        anchorMin = new Vector3(0.5, 0.5, 0.5);

        /**
         * 最大锚点，父Transform2D中左上角锚定的规范化位置。
         */
        @oav({ tooltip: "最大锚点，父Transform2D中左上角锚定的规范化位置。", componentParam: { step: 0.01, stepScale: 0.01, stepDownup: 0.01 } })
        @serialize
        anchorMax = new Vector3(0.5, 0.5, 0.5);

        /**
         * The normalized position in this RectTransform that it rotates around.
         */
        @oav({ tooltip: "中心点" })
        @serialize
        pivot = new Vector3(0.5, 0.5, 0.5);

        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
        {
            // renderAtomic.uniforms.u_rect = this.rect;
        }

        private _updateLayout()
        {
            if (!this._layoutInvalid) return;

            var transformLayout = this.node3d?.parent?.getComponent(TransformLayout);
            if (!transformLayout) return;

            // 中心点基于anchorMin的坐标
            var position = this._position;
            // 尺寸
            var size = this._size;
            var leftTop = this._leftTop;
            var rightBottom = this._rightBottom;

            // 最小锚点
            var anchorMin = this.anchorMin.clone();
            // 最大锚点
            var anchorMax = this.anchorMax.clone();
            var pivot = this.pivot.clone();

            // 父对象显示区域宽高
            var parentSize = transformLayout.size;
            var parentPivot = transformLayout.pivot;
            // 锚点在父Transform2D中锚定的 leftRightTopBottom 位置。
            var anchorLeftTop = new Vector3(
                anchorMin.x * parentSize.x - parentPivot.x * parentSize.x,
                anchorMin.y * parentSize.y - parentPivot.y * parentSize.y,
                anchorMin.z * parentSize.z - parentPivot.z * parentSize.z,
            );
            var anchorRightBottom = new Vector3(
                anchorMax.x * parentSize.x - parentPivot.x * parentSize.x,
                anchorMax.y * parentSize.y - parentPivot.y * parentSize.y,
                anchorMax.z * parentSize.z - parentPivot.z * parentSize.z,
            );

            if (anchorMin.x == anchorMax.x)
            {
                leftTop.x = (-pivot.x * size.x + position.x) - anchorLeftTop.x;
                rightBottom.x = anchorRightBottom.x - (size.x - pivot.x * size.x + position.x);
            } else 
            {
                size.x = (anchorRightBottom.x - rightBottom.x) - (anchorLeftTop.x + leftTop.x);
                position.x = leftTop.x + pivot.x * size.x;
            }

            if (anchorMin.y == anchorMax.y)
            {
                leftTop.y = (-pivot.y * size.y + position.y) - anchorLeftTop.y;
                rightBottom.y = anchorRightBottom.y - (size.y - pivot.y * size.y + position.y);
            } else 
            {
                size.y = (anchorRightBottom.y - rightBottom.y) - (anchorLeftTop.y + leftTop.y);
                position.y = leftTop.y + pivot.y * size.y;
            }

            if (anchorMin.z == anchorMax.z)
            {
                leftTop.z = (-pivot.z * size.z + position.z) - anchorLeftTop.z;
                rightBottom.z = anchorRightBottom.z - (size.z - pivot.z * size.z + position.z);
            } else
            {
                size.z = (anchorRightBottom.z - rightBottom.z) - (anchorLeftTop.z + leftTop.z);
                position.z = leftTop.z + pivot.z * size.z;
            }

            //
            this.node3d.x = anchorLeftTop.x + position.x;
            this.node3d.y = anchorLeftTop.y + position.y;
            this.node3d.z = anchorLeftTop.z + position.z;
            //
            this._layoutInvalid = false;
            ticker.offframe(this._updateLayout, this);
        }

        /**
         * 布局是否失效
         */
        private _layoutInvalid = true;

        private _invalidateLayout()
        {
            this._layoutInvalid = true;
            ticker.onframe(this._updateLayout, this);
        }

        private _invalidateSize()
        {
            this._invalidateLayout();
            this.emit("sizeChanged", this);
        }

        private _invalidatePivot()
        {
            this._invalidateLayout();
            this.emit("pivotChanged", this);
        }
    }
}