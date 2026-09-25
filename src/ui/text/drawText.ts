import { mathUtil } from '../../polyfill/MathUtil';
import { TextMetrics } from './TextMetrics';
import { TEXT_GRADIENT, TextStyle } from './TextStyle';

/**
 * 绘制文本
 *
 * @param canvas 画布
 * @param _text 文本
 * @param style 文本样式
 * @param resolution 分辨率
 */
export function drawText(canvas: HTMLCanvasElement, _text: string, style: TextStyle, resolution = 1)
{
    canvas = canvas || document.createElement('canvas');

    if (style.fontSize < 1) style.fontSize = 1;

    const _font = style.toFontString();

    const context = canvas.getContext('2d');
    const measured = TextMetrics.measureText(_text || ' ', style, style.wordWrap, canvas);
    const width = measured.width;
    const height = measured.height;
    const lines = measured.lines;
    const lineHeight = measured.lineHeight;
    const lineWidths = measured.lineWidths;
    const maxLineWidth = measured.maxLineWidth;
    const fontProperties = measured.fontProperties;

    canvas.width = Math.ceil((Math.max(1, width) + (style.padding * 2)) * resolution);
    canvas.height = Math.ceil((Math.max(1, height) + (style.padding * 2)) * resolution);

    context.scale(resolution, resolution);

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.font = _font;
    context.lineWidth = style.strokeThickness;
    context.textBaseline = style.textBaseline;
    context.lineJoin = style.lineJoin;
    context.miterLimit = style.miterLimit;

    let linePositionX: number;
    let linePositionY: number;

    // 需要2个通过如果一个阴影;第一个绘制投影，第二个绘制文本
    const passesCount = style.dropShadow ? 2 : 1;

    for (let i = 0; i < passesCount; ++i)
    {
        const isShadowPass = style.dropShadow && i === 0;
        const dsOffsetText = isShadowPass ? height * 2 : 0; // 我们只想要投影，所以把文本放到屏幕外
        const dsOffsetShadow = dsOffsetText * resolution;

        if (isShadowPass)
        {
            // 在Safari上，带有渐变和阴影的文本不能正确定位
            // 如果画布的比例不是1: https://bugs.webkit.org/show_bug.cgi?id=197689
            // 因此，我们将样式设置为纯黑色，同时生成这个投影
            context.fillStyle = 'black';
            context.strokeStyle = 'black';

            context.shadowColor = style.dropShadowColor.toRGBA();
            context.shadowBlur = style.dropShadowBlur;
            context.shadowOffsetX = Math.cos(style.dropShadowAngle * mathUtil.DEG2RAD) * style.dropShadowDistance;
            context.shadowOffsetY = (Math.sin(style.dropShadowAngle * mathUtil.DEG2RAD) * style.dropShadowDistance) + dsOffsetShadow;
        }
        else
        {
            // 设置画布文本样式
            context.fillStyle = _generateFillStyle(canvas, style, lines, resolution);
            context.strokeStyle = style.stroke.toRGBA();

            context.shadowColor = '';
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }

        // 一行一行绘制
        for (let i = 0; i < lines.length; i++)
        {
            linePositionX = style.strokeThickness / 2;
            linePositionY = ((style.strokeThickness / 2) + (i * lineHeight)) + fontProperties.ascent;

            if (style.align === 'right')
            {
                linePositionX += maxLineWidth - lineWidths[i];
            }
            else if (style.align === 'center')
            {
                linePositionX += (maxLineWidth - lineWidths[i]) / 2;
            }

            if (style.stroke && style.strokeThickness)
            {
                drawLetterSpacing(
                    canvas,
                    style,
                    lines[i],
                    linePositionX + style.padding,
                    linePositionY + style.padding - dsOffsetText,
                    true
                );
            }

            if (style.fill)
            {
                drawLetterSpacing(
                    canvas,
                    style,
                    lines[i],
                    linePositionX + style.padding,
                    linePositionY + style.padding - dsOffsetText
                );
            }
        }
    }

    // 除去透明边缘。
    if (style.trim)
    {
        const trimmed = trimCanvas(canvas);

        if (trimmed.data)
        {
            canvas.width = trimmed.width;
            canvas.height = trimmed.height;
            context.putImageData(trimmed.data, 0, 0);
        }
    }

return canvas;
}

/**
 * 生成填充样式。可以自动生成一个基于填充样式为数组的渐变。
 *
 * @param style 文本样式。
 * @param lines 多行文本。
 * @return 填充样式。
 */
