import { TextStyle } from './TextStyle';

/**
 * 文本度量
 *
 * 用于度量指定样式的文本的宽度。
 *
 * 从pixi.js移植
 *
 * @see https://github.com/pixijs/pixi.js/blob/dev/packages/text/src/TextMetrics.js
 */
export class TextMetrics
{
    /**
     * 被测量的文本。
     */
    text: string;

    /**
     * 被测量的样式。
     */
    style: TextStyle;

    /**
     * 测量出的宽度。
     */
    width: number;

    /**
     * 测量出的高度。
     */
    height: number;

    /**
     * 根据样式分割成的多行文本。
     */
    lines: string[];

    /**
     * An array of the line widths for each line matched to `lines`
     */
    lineWidths: number[];

    /**
     * The measured line height for this style
     */
    lineHeight: number;

    /**
     * The maximum line width for all measured lines
     */
    maxLineWidth: number;

    /**
     * The font properties object from TextMetrics.measureFont
     */
    fontProperties: IFontMetrics;

    /**
     * Cached canvas element for measuring text
     */
    static _canvas = (() =>
    {
        const c = document.createElement('canvas');

        c.width = c.height = 10;

return c;
    })();

    /**
     * Cache for context to use.
     */
    static _context = <CanvasRenderingContext2D>TextMetrics._canvas.getContext('2d');

    /**
     * Cache of {@see PIXI.TextMetrics.FontMetrics} objects.
     */
    static _fonts: { [key: string]: IFontMetrics } = {};

    /**
     * String used for calculate font metrics.
     * These characters are all tall to help calculate the height required for text.
     */
    static METRICS_STRING = '|ÉqÅ';

    /**
     * Baseline symbol for calculate font metrics.
     */
    static BASELINE_SYMBOL = 'M';

    /**
     * Baseline multiplier for calculate font metrics.
     */
    static BASELINE_MULTIPLIER = 2;

    /**
     * Cache of new line chars.
     */
    static _newlines = [
        0x000A, // line feed
        0x000D, // carriage return
    ];

    /**
     * Cache of breaking spaces.
     */
    static _breakingSpaces = [
        0x0009, // character tabulation
        0x0020, // space
        0x2000, // en quad
        0x2001, // em quad
        0x2002, // en space
        0x2003, // em space
        0x2004, // three-per-em space
        0x2005, // four-per-em space
        0x2006, // six-per-em space
        0x2008, // punctuation space
        0x2009, // thin space
        0x200A, // hair space
        0x205F, // medium mathematical space
        0x3000, // ideographic space
    ];

    /**
     * @param text - the text that was measured
     * @param style - the style that was measured
     * @param width - the measured width of the text
     * @param height - the measured height of the text
     * @param lines - an array of the lines of text broken by new lines and wrapping if specified in style
     * @param lineWidths - an array of the line widths for each line matched to `lines`
     * @param lineHeight - the measured line height for this style
     * @param maxLineWidth - the maximum line width for all measured lines
     * @param fontProperties - the font properties object from TextMetrics.measureFont
     */
    constructor(text: string, style: TextStyle, width: number, height: number, lines: string[], lineWidths: number[], lineHeight: number, maxLineWidth: number, fontProperties: IFontMetrics)
    {
        this.text = text;
        this.style = style;
        this.width = width;
        this.height = height;
        this.lines = lines;
        this.lineWidths = lineWidths;
        this.lineHeight = lineHeight;
        this.maxLineWidth = maxLineWidth;
        this.fontProperties = fontProperties;
    }

    /**
     * Measures the supplied string of text and returns a Rectangle.
     *
     * @param text - the text to measure.
     * @param style - the text style to use for measuring
     * @param wordWrap - optional override for if word-wrap should be applied to the text.
     * @param canvas - optional specification of the canvas to use for measuring.
     * @return measured width and height of the text.
     */
    static measureText(text: string, style: TextStyle, wordWrap: boolean, canvas = TextMetrics._canvas)
    {
        wordWrap = (wordWrap === undefined || wordWrap === null) ? style.wordWrap : wordWrap;
        const font = style.toFontString();
        const fontProperties = TextMetrics.measureFont(font);

        // fallback in case UA disallow canvas data extraction
        // (toDataURI, getImageData functions)
        if (fontProperties.fontSize === 0)
        {
            fontProperties.fontSize = style.fontSize;
            fontProperties.ascent = style.fontSize;
        }

        const context = canvas.getContext('2d');
        if (!context)
        {
            throw `获取 CanvasRenderingContext2D 失败！`;
        }
        context.font = font;

        const outputText = wordWrap ? TextMetrics.wordWrap(text, style, canvas) : text;
        const lines = outputText.split(/(?:\r\n|\r|\n)/);
        const lineWidths = new Array(lines.length);
        let maxLineWidth = 0;

        for (let i = 0; i < lines.length; i++)
        {
            const lineWidth = context.measureText(lines[i]).width + ((lines[i].length - 1) * style.letterSpacing);

            lineWidths[i] = lineWidth;
            maxLineWidth = Math.max(maxLineWidth, lineWidth);
        }
        let width = maxLineWidth + style.strokeThickness;

        if (style.dropShadow)
        {
            width += style.dropShadowDistance;
        }

        const lineHeight = style.lineHeight || fontProperties.fontSize + style.strokeThickness;
        let height = Math.max(lineHeight, fontProperties.fontSize + style.strokeThickness)
            + ((lines.length - 1) * (lineHeight + style.leading));

        if (style.dropShadow)
        {
            height += style.dropShadowDistance;
        }

        return new TextMetrics(
            text,
            style,
            width,
            height,
            lines,
            lineWidths,
            lineHeight + style.leading,
            maxLineWidth,
            fontProperties
        );
    }

