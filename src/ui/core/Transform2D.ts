namespace feng3d
{
    export interface ComponentMap { Transform2D: feng2d.Transform2D; }
}

namespace feng2d
{
    /**
     * 2D变换
     * 
     * 提供了比Transform更加适用于2D元素的API
     * 
     * 通过修改Transform的数值实现
     */
    @feng3d.AddComponentMenu("Layout/Transform2D")
    @feng3d.RegisterComponent()
    export class Transform2D extends feng3d.Component
    {
        get single() { return true; }

        transformLayout: feng3d.TransformLayout;

        /**
         * 描述了2D对象在未经过变换前的位置与尺寸
         */
        get rect()
        {
            var transformLayout = this.transformLayout;
            this._rect.init(-transformLayout.pivot.x * transformLayout.size.x, -transformLayout.pivot.y * transformLayout.size.y, transformLayout.size.x, transformLayout.size.y);
            return this._rect;
        }
        private _rect = new feng3d.Vector4(0, 0, 100, 100);

        /**
         * 位移
         */
        @feng3d.oav({ tooltip: "当anchorMin.x == anchorMax.x时对position.x赋值生效，当 anchorMin.y == anchorMax.y 时对position.y赋值生效，否则赋值无效，自动被覆盖。", componentParam: { step: 1, stepScale: 1, stepDownup: 1 } })
        @feng3d.serialize
        get position() { return this._position; }
        set position(v) { this._position.copy(v); }
        private readonly _position = new feng3d.Vector2();

        /**
         * 尺寸，宽高。
         */
        @feng3d.oav({ tooltip: "宽度，不会影响到缩放值。当 anchorMin.x == anchorMax.x 时对 size.x 赋值生效，当anchorMin.y == anchorMax.y时对 size.y 赋值生效，否则赋值无效，自动被覆盖。", componentParam: { step: 1, stepScale: 1, stepDownup: 1 } })
        @feng3d.serialize
        get size() { return this._size; }
        set size(v) { this._size.copy(v); }
        private _size = new feng3d.Vector2(1, 1);

        /**
         * 与最小最大锚点形成的边框的left、right、top、bottom距离。当 anchorMin.x != anchorMax.x 时对 layout.x layout.y 赋值生效，当 anchorMin.y != anchorMax.y 时对 layout.z layout.w 赋值生效，否则赋值无效，自动被覆盖。
         */
        @feng3d.oav({ tooltip: "与最小最大锚点形成的边框的left、right、top、bottom距离。当 anchorMin.x != anchorMax.x 时对 layout.x layout.y 赋值生效，当 anchorMin.y != anchorMax.y 时对 layout.z layout.w 赋值生效，否则赋值无效，自动被覆盖。", componentParam: { step: 1, stepScale: 1, stepDownup: 1 } })
        @feng3d.serialize
        get layout() { return this._layout; }
        set layout(v) { this._layout.copy(v); }
        private _layout = new feng3d.Vector4();

        /**
         * 最小锚点，父Transform2D中左上角锚定的规范化位置。
         */
        @feng3d.oav({ tooltip: "父Transform2D中左上角锚定的规范化位置。", componentParam: { step: 0.01, stepScale: 0.01, stepDownup: 0.01 } })
        @feng3d.serialize
        get anchorMin() { return this._anchorMin; }
        set anchorMin(v) { this._anchorMin.copy(v); }
        private _anchorMin = new feng3d.Vector2(0.5, 0.5);

        /**
         * 最大锚点，父Transform2D中左上角锚定的规范化位置。
         */
        @feng3d.oav({ tooltip: "最大锚点，父Transform2D中左上角锚定的规范化位置。", componentParam: { step: 0.01, stepScale: 0.01, stepDownup: 0.01 } })
        @feng3d.serialize
        get anchorMax() { return this._anchorMax; }
        set anchorMax(v) { this._anchorMax.copy(v); }
        private _anchorMax = new feng3d.Vector2(0.5, 0.5);

        /**
         * The normalized position in this RectTransform that it rotates around.
         */
        @feng3d.oav({ tooltip: "中心点" })
        @feng3d.serialize
        get pivot() { return this._pivot; }
        set pivot(v) { this._pivot.copy(v); }
        private _pivot = new feng3d.Vector2(0.5, 0.5);

        /**
         * 旋转
         */
        @feng3d.oav({ tooltip: "旋转", componentParam: { step: 0.01, stepScale: 30, stepDownup: 50 } })
        get rotation() { return this._rotation; }
        set rotation(v) { this._rotation = v; }
        private _rotation = 0;

        /**
         * 缩放
         */
        @feng3d.oav({ tooltip: "缩放", componentParam: { step: 0.01, stepScale: 1, stepDownup: 1 } })
        get scale() { return this._scale; }
        set scale(v) { this._scale.copy(v); }
        private readonly _scale = new feng3d.Vector2(1, 1);

