/**
 * 代码里的文档路径引用，必须指向真实存在的文件。
 *
 * ## 为什么需要它
 *
 * `check-docs-links.mjs` 只扫 `.md` 文件里的相对链接；而 `.ts` / `.mjs` / `.json` / `.yml`
 * 里同样大量引用文档路径（实测 **140+ 处 / 85 个文件**）。这些引用此前**没有任何执行者**——
 * 文档一旦移动或改名，它们**静默失效**：编译器不管、链接检查也扫不到。
 *
 * 本仓已经为此付过一次代价：把 3 份迁移文档移入 `docs/migrations/` 时，**39 处引用失效**，
 * 散在 **26 个 `packages/math/**` 源码文件**的注释里，只能靠手工全仓扫描才发现
 * （而且第一次扫描还漏了 `.ts` 文件）。
 *
 * ## 判据
 *
 * 代码/脚本/数据文件里出现的每个文档路径，至少要能被**以下三种基准之一**解析到真实文件：
 *
 * 1. **仓库根**——根级代码与 `scripts/` 的惯例（`docs/CI.md`）；
 * 2. **文件所属包根**——包内代码的惯例（`packages/editor/src/x.ts` 里写 `docs/PLUGINS.md`
 *    指的是 `packages/editor/docs/PLUGINS.md`）；
 * 3. **文件所在目录**——相对路径（`../docs/x.md`）。
 *
 * 三者都不命中才算失效。`http(s)` URL 先剥离，不参与判定。
 *
 * ## 不做的事（有意）
 *
 * - **不检查 `issue #NNN` 之类稳定标识**：它们不需要文件存在性。
 * - **不强制改写**：存量不批量改（会制造与它们等量的 diff）；本门禁只保证"失效能被发现"。
 *   新代码请优先用稳定标识（见根 `AGENTS.md` §14）。
 *
 * 用法：`node scripts/check-doc-refs-in-code.mjs`
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const ROOT = process.cwd();
const SELF = 'scripts/check-doc-refs-in-code.mjs';
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.temp', '.verify', '.playwright-mcp', 'logs']);
const EXTS = ['.ts', '.mjs', '.js', '.json', '.yml', '.yaml'];
// 带前缀（foo/bar/docs/X.md）或不带前缀（docs/X.md，前面不能是路径字符）
const REF_RE = /(?:[A-Za-z0-9_.@-]+\/|\.\.\/)+docs\/[A-Za-z0-9_./-]+\.md|(?<![\w/.-])docs\/[A-Za-z0-9_./-]+\.md/g;
const URL_RE = /https?:\/\/[^\s)>\]}'"]+/g;

const toPosix = (p) => p.split('\\').join('/');

/** 依次按「仓库根 / 所属包根 / 文件所在目录」解析 */
function resolves(token, fileAbs) {
    const bases = [ROOT];
    const rel = toPosix(fileAbs.slice(ROOT.length + 1));
    const pkg = rel.match(/^packages\/([^/]+)\//);
    if (pkg) bases.push(join(ROOT, 'packages', pkg[1]));
    bases.push(dirname(fileAbs));
    return bases.some((b) => existsSync(resolve(b, token)));
}

// ── 判据自证（启动时先跑；失败即 exit 1，避免判据本身写坏而静默全绿）────────────
const SELF_CHECK = [
    ['docs/CI.md', '/scripts/x.mjs', true], // 仓库根基准
    ['docs/PLUGINS.md', '/packages/editor/src/x.ts', true], // 包根基准
    ['./CI.md', '/docs/whatever.mjs', true], // 相对：同目录
    ['../../../docs/CI.md', '/packages/editor/src/x.ts', true], // 相对：回溯到根 docs
    ['docs/__no_such_file__.md', '/scripts/x.mjs', false],
    ['packages/editor/docs/__no_such_file__.md', '/scripts/x.mjs', false],
];
for (const [token, fake, expected] of SELF_CHECK) {
    if (resolves(token, ROOT + fake.split('/').join('\\')) !== expected) {
        console.error(`❌ 判据自证失败：「${token}」在 ${fake} 下应解析为 ${expected}`);
        process.exit(1);
    }
}

function walk(dir, out = []) {
    let ents;
    try {
        ents = readdirSync(dir, { withFileTypes: true });
    } catch {
        return out;
    }
    for (const e of ents) {
        if (SKIP_DIRS.has(e.name)) continue;
        const p = join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (EXTS.some((x) => e.name.endsWith(x))) out.push(p);
    }
    return out;
}

const files = walk(ROOT);
const problems = [];
let scannedFiles = 0;
let foundRefs = 0;

for (const f of files) {
    const rel = toPosix(f.slice(ROOT.length + 1));
    if (rel === SELF) continue; // 本脚本含示例路径，跳过自身
    let text;
    try {
        text = readFileSync(f, 'utf8');
    } catch {
        continue;
    }
    scannedFiles++;
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const clean = lines[i].replace(URL_RE, ' '); // URL 不参与判定
        const hits = clean.match(REF_RE);
        if (!hits) continue;
        for (const ref of hits) {
            foundRefs++;
            if (!resolves(ref, f)) problems.push(`${rel}:${i + 1}  「${ref}」解析不到`);
        }
    }
}

// ── 空转自证：集合空了判据会平凡通过 ────────────────────────────────────────
if (scannedFiles === 0) {
    console.error('❌ 空转：没有扫到任何文件（判据会平凡通过）');
    process.exit(1);
}
if (foundRefs === 0) {
    console.error('❌ 空转：没有找到任何文档路径引用（判据会平凡通过）');
    process.exit(1);
}

if (problems.length > 0) {
    console.error(`❌ 代码里的文档路径引用解析不到：${problems.length} 处`);
    for (const p of problems) console.error('  - ' + p);
    console.error('\n修法：补全路径（根级代码引包内文档要写 `packages/<包>/docs/…`），');
    console.error('或改用稳定标识（`issue #NNN` / 规范编号 / `AGENTS.md §N`）。');
    process.exit(1);
}

console.log(`✅ 代码里的文档路径引用全部可解析：${scannedFiles} 个文件、${foundRefs} 处引用`);
