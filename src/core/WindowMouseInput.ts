import { IEvent } from '../event/IEvent';
import { windowEventProxy } from '../shortcut/WindowEventProxy';
import { MouseInput } from './MouseInput';

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
