import { EventEmitter } from '../event/EventEmitter';
import { IEvent } from '../event/IEvent';

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
