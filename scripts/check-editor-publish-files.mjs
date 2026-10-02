#!/usr/bin/env node
/**
 * **发布白名单覆盖检查**（#277 任务 3 的执行者）。
 *
 * ## 它解决什么
 *
 * `packages/editor/src/ScriptCompiler.ts` 里有 `window.open('packages/codeeditor/codeeditor.html')`
 * ——**页面运行时**才会去取这个路径。而 `package.json` 的 `files` 白名单原来**不含 `packages/`**，
 * 于是**发布版必然 404**，本地却一切正常。
 *
 * `npm run release:dry-run` 拦不住这类问题：它校验的是 `main` / `module` / `types` / `bin`
 * 指向的文件在不在 tarball 里——**运行时才取的路径不在它的视野内**。
 *
 * 所以这里补一个执行者：把源码里"运行时才取的仓库内路径"找出来，逐个检查是否被白名单覆盖。
 *
 * ## 顺带说明
 *
 * 按 D11，`packages/codeeditor` 的脚本编辑职责**最终要交给 VS Code Web**，那之后这条引用会被删。
 * 但"先删引用"和"先把发布修对"是两件事：在它还在的这段时间里，发布版不该 404。
 *
 * 用法：
 *   node scripts/check-editor-publish-files.mjs
 *
 * 退出码：0 全部覆盖；1 有未覆盖的路径。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const EDITOR = join(ROOT, 'packages', 'editor');

let total = 0;
let failed = 0;

/**
 * 记一条判据。
 *
 * @param {string} title 判据
 * @param {boolean} condition 是否通过
 * @param {string} detail 附加说明
 */
function check(title, condition, detail = '')
{
    total++;
    if (condition) console.log(`  PASS  ${title}${detail ? ` — ${detail}` : ''}`);
    else { failed++; console.log(`  FAIL  ${title}${detail ? ` — ${detail}` : ''}`); }
}

/**
 * 递归收集文件。
 *
 * @param {string} dir 目录
 * @param {string} suffix 后缀过滤
 * @returns {string[]} 文件路径
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
 * 判断白名单是否覆盖某个仓库内相对路径。
 *
 * npm 的 `files` 语义：写目录名等于带上整棵子树，写文件名只带那一个。
 *
 * @param {string} path 相对**包根**的路径（正斜杠）
 * @param {string[]} files 白名单
 * @returns {boolean} 是否被覆盖
 */
function covered(path, files)
{
    return files.some((entry) => path === entry || path.startsWith(`${entry}/`));
}

console.log('[发布白名单] #277：运行时才取的仓库内路径，必须在 `files` 里');

const manifest = JSON.parse(readFileSync(join(EDITOR, 'package.json'), 'utf8'));
const files = Array.isArray(manifest.files) ? manifest.files : [];

// ---------- 方法自证：白名单语义得判对，否则下面的通过毫无意义 ----------
check('方法自证：目录条目覆盖其子树', covered('packages/codeeditor/x.html', ['packages']) === true);
check('方法自证：未列出的路径不算被覆盖', covered('libs/feng3d.js', ['packages']) === false);

// ---------- 找出源码里"运行时才取的仓库内路径" ----------
const runtimePaths = new Map();

for (const file of collect(join(EDITOR, 'src'), '.ts'))
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

        runtimePaths.set(target.replace(/^\.?\//, ''), file.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, ''));
    }
}

check('扫到了运行时才取的仓库内路径（否则这条检查是空转）', runtimePaths.size > 0,
    [...runtimePaths.keys()].join(', '));

for (const [path, source] of runtimePaths)
{
    check(`发布白名单覆盖 \`${path}\``, covered(path, files), `来自 ${source}`);
}

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 发布白名单未覆盖——这类路径本地正常、**发布版 404**，'
        + '而 `release:dry-run` 看不到它们（它只查 main/module/types/bin）。');
    process.exit(1);
}

console.log('✅ 发布白名单通过：运行时才取的仓库内路径都在 `files` 覆盖范围内');
