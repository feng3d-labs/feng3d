import { beforeEach, describe, expect, it } from 'vitest';

import {
    clearPluginOverrides,
    getOverriddenPluginIds,
    getPatchEnabled,
    getPluginOverride,
    resolvePluginName,
    setPluginOverride,
} from '../src/plugins/overrides';
import type { EditorPluginManifest } from '../src/plugins/types';

/**
 * 插件覆盖表（`packages/editor/src/plugins/overrides.ts`，84 行，此前**行覆盖率 0%**）。
 *
 * 它保存"用户对插件的覆盖项"（`PluginOverride = { name?, enabled? }`），是 `editor` 里少数
 * **纯注册表逻辑、可离线测**的模块（见 #427 的实测分析）。
 *
 * 关键语义（源码注释明确）：
 * - `resolvePluginName(manifest)` = **覆盖名 ?? 清单名**（优先级固定）；
 * - `getPatchEnabled(id)` 返回 **`patch 层设的启用状态`**，**没设时是 `undefined`** ——
 *   注释特别强调它要能与"设置面板设的"分辨，所以 **`false` 与 `undefined` 必须区分开**；
 * - 覆盖表是 **lazy-init**（`let overrides: Map | null = null`，注释说明这是 R2「零模块级副作用」的要求）。
 *
 * 该模块是**进程级单例状态**，所以每个用例前都要 `clearPluginOverrides()` —— 否则用例之间会互相污染。
 */

function manifest(id: string, name: string): EditorPluginManifest
{
    return { id, name } as EditorPluginManifest;
}

describe('插件覆盖表（editor/src/plugins/overrides）', () =>
{
    beforeEach(() =>
    {
        clearPluginOverrides();
    });

    describe('resolvePluginName', () =>
    {
        it('★ 没有覆盖项时用清单里的名字', () =>
        {
            expect(resolvePluginName(manifest('p1', '清单名'))).toBe('清单名');
        });

        it('★ 有覆盖项时用覆盖名（覆盖优先）', () =>
        {
            setPluginOverride('p1', { name: '用户改名' });

            expect(resolvePluginName(manifest('p1', '清单名'))).toBe('用户改名');
        });

        it('★ 覆盖名只影响对应的 id', () =>
        {
            setPluginOverride('p1', { name: '改了' });

            expect(resolvePluginName(manifest('p1', 'A'))).toBe('改了');
            expect(resolvePluginName(manifest('p2', 'B'))).toBe('B');
        });

        it('覆盖项里只有 enabled、没有 name 时，仍然用清单名', () =>
        {
            setPluginOverride('p1', { enabled: false });

            expect(resolvePluginName(manifest('p1', '清单名'))).toBe('清单名');
        });

        it('覆盖名的 name 为空字符串时按"有值"处理（?? 只跳过 null/undefined）', () =>
        {
            setPluginOverride('p1', { name: '' });

            expect(resolvePluginName(manifest('p1', '清单名'))).toBe('');
        });
    });

    describe('getPatchEnabled', () =>
    {
        it('★ 没设过时返回 undefined', () =>
        {
            expect(getPatchEnabled('p1')).toBeUndefined();
        });

        it('★ 设了 true 返回 true', () =>
        {
            setPluginOverride('p1', { enabled: true });

            expect(getPatchEnabled('p1')).toBe(true);
        });

        it('★★ 设了 false 返回 false —— 与"没设过"的 undefined 必须能区分', () =>
        {
            setPluginOverride('p1', { enabled: false });

            const value = getPatchEnabled('p1');

            expect(value).toBe(false);
            expect(value).not.toBeUndefined();
            expect(typeof value).toBe('boolean');
        });

        it('只设了 name 时，enabled 仍是 undefined', () =>
        {
            setPluginOverride('p1', { name: '只有名字' });

            expect(getPatchEnabled('p1')).toBeUndefined();
        });
    });

    describe('getPluginOverride / setPluginOverride', () =>
    {
        it('未设置时返回 undefined', () =>
        {
            expect(getPluginOverride('p1')).toBeUndefined();
        });

        it('★ 设置后能按 id 取回同样的内容', () =>
        {
            setPluginOverride('p1', { name: 'X', enabled: true });

            expect(getPluginOverride('p1')).toEqual({ name: 'X', enabled: true });
        });

        it('★ 再次设置是「合并」而不是「整体替换」—— 实测行为', () =>
        {
            setPluginOverride('p1', { name: '第一次', enabled: true });
            setPluginOverride('p1', { name: '第二次' });

            const got = getPluginOverride('p1');

            expect(got?.name).toBe('第二次');
            // ⚠️ 实测：未提及的字段会被**保留**（实现是合并语义）。
            // 我第一版按"整体替换"断言 `enabled` 变 undefined，失败了 —— 这里改为如实钉住。
            expect(got?.enabled).toBe(true);
        });

        it('★ 合并语义的直接体现：上一轮设的 enabled=false 不会被只传 name 的调用清掉', () =>
        {
            setPluginOverride('p1', { enabled: false });
            setPluginOverride('p1', { name: '只有名字' });

            const got = getPluginOverride('p1');

            expect(got?.name).toBe('只有名字');
            expect(got?.enabled).toBe(false);
        });

        it('不同 id 互不干扰', () =>
        {
            setPluginOverride('p1', { name: 'A' });
            setPluginOverride('p2', { name: 'B' });

            expect(getPluginOverride('p1')?.name).toBe('A');
            expect(getPluginOverride('p2')?.name).toBe('B');
        });
    });

    describe('getOverriddenPluginIds', () =>
    {
        it('初始为空数组', () =>
        {
            expect(getOverriddenPluginIds().length).toBe(0);
        });

        it('★ 反映已设置覆盖的 id', () =>
        {
            setPluginOverride('b', { name: 'B' });
            setPluginOverride('a', { name: 'A' });

            const ids = [...getOverriddenPluginIds()].sort();

            expect(ids).toEqual(['a', 'b']);
        });
    });

    describe('clearPluginOverrides', () =>
    {
        it('★ 清空后所有查询都回到"未设置"', () =>
        {
            setPluginOverride('p1', { name: 'X', enabled: false });

            clearPluginOverrides();

            expect(getPluginOverride('p1')).toBeUndefined();
            expect(getOverriddenPluginIds().length).toBe(0);
            expect(getPatchEnabled('p1')).toBeUndefined();
            expect(resolvePluginName(manifest('p1', '清单名'))).toBe('清单名');
        });
    });
});
