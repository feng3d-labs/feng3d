#!/usr/bin/env node
/**
 * **发布白名单覆盖检查**（#277 任务 3 的执行者）。
 *
 * ## 它解决什么
 *
 * 当初是 `packages/editor/src/ScriptCompiler.ts` 里的 `window.open('packages/codeeditor/codeeditor.html')`
 * ——**页面运行时**才会去取这个路径。而 `package.json` 的 `files` 白名单原来**不含 `packages/`**，
 * 于是**发布版必然 404**，本地却一切正常。
 *
 * （那条引用与那两个模块**都已删除**：`ScriptCompiler.ts` 随 #275、`packages/codeeditor/` 随 D11。
 * 现在扫到的是 `run.html` —— 判据本身照旧，只是样本换了。）
 *
 * `npm run release:dry-run` 拦不住这类问题：它校验的是 `main` / `module` / `types` / `bin`
 * 指向的文件在不在 tarball 里——**运行时才取的路径不在它的视野内**。
 *
 * ## 现在两个时机共用同一份判定
 *
 * 判定已抽到 [release-utils/publish-files.mjs](release-utils/publish-files.mjs)：
 * 本脚本用它，`scripts/release-packages.mjs` 的 `validatePackedFiles` 也用它。
 * 于是"门禁绿、dry-run 红"（或反过来）这种自相矛盾不会出现——两处**同一把尺子**。
 *
 * ## 顺带说明
 *
 * 它守的**不是某一条具体路径**，而是这一类：**凡"页面运行时才去取"的仓库内路径，都得在 `files` 里**。
 * 所以样本会随仓库变化（`codeeditor.html` → `run.html`），判据不变。
 *
 * 用法：
 *   node scripts/check-editor-publish-files.mjs
 *
 * 退出码：0 全部覆盖；1 有未覆盖的路径。
 */
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { coveredByFiles, findRuntimeRepoPaths } from './release-utils/publish-files.mjs';

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
 * 把绝对路径显示成相对仓库根的正斜杠路径。
 *
 * @param {string} file 绝对路径
 * @returns {string} 显示用路径
 */
function display(file)
{
    return relative(ROOT, file).split('\\').join('/');
}

console.log('[发布白名单] #277：运行时才取的仓库内路径，必须在 `files` 里');

const manifest = JSON.parse(readFileSync(join(EDITOR, 'package.json'), 'utf8'));
const files = Array.isArray(manifest.files) ? manifest.files : [];

// ---------- 方法自证：白名单语义得判对，否则下面的通过毫无意义 ----------
check('方法自证：目录条目覆盖其子树', coveredByFiles('packages/editor/public/run.html', ['packages']) === true);
check('方法自证：未列出的路径不算被覆盖', coveredByFiles('libs/feng3d.js', ['packages']) === false);

// ---------- 接线自证：`release:dry-run` 必须用**同一份**判定 ----------
// 这条守的是"接线还在"：`release-packages.mjs` 一旦不再调共用实现，两个时机会重新分叉
// ——门禁绿、dry-run 也绿，而**发布版照样 404**（那正是这条检查存在的理由）。
//
// 它刻意做成**文本级**断言，理由说清楚：release 侧的校验要跑真 `npm pack` 才到得了，
// 而这里要守的只是"接线没被删掉"；同时它带空转检查（正则没匹配到就失败），
// 不会出现"什么都没扫到却报通过"。
const releaseSource = readFileSync(join(ROOT, 'scripts', 'release-packages.mjs'), 'utf8');
const releaseImport = /import\s*\{[^}]*checkPublishFiles[^}]*\}\s*from\s*'\.\/release-utils\/publish-files\.mjs'/.test(releaseSource);
const releaseCall = /checkPublishFiles\(pkg\.packageRoot, pkg\.manifest\)/.test(releaseSource);

check('★ 「release:dry-run 用同一份判定」的接线还在（import + 调用都要有）',
    releaseImport && releaseCall,
    `import=${releaseImport} 调用=${releaseCall}`);

// ---------- 找出源码里"运行时才取的仓库内路径" ----------
const runtimePaths = findRuntimeRepoPaths(EDITOR);

check('扫到了运行时才取的仓库内路径（否则这条检查是空转）', runtimePaths.size > 0,
    [...runtimePaths.keys()].join(', '));

for (const [path, source] of runtimePaths)
{
    check(`发布白名单覆盖 \`${path}\``, coveredByFiles(path, files), `来自 ${display(source)}`);
}

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 发布白名单未覆盖——这类路径本地正常、**发布版 404**，'
        + '而 `release:dry-run` 看不到它们（它只查 main/module/types/bin）。');
    process.exit(1);
}

console.log('✅ 发布白名单通过：运行时才取的仓库内路径都在 `files` 覆盖范围内');
