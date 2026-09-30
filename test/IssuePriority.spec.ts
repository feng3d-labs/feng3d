import { describe, expect, it } from 'vitest';
import {
    PRIORITY_LEVELS,
    evaluateIssuePriorities,
    formatPriorityReport,
    labelNames,
} from '../scripts/issue-utils/issue-priority.mjs';

/**
 * issue 优先级标签的判定（issue #286）。
 *
 * 规范在 `docs/ISSUE_PRIORITY.md`：每条 issue 必须**恰好**带一个优先级标签。这条规范
 * 的执行者就是本文件测的这个纯函数 + `scripts/check-issue-priority.mjs`（对齐仓规 §15
 * 的元规则"每条规范必须有机器执行者"）。
 *
 * 为什么这段值得单测：**规范本身不会自我维持**。本次做 #285 时实测就抓到一条真实的漏标
 * （#337，而且是在同一个会话里刚创建的 issue）——"新 issue 忘了定级"不是假设，是会立刻
 * 发生的事。所以判定必须能可靠地报出：漏标、多标、以及档位写错。
 *
 * 这里只测纯函数（不碰网络与凭据）。真实数据的端到端跑法见 PR 说明。
 */
function issue(number: number, title: string, labels?: string[])
{
    return labels === undefined ? { number, title } : { number, title, labels };
}

describe('issue 优先级标签判定', () =>
{
    it('四档都合规时判定通过，并给出分布', () =>
    {
        const result = evaluateIssuePriorities([
            issue(1, '阻塞的', ['优先级-阻塞']),
            issue(2, '高的', ['优先级-高', '引擎']),
            issue(3, '中的', ['优先级-中']),
            issue(4, '低的', ['优先级-低', '工程基建']),
        ]);

        expect(result.ok).toBe(true);
        expect(result.total).toBe(4);
        expect(result.missing).toEqual([]);
        expect(result.duplicated).toEqual([]);
        expect(result.unknown).toEqual([]);
        expect(result.distribution).toEqual({
            '优先级-阻塞': 1,
            '优先级-高': 1,
            '优先级-中': 1,
            '优先级-低': 1,
        });
    });

    it('**漏标**必须被报出（这就是 #286 的验收场景）', () =>
    {
        const result = evaluateIssuePriorities([
            issue(1, '已定级的', ['优先级-中']),
            issue(337, '蒙皮闭环最后一块', ['新功能']), // ← 有别的标签，但没有优先级标签
            issue(99004, '连 labels 字段都没有'),
        ]);

        expect(result.ok).toBe(false);
        expect(result.missing).toHaveLength(2);
        // 报出的东西要能直接拿去修：带编号与标题
        expect(result.missing[0]).toContain('#337');
        expect(result.missing[0]).toContain('蒙皮闭环最后一块');
        expect(result.missing[1]).toContain('#99004');
        // 漏标的不能混进分布
        expect(result.distribution).toEqual({ '优先级-中': 1 });
    });

    it('**多标**必须被报出（档位自相矛盾），并列出是哪两个', () =>
    {
        const result = evaluateIssuePriorities([issue(2, '又高又中', ['优先级-高', '优先级-中'])]);

        expect(result.ok).toBe(false);
        expect(result.duplicated).toHaveLength(1);
        expect(result.duplicated[0]).toContain('#2');
        expect(result.duplicated[0]).toContain('优先级-高');
        expect(result.duplicated[0]).toContain('优先级-中');
        expect(result.distribution).toEqual({});
    });

    it('**非规范档位**必须被报出（拼错或新档次没进规范）', () =>
    {
        const result = evaluateIssuePriorities([
            issue(3, '档位拼错', ['优先级-急']),
            issue(4, '档次前缀对但档名错', ['优先级-P0']),
        ]);

        expect(result.ok).toBe(false);
        expect(result.unknown).toHaveLength(2);
        expect(result.unknown[0]).toContain('优先级-急');
        expect(result.distribution).toEqual({});
    });

    it('labels 用对象形态（GitHub API 另一种返回）也能识别', () =>
    {
        const result = evaluateIssuePriorities([
            { number: 5, title: '对象形态', labels: [{ name: '优先级-高' }, { name: '引擎' }] },
        ]);

        expect(result.ok).toBe(true);
        expect(result.distribution).toEqual({ '优先级-高': 1 });
    });

    it('空列表与非法入参不崩', () =>
    {
        for (const input of [[], undefined, null, 'not-an-array'])
        {
            const result = evaluateIssuePriorities(input as never);

            expect(result.total).toBe(0);
            expect(result.ok).toBe(true);
        }
    });

    it('labels 里的空值/非字符串被忽略，不会误判成"有标签"', () =>
    {
        expect(labelNames([null, undefined, 42, '', '优先级-中'])).toEqual(['优先级-中']);

        const result = evaluateIssuePriorities([issue(6, '只有垃圾标签', [])]);

        expect(result.ok).toBe(false);
        expect(result.missing).toHaveLength(1);
    });

    it('报告文本：合规时给出分布与通过标记', () =>
    {
        const result = evaluateIssuePriorities([issue(1, 'a', ['优先级-中']), issue(2, 'b', ['优先级-低'])]);
        const lines = formatPriorityReport(result, { source: 'test' });
        const text = lines.join('\n');

        expect(text).toContain('开放 2 条');
        expect(text).toContain('（test）');
        expect(text).toContain('优先级-中: 1');
        expect(text).toContain('优先级-低: 1');
        expect(text).toContain('✅');
    });

    it('报告文本：不合规时逐类列出，并给出可操作指引', () =>
    {
        const result = evaluateIssuePriorities([
            issue(1, '漏标了', ['引擎']),
            issue(2, '多标了', ['优先级-高', '优先级-低']),
            issue(3, '档位错了', ['优先级-急']),
        ]);
        const text = formatPriorityReport(result).join('\n');

        expect(text).toContain('❌');
        expect(text).toContain('#1 漏标了');
        expect(text).toContain('#2 多标了');
        expect(text).toContain('#3 档位错了');
        // 三类问题的标题各自出现
        expect(text).toContain('没有任何优先级标签');
        expect(text).toContain('多个');
        expect(text).toContain('非规范档位');
    });

    it('四档清单与规范文档一致（改档位必须同时改文档）', () =>
    {
        // 这份清单是 docs/ISSUE_PRIORITY.md §1/§4 里的四档；两处不一致就说明规范漂移了
        expect(PRIORITY_LEVELS).toEqual(['优先级-阻塞', '优先级-高', '优先级-中', '优先级-低']);
    });
});
