import { Camera } from "../../core/cameras/Camera";
import { Component, RegisterComponent } from "../../ecs/Component";
import { HideFlags } from "../../core/core/HideFlags";
import { Node3D } from "../../core/core/Node3D";
import { TransformLayout } from "../../core/core/TransformLayout";
import { AddComponentMenu } from "../../core/Menu";
import { Scene } from "../../core/scene/Scene";
import { IEvent } from "../../event/IEvent";
import { Vector2 } from "../../math/geom/Vector2";
import { Vector4 } from "../../math/geom/Vector4";
import { oav } from "../../objectview/ObjectView";
import { RenderAtomic } from "../../renderer/data/RenderAtomic";
import { Serializable } from "../../serialization/Serializable";
import { SerializeProperty } from "../../serialization/SerializeProperty";
import { watcher } from "../../watcher/watcher";

declare global
{
    export interface MixinsNode3D
    {
        /**
         * 游戏对象上的2D变换。
         */
        transform2D: Transform2D;
    }

    export interface MixinsComponentMap
    {
        /**
         * 游戏对象上的2D变换。
         */
        transform2D: Transform2D;
    }
}

/**
 * 2D变换
 *
 * 提供了比Transform更加适用于2D元素的API
 *
 * 通过修改Transform的数值实现
 */
@AddComponentMenu('Layout/Transform2D')
@RegisterComponent()
@Serializable()
export class Transform2D extends Component
{
    get single() { return true; }

    transformLayout: TransformLayout;

    /**
     * 描述了2D对象在未经过变换前的位置与尺寸
     */
    get rect()
    {
        const transformLayout = this.transformLayout;
        this._rect.set(-transformLayout.pivot.x * transformLayout.size.x, -transformLayout.pivot.y * transformLayout.size.y, transformLayout.size.x, transformLayout.size.y);

        return this._rect;
    }
    private _rect = new Vector4(0, 0, 100, 100);

    /**
     * 位移
     */
    @oav({ tooltip: '当anchorMin.x == anchorMax.x时对position.x赋值生效，当 anchorMin.y == anchorMax.y 时对position.y赋值生效，否则赋值无效，自动被覆盖。', componentParam: { step: 1, stepScale: 1, stepDownUp: 1 } })
    @SerializeProperty()
    get position() { return this._position; }
    set position(v) { this._position.copy(v); }
    private readonly _position = new Vector2();

    /**
     * 尺寸，宽高。
     */
    @oav({ tooltip: '宽度，不会影响到缩放值。当 anchorMin.x == anchorMax.x 时对 size.x 赋值生效，当anchorMin.y == anchorMax.y时对 size.y 赋值生效，否则赋值无效，自动被覆盖。', componentParam: { step: 1, stepScale: 1, stepDownUp: 1 } })
    @SerializeProperty()
    get size() { return this._size; }
    set size(v) { this._size.copy(v); }
    private _size = new Vector2(1, 1);

    /**
     * 与最小最大锚点形成的边框的left、right、top、bottom距离。当 anchorMin.x != anchorMax.x 时对 layout.x layout.y 赋值生效，当 anchorMin.y != anchorMax.y 时对 layout.z layout.w 赋值生效，否则赋值无效，自动被覆盖。
     */
    @oav({ tooltip: '与最小最大锚点形成的边框的left、right、top、bottom距离。当 anchorMin.x != anchorMax.x 时对 layout.x layout.y 赋值生效，当 anchorMin.y != anchorMax.y 时对 layout.z layout.w 赋值生效，否则赋值无效，自动被覆盖。', componentParam: { step: 1, stepScale: 1, stepDownUp: 1 } })
    @SerializeProperty()
    get layout() { return this._layout; }
    set layout(v) { this._layout.copy(v); }
    private _layout = new Vector4();

    /**
     * 最小锚点，父Transform2D中左上角锚定的规范化位置。
     */
    @oav({ tooltip: '父Transform2D中左上角锚定的规范化位置。', componentParam: { step: 0.01, stepScale: 0.01, stepDownUp: 0.01 } })
    @SerializeProperty()
    get anchorMin() { return this._anchorMin; }
    set anchorMin(v) { this._anchorMin.copy(v); }
    private _anchorMin = new Vector2(0.5, 0.5);

    /**
     * 最大锚点，父Transform2D中左上角锚定的规范化位置。
     */
    @oav({ tooltip: '最大锚点，父Transform2D中左上角锚定的规范化位置。', componentParam: { step: 0.01, stepScale: 0.01, stepDownUp: 0.01 } })
    @SerializeProperty()
    get anchorMax() { return this._anchorMax; }
    set anchorMax(v) { this._anchorMax.copy(v); }
    private _anchorMax = new Vector2(0.5, 0.5);

    /**
     * The normalized position in this RectTransform that it rotates around.
     */
    @oav({ tooltip: '中心点' })
    @SerializeProperty()
    get pivot() { return this._pivot; }
    set pivot(v) { this._pivot.copy(v); }
    private _pivot = new Vector2(0.5, 0.5);

