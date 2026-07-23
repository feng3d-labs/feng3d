import { logic } from '@feng3d/reactivity';
import { EventEmitter, IEvent } from '@feng3d/event';
import { Ray3, Rectangle } from '@feng3d/math';
import { Lazy, lazy } from '@feng3d/polyfill';
import { windowEventProxy } from '@feng3d/shortcut';
import { watcher } from '@feng3d/watcher';
import { raycaster } from '../pick/Raycaster';
import type { Scene } from '../scene/Scene';
import { Object3D } from './Object3D';

/**
 * 鼠标事件管理
 */
export class Mouse3DManager
{
    mouseInput: MouseInput;

    /** 点击拾取回调（纯数据 Object3D 无 emit，通过回调通知点击） */
    pickClick: (object3D: Object3D) => void = null;

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
     * @param mouseRay3D 鼠标射线（由调用方用 camera.getRay3D 算出）
     * @param scene 场景
     */
    pick(mouseRay3D: Ray3, scene: Scene)
    {
        if (this._mouseEventTypes.length === 0) return;
        // 计算得到鼠标射线相交的物体
        const pickingCollisionVO = raycaster.pick(mouseRay3D, logic(scene).mouseCheckObjects);

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
            const bound = lazy.getvalue(this.viewport);
            if (!bound.contains(windowEventProxy.clientX, windowEventProxy.clientY))
            { return; }
        }

        if (this._mouseEventTypes.indexOf(type) === -1)
        { this._mouseEventTypes.push(type); }
    }

    /**
     * 监听鼠标事件收集事件类型
     */
    private onMouseEvent(event: IEvent<unknown>)
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
            // TODO: events removed from pure data Object3D
            // if (this._selectedObject3D)
            // { this._selectedObject3D.emit('mouseout', null, true); }
            // if (value)
            // { value.emit('mouseover', null, true); }
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
                    // TODO: events removed from pure data Object3D
                    // this._selectedObject3D && this._selectedObject3D.emit(element, null, true);
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
                    // TODO: events removed from pure data Object3D
                    // this._selectedObject3D && this._selectedObject3D.emit(element, null, true);
                    break;
                case 'mousemove':
                    // TODO: events removed from pure data Object3D
                    // this._selectedObject3D && this._selectedObject3D.emit(element, null, true);
                    break;
                case 'click':
                    if (this.object3DClickNum > 0)
                    {
                        if (this._selectedObject3D && this.pickClick)
                        {
                            this.pickClick(this._selectedObject3D);
                        }
                    }
                    break;
                case 'dblclick':
                    if (this.object3DClickNum > 1)
                    {
                        // TODO: events removed from pure data Object3D
                        // this._selectedObject3D && this._selectedObject3D.emit(element, null, true);
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

        this.emit(type as keyof MouseEventMap, { mouseX: mouseEvent.clientX, mouseY: mouseEvent.clientY });
    }
}

/**
 * 鼠标事件数据。
 */
export interface MouseEventData
{
    /** 鼠标 X 坐标 */
    mouseX: number;
    /** 鼠标 Y 坐标 */
    mouseY: number;
}

export interface MouseEventMap
{
    /**
     * 鼠标移出对象
     */
    mouseout: MouseEventData
    /**
     * 鼠标移入对象
     */
    mouseover: MouseEventData
    /**
     * 鼠标在对象上移动
     */
    mousemove: MouseEventData
    /**
     * 鼠标左键按下
     */
    mousedown: MouseEventData
    /**
     * 鼠标左键弹起
     */
    mouseup: MouseEventData
    /**
     * 单击
     */
    click: MouseEventData
    /**
     * 鼠标中键按下
     */
    middlemousedown: MouseEventData
    /**
     * 鼠标中键弹起
     */
    middlemouseup: MouseEventData
    /**
     * 鼠标中键单击
     */
    middleclick: MouseEventData
    /**
     * 鼠标右键按下
     */
    rightmousedown: MouseEventData
    /**
     * 鼠标右键弹起
     */
    rightmouseup: MouseEventData
    /**
     * 鼠标右键单击
     */
    rightclick: MouseEventData
    /**
     * 鼠标双击
     */
    dblclick: MouseEventData
}
