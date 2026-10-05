import { EventEmitter } from '@feng3d/event';
import { Color4 } from '@feng3d/math';
import { serialization } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';

/**
 * 文本上渐变方向。
 */
export enum TEXT_GRADIENT
{
    /**
     * 纵向梯度。
     */
    LINEAR_VERTICAL = 0,
    /**
     * 横向梯度。
     */
    LINEAR_HORIZONTAL = 1,
}

/**
 * 通用字体。
 */
export enum FontFamily
{
    'Arial' = 'Arial',
    'serif' = 'serif',
    'sans-serif' = 'sans-serif',
    'monospace' = 'monospace',
    'cursive' = 'cursive',
    'fantasy' = 'fantasy',
    'system-ui' = 'system-ui',
    '宋体' = '宋体',
}

/**
 * 字体样式。
 */
export enum FontStyle
{
    'normal' = 'normal',
    'italic' = 'italic',
    'oblique' = 'oblique',
}

/**
 * 字体变体。
 */
export enum FontVariant
{
    'normal' = 'normal',
    'small-caps' = 'small-caps',
}

export enum FontWeight
{
    'normal' = 'normal',
    'bold' = 'bold',
    'bolder' = 'bolder',
    'lighter' = 'lighter',
    // '100' = '100',
    // '200' = '200',
    // '300' = '300',
    // '400' = '400',
    // '500' = '500',
    // '600' = '600',
    // '700' = '700',
    // '800' = '800',
    // '900' = '900',
}

/**
 * 设置创建的角的类型，它可以解决带尖刺的文本问题。
 */
export enum CanvasLineJoin
{
    'round' = 'round',
    'bevel' = 'bevel',
    'miter' = 'miter',
}

/**
 * 画布文本基线
 */
export enum CanvasTextBaseline
{
    'top' = 'top',
    'hanging' = 'hanging',
    'middle' = 'middle',
    'alphabetic' = 'alphabetic',
    'ideographic' = 'ideographic',
    'bottom' = 'bottom',
}

/**
 * 文本对齐方式
 */
export enum TextAlign
{
    'left' = 'left',
    'center' = 'center',
    'right' = 'right',
}

export enum WhiteSpaceHandle
{
    'normal' = 'normal',
    'pre' = 'pre',
    'pre-line' = 'pre-line',
}

export interface TextStyleEventMap
{
    /**
     * 发生变化
     */
    changed
}

/**
 * 文本样式
 *
 * 从pixi.js移植
 *
 * @see https://github.com/pixijs/pixi.js/blob/dev/packages/text/src/TextStyle.js
 */
export class TextStyle<T extends TextStyleEventMap = TextStyleEventMap> extends EventEmitter<T>
{
    /**
     * @param style 样式参数
     */
    constructor(style?: Partial<TextStyle>)
    {
        super();
        serialization.setValue(this, style);
        //
        watcher.watch(this as TextStyle, 'fontFamily', this.invalidate, this);
        watcher.watch(this as TextStyle, 'fontSize', this.invalidate, this);
        watcher.watch(this as TextStyle, 'fontStyle', this.invalidate, this);
        watcher.watch(this as TextStyle, 'fontVariant', this.invalidate, this);
        watcher.watch(this as TextStyle, 'fontWeight', this.invalidate, this);
        watcher.watch(this as TextStyle, 'fill', this.invalidate, this);
        watcher.watch(this as TextStyle, 'fillGradientType', this.invalidate, this);
        watcher.watch(this as TextStyle, 'fillGradientStops', this.invalidate, this);
        watcher.watch(this as TextStyle, 'stroke', this.invalidate, this);
        watcher.watch(this as TextStyle, 'strokeThickness', this.invalidate, this);
        watcher.watch(this as TextStyle, 'lineJoin', this.invalidate, this);
        watcher.watch(this as TextStyle, 'miterLimit', this.invalidate, this);
        watcher.watch(this as TextStyle, 'letterSpacing', this.invalidate, this);
        watcher.watch(this as TextStyle, 'textBaseline', this.invalidate, this);
        watcher.watch(this as TextStyle, 'dropShadow', this.invalidate, this);
        watcher.watch(this as TextStyle, 'dropShadowColor', this.invalidate, this);
        watcher.watch(this as TextStyle, 'dropShadowAngle', this.invalidate, this);
        watcher.watch(this as TextStyle, 'dropShadowBlur', this.invalidate, this);
        watcher.watch(this as TextStyle, 'dropShadowDistance', this.invalidate, this);
        watcher.watch(this as TextStyle, 'wordWrap', this.invalidate, this);
        watcher.watch(this as TextStyle, 'breakWords', this.invalidate, this);
        watcher.watch(this as TextStyle, 'align', this.invalidate, this);
        watcher.watch(this as TextStyle, 'whiteSpace', this.invalidate, this);
        watcher.watch(this as TextStyle, 'wordWrapWidth', this.invalidate, this);
        watcher.watch(this as TextStyle, 'lineHeight', this.invalidate, this);
        watcher.watch(this as TextStyle, 'leading', this.invalidate, this);
        watcher.watch(this as TextStyle, 'padding', this.invalidate, this);
        watcher.watch(this as TextStyle, 'trim', this.invalidate, this);
    }

