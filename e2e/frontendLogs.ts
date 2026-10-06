import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 读取最新一个 `frontend_*.log`，返回其中 level 为 error 的行（含 '❌'）。
 *
 * 日志由 `@feng3d/error-logger` 写入 `examples/logs/`。AGENTS.md 规范要求改代码后检查运行日志，
 * 示例的端到端测试据此校验「运行期无 ❌ error」——这条断言**与环境无关**（不需要 GPU），
 * 因此在 CI 里也有效：页面脚本抛错、WebGPU 校验失败、着色器编译失败都会落到这里。
 */
const LOGS_DIR = path.join(fileURLToPath(new URL('.', import.meta.url)), '..', 'examples', 'logs');

// 说明：`e2e/examples.spec.ts` 里有一份等价的内联实现（它先于本文件存在，且被 220 个示例的
// 基线套件共享）。这里抽出来供新的 `particlesystem.spec.ts` 复用；合并两者需要重跑整套基线，
// 留作独立事项，避免本批同时动「既有基线套件」与「新增门禁」两件事。

export function readRecentErrors(afterTime: number): string[]
{
    let files: string[] = [];
    try
    {
        files = readdirSync(LOGS_DIR)
            .filter((f) => f.startsWith('frontend_') && f.endsWith('.log'))
            .map((f) => ({ f, mtime: statSync(path.join(LOGS_DIR, f)).mtimeMs }))
            .filter((x) => x.mtime >= afterTime)
            .sort((a, b) => b.mtime - a.mtime)
            .map((x) => x.f);
    }
    catch
    {
        return [];
    }

    const errors: string[] = [];
    for (const f of files)
    {
        let content = '';
        try
        {
            content = readFileSync(path.join(LOGS_DIR, f), 'utf-8');
        }
        catch
        {
            continue;
        }
        for (const line of content.split('\n'))
        {
            if (line.includes('❌') || (/\berror\b/i.test(line) && !line.includes('error-logger')))
            {
                errors.push(f + ': ' + line.trim());
            }
        }
    }

    return errors;
}
