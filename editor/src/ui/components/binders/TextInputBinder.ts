import { EventEmitter, watcher, ticker } from 'feng3d';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';

declare global
{
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace eui
    {
        export interface Component
        {
            addBinder(...binders: UIBinder[]): void;
            _binders?: UIBinder[];
            $onRemoveFromStage?(): void;
        }
    }
}

// 兼容层：为 eui.Component 添加方法（如果存在）
if (typeof (globalThis as any).eui !== 'undefined' && (globalThis as any).eui.Component) {
    (globalThis as any).eui.Component.prototype['addBinder'] = function (...binders: UIBinder[])
    {
        this._binders = this._binders || [];
        binders.forEach((v) =>
        {
            this._binders.push(v);
        });
    };

    const old$onRemoveFromStage = (globalThis as any).eui.Component.prototype.$onRemoveFromStage;
    (globalThis as any).eui.Component.prototype['$onRemoveFromStage'] = function ()
    {
        if (this._binders)
        {
            this._binders.forEach((v) => v.dispose());
            this._binders.length = 0;
        }
        if (old$onRemoveFromStage) {
            old$onRemoveFromStage.call(this);
        }
    };
}

export interface UIBinder
{
    init(v: Partial<this>): this;
    dispose(): void;
}

export interface TextInputBinderEventMap
{
    valueChanged
}

export class TextInputBinder<T extends TextInputBinderEventMap = TextInputBinderEventMap> extends EventEmitter<T> implements UIBinder
{
    space: any;

    /**
     * 绑定属性名称
     */
    attribute: string;

    textInput: any;

    /**
     * 是否可编辑
     */
    editable = true;

    /**
     * 绑定属性值转换为文本
     */
    toText(v: any)
    {
        return v;
    }

    /**
     * 文本转换为绑定属性值
     */
    toValue(v: any)
    {
        return v;
    }

    init(v: Partial<this>)
    {
        Object.assign(this, v);

        this.initView();
        this.invalidateView();

        return this;
    }

    dispose()
    {
        watcher.unwatch(this.space, this.attribute, this.onValueChanged, this);

        //
        this.textInput.removeEventListener('focusin', this.ontxtfocusin, this);
        this.textInput.removeEventListener('focusout', this.ontxtfocusout, this);
        this.textInput.removeEventListener('change', this.onTextChange, this);
    }

    protected initView()
    {
        //
        if (this.editable)
        {
            this.textInput.addEventListener('focusin', this.ontxtfocusin, this);
            this.textInput.addEventListener('focusout', this.ontxtfocusout, this);
            this.textInput.addEventListener('change', this.onTextChange, this);
        }
        watcher.watch(this.space, this.attribute, this.onValueChanged, this);
        this.textInput.enabled = this.editable;
    }

    protected onValueChanged()
    {
        const objectViewEvent = new ObjectViewEvent();
        objectViewEvent.type = ObjectViewEvent.VALUE_CHANGE;
        objectViewEvent.space = this.space;
        objectViewEvent.attributeName = this.attribute;
        objectViewEvent.attributeValue = this.space[this.attribute];
        this.textInput.dispatchEvent(objectViewEvent);

        this.emit('valueChanged');

        this.invalidateView();
    }

    protected updateView()
    {
        if (!this._textfocusintxt)
        {
            this.textInput.text = this.toText(this.space[this.attribute]);
        }
    }

    protected onTextChange()
    {
        this.space[this.attribute] = this.toValue(this.textInput.text);
    }

    private _textfocusintxt: boolean;
    protected ontxtfocusin()
    {
        this._textfocusintxt = true;
    }

    protected ontxtfocusout()
    {
        this._textfocusintxt = false;
        this.invalidateView();
    }

    protected invalidateView()
    {
        ticker.nextframe(this.updateView, this);
    }
}
