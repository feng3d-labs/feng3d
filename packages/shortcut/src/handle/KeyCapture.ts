import { IEvent } from '@feng3d/event';
import { KeyBoard } from '../Keyboard';
import { ShortCut } from '../ShortCut';
import { windowEventProxy } from '../WindowEventProxy';
import { KeyState } from './KeyState';

/**
 * 按键捕获
 */
export class KeyCapture
{
    /**
     * 捕获的按键字典
     */
    private _mouseKeyDic = {};

    /**
     * 按键状态
     */
    private _keyState: KeyState;
    private shortcut: ShortCut;

    /**
     * 构建
     * @param stage 舞台
     */
    constructor(shortcut: ShortCut)
    {
        this.shortcut = shortcut;
        this._keyState = shortcut.keyState;
        //
        if (!windowEventProxy)
        {
            return;
        }
        windowEventProxy.on('keydown', this.onKeydown, this);
        windowEventProxy.on('keyup', this.onKeyup, this);

        // 监听鼠标事件
        const mouseEvents = [ //
            'dblclick', //
            'click', //
            'mousedown',
            'mouseup',
            'mousemove',
            'mouseover',
            'mouseout',
        ];

        for (let i = 0; i < mouseEvents.length; i++)
        {
            windowEventProxy.on(mouseEvents[i] as any, this.onMouseOnce, this);
        }
        windowEventProxy.on('wheel', this.onMousewheel, this);
    }

    /**
     * 鼠标事件
     */
    private onMouseOnce(event: IEvent<MouseEvent>): void
    {
        if (!this.shortcut.enable)
        {
            return;
        }
        // IEvent.data 是"emit 时填充"的可选字段，事件能派发到这里就必然带 data（#284 之后各包统一按此处理）
        const data = event.data!;
        const mouseKey: string = event.type;

        this._keyState.pressKey(mouseKey, data);
        this._keyState.releaseKey(mouseKey, data);
    }

    /**
     * 鼠标事件
     */
    private onMousewheel(event: IEvent<WheelEvent>): void
    {
        if (!this.shortcut.enable)
        {
            return;
        }
        // IEvent.data 是"emit 时填充"的可选字段，事件能派发到这里就必然带 data（#284 之后各包统一按此处理）
        const data = event.data!;
        const mouseKey: string = event.type;

        this._keyState.pressKey(mouseKey, data);
        this._keyState.releaseKey(mouseKey, data);
    }

    /**
     * 键盘按下事件
     */
    private onKeydown(event: IEvent<KeyboardEvent>): void
    {
        if (!this.shortcut.enable)
        {
            return;
        }
        // IEvent.data 是"emit 时填充"的可选字段，事件能派发到这里就必然带 data
        const data = event.data!;
        let boardKey: string = KeyBoard.getKey(data.keyCode);

        boardKey = boardKey || data.key;
        if (boardKey)
        {
            boardKey = boardKey.toLocaleLowerCase();
            this._keyState.pressKey(boardKey, data);
        }
        else
        {
            console.error(`无法识别按钮 ${data.key}`);
        }
    }

    /**
     * 键盘弹起事件
     */
    private onKeyup(event: IEvent<KeyboardEvent>): void
    {
        if (!this.shortcut.enable)
        {
            return;
        }
        // IEvent.data 是"emit 时填充"的可选字段，事件能派发到这里就必然带 data
        const data = event.data!;
        let boardKey: string = KeyBoard.getKey(data.keyCode);

        boardKey = boardKey || data.key;
        if (boardKey)
        {
            boardKey = boardKey.toLocaleLowerCase();
            this._keyState.releaseKey(boardKey, data);
        }
        else
        {
            console.error(`无法识别按钮 ${data.key}`);
        }
    }
}
