import { ChainMap } from '../utils/ChainMap';

/**
 * GPU着色器模块管理器。
 */
export class WGPUShaderModule
{
    /**
     * 从设备以及着色器代码获得GPU着色器模块。
     *
     * @param device 设备。
     * @param code 着色器代码。
     * @returns GPU着色器模块。
     */
    static getGPUShaderModule(device: GPUDevice, code: string)
    {
        let gpuShaderModule = this.map.get([device, code]);

        if (gpuShaderModule) return gpuShaderModule;

        try
        {
            gpuShaderModule = device.createShaderModule({ code });
        }
        catch (e)
        {
            // 增强错误信息，明确指出是 WGSL 着色器编译错误
            const errorMessage = e instanceof Error ? e.message : String(e);
            const lines = code.split('\n');

            // 尝试从错误消息中提取行号
            const lineMatch = errorMessage.match(/line\s*(\d+)/i);
            const errorLine = lineMatch ? parseInt(lineMatch[1], 10) : null;

            // 构建详细错误输出
            const separator = '='.repeat(70);
            const errorOutput: string[] = [
                '',
                separator,
                '[WGSL Shader Compilation Error]',
                `Error: ${errorMessage}`,
                separator,
            ];

            if (errorLine !== null)
            {
                errorOutput.push('Code context:');
                const startLine = Math.max(0, errorLine - 3);
                const endLine = Math.min(lines.length, errorLine + 2);

                for (let i = startLine; i < endLine; i++)
                {
                    const lineNumber = (i + 1).toString().padStart(4, ' ');
                    const marker = (i + 1 === errorLine) ? '>>>' : '   ';

                    errorOutput.push(`${marker} ${lineNumber} | ${lines[i]}`);
                }
            }
            else
            {
                errorOutput.push('Full WGSL code:');
                lines.forEach((line, i) =>
                {
                    const lineNumber = (i + 1).toString().padStart(4, ' ');

                    errorOutput.push(`    ${lineNumber} | ${line}`);
                });
            }

            errorOutput.push(separator);
            errorOutput.push('');

            console.error(errorOutput.join('\n'));

            // 重新抛出带有更明确信息的错误
            throw new Error(`[WGSL Error] ${errorMessage}\n\nSee console for full shader code and context.`);
        }

        gpuShaderModule.getCompilationInfo().then((compilationInfo) =>
        {
            if (compilationInfo.messages.length > 0)
            {
                const lines = code.split('\n');

                compilationInfo.messages.forEach((message) =>
                {
                    const { type, lineNum, linePos, message: msg } = message;
                    const typeStr = type.toUpperCase();

                    // 获取错误行及上下文
                    const contextLines: string[] = [];
                    const startLine = Math.max(0, lineNum - 3);
                    const endLine = Math.min(lines.length, lineNum + 2);

                    for (let i = startLine; i < endLine; i++)
                    {
                        const lineNumber = (i + 1).toString().padStart(4, ' ');
                        const marker = (i + 1 === lineNum) ? '>>>' : '   ';

                        contextLines.push(`${marker} ${lineNumber} | ${lines[i]}`);

                        // 添加错误位置指示
                        if (i + 1 === lineNum && linePos > 0)
                        {
                            const pointer = ' '.repeat(linePos + 9) + '^';

                            contextLines.push(pointer);
                        }
                    }

                    const separator = '='.repeat(70);
                    const errorOutput = [
                        '',
                        separator,
                        `[WGSL ${typeStr}] Line ${lineNum}, Column ${linePos}`,
                        `Message: ${msg}`,
                        separator,
                        'Code context:',
                        ...contextLines,
                        separator,
                        '',
                    ].join('\n');

                    if (type === 'error')
                    {
                        console.error(errorOutput);
                    }
                    else if (type === 'warning')
                    {
                        console.warn(errorOutput);
                    }
                    else
                    {
                        console.info(errorOutput);
                    }
                });
            }
        });

        this.map.set([device, code], gpuShaderModule);

        return gpuShaderModule;
    }

    private static readonly map = new ChainMap<[GPUDevice, string], GPUShaderModule>();
}
