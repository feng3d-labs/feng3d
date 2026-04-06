/**
 * 二维码工具模块
 * 使用 Canvas API 生成二维码，不依赖 jQuery
 */
import QRCode from 'qrcode';

/**
 * 初始化二维码显示
 * @param url 要生成二维码的 URL
 */
export function initQRCode(url: string): void
{
    const outputElement = document.getElementById('output');
    if (!outputElement)
    {
        console.warn('找不到 #output 元素');

        return;
    }

    // 清空现有内容
    outputElement.innerHTML = '';

    // 创建 canvas 元素
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    outputElement.appendChild(canvas);

    // 生成二维码
    generateQRCode(canvas, url);

    // 添加点击隐藏功能
    window.addEventListener('click', () =>
    {
        hideQRCode();
    });
}

/**
 * 显示二维码
 */
export function showQRCode(): void
{
    const outputElement = document.getElementById('output');
    if (outputElement)
    {
        outputElement.style.display = 'block';
    }
}

/**
 * 隐藏二维码
 */
export function hideQRCode(): void
{
    const outputElement = document.getElementById('output');
    if (outputElement)
    {
        outputElement.style.display = 'none';
    }
}

/**
 * 生成二维码
 */
async function generateQRCode(canvas: HTMLCanvasElement, text: string): Promise<void>
{
    try
    {
        await QRCode.toCanvas(canvas, text, {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
    }
    catch (error)
    {
        console.error('生成二维码失败:', error);
        // 如果生成失败，显示错误信息
        const ctx = canvas.getContext('2d');
        if (ctx)
        {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ff0000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('二维码生成失败', canvas.width / 2, canvas.height / 2);
        }
    }
}