    /**
     * Applies newlines to a string to have it optimally fit into the horizontal
     * bounds set by the Text object's wordWrapWidth property.
     *
     * @private
     * @param text - String to apply word wrapping to
     * @param style - the style to use when wrapping
     * @param canvas - optional specification of the canvas to use for measuring.
     * @return New string with new lines applied where required
     */
    static wordWrap(text: string, style: TextStyle, canvas = TextMetrics._canvas)
    {
        const context = canvas.getContext('2d');
        if (!context)
        {
            throw `获取 CanvasRenderingContext2D 失败！`;
        }

        let width = 0;
        let line = '';
        let lines = '';

        const cache = {};
        const { letterSpacing, whiteSpace } = style;

        // How to handle whitespaces
        const collapseSpaces = TextMetrics.collapseSpaces(whiteSpace);
        const collapseNewlines = TextMetrics.collapseNewlines(whiteSpace);

        // whether or not spaces may be added to the beginning of lines
        let canPrependSpaces = !collapseSpaces;

        // There is letterSpacing after every char except the last one
        // t_h_i_s_' '_i_s_' '_a_n_' '_e_x_a_m_p_l_e_' '_!
        // so for convenience the above needs to be compared to width + 1 extra letterSpace
        // t_h_i_s_' '_i_s_' '_a_n_' '_e_x_a_m_p_l_e_' '_!_
        // ________________________________________________
        // And then the final space is simply no appended to each line
        const wordWrapWidth = style.wordWrapWidth + letterSpacing;

        // break text into words, spaces and newline chars
        const tokens = TextMetrics.tokenize(text);

        for (let i = 0; i < tokens.length; i++)
        {
            // get the word, space or newlineChar
            let token = tokens[i];

            // if word is a new line
            if (TextMetrics.isNewline(token))
            {
                // keep the new line
                if (!collapseNewlines)
                {
                    lines += TextMetrics.addLine(line);
                    canPrependSpaces = !collapseSpaces;
                    line = '';
                    width = 0;
                    continue;
                }

                // if we should collapse new lines
                // we simply convert it into a space
                token = ' ';
            }

            // if we should collapse repeated whitespaces
            if (collapseSpaces)
            {
                // check both this and the last tokens for spaces
                const currIsBreakingSpace = TextMetrics.isBreakingSpace(token);
                const lastIsBreakingSpace = TextMetrics.isBreakingSpace(line[line.length - 1]);

                if (currIsBreakingSpace && lastIsBreakingSpace)
                {
                    continue;
                }
            }

            // get word width from cache if possible
            const tokenWidth = TextMetrics.getFromCache(token, letterSpacing, cache, context);

            // word is longer than desired bounds
            if (tokenWidth > wordWrapWidth)
            {
                // if we are not already at the beginning of a line
                if (line !== '')
                {
                    // start newlines for overflow words
                    lines += TextMetrics.addLine(line);
                    line = '';
                    width = 0;
                }

                // break large word over multiple lines
                if (TextMetrics.canBreakWords(token, style.breakWords))
                {
                    // break word into characters
                    const characters = TextMetrics.wordWrapSplit(token);

                    // loop the characters
                    for (let j = 0; j < characters.length; j++)
                    {
                        let char = characters[j];

                        let k = 1;
                        // we are not at the end of the token

                        while (characters[j + k])
                        {
                            const nextChar = characters[j + k];
                            const lastChar = char[char.length - 1];

                            // should not split chars
                            if (!TextMetrics.canBreakChars(lastChar, nextChar, token, j, style.breakWords))
                            {
                                // combine chars & move forward one
                                char += nextChar;
                            }
                            else
                            {
                                break;
                            }

                            k++;
                        }

                        j += char.length - 1;

                        const characterWidth = TextMetrics.getFromCache(char, letterSpacing, cache, context);

                        if (characterWidth + width > wordWrapWidth)
                        {
                            lines += TextMetrics.addLine(line);
                            canPrependSpaces = false;
                            line = '';
                            width = 0;
                        }

                        line += char;
                        width += characterWidth;
                    }
                }

                // run word out of the bounds
                else
                {
                    // if there are words in this line already
                    // finish that line and start a new one
                    if (line.length > 0)
                    {
                        lines += TextMetrics.addLine(line);
                        line = '';
                        width = 0;
                    }

                    const isLastToken = i === tokens.length - 1;

                    // give it its own line if it's not the end
                    lines += TextMetrics.addLine(token, !isLastToken);
                    canPrependSpaces = false;
                    line = '';
                    width = 0;
                }
            }

            // word could fit
            else
            {
                // word won't fit because of existing words
                // start a new line
                if (tokenWidth + width > wordWrapWidth)
                {
                    // if its a space we don't want it
                    canPrependSpaces = false;

                    // add a new line
                    lines += TextMetrics.addLine(line);

                    // start a new line
                    line = '';
                    width = 0;
                }

                // don't add spaces to the beginning of lines
                if (line.length > 0 || !TextMetrics.isBreakingSpace(token) || canPrependSpaces)
                {
                    // add the word to the current line
                    line += token;

                    // update width counter
                    width += tokenWidth;
                }
            }
        }

        lines += TextMetrics.addLine(line, false);

        return lines;
    }

