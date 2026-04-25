import { Vector2, windowEventProxy, IEvent } from 'feng3d';
import { MouseOnDisableScroll } from '../tools/MouseOnDisableScroll';
import { TextInputBinder } from './TextInputBinder';

export class NumberTextInputBinder extends TextInputBinder
{
    /**
     * 步长，精度
     */
    step = 0.001;

    /**
     * 按下上下方向键时增加的步长数量
     */
    stepDownup = 10;

    /**
     * 移动一个像素时增加的步长数量
     */
    stepScale = 1;

    /**
     * 最小值
     */
    minValue = NaN;

    /**
     * 最小值
     */
    maxValue = NaN;

    /**
     * 控制器
     */
    controller: any;

    toText(v: number)
    {
        // 消除数字显示为类似 0.0000000001 的问题
        let fractionDigits = 1; while (fractionDigits * this.step < 1) { fractionDigits *= 10; }
        const text = String(Math.round(fractionDigits * (Math.round(v / this.step) * this.step)) / fractionDigits);

        return text;
    }

    toValue(v: string)
    {
        let n = Number(v) || 0;
        let fractionDigits = 1; while (fractionDigits * this.step < 1) { fractionDigits *= 10; }
        n = Math.round(fractionDigits * (Math.round(n / this.step) * this.step)) / fractionDigits;

        return n;
    }

    initView()
    {
        super.initView();
        if (this.editable)
        {
            // windowEventProxy.on("mousedown", this.onMouseDown, this);
            this.controller && this.controller.addEventListener('mousedown', this.onMouseDown, this);
            MouseOnDisableScroll.register(this.controller);
        }
    }

    dispose()
    {
        super.dispose();
        // windowEventProxy.off("mousedown", this.onMouseDown, this);
        this.controller && this.controller.removeEventListener('mousedown', this.onMouseDown, this);
        MouseOnDisableScroll.unRegister(this.controller);
    }

    protected onValueChanged()
    {
        let value = this.space[this.attribute];
        if (!isNaN(this.minValue))
        {
            value = Math.max(this.minValue, value);
        }
        if (!isNaN(this.maxValue))
        {
            value = Math.min(this.maxValue, value);
        }
        this.space[this.attribute] = value;
        super.onValueChanged();
    }

    private mouseDownPosition = new Vector2();
    private mouseDownValue = 0;

    private onMouseDown(_e: any)
    {
        const mousePos = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);

        //
        this.mouseDownPosition = mousePos;
        this.mouseDownValue = this.space[this.attribute];

        //
        windowEventProxy.on('mousemove', this.onStageMouseMove, this);
        windowEventProxy.on('mouseup', this.onStageMouseUp, this);
    }

    private onStageMouseMove()
    {
        this.space[this.attribute] = this.mouseDownValue + ((windowEventProxy.clientX - this.mouseDownPosition.x) + (this.mouseDownPosition.y - windowEventProxy.clientY)) * this.step * this.stepScale;
    }

    private onStageMouseUp()
    {
        windowEventProxy.off('mousemove', this.onStageMouseMove, this);
        windowEventProxy.off('mouseup', this.onStageMouseUp, this);
    }

    protected ontxtfocusin()
    {
        super.ontxtfocusin();
        windowEventProxy.on('keydown', this.onWindowKeyDown, this);
    }

    protected ontxtfocusout()
    {
        super.ontxtfocusout();
        windowEventProxy.off('keydown', this.onWindowKeyDown, this);
    }

    private onWindowKeyDown(event: IEvent<KeyboardEvent>)
    {
        if (event.data.key === 'ArrowUp')
        {
            this.space[this.attribute] += this.step * this.stepDownup;
            // eslint-disable-next-line no-useless-call
            this.textInput.text = this.toText.call(this, this.space[this.attribute]);
        }
        else if (event.data.key === 'ArrowDown')
        {
            this.space[this.attribute] -= this.step * this.stepDownup;
            // eslint-disable-next-line no-useless-call
            this.textInput.text = this.toText.call(this, this.space[this.attribute]);
        }
        this.invalidateView();
    }
}
