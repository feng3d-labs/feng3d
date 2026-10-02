/**
 * **发布白名单**的共用判定（#277 任务 3）。
 *
 * ## 为什么抽出来
 *
 * 同一个问题有**两个发现时机**，而它们必须用同一把尺子：
 *
 * | 谁 | 什么时候 | 覆盖范围 |
 * |---|---|---|
 * | `scripts/check-editor-publish-files.mjs` | 平时手跑 / 门禁 | 只看 `packages/editor` |
 * | `scripts/release-packages.mjs` 的 `validatePackedFiles` | `npm run release:dry-run` **打包时** | 每个要发布的包 |
 *
 * 两个时机的判定必须是**同一份实现**——否则"门禁绿、dry-run 红"（或反过来）会让人怀疑是不是自己眼花了。
 * 共用的另一半理由是：抽出来之后纯函数可以被单测直接喂输入，不必起真发布流程。
 *
 * ## 它检查什么
 *
 * `window.open('packages/codeeditor/codeeditor.html')` 这类**运行时才取**的仓库内路径，
 * 必须在 `package.json` 的 `files` 覆盖范围内。`release:dry-run` 原本只查
 * `main` / `module` / `types` / `bin` 指向的文件——**看不到**这类路径，
 * 于是"本地一切正常、发布版 404"。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 判断白名单是否覆盖某个包内相对路径。
 *
 * npm 的 `files` 语义：写目录名等于带上整棵子树，写文件名只带那一个。
 *
 * @param {string} path 相对**包根**的路径（正斜杠）
 * @param {readonly string[]} files 白名单
 * @returns {boolean} 是否被覆盖
 */
export function coveredByFiles(path, files)
{
    return files.some((entry) => path === entry || path.startsWith(`${entry}/`));
}

/**
 * 递归收集目录下指定后缀的文件。
 *
 * @param {string} dir 目录
 * @param {string} suffix 后缀过滤
 * @returns {string[]} 文件路径（绝对）
 */
function collect(dir, suffix)
{
    const found = [];

    for (const entry of readdirSync(dir, { withFileTypes: true }))
    {
        const full = join(dir, entry.name);

        if (entry.isDirectory()) found.push(...collect(full, suffix));
        else if (entry.name.endsWith(suffix)) found.push(full);
    }

    return found;
}

/**
 * 找出源码里"**运行时才取**的仓库内路径"。
 *
 * 只扫 `window.open(...)`：它是本仓出现过的唯一形态，而**刻意不做成"扫所有字符串字面量"**
 * ——那会把大量无关字符串卷进来，判据立刻变成噪音。
 *
 * @param {string} packageRoot 包根目录（绝对路径）
 * @returns {Map<string, string>} 路径（相对包根）→ 出现的源文件（绝对路径）
 */
export function findRuntimeRepoPaths(packageRoot)
{
    /** @type {Map<string, string>} */
    const paths = new Map();
    const src = join(packageRoot, 'src');

    if (!existsSync(src)) return paths;

    for (const file of collect(src, '.ts'))
    {
        const code = readFileSync(file, 'utf8');
        // 目标既可能是普通字符串，也可能是**模板字符串**——实现里用的正是反引号，
        // 只匹配引号会一个都扫不到（第一版就这么空转了）
        const pattern = new RegExp('window\\.open\\(\\s*[`\'"]([^`\'"]+)[`\'"]', 'g');

        for (const match of code.matchAll(pattern))
        {
            const target = match[1].split('?')[0];

            // 只关心"仓库内的相对路径"：外链、锚点、绝对 URL 都不算
            if (/^[a-z]+:/i.test(target) || target.startsWith('//') || target.startsWith('#')) continue;

            paths.set(target.replace(/^\.?\//, ''), file);
        }
    }

    return paths;
}

/**
 * 校验一个包的发布白名单是否覆盖它**运行时才取**的路径。
 *
 * 与 `validatePackedFiles` 的分工：那一半查"入口指向的文件在不在 tarball 里"，
 * 这一半查"运行时才取的路径在不在 files 里"——两者都必须过，包才算可用。
 *
 * @param {string} packageRoot 包根目录（绝对路径）
 * @param {object} manifest 该包的 package.json 内容
 * @returns {{ ok: boolean, reasons: string[], paths: Map<string, string> }} 结果（`paths` 供"空转检查"用）
 */
export function checkPublishFiles(packageRoot, manifest)
{
    const files = Array.isArray(manifest?.files) ? manifest.files : [];
    const paths = findRuntimeRepoPaths(packageRoot);
    const reasons = [];

    for (const path of paths.keys())
    {
        if (!coveredByFiles(path, files))
        {
            reasons.push(`运行时才取的路径 \`${path}\` 不被 files 白名单覆盖（发布后会 404）`);
        }
    }

    return { ok: reasons.length === 0, reasons, paths };
}