    /**
     * Convienience function for logging each line added during the wordWrap
     * method
     *
     * @private
     * @param  line        - The line of text to add
     * @param  newLine     - Add new line character to end
     * @return A formatted line
     */
    static addLine(line: string, newLine = true)
    {
        line = TextMetrics.trimRight(line);

        line = (newLine) ? `${line}\n` : line;

        return line;
    }

    /**
     * Gets & sets the widths of calculated characters in a cache object
     *
     * @private
     * @param key            The key
     * @param letterSpacing  The letter spacing
     * @param cache          The cache
     * @param context        The canvas context
     * @return The from cache.
     */
    static getFromCache(key: string, letterSpacing: number, cache: { [key: string]: number }, context: CanvasRenderingContext2D)
    {
        let width = cache[key];

        if (width === undefined)
        {
            const spacing = ((key.length) * letterSpacing);

            width = context.measureText(key).width + spacing;
            cache[key] = width;
        }

        return width;
    }

    /**
     * Determines whether we should collapse breaking spaces
     *
     * @private
     * @param whiteSpace  The TextStyle property whiteSpace
     * @return should collapse
     */
    static collapseSpaces(whiteSpace: string)
    {
        return (whiteSpace === 'normal' || whiteSpace === 'pre-line');
    }

    /**
     * Determines whether we should collapse newLine chars
     *
     * @private
     * @param whiteSpace  The white space
     * @return should collapse
     */
    static collapseNewlines(whiteSpace: string)
    {
        return (whiteSpace === 'normal');
    }

    /**
     * trims breaking whitespaces from string
     *
     * @private
     * @param text  The text
     * @return trimmed string
     */
    static trimRight(text: string)
    {
        if (typeof text !== 'string')
        {
            return '';
        }

        for (let i = text.length - 1; i >= 0; i--)
        {
            const char = text[i];

            if (!TextMetrics.isBreakingSpace(char))
            {
                break;
            }

            text = text.slice(0, -1);
        }

        return text;
    }

    /**
     * Determines if char is a newline.
     *
     * @private
     * @param char  The character
     * @return True if newline, False otherwise.
     */
    static isNewline(char: string)
    {
        if (typeof char !== 'string')
        {
            return false;
        }

        return (TextMetrics._newlines.indexOf(char.charCodeAt(0)) >= 0);
    }

    /**
     * Determines if char is a breaking whitespace.
     *
     * @private
     * @param char  The character
     * @return True if whitespace, False otherwise.
     */
    static isBreakingSpace(char: string)
    {
        if (typeof char !== 'string')
        {
            return false;
        }

        return (TextMetrics._breakingSpaces.indexOf(char.charCodeAt(0)) >= 0);
    }

    /**
     * Splits a string into words, breaking-spaces and newLine characters
     *
     * @private
     * @param text       The text
     * @return A tokenized array
     */
    static tokenize(text: string)
    {
        const tokens: string[] = [];
        let token = '';

        if (typeof text !== 'string')
        {
            return tokens;
        }

        for (let i = 0; i < text.length; i++)
        {
            const char = text[i];

            if (TextMetrics.isBreakingSpace(char) || TextMetrics.isNewline(char))
            {
                if (token !== '')
                {
                    tokens.push(token);
                    token = '';
                }

                tokens.push(char);

                continue;
            }

            token += char;
        }

        if (token !== '')
        {
            tokens.push(token);
        }

        return tokens;
    }

