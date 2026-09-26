import { describe, expect, it } from 'vitest';
import {
    compareVersions,
    highestVersion,
    nextPatchVersion,
    normalizeVersion,
    resolveBumpAllVersion,
    resolveDefaultVersion,
} from '../scripts/release-utils/release-version.mjs';

/**
 * 发布版本决策的单元测试。
 *
 * 这些函数决定「这次发布哪个版本号」，出错后果最重——npm 上已发布的版本不可撤回，
 * 发错只能再发一个版本来补救。所以这里把每条规则都钉住，特别是
 * 「绝不降级」这条：一旦发布版本低于 registry 上的最高版本，
 * `npm i <包名>` 会装到更旧的版本，而 npm 的 latest 标签也会往回指。
 */

describe('发布版本/normalizeVersion', () =>
{
    it('接受带 v 前缀与不带的语义化版本', () =>
    {
        expect(normalizeVersion('v0.6.1')).toBe('0.6.1');
        expect(normalizeVersion('0.6.1')).toBe('0.6.1');
        expect(normalizeVersion('refs/tags/v0.7.11')).toBe('0.7.11');
    });

    it('保留 prerelease 后缀', () =>
    {
        expect(normalizeVersion('v1.0.0-beta.1')).toBe('1.0.0-beta.1');
    });

    it('从更长的字符串里提取版本号（prerelease 后缀一并保留）', () =>
    {
        expect(normalizeVersion('release-0.6.1-final')).toBe('0.6.1-final');
        expect(normalizeVersion('refs/tags/v0.7.11')).toBe('0.7.11');
    });

    it('解析不出时返回空串', () =>
    {
        expect(normalizeVersion('')).toBe('');
        expect(normalizeVersion('master')).toBe('');
        expect(normalizeVersion(undefined)).toBe('');
    });
});

describe('发布版本/compareVersions', () =>
{
    it('按 major/minor/patch 逐段比较', () =>
    {
        expect(compareVersions('0.6.1', '0.6.0')).toBeGreaterThan(0);
        expect(compareVersions('0.6.0', '0.6.1')).toBeLessThan(0);
        expect(compareVersions('0.6.1', '0.6.1')).toBe(0);
        expect(compareVersions('1.0.0', '0.9.9')).toBeGreaterThan(0);
        expect(compareVersions('0.10.0', '0.9.0')).toBeGreaterThan(0);
    });

    it('正式版大于同号 prerelease 版（semver 约定）', () =>
    {
        expect(compareVersions('1.0.0', '1.0.0-beta.1')).toBeGreaterThan(0);
        expect(compareVersions('1.0.0-beta.1', '1.0.0')).toBeLessThan(0);
    });

    it('两侧都有 prerelease 时按字典序比较', () =>
    {
        expect(compareVersions('1.0.0-beta.2', '1.0.0-beta.1')).toBeGreaterThan(0);
        expect(compareVersions('1.0.0-alpha', '1.0.0-beta')).toBeLessThan(0);
    });

    it('位数不足的版本按 0 补齐', () =>
    {
        expect(compareVersions('1', '1.0.0')).toBe(0);
        expect(compareVersions('1.1', '1.0.9')).toBeGreaterThan(0);
    });
});

describe('发布版本/nextPatchVersion', () =>
{
    it('补丁号加一', () =>
    {
        expect(nextPatchVersion('0.6.4')).toBe('0.6.5');
        expect(nextPatchVersion('0.6.9')).toBe('0.6.10');
        expect(nextPatchVersion('1.0.0')).toBe('1.0.1');
    });

    it('丢弃 prerelease 后缀', () =>
    {
        expect(nextPatchVersion('1.0.0-beta.1')).toBe('1.0.1');
    });
});

