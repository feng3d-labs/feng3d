/**
 * 格式化数字为 GLSL/WGSL 格式
 * 所有整数（正数和负数）都保留 .0 后缀以表示浮点数
 * 科学计数法使用小写 e（如 1e-17）
 */
export function formatNumber(num: number): string
{
    // 如果是整数（正数或负数），添加 .0 后缀
    if (Number.isInteger(num))
    {
        return `${num}.0`;
    }

    // 对于非常小或非常大的数字，使用科学计数法
    const absNum = Math.abs(num);
    if ((absNum !== 0 && (absNum < 1e-6 || absNum >= 1e15)) || !Number.isFinite(num))
    {
        // 使用科学计数法，确保使用小写 e
        return num.toExponential().replace(/e/i, 'e');
    }

    // 浮点数直接转换为字符串
    const str = String(num);

    // 如果字符串包含大写 E，转换为小写 e（GLSL/WGSL 使用小写 e）
    return str.replace(/E/g, 'e');
}

