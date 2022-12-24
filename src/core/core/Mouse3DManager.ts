import { EventEmitter } from '../../event/EventEmitter';
import { IEvent } from '../../event/IEvent';
import { Rectangle } from '../../math/geom/Rectangle';
import { Lazy, lazy } from '../../polyfill/Types';
import { windowEventProxy } from '../../shortcut/WindowEventProxy';
import { watcher } from '../../watcher/watcher';
import { Camera } from '../cameras/Camera';
import { rayCast } from '../pick/Raycaster';
import { Scene } from '../scene/Scene';
import { Object3D } from './Object3D';
import { View } from './View';

/**
 * 鼠标事件管理
 */
export class Mouse3DManager
{
    mouseInput: MouseInput;

    get selectedObject3D()
    {
        return this._selectedObject3D;
    }
    set selectedObject3D(v)
    {
        this.setSelectedObject3D(v);
    }

    /**
     * 视窗，鼠标在该矩形内时为有效事件
     */
    viewport: Lazy<Rectangle>;

    /**
     * 拾取
     * @param scene 场景
     * @param _camera 摄像机
     */
    pick(view: View, scene: Scene, _camera: Camera)
    {
        if (this._mouseEventTypes.length === 0) return;
        // 计算得到鼠标射线相交的物体
        const pickingCollisionVO = rayCast(view.mouseRay3D, scene.mouseCheckObjects);

        const object3D = pickingCollisionVO && pickingCollisionVO.object3D;

        return object3D;
    }

    constructor(mouseInput: MouseInput, viewport?: Lazy<Rectangle>)
    {
        watcher.watch(this as Mouse3DManager, 'mouseInput', this._mouseInputChanged, this);
        //
        this.mouseInput = mouseInput;
        this.viewport = viewport;
    }

    private _selectedObject3D: Object3D;
    private _mouseEventTypes: string[] = [];

    /**
     * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
     */
    private preMouseDownObject3D: Object3D | null;
    /**
     * 统计处理click次数，判断是否达到dblclick
     */
    private object3DClickNum: number;

    private _mouseInputChanged(newValue: MouseInput, oldValue: MouseInput)
    {
        if (oldValue)
        {
            mouseEventTypes.forEach((element) =>
            {
                oldValue.off(element, this.onMouseEvent, this);
            });
        }
        if (newValue)
        {
            mouseEventTypes.forEach((element) =>
            {
                newValue.on(element, this.onMouseEvent, this);
            });
        }
    }

    private dispatch(type)
    {
        if (this.viewport)
        {
            const bound = lazy.getValue(this.viewport);
            if (!bound.contains(windowEventProxy.clientX, windowEventProxy.clientY))
            { return; }
        }

        if (this._mouseEventTypes.indexOf(type) === -1)
        { this._mouseEventTypes.push(type); }
    }

    /**
     * 监听鼠标事件收集事件类型
     */
    private onMouseEvent(event: IEvent<any>)
    {
        this.dispatch(event.type);
    }

    /**
     * 设置选中对象
     */
    private setSelectedObject3D(value: Object3D)
    {
        if (this._selectedObject3D !== value)
        {
            if (this._selectedObject3D)
            { this._selectedObject3D.emit('mouseout', null, true); }
            if (value)
            { value.emit('mouseover', null, true); }
        }
        this._selectedObject3D = value;
        this._mouseEventTypes.forEach((element) =>
        {
            switch (element)
            {
                case 'mousedown':
                    if (this.preMouseDownObject3D !== this._selectedObject3D)
                    {
                        this.object3DClickNum = 0;
                        this.preMouseDownObject3D = this._selectedObject3D;
                    }
                    this._selectedObject3D && this._selectedObject3D.emit(element, null, true);
                    break;
                case 'mouseup':
                    if (this._selectedObject3D === this.preMouseDownObject3D)
                    {
                        this.object3DClickNum++;
                    }
                    else
                    {
                        this.object3DClickNum = 0;
                        this.preMouseDownObject3D = null;
                    }
                    this._selectedObject3D && this._selectedObject3D.emit(element, null, true);
                    break;
                case 'mousemove':
                    this._selectedObject3D && this._selectedObject3D.emit(element, null, true);
                    break;
                case 'click':
                    if (this.object3DClickNum > 0)
                    { this._selectedObject3D && this._selectedObject3D.emit(element, null, true); }
                    break;
                case 'dblclick':
                    if (this.object3DClickNum > 1)
                    {
                        this._selectedObject3D && this._selectedObject3D.emit(element, null, true);
                        this.object3DClickNum = 0;
                    }
                    break;
            }
        });
        this._mouseEventTypes.length = 0;
    }
}

