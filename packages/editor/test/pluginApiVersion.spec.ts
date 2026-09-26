import { beforeEach, describe, expect, it } from 'vitest';
import {
    BUILTIN_PLUGINS,
    EDITOR_PLUGIN_API_VERSION,
    assertPluginApiVersions,
    checkApiVersion,
    getPlugins,
    parseVersion,
    registerPlugins,
    resetPlugins,
} from '../src/plugins';
import type { EditorPluginManifest } from '../src/plugins';

/**
 * 插件 API 版本契约（issue #171）。
 *
 * 被测的是三件事：**判据说得清**（^ / ~ / 精确各自什么意思）、**报错说得清**
 * （要什么、现在是什么）、**注册表不被坏插件污染**（事务性）。
 */

/** 造一份最小清单（可指定版本声明） */
function manifest(id: string, apiVersion?: string): EditorPluginManifest
{
    return {
        id,
        name: id,
        ...(apiVersion === undefined ? {} : { apiVersion }),
        contributes: { panels: [{ id: `${id}-panel`, labelKey: 'k', view: () => Promise.resolve({}), placement: 'main' }] },
    };
}

beforeEach(() =>
{
    resetPlugins();
});

describe('版本解析', () =>
{
    it('认得出 ^X.Y.Z / ~X.Y.Z / X.Y.Z', () =>
    {
        expect(parseVersion('^1.2.3')).toMatchObject({ major: 1, minor: 2, patch: 3, caret: true, tilde: false });
        expect(parseVersion('~1.2.3')).toMatchObject({ caret: false, tilde: true });
        expect(parseVersion('1.2.3')).toMatchObject({ caret: false, tilde: false });
    });

    it('不认范围表达式（刻意不做半套 semver）', () =>
    {
        for (const text of ['>=1.0.0', '1.x', '*', '1', '1.2', '^1.2'])
        {
            expect(parseVersion(text), `${text} 不该被接受`).toBeNull();
        }
    });
});

describe('兼容判据', () =>
{
    it('主版本相同 + 不低于要求 → 兼容（^）', () =>
    {
        expect(checkApiVersion(`^${EDITOR_PLUGIN_API_VERSION}`).compatible).toBe(true);
        expect(checkApiVersion('^1.0.0').compatible).toBe(true);
    });

    it('精确写法必须完全相同', () =>
    {
        expect(checkApiVersion(EDITOR_PLUGIN_API_VERSION).compatible).toBe(true);
        const check = checkApiVersion('1.0.1');
        expect(check.compatible).toBe(false);
        expect(check.reason).toContain('完全等于');
        expect(check.reason).toContain(EDITOR_PLUGIN_API_VERSION);
    });

    it('主版本不同 → 不兼容，且理由里要什么/现在是什么都在', () =>
    {
        const check = checkApiVersion('^2.0.0');
        expect(check.compatible).toBe(false);
        expect(check.reason).toContain('^2.0.0');
        expect(check.reason).toContain(EDITOR_PLUGIN_API_VERSION);
    });

    it('~ 要求次版本也相同', () =>
    {
        const check = checkApiVersion('~1.9.0');
        expect(check.compatible).toBe(false);
        expect(check.reason).toContain('1.9.x');
    });

    it('没声明 → 不兼容（契约不能是可选的）', () =>
    {
        const check = checkApiVersion(undefined);
        expect(check.compatible).toBe(false);
        expect(check.reason).toContain('没有声明');
        expect(check.reason).toContain(EDITOR_PLUGIN_API_VERSION);
    });

    it('写法不合法 → 不兼容，并列出合法写法', () =>
    {
        const check = checkApiVersion('>=1.0.0');
        expect(check.compatible).toBe(false);
        expect(check.reason).toContain('^X.Y.Z');
    });
});

describe('注册时的契约检查', () =>
{
    it('未声明版本的插件被拒绝，且注册表保持原样（事务性）', () =>
    {
        expect(() => registerPlugins([manifest('p-no-version')])).toThrow(/没有声明/);
        expect(getPlugins()).toEqual([]);
    });

    it('不兼容的插件被拒绝，报错点名插件与原因', () =>
    {
        expect(() => registerPlugins([manifest('p-future', '^9.0.0')])).toThrow(/p-future/);
        expect(() => registerPlugins([manifest('p-future', '^9.0.0')])).toThrow(/当前编辑器 API 版本是/);
        expect(getPlugins()).toEqual([]);
    });

    it('一批里有一个不兼容就整批不登记（不留半套）', () =>
    {
        expect(() => registerPlugins([manifest('p-ok', '^1.0.0'), manifest('p-bad', '^9.0.0')])).toThrow(/p-bad/);
        expect(getPlugins()).toEqual([]);
    });

    it('断言函数可以直接用（给需要前置检查的调用方）', () =>
    {
        expect(() => assertPluginApiVersions([manifest('p-ok', '^1.0.0')])).not.toThrow();
        expect(() => assertPluginApiVersions([manifest('p-bad', '9.9.9')])).toThrow(/p-bad/);
    });
});

describe('内置插件的契约', () =>
{
    it('每个内置插件都声明了与当前版本兼容的 API 版本', () =>
    {
        const bad = BUILTIN_PLUGINS
            .map((plugin) => ({ id: plugin.id, check: checkApiVersion(plugin.apiVersion) }))
            .filter((entry) => !entry.check.compatible);

        expect(bad.map((entry) => `${entry.id}：${entry.check.reason}`)).toEqual([]);
    });

    it('登记内置插件不会因为契约失败（安装入口真的能用）', () =>
    {
        expect(() => registerPlugins([...BUILTIN_PLUGINS], 'builtin')).not.toThrow();
        expect(getPlugins().length).toBe(BUILTIN_PLUGINS.length);
    });
});
