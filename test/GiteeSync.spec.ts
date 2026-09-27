import { describe, expect, it } from 'vitest';
import { evaluateSync, explainPushFailure } from '../scripts/sync-utils/gitee-sync.mjs';

/**
 * Gitee 镜像同步的结论判定（issue #107）。
 *
 * 为什么这段值得单测：同步失败的原因通常不在代码里，而在 **Gitee 侧的仓库设置**
 * （`master` 是保护分支，直接推送被拒）。结论必须带着可操作的提示，
 * 否则调用方只能看到一句 "push failed"，然后去 Gitee 网页上瞎找。
 */
describe('Gitee 镜像同步结论', () =>
{
    const shaA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const shaB = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

    it('两侧一致时判定为已同步', () =>
    {
        const result = evaluateSync(shaA, shaA);

        expect(result.synced).toBe(true);
        expect(result.summary).toContain('一致');
        expect(result.summary).toContain('aaaaaaaa');   // 短 SHA（前 8 位）
        expect(result.summary).not.toContain(shaA);     // 不打整串
    });

    it('两侧不一致时给出 push 提示（含保护分支的线索）', () =>
    {
        const result = evaluateSync(shaA, shaB);

        expect(result.synced).toBe(false);
        expect(result.summary).toContain('aaaaaaaa');
        expect(result.summary).toContain('bbbbbbbb');
        expect(result.hint).toContain('保护');
    });

    it('源侧 SHA 缺失时提示先 fetch', () =>
    {
        for (const missing of [null, undefined, ''])
        {
            const result = evaluateSync(missing, shaB);

            expect(result.synced).toBe(false);
            expect(result.hint).toContain('git fetch origin master');
        }
    });

    it('镜像侧 SHA 缺失时提示检查 gitee 凭据与 remote', () =>
    {
        const result = evaluateSync(shaA, null);

        expect(result.synced).toBe(false);
        expect(result.hint).toContain('git fetch gitee master');
        expect(result.hint).toContain('凭据');
    });
});

describe('Gitee push 失败信息翻译', () =>
{
    it('保护分支 / 认证失败 / 网络不可达各给一条可操作提示', () =>
    {
        expect(explainPushFailure('remote: error: No permission to push this protected branch'))
            .toContain('分支设置');
        expect(explainPushFailure('fatal: Authentication failed for https://gitee.com/x/y.git'))
            .toContain('~/.git-credentials');
        expect(explainPushFailure('fatal: unable to access ... Could not resolve host: gitee.com'))
            .toContain('网络不可达');
    });

    it('认不出的失败也给出"看原始输出"的兜底，而不是空提示', () =>
    {
        expect(explainPushFailure('something weired happened')).toContain('原始输出');
        expect(explainPushFailure('')).toContain('原始输出');
    });
});