/**
 * 鼠标事件输入
 */
export class MouseInput<T = MouseEventMap> extends EventEmitter<T>
{
    /**
     * 是否启动
     */
    enable = true;

    /**
     * 是否捕获鼠标移动
     */
    catchMouseMove = false;

    /**
     * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
     * @param type                      事件的类型。类型区分大小写。
     * @param data                      事件携带的自定义数据。
     * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
     */
    emit<K extends keyof T & string>(type: K, data?: T[K], bubbles = false)
    {
        if (!this.enable)
        {
            return null;
        }
        if (!this.catchMouseMove && type === 'mousemove')
        {
            return null;
        }

        return super.emit(type, data, bubbles);
    }

    /**
     * 派发事件
     * @param event   事件对象
     */
    emitEvent<K extends keyof T & string>(event: IEvent<T[K]>)
    {
        if (!this.enable)
        {
            return event;
        }
        if (!this.catchMouseMove && event.type === 'mousemove')
        {
            return event;
        }

        return super.emitEvent(event);
    }
}

/**
 * 鼠标事件列表
 */
const mouseEventTypes: (keyof MouseEventMap)[]
    = [
        'mouseout',
        'mouseover',
        'mousemove',
        'mousedown',
        'mouseup',
        'click',
        'middlemousedown',
        'middlemouseup',
        'middleclick',
        'rightmousedown',
        'rightmouseup',
        'rightclick',
        'dblclick',
    ];

/**
 * Window鼠标事件输入
 */
export class WindowMouseInput extends MouseInput
{
    constructor()
    {
        super();
        windowEventProxy.on('click', this.onMouseEvent, this);
        windowEventProxy.on('dblclick', this.onMouseEvent, this);
        windowEventProxy.on('mousedown', this.onMouseEvent, this);
        windowEventProxy.on('mouseup', this.onMouseEvent, this);
        windowEventProxy.on('mousemove', this.onMouseEvent, this);
    }

    /**
     * 监听鼠标事件收集事件类型
     */
    private onMouseEvent(event: IEvent<MouseEvent>)
    {
        const mouseEvent = event.data;
        let type = mouseEvent.type;
        // 处理鼠标中键与右键
        if (mouseEvent instanceof MouseEvent)
        {
            if (['click', 'mousedown', 'mouseup'].indexOf(mouseEvent.type) !== -1)
            {
                type = ['', 'middle', 'right'][mouseEvent.button] + mouseEvent.type;
            }
        }

        this.emit(<any>type, { mouseX: mouseEvent.clientX, mouseY: mouseEvent.clientY });
    }
}

export interface MouseEventMap
{
    /**
     * 鼠标移出对象
     */
    mouseout: { clientX: number, clientY: number }
    /**
     * 鼠标移入对象
     */
    mouseover: { clientX: number, clientY: number }
    /**
     * 鼠标在对象上移动
     */
    mousemove: { clientX: number, clientY: number }
    /**
     * 鼠标左键按下
     */
    mousedown: { clientX: number, clientY: number }
    /**
     * 鼠标左键弹起
     */
    mouseup: { clientX: number, clientY: number }
    /**
     * 单击
     */
    click: { clientX: number, clientY: number }
    /**
     * 鼠标中键按下
     */
    middlemousedown: { clientX: number, clientY: number }
    /**
     * 鼠标中键弹起
     */
    middlemouseup: { clientX: number, clientY: number }
    /**
     * 鼠标中键单击
     */
    middleclick: { clientX: number, clientY: number }
    /**
     * 鼠标右键按下
     */
    rightmousedown: { clientX: number, clientY: number }
    /**
     * 鼠标右键弹起
     */
    rightmouseup: { clientX: number, clientY: number }
    /**
     * 鼠标右键单击
     */
    rightclick: { clientX: number, clientY: number }
    /**
     * 鼠标双击
     */
    dblclick: { clientX: number, clientY: number }
}