		/**
		 * 创建一个实体，该类为虚类
		 */
        constructor()
        {
            super();

            feng3d.watcher.watch(<Transform2D>this, "transformLayout", this._onTransformLayoutChanged, this);
        }

        init()
        {
            super.init();

            // 处理依赖组件
            var transformLayout = this.getComponent("TransformLayout");
            if (!transformLayout)
            {
                transformLayout = this.gameObject.addComponent("TransformLayout");
            }
            this.transformLayout = transformLayout;

            feng3d.watcher.bind(this.transform.rotation, "z", <Transform2D>this, "rotation");
            feng3d.watcher.bind(this.transform.scale, "x", this.scale, "x");
            feng3d.watcher.bind(this.transform.scale, "y", this.scale, "y");

            this.on("addComponent", this._onAddComponent, this);
            this.on("removeComponent", this._onRemovedComponent, this);
        }

        private _onAddComponent(event: feng3d.Event<{ gameobject: feng3d.GameObject; component: feng3d.Component; }>)
        {
            if (event.data.gameobject != this.gameObject) return;
            var component = event.data.component;
            if (component instanceof feng3d.TransformLayout)
            {
                component.hideFlags = component.hideFlags | feng3d.HideFlags.HideInInspector;
                this.transformLayout = component;
            }
        }

        private _onRemovedComponent(event: feng3d.Event<{ gameobject: feng3d.GameObject; component: feng3d.Component; }>)
        {
            if (event.data.gameobject != this.gameObject) return;
            var component = event.data.component;
            if (component instanceof feng3d.TransformLayout)
            {
                this.transformLayout = null;
            }
        }

        private _onTransformLayoutChanged(newValue: feng3d.TransformLayout, oldValue: feng3d.TransformLayout, object: Transform2D, property: string)
        {
            var watcher = feng3d.watcher;
            if (oldValue)
            {
                watcher.unbind(oldValue.position, "x", this.position, "x");
                watcher.unbind(oldValue.position, "y", this.position, "y");
                watcher.unbind(oldValue.anchorMin, "x", this.anchorMin, "x");
                watcher.unbind(oldValue.anchorMin, "y", this.anchorMin, "y");
                watcher.unbind(oldValue.anchorMax, "x", this.anchorMax, "x");
                watcher.unbind(oldValue.anchorMax, "y", this.anchorMax, "y");
                //
                watcher.unbind(oldValue.leftTop, "x", this.layout, "x");
                watcher.unbind(oldValue.rightBottom, "x", this.layout, "y");
                watcher.unbind(oldValue.leftTop, "y", this.layout, "z");
                watcher.unbind(oldValue.rightBottom, "y", this.layout, "w");
                //
                watcher.unbind(oldValue.size, "x", this.size, "x");
                watcher.unbind(oldValue.size, "y", this.size, "y");
                watcher.unbind(oldValue.pivot, "x", this.pivot, "x");
                watcher.unbind(oldValue.pivot, "y", this.pivot, "y");
            }
            var newValue: feng3d.TransformLayout = object[property];
            if (newValue)
            {
                watcher.bind(newValue.position, "x", this.position, "x");
                watcher.bind(newValue.position, "y", this.position, "y");
                watcher.bind(newValue.anchorMin, "x", this.anchorMin, "x");
                watcher.bind(newValue.anchorMin, "y", this.anchorMin, "y");
                watcher.bind(newValue.anchorMax, "x", this.anchorMax, "x");
                watcher.bind(newValue.anchorMax, "y", this.anchorMax, "y");
                //
                watcher.bind(newValue.leftTop, "x", this.layout, "x");
                watcher.bind(newValue.rightBottom, "x", this.layout, "y");
                watcher.bind(newValue.leftTop, "y", this.layout, "z");
                watcher.bind(newValue.rightBottom, "y", this.layout, "w");
                //
                watcher.bind(newValue.size, "x", this.size, "x");
                watcher.bind(newValue.size, "y", this.size, "y");
                watcher.bind(newValue.pivot, "x", this.pivot, "x");
                watcher.bind(newValue.pivot, "y", this.pivot, "y");
            }
        }

        beforeRender(renderAtomic: feng3d.RenderAtomic, scene: feng3d.Scene, camera: feng3d.Camera)
        {
            renderAtomic.uniforms.u_rect = this.rect;
        }
    }
}

namespace feng3d
{

    export interface GameObject
    {
        /**
         * 游戏对象上的2D变换。
         */
        transform2D: feng2d.Transform2D;
    }

    Object.defineProperty(GameObject.prototype, "transform2D",
        {
            get: function () { return this.getComponent("Transform2D"); },
        });

    export interface Component
    {
        /**
         * 游戏对象上的2D变换。
         */
        transform2D: feng2d.Transform2D;
    }

    Object.defineProperty(Component.prototype, "transform2D",
        {
            get: function () { return this._gameObject && this._gameObject.transform2D; },
        });
}