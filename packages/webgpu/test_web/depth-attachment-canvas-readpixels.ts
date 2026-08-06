import { CanvasTexture, ReadPixels, RenderObject, Submit, TextureView } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';

// 创建两个重叠的三角形
function createRedTriangle(): RenderObject
{
    return {
        vertices: {
            position: {
                data: new Float32Array([
                    -0.5, -0.5, 0.1, // 左下（z=0.1，更靠近）
                    0.5, -0.5, 0.1,  // 右下（z=0.1，更靠近）
                    0.0, 0.5, 0.1,   // 上（z=0.1，更靠近）
                ]),
                format: 'float32x3' as const,
            },
        },
        draw: { __type__: 'DrawVertex' as const, vertexCount: 3 },
        bindingResources: { color: { value: [1, 0, 0, 1] } }, // 红色
        pipeline: {
            vertex: {
                code: `
                    @vertex
                    fn main(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
                        return vec4<f32>(position, 1.0);
                    }
                `,
            },
            fragment: {
                code: `
                    @binding(0) @group(0) var<uniform> color: vec4<f32>;
                    @fragment
                    fn main() -> @location(0) vec4<f32> {
                        return color;
                    }
                `,
            },
            depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
        },
    };
}

function createGreenTriangle(): RenderObject
{
    return {
        vertices: {
            position: {
                data: new Float32Array([
                    -0.3, -0.3, 0.9, // 左下（z=0.9，更远）
                    0.3, -0.3, 0.9,  // 右下（z=0.9，更远）
                    0.0, 0.3, 0.9,   // 上（z=0.9，更远）
                ]),
                format: 'float32x3' as const,
            },
        },
        draw: { __type__: 'DrawVertex' as const, vertexCount: 3 },
        bindingResources: { color: { value: [0, 1, 0, 1] } }, // 绿色
        pipeline: {
            vertex: {
                code: `
                    @vertex
                    fn main(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
                        return vec4<f32>(position, 1.0);
                    }
                `,
            },
            fragment: {
                code: `
                    @binding(0) @group(0) var<uniform> color: vec4<f32>;
                    @fragment
                    fn main() -> @location(0) vec4<f32> {
                        return color;
                    }
                `,
            },
            depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
        },
    };
}

// 使用 webgpu.readPixels 读取画布中心点的像素颜色
async function readPixelColor(webgpu: WebGPU, textureView: TextureView, x: number, y: number): Promise<[number, number, number, number]>
{
    // 使用 webgpu.readPixels 读取像素（WebGPU 的 readPixels 是异步的）
    // WebGPU 的 ReadPixels 需要 texture 字段（从 textureView.texture 获取）
    const readPixelsParams: ReadPixels = {
        texture: textureView.texture,
        origin: [x, y] as [number, number],
        copySize: [1, 1] as [number, number],
    };
    const result = await webgpu.readPixels(readPixelsParams);

    // 将结果转换为 Uint8Array 并提取颜色值
    const pixel = new Uint8Array(result.buffer, result.byteOffset, 4);

    // 根据纹理格式处理颜色通道顺序
    const format = readPixelsParams.format;

    if (format === 'bgra8unorm' || format === 'bgra8unorm-srgb')
    {
        // BGRA 格式：需要将 BGRA 转换为 RGBA：交换 B 和 R 通道
        // BGRA: [B, G, R, A] -> RGBA: [R, G, B, A]
        return [pixel[2], pixel[1], pixel[0], pixel[3]];
    }
    else
    {
        // RGBA 格式：直接返回
        return [pixel[0], pixel[1], pixel[2], pixel[3]];
    }
}

// 测试 1: 没有深度附件
async function testWithoutDepthAttachment()
{
    const canvas = document.getElementById('canvas-no-depth') as HTMLCanvasElement;
    const statusDiv = document.getElementById('status-no-depth') as HTMLDivElement;

    try
    {
        const webgpu = await new WebGPU({ canvasId: 'canvas-no-depth' }).init();

        const redTriangle = createRedTriangle();
        const greenTriangle = createGreenTriangle();

        // 使用画布纹理视图直接渲染到画布
        const canvasTexture: CanvasTexture = {
            context: { canvasId: 'canvas-no-depth' },
        };

        const canvasTextureView: TextureView = {
            texture: canvasTexture,
        };

        // 提交渲染（没有深度附件，直接渲染到画布）
        // 先绘制红色（z=0.1，更靠近），后绘制绿色（z=0.9，更远）
        // 如果没有深度测试，后绘制的绿色会覆盖先绘制的红色
        const submit: Submit = {
            commandEncoders: [{
                passEncoders: [
                    {
                        descriptor: {
                            colorAttachments: [{ clearValue: [0, 0, 0, 1], view: canvasTextureView }],
                            // 注意：这里没有 depthStencilAttachment
                        },
                        renderPassObjects: [redTriangle, greenTriangle], // 先绘制红色，后绘制绿色
                    },
                ],
            }],
        };

        webgpu.submit(submit);

        // 使用 webgpu.readPixels 直接从画布读取中心点的像素颜色
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        const [r, g, b, a] = await readPixelColor(webgpu, canvasTextureView, centerX, centerY);

        // 验证：没有深度附件时，后绘制的绿色三角形（更远）应该覆盖先绘制的红色三角形（更靠近）
        // 中心点应该是绿色（0, 255, 0）或接近绿色
        const isGreen = g > 200 && r < 100 && b < 100;

        if (isGreen)
        {
            const message = '后绘制的绿色三角形（更远）覆盖了先绘制的红色三角形（更靠近）（深度测试被禁用）';

            statusDiv.textContent = `✓ 测试通过: ${message}`;
            statusDiv.className = 'status pass';
            testResults.test1 = { passed: true, message };
        }
        else
        {
            const message = `中心点颜色为 (${r}, ${g}, ${b}, ${a})，期望为绿色`;

            statusDiv.textContent = `✗ 测试失败: ${message}`;
            statusDiv.className = 'status fail';
            testResults.test1 = { passed: false, message };
        }
    }
    catch (error)
    {
        const errorMessage = error instanceof Error ? error.message : String(error);

        statusDiv.textContent = `错误: ${errorMessage}`;
        statusDiv.className = 'status fail';
        testResults.test1 = { passed: false, message: errorMessage };
    }
}