    /**
     * 字体。
     */
    fontFamily = FontFamily.Arial;

    /**
     * 字体尺寸。
     */
    fontSize = 26;

    /**
     * 字体样式。
     */
    fontStyle = FontStyle.normal;

    /**
     * 字体变体。
     */
    fontVariant = FontVariant.normal;

    /**
     * 字型粗细。
     */
    fontWeight = FontWeight.normal;

    /**
     * 用于填充文本的颜色。
     * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle
     */
    fill: Color4 = { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 };
    // fill = new MinMaxGradient();

    /**
     * 如果填充是一个创建渐变的颜色数组，这可以改变渐变的方向。
     */
    fillGradientType = TEXT_GRADIENT.LINEAR_VERTICAL;

    /**
     * 如果填充是一个颜色数组来创建渐变，这个数组可以设置停止点
     */
    fillGradientStops: number[] = [];

    /**
     * 将用于文本笔划的画布填充样式。
     */
    stroke: Color4 = { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 };

    /**
     * 一个表示笔画厚度的数字。
     */
    strokeThickness = 0;

    /**
     * lineJoin属性设置创建的角的类型，它可以解决带尖刺的文本问题。
     */
    lineJoin = CanvasLineJoin.miter;

    /**
     * 当使用“miter”lineJoin模式时，miter限制使用。这可以减少或增加呈现文本的尖锐性。
     */
    miterLimit = 10;

    /**
     * 字母之间的间距，默认为0
     */
    letterSpacing = 0;

    /**
     * 呈现文本的基线。
     */
    textBaseline = CanvasTextBaseline.alphabetic;

    /**
     * 是否为文本设置一个投影。
     */
    dropShadow = false;

    /**
     * 投影颜色。
     */
    dropShadowColor: Color4 = { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 };

    /**
     * 投影角度。
     */
    dropShadowAngle = 30;

    /**
     * 阴影模糊半径。
     */
    dropShadowBlur = 0;

    /**
     * 投影距离。
     */
    dropShadowDistance = 5;

    /**
     * 是否应使用自动换行。
     */
    wordWrap = false;

    /**
     * 能否把单词分多行。
     */
    breakWords = false;

    /**
     * 多行文本对齐方式。
     */
    align = TextAlign.left;

    /**
     * 如何处理换行与空格。
     * Default is 'pre' (preserve, preserve).
     *
     *  value       | New lines     |   Spaces
     *  ---         | ---           |   ---
     * 'normal'     | Collapse      |   Collapse
     * 'pre'        | Preserve      |   Preserve
     * 'pre-line'   | Preserve      |   Collapse
     */
    whiteSpace = WhiteSpaceHandle.pre;

    /**
     * 文本的换行宽度。
     */
    wordWrapWidth = 100;

    /**
     * 行高。
     */
    lineHeight = 0;

    /**
     * 行距。
     */
    leading = 0;

    /**
     * 内边距，用于文字被裁减问题。
     */
    padding = 0;

    /**
     * 是否修剪透明边界。
     */
    trim = false;

    /**
     * 使数据失效
     */
    invalidate()
    {
        this.emit('changed');
    }

    /**
     *
     * 生成用于' TextMetrics.measureFont() '的字体样式字符串。
     */
    toFontString()
    {
        const fontSizeString = `${this.fontSize}px`;

        // 通过引用每个字体名来清除fontFamily属性
        // 这将支持带有空格的字体名称
        // fontFamily 运行期可为 string 或 string[]；统一归一化为数组
        const rawFontFamily = this.fontFamily as string | string[];
        const fontFamilies: string[] = Array.isArray(rawFontFamily)
            ? rawFontFamily
            : rawFontFamily.split(',');

        for (let i = fontFamilies.length - 1; i >= 0; i--)
        {
            // 修剪任何多余的空白
            let fontFamily = fontFamilies[i].trim();

            // 检查字体是否已经包含字符串
            if (!(/([\"\'])[^\'\"]+\1/).test(fontFamily) && FontFamily[fontFamily] === undefined)
            {
                fontFamily = `"${fontFamily}"`;
            }
            fontFamilies[i] = fontFamily;
        }

        return `${this.fontStyle} ${this.fontVariant} ${this.fontWeight} ${fontSizeString} ${fontFamilies.join(',')}`;
    }
}
