#!/usr/bin/env node
/**
 * 文档相对链接门禁：仓库内 Markdown 的相对链接必须指向真实存在的文件或目录。
 *
 * ## 为什么要门禁
 *
 * 文档移动、目录改名、文件重命名时，正文里的相对链接是最容易被漏掉的东西——
 * 链接断了既不报错也不让任何测试失败，只有读者点进去 404 才发现。实测本轮仓库里
 * 就有 6 条坏链：`FRAMEWORK_REFACTOR_PLAN.md` 归档到 `docs/archive/` 后 3 处仍在用旧路径、
 * editor 的 AGENTS.md 少写了 `.ts` 后缀、objectview 两处指向并不存在的包内 `LICENSE`。
 * 根规范 §15：每条规范必须有机器执行者——「文档链接必须有效」这条就是它。
 *
 * ## 判据
 *
 * - 只查**相对链接**（`[…](./x)` / `[…](../x)`）。`http(s):` / `mailto:` / 页内 `#anchor`
 *   一律跳过：外链有效性取决于网络与对方站点，做阻塞门禁会变成随机红灯。
 * - 目标按链接所在文件所在目录解析，`existsSync` 为真即通过（文件或目录都算）。
 * - 跳过 vendored 第三方目录 `packages/editor/libs/`（入库的 monaco-editor 源码，
 *   其 README 的坏链属上游，不在本仓维护范围）。
 *
 * 用法：node scripts/check-docs-links.mjs [文件...]
 *       不给参数则递归扫描全仓 Markdown。
 * 退出码：0 = 无坏链；1 = 存在坏链（逐条打印 文件 -> 链接）。
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** 不参与扫描的目录（构建产物、依赖、vendored 第三方源码） */
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'lib', 'public', 'coverage', '.verify', '.playwright-mcp']);
/** vendored 第三方目录（相对仓库根，用 / 分隔） */
const SKIP_PATHS = ['packages/editor/libs'];

function isSkipped(abs)
{
    const rel = relative(ROOT, abs).split(sep).join('/');

    return SKIP_PATHS.some((p) => rel === p || rel.startsWith(`${p}/`));
}

function walk(dir, out = [])
{
    for (const name of readdirSync(dir))
    {
        if (SKIP_DIRS.has(name)) continue;

        const abs = join(dir, name);

        if (isSkipped(abs)) continue;

        if (statSync(abs).isDirectory()) walk(abs, out);
        else if (name.endsWith('.md')) out.push(abs);
    }

    return out;
}

const args = process.argv.slice(2);
const files = args.length > 0 ? args.map((f) => resolve(ROOT, f)) : walk(ROOT);

let checked = 0;
const broken = [];

for (const file of files)
{
    if (!existsSync(file)) throw new Error(`待检查的文件不存在：${file}`);
    if (!file.endsWith('.md')) continue;

    const dir = dirname(file);
    const text = readFileSync(file, 'utf8');

    // [文字](目标) / [文字](目标 "标题") / ![alt](目标)
    for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g))
    {
        const target = m[1];

        if (/^([a-z][a-z0-9+.-]*:|#)/i.test(target)) continue;   // http(s) / mailto / 页内锚点

        const pathPart = decodeURIComponent(target.split('#')[0].split('?')[0]);

        if (!pathPart) continue;

        checked++;

        if (!existsSync(resolve(dir, pathPart)))
        {
            broken.push(`${relative(ROOT, file).split(sep).join('/')} -> ${target}`);
        }
    }
}

for (const b of broken) console.error(`坏链 ${b}`);

console.log(`文档链接检查：${files.length} 个文件、${checked} 条相对链接，坏链 ${broken.length} 条`);

process.exit(broken.length === 0 ? 0 : 1);
