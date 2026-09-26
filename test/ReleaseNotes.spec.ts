import { describe, expect, it } from 'vitest';
import { buildNotes, composeReleaseNotes, fetchGeneratedNotes } from '../scripts/release-utils/release-notes.mjs';

/**
 * Release 正文生成器的单元测试。
 *
 * 这块逻辑决定 GitHub Release 页面给人看的内容。用 `--bump-all` 发布时
 * 各包版本号互不相同，台账是唯一能说明「这批到底发了哪些版本」的地方，
 * 所以格式与边界都要钉住。
 */

/** 构造一份最小可用的发布报告 */
const report = (published) => ({ published, results: [] });

describe('Release 正文/台账', () =>
{
    it('空发布列表给出明确说明而不是空正文', () =>
    {
        const notes = buildNotes(report([]));

        expect(notes).toContain('没有包被发布');
        expect(notes).not.toContain('| 包 |');
    });

    it('缺少 published 字段时按空处理（不抛异常）', () =>
    {
        expect(() => buildNotes({})).not.toThrow();
        expect(buildNotes({})).toContain('没有包被发布');
    });

    it('列出每个包的名称与版本', () =>
    {
        const notes = buildNotes(report([
            { name: '@feng3d/math', version: '0.8.6', isFirstPublish: false, reason: '0.8.5 已被占用，递进到 0.8.6' },
            { name: 'feng3d', version: '0.9.2', isFirstPublish: false, reason: '0.9.1 已被占用，递进到 0.9.2' },
        ]));

        expect(notes).toContain('本次将 **2** 个子包发布到 npm');
        expect(notes).toContain('| `@feng3d/math` | `0.8.6` |');
        expect(notes).toContain('| `feng3d` | `0.9.2` |');
        expect(notes).toContain('0.8.5 已被占用，递进到 0.8.6');
    });

    it('标出首次发布的包', () =>
    {
        const notes = buildNotes(report([
            { name: '@feng3d/addons', version: '0.6.1', isFirstPublish: true, reason: '尚未发布过' },
            { name: '@feng3d/math', version: '0.8.6', isFirstPublish: false, reason: '递进' },
        ]));

        expect(notes).toContain('**首次发布**');
        expect(notes).toContain('其中首次发布的有 1 个：`@feng3d/addons`');
    });

    it('没有首次发布的包时不出现该段落', () =>
    {
        const notes = buildNotes(report([
            { name: '@feng3d/math', version: '0.8.6', isFirstPublish: false, reason: '递进' },
        ]));

        expect(notes).not.toContain('首次发布');
    });

    it('转义版本来源里的竖线，避免破坏表格列结构', () =>
    {
        // reason 来自脚本拼接，正常不会含竖线；但只要出现就会把表格撑坏，
        // 所以这里必须转义而不是原样输出
        const notes = buildNotes(report([
            { name: 'p', version: '1.0.0', isFirstPublish: false, reason: 'a|b' },
        ]));

        expect(notes).toContain('a\\|b');
        // 表头 3 列 + 数据行应为 4 个竖线分隔符（转义的那个不算）
        const dataRow = notes.split('\n').find((l) => l.startsWith('| `p`'));
        expect(dataRow.replace(/\\\|/g, '')).toMatch(/^\|(?:[^|]*\|){3}$/);
    });

    it('生成可整批复制的安装命令', () =>
    {
        const notes = buildNotes(report([
            { name: 'a', version: '1.0.0', isFirstPublish: false, reason: '' },
            { name: 'b', version: '2.0.0', isFirstPublish: false, reason: '' },
        ]));

        expect(notes).toContain('npm i a@1.0.0 b@2.0.0');
    });

    it('版本来源为空时不留下多余分隔符', () =>
    {
        const notes = buildNotes(report([
            { name: 'a', version: '1.0.0', isFirstPublish: false, reason: '' },
        ]));

        const dataRow = notes.split('\n').find((l) => l.startsWith('| `a`'));
        expect(dataRow).not.toContain('；');
        expect(dataRow.trimEnd().endsWith('|')).toBe(true);
    });

    it('首次发布与来源同时存在时用分号连接', () =>
    {
        const notes = buildNotes(report([
            { name: 'a', version: '1.0.0', isFirstPublish: true, reason: '尚未发布过' },
        ]));

        expect(notes).toContain('**首次发布**；尚未发布过');
    });
});

describe('Release 正文/自动变更说明', () =>
{
    it('不带 withGenerated 时不请求 API，正文只有台账', async () =>
    {
        const notes = await composeReleaseNotes(report([
            { name: 'a', version: '1.0.0', isFirstPublish: false, reason: '' },
        ]));

        expect(notes).toContain('| `a` |');
        // 注意不能用 toContain('---') 判断：表格分隔行 |---|---|---| 里也有 ---，
        // 要检查的是「独立的水平分割线」，即整行只有三个短横线
        expect(notes.split('\n').some((l) => l.trim() === '---')).toBe(false);
    });

    it('缺参数时 fetchGeneratedNotes 直接返回空串（不发请求）', async () =>
    {
        expect(await fetchGeneratedNotes({})).toBe('');
        expect(await fetchGeneratedNotes({ owner: 'a', repo: 'b', tag: 'v1' })).toBe('');
        expect(await fetchGeneratedNotes({ owner: 'a', repo: 'b', token: 'x' })).toBe('');
    });

    it('withGenerated 但取不到自动说明时，明确标注而不是静默省略', async () =>
    {
        const notes = await composeReleaseNotes(report([
            { name: 'a', version: '1.0.0', isFirstPublish: false, reason: '' },
        ]), { withGenerated: true });

        expect(notes).toContain('（未能生成自动变更说明）');
    });
});
