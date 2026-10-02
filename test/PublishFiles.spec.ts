import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { checkPublishFiles, coveredByFiles, findRuntimeRepoPaths } from '../scripts/release-utils/publish-files.mjs';

/**
 * 发布白名单判定（#277 任务 3 的**共用实现**）。
 *
 * 这层被两个时机用**同一把尺子**量：CI 门禁 `scripts/check-editor-publish-files.mjs`
 * 与 `npm run release:dry-run`（`release-packages.mjs` 的 `validatePackedFiles`）。
 * 所以这里守判定本身；"release 侧真的接了线"由那条门禁脚本的接线判据守
 * （两边都守，是因为它们的坏法不同：前者错在判定写错，后者错在接线被删）。
 *
 * 用**合成包目录**驱动纯函数，不起真发布流程——那样几十秒才能跑一轮，也没法构造
 * "模板字符串 / 外链"这些边界。
 */
describe('发布白名单判定（共用实现）', () =>
{
    /** 合成包目录：`src/` 下铺几种 `window.open` 的写法 */
    let packageRoot = '';

    beforeAll(() =>
    {
        packageRoot = mkdtempSync(join(tmpdir(), 'feng3d-publish-files-'));

        mkdirSync(join(packageRoot, 'src', 'deep'), { recursive: true });

        // ① 普通字符串
        writeFileSync(join(packageRoot, 'src', 'a.ts'), "window.open('packages/codeeditor/a.html');\n", 'utf8');
        // ② **模板字符串**——真实实现用的就是这种；只匹配引号会一个都扫不到（第一版就这么空转了）
        writeFileSync(join(packageRoot, 'src', 'deep', 'b.ts'), 'window.open(`packages/codeeditor/b.html?x=1`);\n', 'utf8');
        // ③ 外链与锚点：不是"仓库内路径"，不该被算进来
        writeFileSync(join(packageRoot, 'src', 'c.ts'),
            "window.open('https://example.com/x');\nwindow.open('#anchor');\n", 'utf8');
    });

    afterAll(() =>
    {
        rmSync(packageRoot, { recursive: true, force: true });
    });

    it('coveredByFiles：目录条目覆盖子树，未列出的不算', () =>
    {
        expect(coveredByFiles('packages/codeeditor/x.html', ['packages'])).toBe(true);
        expect(coveredByFiles('packages', ['packages'])).toBe(true);
        expect(coveredByFiles('libs/feng3d.js', ['packages'])).toBe(false);
        // 前缀相似但不是子路径——用 startsWith 时最容易漏掉的一种
        expect(coveredByFiles('packages-extra/x.js', ['packages'])).toBe(false);
    });

    it('findRuntimeRepoPaths：字符串与**模板字符串**都扫得到，外链/锚点不算', () =>
    {
        const paths = findRuntimeRepoPaths(packageRoot);

        // 空转检查：必须真的扫到东西，否则下面那条"相等"毫无意义
        expect(paths.size, '一条都没扫到 = 判据空转').toBe(2);
        expect([...paths.keys()].sort()).toEqual(['packages/codeeditor/a.html', 'packages/codeeditor/b.html']);
    });

    it('checkPublishFiles：覆盖 → ok；不覆盖 → reasons 点名那条路径', () =>
    {
        const covered = checkPublishFiles(packageRoot, { files: ['src', 'packages'] });

        expect(covered.ok).toBe(true);
        expect(covered.reasons).toEqual([]);

        const missing = checkPublishFiles(packageRoot, { files: ['src'] });

        expect(missing.ok).toBe(false);
        expect(missing.reasons.join('\n')).toMatch(/packages\/codeeditor\/a\.html/);
        expect(missing.reasons.join('\n')).toMatch(/404/);
    });

    it('没有 src/ 的包不算失败（判定不该对无关包报假错）', () =>
    {
        const empty = mkdtempSync(join(tmpdir(), 'feng3d-publish-files-empty-'));

        try
        {
            expect(checkPublishFiles(empty, { files: [] }).ok).toBe(true);
        }
        finally
        {
            rmSync(empty, { recursive: true, force: true });
        }
    });
});