function _generateFillStyle(canvas: HTMLCanvasElement, style: TextStyle, lines: string[], resolution = 1)
{
    const context = canvas.getContext('2d');
    const stylefill = style.fill;
    if (!Array.isArray(stylefill))
    {
        return stylefill.toRGBA();
    }
    else if (stylefill.length === 1)
    {
        return stylefill[0];
    }

    // 画布颜色渐变。
    let gradient: CanvasGradient;
    let totalIterations: number;
    let currentIteration: number;
    let stop: number;

    const width = Math.ceil(canvas.width / resolution);
    const height = Math.ceil(canvas.height / resolution);

    const fill: string[] = <any>stylefill.slice();
    const fillGradientStops = style.fillGradientStops.slice();

    // 初始化渐变关键帧
    if (!fillGradientStops.length)
    {
        const lengthPlus1 = fill.length + 1;

        for (let i = 1; i < lengthPlus1; ++i)
        {
            fillGradientStops.push(i / lengthPlus1);
        }
    }

    // 设置渐变起点与终点。
    fill.unshift(stylefill[0]);
    fillGradientStops.unshift(0);

    fill.push(stylefill[stylefill.length - 1]);
    fillGradientStops.push(1);

    if (style.fillGradientType === TEXT_GRADIENT.LINEAR_VERTICAL)
    {
        // 创建纵向渐变
        gradient = context.createLinearGradient(width / 2, 0, width / 2, height);

        // 我们需要重复渐变，这样每一行文本都有相同的垂直渐变效果
        totalIterations = (fill.length + 1) * lines.length;
        currentIteration = 0;
        for (let i = 0; i < lines.length; i++)
        {
            currentIteration += 1;
            for (let j = 0; j < fill.length; j++)
            {
                if (typeof fillGradientStops[j] === 'number')
                {
                    stop = (fillGradientStops[j] / lines.length) + (i / lines.length);
                }
                else
                {
                    stop = currentIteration / totalIterations;
                }
                gradient.addColorStop(stop, fill[j]);
                currentIteration++;
            }
        }
    }
    else
    {
        // 从画布的中间左侧开始渐变，并在画布的中间右侧结束
        gradient = context.createLinearGradient(0, height / 2, width, height / 2);

        totalIterations = fill.length + 1;
        currentIteration = 1;

        for (let i = 0; i < fill.length; i++)
        {
            if (typeof fillGradientStops[i] === 'number')
            {
                stop = fillGradientStops[i];
            }
            else
            {
                stop = currentIteration / totalIterations;
            }
            gradient.addColorStop(stop, fill[i]);
            currentIteration++;
        }
    }

    return gradient;
}

/**
 * Render the text with letter-spacing.
 * 绘制文本。
 *
 * @param text 文本。
 * @param x X轴位置。
 * @param y Y轴位置。
 * @param isStroke
 */
function drawLetterSpacing(canvas: HTMLCanvasElement, style: TextStyle, text: string, x: number, y: number, isStroke = false)
{
    const context = canvas.getContext('2d');
    const letterSpacing = style.letterSpacing;

    if (letterSpacing === 0)
    {
        if (isStroke)
        {
            context.strokeText(text, x, y);
        }
        else
        {
            context.fillText(text, x, y);
        }

        return;
    }

    let currentPosition = x;

    // 使用 Array.from 可以解决表情符号的分割问题。 如  "🌷","🎁","💩","😜" "👍"
    // https://medium.com/@giltayar/iterating-over-emoji-characters-the-es6-way-f06e4589516
    // https://github.com/orling/grapheme-splitter
    const stringArray = Array.from(text);
    let previousWidth = context.measureText(text).width;
    let currentWidth = 0;

    for (let i = 0; i < stringArray.length; ++i)
    {
        const currentChar = stringArray[i];

        if (isStroke)
        {
            context.strokeText(currentChar, currentPosition, y);
        }
        else
        {
            context.fillText(currentChar, currentPosition, y);
        }
        currentWidth = context.measureText(text.substring(i + 1)).width;
        currentPosition += previousWidth - currentWidth + letterSpacing;
        previousWidth = currentWidth;
    }
}

/**
  * 除去边界透明部分
  *
  * @param canvas 画布
  */
function trimCanvas(canvas: HTMLCanvasElement)
{
    let width = canvas.width;
    let height = canvas.height;

    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const len = pixels.length;

    let top = NaN;
    let left = NaN;
    let right = NaN;
    let bottom = NaN;

    let data: ImageData = null;
    let i: number;
    let x: number;
    let y: number;

    for (i = 0; i < len; i += 4)
    {
        if (pixels[i + 3] !== 0)
        {
            x = (i / 4) % width;
            y = ~~((i / 4) / width);

            if (isNaN(top))
            {
                top = y;
            }

            if (isNaN(left))
            {
                left = x;
            }
            else if (x < left)
            {
                left = x;
            }

            if (isNaN(right))
            {
                right = x + 1;
            }
            else if (right < x)
            {
                right = x + 1;
            }

            if (isNaN(bottom))
            {
                bottom = y;
            }
            else if (bottom < y)
            {
                bottom = y;
            }
        }
    }

    if (!isNaN(top))
    {
        width = right - left;
        height = bottom - top + 1;
        data = context.getImageData(left, top, width, height);
    }

    return {
        height,
        width,
        data,
    };
}