    /**
     * Overridable helper method used internally by TextMetrics, exposed to allow customizing the class's behavior.
     *
     * It allows one to customise which words should break
     * Examples are if the token is CJK or numbers.
     * It must return a boolean.
     *
     * @param _token       The token
     * @param breakWords  The style attr break words
     * @return whether to break word or not
     */
    static canBreakWords(_token: string, breakWords: boolean)
    {
        return breakWords;
    }

    /**
     * Overridable helper method used internally by TextMetrics, exposed to allow customizing the class's behavior.
     *
     * It allows one to determine whether a pair of characters
     * should be broken by newlines
     * For example certain characters in CJK langs or numbers.
     * It must return a boolean.
     *
     * @param _char      The character
     * @param _nextChar  The next character
     * @param _token     The token/word the characters are from
     * @param _index     The index in the token of the char
     * @param _breakWords  The style attr break words
     * @return whether to break word or not
     */
    static canBreakChars(_char: string, _nextChar: string, _token: string, _index: number, _breakWords: boolean) // eslint-disable-line no-unused-vars
    {
        return true;
    }

    /**
     * Overridable helper method used internally by TextMetrics, exposed to allow customizing the class's behavior.
     *
     * It is called when a token (usually a word) has to be split into separate pieces
     * in order to determine the point to break a word.
     * It must return an array of characters.
     *
     * @example
     * // Correctly splits emojis, eg "🤪🤪" will result in two element array, each with one emoji.
     * TextMetrics.wordWrapSplit = (token) => [...token];
     *
     * @param token The token to split
     * @return The characters of the token
     */
    static wordWrapSplit(token: string)
    {
        return token.split('');
    }

    /**
     * Calculates the ascent, descent and fontSize of a given font-style
     *
     * @param font - String representing the style of the font
     * @return Font properties object
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textBaseline
     */
    static measureFont(font: string)
    {
        // as this method is used for preparing assets, don't recalculate things if we don't need to
        if (TextMetrics._fonts[font])
        {
            return TextMetrics._fonts[font];
        }

        const properties: IFontMetrics = <any>{};

        const canvas = TextMetrics._canvas;
        const context = TextMetrics._context;

        context.font = font;

        const metricsString = TextMetrics.METRICS_STRING + TextMetrics.BASELINE_SYMBOL;
        const width = Math.ceil(context.measureText(metricsString).width);
        let baseline = Math.ceil(context.measureText(TextMetrics.BASELINE_SYMBOL).width);
        const height = 3 * baseline;

        baseline = baseline * TextMetrics.BASELINE_MULTIPLIER | 0;

        canvas.width = width;
        canvas.height = height;

        context.fillStyle = '#f00';
        context.fillRect(0, 0, width, height);

        context.font = font;

        context.textBaseline = 'alphabetic';
        context.fillStyle = '#000';
        context.fillText(metricsString, 0, baseline);

        const imagedata = context.getImageData(0, 0, width, height).data;
        const pixels = imagedata.length;
        const line = width * 4;

        let i = 0;
        let idx = 0;
        let stop = false;

        // ascent. scan from top to bottom until we find a non red pixel
        for (i = 0; i < baseline; ++i)
        {
            for (let j = 0; j < line; j += 4)
            {
                if (imagedata[idx + j] !== 255)
                {
                    stop = true;
                    break;
                }
            }
            if (!stop)
            {
                idx += line;
            }
            else
            {
                break;
            }
        }

        properties.ascent = baseline - i;

        idx = pixels - line;
        stop = false;

        // descent. scan from bottom to top until we find a non red pixel
        for (i = height; i > baseline; --i)
        {
            for (let j = 0; j < line; j += 4)
            {
                if (imagedata[idx + j] !== 255)
                {
                    stop = true;
                    break;
                }
            }

            if (!stop)
            {
                idx -= line;
            }
            else
            {
                break;
            }
        }

        properties.descent = i - baseline;
        properties.fontSize = properties.ascent + properties.descent;

        TextMetrics._fonts[font] = properties;

        return properties;
    }

    /**
     * Clear font metrics in metrics cache.
     *
     * @param font - font name. If font name not set then clear cache for all fonts.
     */
    static clearMetrics(font = '')
    {
        if (font)
        {
            delete TextMetrics._fonts[font];
        }
        else
        {
            TextMetrics._fonts = {};
        }
    }
}

/**
 * A number, or a string containing a number.
 */
interface IFontMetrics
{
    /**
     * Font ascent
     */
    ascent: number;
    /**
     * Font descent
     */
    descent: number;
    /**
     * Font size
     */
    fontSize: number;
}