    /**
     * 旋转
     */
    @oav({ tooltip: '旋转', componentParam: { step: 0.01, stepScale: 30, stepDownUp: 50 } })
    get rotation() { return this._rotation; }
    set rotation(v) { this._rotation = v; }
    private _rotation = 0;

    /**
     * 缩放
     */
    @oav({ tooltip: '缩放', componentParam: { step: 0.01, stepScale: 1, stepDownUp: 1 } })
    get scale() { return this._scale; }
    set scale(v) { this._scale.copy(v); }
    private readonly _scale = new Vector2(1, 1);

    /**
     * 创建一个实体，该类为虚类
     */
    constructor()
    {
        super();

        watcher.watch(this as Transform2D, 'transformLayout', this._onTransformLayoutChanged, this);
    }

    init()
    {
        super.init();

        // 处理依赖组件
        let transformLayout = this.getComponent(TransformLayout);
        if (!transformLayout)
        {
            transformLayout = this.object3D.addComponent(TransformLayout);
        }
        this.transformLayout = transformLayout;

        watcher.bind(this.object3D.rotation, 'z', this as Transform2D, 'rotation');
        watcher.bind(this.object3D.scale, 'x', this.scale, 'x');
        watcher.bind(this.object3D.scale, 'y', this.scale, 'y');

        this.on('addComponent', this._onAddComponent, this);
        this.on('removeComponent', this._onRemovedComponent, this);
    }

    private _onAddComponent(event: IEvent<{ entity: Node3D; component: Component; }>)
    {
        if (event.data.entity !== this.object3D) return;
        const component = event.data.component;
        if (component instanceof TransformLayout)
        {
            component.hideFlags = component.hideFlags | HideFlags.HideInInspector;
            this.transformLayout = component;
        }
    }

    private _onRemovedComponent(event: IEvent<{ entity: Node3D; component: Component; }>)
    {
        if (event.data.entity !== this.object3D) return;
        const component = event.data.component;
        if (component instanceof TransformLayout)
        {
            this.transformLayout = null;
        }
    }

    private _onTransformLayoutChanged(newValue: TransformLayout, oldValue: TransformLayout, _object: Transform2D, _property: string)
    {
        if (oldValue)
        {
            watcher.unbind(oldValue.position, 'x', this.position, 'x');
            watcher.unbind(oldValue.position, 'y', this.position, 'y');
            watcher.unbind(oldValue.anchorMin, 'x', this.anchorMin, 'x');
            watcher.unbind(oldValue.anchorMin, 'y', this.anchorMin, 'y');
            watcher.unbind(oldValue.anchorMax, 'x', this.anchorMax, 'x');
            watcher.unbind(oldValue.anchorMax, 'y', this.anchorMax, 'y');
            //
            watcher.unbind(oldValue.leftTop, 'x', this.layout, 'x');
            watcher.unbind(oldValue.rightBottom, 'x', this.layout, 'y');
            watcher.unbind(oldValue.leftTop, 'y', this.layout, 'z');
            watcher.unbind(oldValue.rightBottom, 'y', this.layout, 'w');
            //
            watcher.unbind(oldValue.size, 'x', this.size, 'x');
            watcher.unbind(oldValue.size, 'y', this.size, 'y');
            watcher.unbind(oldValue.pivot, 'x', this.pivot, 'x');
            watcher.unbind(oldValue.pivot, 'y', this.pivot, 'y');
        }
        if (newValue)
        {
            watcher.bind(newValue.position, 'x', this.position, 'x');
            watcher.bind(newValue.position, 'y', this.position, 'y');
            watcher.bind(newValue.anchorMin, 'x', this.anchorMin, 'x');
            watcher.bind(newValue.anchorMin, 'y', this.anchorMin, 'y');
            watcher.bind(newValue.anchorMax, 'x', this.anchorMax, 'x');
            watcher.bind(newValue.anchorMax, 'y', this.anchorMax, 'y');
            //
            watcher.bind(newValue.leftTop, 'x', this.layout, 'x');
            watcher.bind(newValue.rightBottom, 'x', this.layout, 'y');
            watcher.bind(newValue.leftTop, 'y', this.layout, 'z');
            watcher.bind(newValue.rightBottom, 'y', this.layout, 'w');
            //
            watcher.bind(newValue.size, 'x', this.size, 'x');
            watcher.bind(newValue.size, 'y', this.size, 'y');
            watcher.bind(newValue.pivot, 'x', this.pivot, 'x');
            watcher.bind(newValue.pivot, 'y', this.pivot, 'y');
        }
    }

    beforeRender(renderAtomic: RenderAtomic, _scene: Scene, _camera: Camera)
    {
        renderAtomic.uniforms.u_rect = this.rect;
    }
}

Object.defineProperty(Node3D.prototype, 'transform2D', {
    get(this: Node3D) { return this.getComponent(Transform2D); },
});

Object.defineProperty(Component.prototype, 'transform2D', {
    get(this: Component) { return this._object3D && this._object3D.transform2D; },
});
