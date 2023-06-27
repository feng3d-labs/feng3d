import { EventEmitter, IEvent } from '@feng3d/event';
import { gPartial } from '@feng3d/polyfill';
import { Camera3D } from '../../3d/cameras/Camera3D';
import { TransformLayout3D } from '../../3d/components/TransformLayout3D';
import { Scene3D } from '../../3d/core/Scene3D';
import { HideFlags } from '../../core/HideFlags';
import { Node, NodeEventMap } from '../../core/Node';
import { Component } from '../../ecs/Component';
import { Entity } from '../../ecs/Entity';
import { Vector2 } from '../../math/geom/Vector2';
import { Vector4 } from '../../math/geom/Vector4';
import { oav } from '@feng3d/objectview';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { Serializable } from '@feng3d/serialization';
import { $set } from '@feng3d/serialization';
import { SerializeProperty } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';

/**
 * 2D结点事件映射
 */
export interface Node2DEventMap extends NodeEventMap
{
}

export interface Node2D
{
    readonly emitter: EventEmitter<Node2DEventMap>;

    /**
     * 父对象
     */
    get parent(): Node2D;

    /**
     * 子对象列表
     */
    get children(): Node2D[];
    set children(v: Node2D[]);

    /**
     * 获取指定位置的子对象
     *
     * @param index 子对象位置。
     */
    getChildAt(index: number): Node2D;

    /**
     * 根据名称查找对象
     *
     * @param name 对象名称
     */
    find(name: string): Node2D;
}

declare module '@feng3d/serialization'
{
    interface SerializableMap { Node2D: Node2D }
}

/**
 * 2D结点
 *
 * 用于构建2D场景树结构，处理2D对象的位移旋转缩放等空间数据。
 */
@Serializable('Node2D')
export class Node2D extends Node
{
    get single() { return true; }

    transformLayout: TransformLayout3D;

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

        watcher.watch(this as Node2D, 'transformLayout', this._onTransformLayoutChanged, this);

        // 处理依赖组件
        let transformLayout = this.getComponent('TransformLayout3D');
        if (!transformLayout)
        {
            transformLayout = this.addComponent('TransformLayout3D');
        }
        this.transformLayout = transformLayout;

        watcher.bind(this.scale, 'x', this.scale, 'x');
        watcher.bind(this.scale, 'y', this.scale, 'y');

        this.emitter.on('addComponent', this._onAddComponent, this);
        this.emitter.on('removeComponent', this._onRemovedComponent, this);
    }

    private _onAddComponent(event: IEvent<{ entity: Entity; component: Component; }>)
    {
        const component = event.data.component;
        if (component instanceof TransformLayout3D)
        {
            component.hideFlags = component.hideFlags | HideFlags.HideInInspector;
            this.transformLayout = component;
        }
    }

    private _onRemovedComponent(event: IEvent<{ entity: Entity; component: Component; }>)
    {
        const component = event.data.component;
        if (component instanceof TransformLayout3D)
        {
            this.transformLayout = null;
        }
    }

    private _onTransformLayoutChanged(newValue: TransformLayout3D, oldValue: TransformLayout3D, _object: Node2D, _property: string)
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

    beforeRender(renderAtomic: RenderAtomic, _scene: Scene3D, _camera: Camera3D)
    {
        renderAtomic.uniforms.u_rect = this.rect;
    }

    /**
     * 创建指定类型的游戏对象。
     *
     * @param type 游戏对象类型。
     * @param param 游戏对象参数。
     */
    static createPrimitive<K extends keyof PrimitiveNode2D>(type: K, param?: gPartial<Node2D>)
    {
        const g = new Node2D();
        g.name = type;

        const createHandler = this._registerPrimitives[type];
        if (createHandler) createHandler(g);

        $set(g, param);

        return g;
    }

    /**
     * 注册原始游戏对象，被注册后可以使用 Node2D.registerPrimitive 进行创建。
     *
     * @param type 原始游戏对象类型。
     * @param handler 构建原始游戏对象的函数。
     */
    static registerPrimitive<K extends keyof PrimitiveNode2D>(type: K, handler: (object2D: Node2D) => void)
    {
        if (this._registerPrimitives[type])
        {
            console.warn(`重复注册原始游戏对象 ${type} ！`);
        }
        this._registerPrimitives[type] = handler;
    }
    static _registerPrimitives: { [type: string]: (node2d: Node2D) => void } = {};
}

/**
 * 原始游戏对象，可以通过Object3D.createPrimitive进行创建。
 */
export interface PrimitiveNode2D
{
}
