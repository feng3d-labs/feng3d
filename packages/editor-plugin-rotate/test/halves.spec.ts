import pkgJson from '../package.json';
import { checkPluginPackage, checkPluginPackageForInstall, resolveHalfEntries } from 'feng3d-editor';
import { describe, expect, it } from 'vitest';
import type { EditorPluginPackageJson } from 'feng3d-editor';

/**
 * 三端声明（#276 阶段 3）：插件包自己就是"三端齐全"的第一个真实样本。
 *
 * 这一组用例是**反向守门**：本包的 `package.json` 一旦漏了某一端、或自述与 `exports` 对不上，
 * 就当场失败——不必等到宿主装载时才发现。
 */
const pkg = pkgJson as EditorPluginPackageJson;

describe('三端声明', () =>
{
    it('本包的声明通过校验（无遗留问题）', () =>
    {
        expect(checkPluginPackage(pkg)).toEqual([]);
    });

    it('三端都能从 exports 解析出来：宿主 / 界面 / 游戏端', () =>
    {
        expect(resolveHalfEntries(pkg).declared).toEqual(['host', 'client', 'runtime']);
        expect(resolveHalfEntries(pkg).entries).toEqual({ host: '.', client: './client', runtime: './runtime' });
    });

    it('apiVersion 与当前编辑器兼容（与清单同一套规则）', () =>
    {
        expect(checkPluginPackageForInstall(pkg)).toEqual([]);
    });

    it('漏声明 apiVersion 会被拦下（不是"忘了也没事"）', () =>
    {
        const broken = { name: pkg.name, exports: pkg.exports } as EditorPluginPackageJson;

        expect(checkPluginPackage(broken).join('\n')).toMatch(/feng3dEditor/);
    });

    it('自述写了某端、exports 里却没有，会被拦下（避免"文档说三端、实际只有两端"）', () =>
    {
        const broken: EditorPluginPackageJson = {
            name: pkg.name,
            exports: { '.': './src/index.ts' },
            feng3dEditor: { apiVersion: '^1.0.0', halves: { runtime: './runtime' } },
        };

        expect(checkPluginPackage(broken).join('\n')).toMatch(/exports/);
    });
});