// 测试 2: 有深度附件
async function testWithDepthAttachment()
{
    const canvas = document.getElementById('canvas-with-depth') as HTMLCanvasElement;
    const statusDiv = document.getElementById('status-with-depth') as HTMLDivElement;

    try
    {
        const webgpu = await new WebGPU({ canvasId: 'canvas-with-depth' }).init();

        const redTriangle = createRedTriangle();
        const greenTriangle = createGreenTriangle();

        // 使用画布纹理视图直接渲染到画布
        const canvasTexture: CanvasTexture = {
            context: { canvasId: 'canvas-with-depth' },
        };

        const canvasTextureView: TextureView = {
            texture: canvasTexture,
        };

        // 提交渲染（有深度附件，直接渲染到画布）
        // 先绘制红色（z=0.1，更靠近），后绘制绿色（z=0.9，更远）
        // 有深度测试时，更靠近的红色会覆盖更远的绿色
        const submit: Submit = {
            commandEncoders: [{
                passEncoders: [
                    {
                        descriptor: {
                            colorAttachments: [{ clearValue: [0, 0, 0, 1], view: canvasTextureView }],
                            depthStencilAttachment: { depthClearValue: 1 }, // 有深度附件
                        },
                        renderPassObjects: [redTriangle, greenTriangle], // 先绘制红色，后绘制绿色
                    },
                ],
            }],
        };

        webgpu.submit(submit);

        // 使用 webgpu.readPixels 直接从画布读取中心点的像素颜色
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        const [r, g, b, a] = await readPixelColor(webgpu, canvasTextureView, centerX, centerY);

        // 验证：有深度附件时，更靠近的红色三角形（z=0.1）应该覆盖更远的绿色三角形（z=0.9）
        // 中心点应该是红色（255, 0, 0）或接近红色
        const isRed = r > 200 && g < 100 && b < 100;

        if (isRed)
        {
            const message = '更靠近的红色三角形覆盖了更远的绿色三角形（深度测试启用）';

            statusDiv.textContent = `✓ 测试通过: ${message}`;
            statusDiv.className = 'status pass';
            testResults.test2 = { passed: true, message };
        }
        else
        {
            const message = `中心点颜色为 (${r}, ${g}, ${b}, ${a})，期望为红色`;

            statusDiv.textContent = `✗ 测试失败: ${message}`;
            statusDiv.className = 'status fail';
            testResults.test2 = { passed: false, message };
        }
    }
    catch (error)
    {
        const errorMessage = error instanceof Error ? error.message : String(error);

        statusDiv.textContent = `错误: ${errorMessage}`;
        statusDiv.className = 'status fail';
        testResults.test2 = { passed: false, message: errorMessage };
    }
}

// 测试结果
interface TestResult
{
    test1: { passed: boolean; message: string };
    test2: { passed: boolean; message: string };
}

const testResults: TestResult = {
    test1: { passed: false, message: '' },
    test2: { passed: false, message: '' },
};

// 发送测试结果给父窗口（如果是在 iframe 中运行）
function sendTestResult()
{
    // 检查测试结果是否都已设置（不是初始状态）
    const test1Completed = testResults.test1.message !== '';
    const test2Completed = testResults.test2.message !== '';

    // 如果测试未完成，不发送结果
    if (!test1Completed || !test2Completed)
    {
        return;
    }

    const allPassed = testResults.test1.passed && testResults.test2.passed;
    const message = `测试 1: ${testResults.test1.passed ? '通过' : '失败'} - ${testResults.test1.message}\n测试 2: ${testResults.test2.passed ? '通过' : '失败'} - ${testResults.test2.message}`;

    if (window.parent !== window)
    {
        window.parent.postMessage({
            type: 'test-result',
            testName: 'depth-attachment-canvas-readpixels',
            passed: allPassed,
            message,
            details: testResults,
        }, '*');
    }
}

// 运行测试
document.addEventListener('DOMContentLoaded', async () =>
{
    // 等待页面完全加载
    await new Promise(resolve => setTimeout(resolve, 200));

    try
    {
        await testWithoutDepthAttachment();
        await testWithDepthAttachment();
    }
    catch (error)
    {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // 确保即使出错也记录结果
        if (!testResults.test1.message)
        {
            testResults.test1 = { passed: false, message: `执行错误: ${errorMessage}` };
        }
        if (!testResults.test2.message)
        {
            testResults.test2 = { passed: false, message: `执行错误: ${errorMessage}` };
        }
    }
    finally
    {
        sendTestResult();
    }
});

