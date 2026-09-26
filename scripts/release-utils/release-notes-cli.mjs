#!/usr/bin/env node
/**
 * Release notes 生成器的命令行入口。
 *
 * 用法：
 *   node scripts/release-utils/release-notes-cli.mjs <报告 json> <输出 md> [--with-generated]
 *
 * 环境变量（--with-generated 时需要）：
 *   RELEASE_TAG    发布 tag
 *   REPO_OWNER     仓库 owner
 *   REPO_NAME      仓库名
 *   GITHUB_TOKEN   用于调 generate-notes API
 *
 * 逻辑本体在 release-notes.mjs（纯函数，有单元测试）。
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { composeReleaseNotes } from './release-notes.mjs';

const [, , reportPath, outputPath, ...flags] = process.argv;

if (!reportPath || !outputPath)
{
    console.error('用法：node release-notes-cli.mjs <报告 json> <输出 md> [--with-generated]');
    process.exit(1);
}

if (!existsSync(reportPath))
{
    // 没有报告时不要静默产出空文件，写一句明确说明便于在 Release 页面看出异常
    writeFileSync(outputPath, '（未找到发布报告，无法列出本次发布的包）\n', 'utf8');
    console.error(`报告不存在：${reportPath}`);
    process.exit(0);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const notes = await composeReleaseNotes(report, {
    owner: process.env.REPO_OWNER ?? '',
    repo: process.env.REPO_NAME ?? '',
    tag: process.env.RELEASE_TAG ?? '',
    token: process.env.GITHUB_TOKEN ?? '',
    withGenerated: flags.includes('--with-generated'),
});

writeFileSync(outputPath, notes, 'utf8');
console.log(`Release notes 已写入 ${outputPath}（发布 ${report.published?.length ?? 0} 个包）`);
