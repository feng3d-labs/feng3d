import { EventEmitter } from '../../event/EventEmitter';
import { IEvent } from '../../event/IEvent';
import { MouseEventMap } from './MouseEvent3D';

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