describe('发布版本/highestVersion', () =>
{
    it('取最高版本而不是最大字符串', () =>
    {
        expect(highestVersion(['0.6.4', '1.0.0', '0.10.0'])).toBe('1.0.0');
        expect(highestVersion(['0.9.0', '0.10.0'])).toBe('0.10.0');
    });

    it('空数组返回 0.0.0', () =>
    {
        expect(highestVersion([])).toBe('0.0.0');
    });
});

describe('发布版本/resolveDefaultVersion（只升不降）', () =>
{
    it('本地版本落后时抬到目标版本', () =>
    {
        const result = resolveDefaultVersion({ name: 'p', version: '0.6.0' }, '0.6.1');

        expect(result.version).toBe('0.6.1');
        expect(result.reason).toContain('落后');
    });

    it('本地版本高于目标版本时保持原版本（不降级）', () =>
    {
        const result = resolveDefaultVersion({ name: 'p', version: '1.0.12' }, '0.6.1');

        expect(result.version).toBe('1.0.12');
        expect(result.reason).toBe('');
    });

    it('本地版本等于目标版本时保持', () =>
    {
        expect(resolveDefaultVersion({ name: 'p', version: '0.6.1' }, '0.6.1').version).toBe('0.6.1');
    });
});

describe('发布版本/resolveBumpAllVersion（保证每包发版）', () =>
{
    /** 构造 registry 现状；只给已发布版本时 latest 默认取最高版本 */
    const registry = (published, latest = highestVersion(published)) => ({ published, latest });

    it('首次发布用目标版本', () =>
    {
        const result = resolveBumpAllVersion({ name: 'p', version: '0.0.1' }, registry([]), '0.6.1');

        expect(result.version).toBe('0.6.1');
        expect(result.reason).toContain('首次发布');
    });

    it('本地落后、目标版本可用且不低于 latest 时抬到目标版本', () =>
    {
        const result = resolveBumpAllVersion({ name: 'p', version: '0.6.0' }, registry(['0.6.0']), '0.6.1');

        expect(result.version).toBe('0.6.1');
    });

    it('本地版本已被占用时递进补丁号', () =>
    {
        const result = resolveBumpAllVersion({ name: 'p', version: '0.8.3' }, registry(['0.8.3']), '0.6.1');

        expect(result.version).toBe('0.8.4');
        expect(result.reason).toContain('递进');
    });

    it('连续占用时一路递进到空位', () =>
    {
        const result = resolveBumpAllVersion(
            { name: 'p', version: '0.8.3' },
            registry(['0.8.3', '0.8.4', '0.8.5']),
            '0.6.1',
        );

        expect(result.version).toBe('0.8.6');
    });

    it('本地版本落后于 latest 时，从 latest 起递进（防降级回归）', () =>
    {
        // 真实案例：@feng3d/event 本地 0.6.4，但 npm latest 是 0.8.4。
        // 若只从本地版本往上找会算出 0.6.5 —— 那是让依赖方拿到更旧版本的降级发布。
        const result = resolveBumpAllVersion(
            { name: '@feng3d/event', version: '0.6.4' },
            registry(['0.6.4', '0.8.4'], '0.8.4'),
            '0.6.1',
        );

        expect(result.version).toBe('0.8.5');
        expect(compareVersions(result.version, '0.8.4')).toBeGreaterThan(0);
    });

    it('目标版本低于 latest 时不用目标版本（防降级回归）', () =>
    {
        // 本地 0.6.0、npm latest 0.8.0、目标 0.6.1：
        // 「本地落后就抬到目标版本」会算出 0.6.1，比 0.8.0 低 —— 降级发布。
        const result = resolveBumpAllVersion(
            { name: 'p', version: '0.6.0' },
            registry(['0.8.0'], '0.8.0'),
            '0.6.1',
        );

        expect(result.version).toBe('0.8.1');
        expect(compareVersions(result.version, '0.8.0')).toBeGreaterThan(0);
    });

    it('以 latest 而非「版本号最大值」为基准（历史怪异版本号回归）', () =>
    {
        // 真实案例：feng3d 发过日期式版本号 201810.3.0，语义化比较里高于 0.9.0，
        // 但 npm latest 是 0.9.0。按最大值算会发出 201810.3.1 并让 latest 乱跳。
        const result = resolveBumpAllVersion(
            { name: 'feng3d', version: '0.6.0' },
            registry(['0.9.0', '201810.3.0'], '0.9.0'),
            '0.6.1',
        );

        expect(result.version).toBe('0.9.1');
    });

    it('纯 registry 最高版本不会成为基准（防版本号跳跃）', () =>
    {
        const result = resolveBumpAllVersion(
            { name: 'p', version: '0.6.0' },
            registry(['0.6.0', '5.0.0'], '0.6.0'),
            '0.6.1',
        );

        // latest 是 0.6.0，所以基准取 max(0.6.0, 0.6.0, 0.6.1) = 0.6.1
        expect(result.version).toBe('0.6.1');
    });

    it('目标版本已被占用时不降级到目标版本，而是继续递进', () =>
    {
        const result = resolveBumpAllVersion(
            { name: 'p', version: '0.6.4' },
            registry(['0.6.1', '0.6.4'], '0.6.4'),
            '0.6.1',
        );

        expect(compareVersions(result.version, '0.6.4')).toBeGreaterThan(0);
    });

    it('任何情况下结果都不低于 latest，且不是已发布过的版本', () =>
    {
        const cases = [
            { local: '0.0.3', published: ['0.0.3', '0.0.8'], latest: '0.0.8', target: '0.6.1' },
            { local: '1.0.12', published: ['1.0.12', '1.0.13'], latest: '1.0.13', target: '0.6.1' },
            { local: '0.6.0', published: ['0.8.0'], latest: '0.8.0', target: '0.6.1' },
            { local: '0.6.0', published: [], latest: '', target: '0.6.1' },
            { local: '0.6.0', published: ['0.6.1'], latest: '0.6.1', target: '0.6.1' },
            { local: '0.6.4', published: ['0.8.4'], latest: '0.8.4', target: '0.6.1' },
        ];

        for (const item of cases)
        {
            const result = resolveBumpAllVersion(
                { name: 'p', version: item.local },
                { published: item.published, latest: item.latest },
                item.target,
            );

            const tuple = `local=${item.local} latest=${item.latest} target=${item.target} → ${result.version}`;
            if (item.latest)
            {
                expect(compareVersions(result.version, item.latest), tuple).toBeGreaterThanOrEqual(0);
            }
            expect(item.published, tuple).not.toContain(result.version);
        }
    });

    it('到处都被占用时抛错而不是死循环（防御性分支）', () =>
    {
        // base 取三者最大值，其上空位必然存在，所以真实 registry 触发不了这条分支。
        // 这里用一个「只含已占用版本、且本地版本更高」的病态输入把候选版本全部占掉，
        // 验证上限守卫确实会报错退出（而不是把流程挂住）。
        const published = Array.from({ length: 2000 }, (_, i) => `1.0.${i}`);
        const pathological = new Proxy(registry(published, '1.0.1999'), {
            get(target, prop, receiver)
            {
                if (prop === 'published')
                {
                    return new Proxy(published, {
                        get(p, key, r)
                        {
                            if (key === 'includes') return () => true;
                            return Reflect.get(p, key, r);
                        },
                    });
                }
                return Reflect.get(target, prop, receiver);
            },
        });

        expect(() => resolveBumpAllVersion({ name: 'p', version: '1.0.1999' }, pathological, '0.6.1'))
            .toThrow(/仍未找到未被占用的版本/);
    });

    it('递进几次就能找到空位时不报错', () =>
    {
        const result = resolveBumpAllVersion(
            { name: 'p', version: '1.0.9' },
            registry(Array.from({ length: 10 }, (_, i) => `1.0.${i}`)),
            '0.6.1',
        );

        expect(result.version).toBe('1.0.10');
    });
});
