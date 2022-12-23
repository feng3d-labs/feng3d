// @see https://github.com/mattdesl/parse-unit

export function parseUnit(str, out?)
{
    if (!out)
    { out = [0, '']; }

    str = String(str);
    const num = parseFloat(str);
    out[0] = num;
    out[1] = str.match(/[\d.\-\+]*\s*(.*)/)[1] || '';

    return out;
}
