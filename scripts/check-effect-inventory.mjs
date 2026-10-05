/**
 * R5：`EFFECT_INVENTORY.md` 与实际 `effect(` 调用点一致性校验（issue #79）。
 *
 * 清单一旦与实际调用点脱节就会**静默腐化**：读者按清单判断"effect 已清零"，
 * 而代码里早已新增。这里把清单变成机器可校验的：脚本统计源码里的 `effect(` 调用点，
 * 与清单中标记块内的表格逐文件比对，数量或文件集合不一致即失败。
 *
 * 用法：
 *   node scripts/check-effect-inventory.mjs           # 校验（CI 用）
 *   node scripts/check-effect-inventory.mjs --list    # 只打印实测统计
 *
 * 统计口径（**与 R5 的对象一致：只算响应式 effect**）：
 * - 范围：`packages/**` 下的 `.ts` 源码；
 * - 排除：`*.spec.ts`、`test/`、`dist/`、`node_modules/`、`.d.ts`；
 * - 排除：注释行（`//` 之后）与 `function effect(` 的定义行；
 * - 计入两类：
 *   1. **从 `@feng3d/reactivity`（或重导出它的 `feng3d`）导入的 `effect` 绑定名的直接调用**——
 *      与 eslint 规则 `feng3d/effect-annotation` 同一口径；
 *   2. **`this.effect(...)`**——`ReactiveObject.effect(fn)` 是响应式 effect 的**封装**
 *      （其实现内部调用 `effect(fn)`）。这条是**有意补上的**：根 `AGENTS.md` §15 明确记着
 *      "`this.effect(` 不受检——仍是真缺口"（eslint 规则只认导入的绑定名），
 *      清单把这类间接调用点也登记下来，读者才不会以为"清零了"。
 *
 * 为什么要按"导入来源"收窄（#276 踩到的坑）：早先的实现是"行里出现 `effect(` 就算"，
 * 于是**任何叫 effect 的方法**都会被计入——编辑器插件插槽层引入的 `EffectHost.effect(...)`
 * （`ctx.effect` 的最小等价，形态是 `host.effect(`）与 cordis 的 `ctx.effect(...)` 都被误判成
 * 响应式 effect，清单被迫登记一堆与 R5 无关的调用点。
 * **收窄不等于放松**：这次改动后实测仍是 55 处 / 32 文件，与清单一致——被排除的只有
 * "既不是导入绑定、也不是 `this.effect(`"的同名方法（`host.effect(` / `ctx.effect(`）。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { assertScanVolume } from './scan-volume.mjs';

const ROOT = process.cwd();
const PACKAGES = join(ROOT, 'packages');
const INVENTORY = join(ROOT, 'EFFECT_INVENTORY.md');
const START_MARK = '<!-- EFFECT_INVENTORY:START -->';
const END_MARK = '<!-- EFFECT_INVENTORY:END -->';

/** 可能导出响应式 `effect` 的模块（`feng3d` 会重导出 reactivity 的内容） */
const EFFECT_SOURCES = ['@feng3d/reactivity', 'feng3d'];

const listOnly = process.argv.includes('--list');

/** 递归收集待统计的源码文件 */
function collectFiles(dir, out = [])
{
    for (const entry of readdirSync(dir))
    {
        if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;

        const full = join(dir, entry);
        const st = statSync(full);

        if (st.isDirectory())
        {
            if (entry === 'test') continue;
            collectFiles(full, out);
        }
        else if (entry.endsWith('.ts') && !entry.endsWith('.spec.ts') && !entry.endsWith('.d.ts'))
        {
            out.push(full);
        }
    }

    return out;
}

/** 去掉行内 `//` 注释与 `/* *\/` 块注释（含跨行 JSDoc），避免注释里的示例被当成调用点 */
function stripComments(text)
{
    const out = [];
    let inBlock = false;

    for (const raw of text.split('\n'))
    {
        let line = '';
        let k = 0;

        while (k < raw.length)
        {
            if (inBlock)
            {
                const end = raw.indexOf('*/', k);

                if (end < 0) break;
                inBlock = false;
                k = end + 2;
            }
            else
            {
                const blockStart = raw.indexOf('/*', k);
                const lineStart = raw.indexOf('//', k);

                if (lineStart >= 0 && (blockStart < 0 || lineStart < blockStart))
                {
                    line += raw.slice(k, lineStart);
                    break;
                }
                if (blockStart < 0)
                {
                    line += raw.slice(k);
                    break;
                }
                line += raw.slice(k, blockStart);
                inBlock = true;
                k = blockStart + 2;
            }
        }

        out.push(line);
    }

    return out;
}

/**
 * 收集一个文件里"从响应式库导入的 `effect` 绑定名"（含别名）。
 *
 * 没有任何绑定名 ⇒ 该文件里的 `effect(` 都不是响应式 effect，一律不计（见文件头说明）。
 *
 * @param text 文件内容
 * @returns 绑定名集合（如 `{ 'effect' }` 或 `{ 'rEffect' }`）
 */
function reactivityEffectNames(text)
{
    const names = new Set();

    for (const source of EFFECT_SOURCES)
    {
        const escaped = source.replace(/[/@]/g, (c) => `\\${c}`);
        const pattern = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${escaped}['"]`, 'g');

        for (const match of text.matchAll(pattern))
        {
            for (const part of match[1].split(','))
            {
                const [imported, local] = part.split(/\s+as\s+/).map((piece) => piece.trim());
                if (imported === 'effect') names.add(local && local.length > 0 ? local : 'effect');
            }
        }
    }

    return names;
}

/**
 * 统计单个文件里的响应式 `effect(` 调用点。
 *
 * 计入两类（见文件头说明）：
 * 1. 该文件从响应式库导入的 `effect` 绑定名的直接调用（含别名）；
 * 2. `this.effect(...)`——`ReactiveObject.effect(fn)` 是响应式 effect 的封装。
 *
 * @param text 文件内容
 * @param names 该文件里 `effect` 的本地绑定名（可为空：此时仍会统计 `this.effect(`）
 * @returns 行号数组
 */
function findEffectCalls(text, names)
{
    const hits = [];
    const direct = [...names].join('|');
    const callPattern = direct.length === 0
        ? /\bthis\.effect\s*\(/
        : new RegExp(`\\b(?:${direct})\\s*\\(|\\bthis\\.effect\\s*\\(`);

    stripComments(text).forEach((line, i) =>
    {
        if (!callPattern.test(line)) return;
        // 定义行不算调用点（`function effect(` / `export function effect(`）
        if (/function\s+effect\s*\(/.test(line)) return;
        // 方法/函数声明行也不算：整行就是 `effect(...)` 并以 `)` 收尾
        // （Allman 风格下 `{` 在下一行，如 `ReactiveObject.effect(fn: () => void)`）。
        // 单行调用 `effect(fn)` 会被一并跳过——本仓库的调用点都是多行回调，可以接受。
        if (/^\s*(?:\w+\s+)*effect\s*\(.*\)\s*$/.test(line)) return;
        hits.push(i + 1);
    });

    return hits;
}

/**
 * 实测统计：文件 → 调用点行号。
 *
 * @param files `collectFiles(PACKAGES)` 的结果（由主流程先收集一次，供扫描量自证使用）
 * @returns 文件 → 调用点行号
 */
function measure(files)
{
    const result = new Map();

    for (const file of files)
    {
        const text = readFileSync(file, 'utf8');
        const hits = findEffectCalls(text, reactivityEffectNames(text));

        if (hits.length > 0) result.set(relative(ROOT, file).split(sep).join('/'), hits);
    }

    return result;
}

/** 解析清单标记块内的表格：`| 路径 | 数量 | ... |` */
function parseInventory()
{
    const text = readFileSync(INVENTORY, 'utf8');
    const start = text.indexOf(START_MARK);
    const end = text.indexOf(END_MARK);

    if (start < 0 || end < 0 || end < start)
    {
        throw new Error(`EFFECT_INVENTORY.md 缺少 ${START_MARK} / ${END_MARK} 标记块`);
    }

    const declared = new Map();

    for (const raw of text.slice(start + START_MARK.length, end).split('\n'))
    {
        const cells = raw.split('|').map((c) => c.trim());

        // cells[0] 与最后一个都是空串（行首/行尾的竖线）
        if (cells.length < 4) continue;
        const path = cells[1].replace(/`/g, '');
        const count = Number(cells[2]);

        if (!path.startsWith('packages/') || !Number.isFinite(count)) continue;
        declared.set(path, count);
    }

    return declared;
}

const tsFiles = collectFiles(PACKAGES);

assertScanVolume({
    label: 'R5 effect 清单扫描（packages/ 下全部 .ts）',
    count: tsFiles.length,
    min: 1,
    detail: '扫描根：packages/（本脚本的 collectFiles；排除 test/dist/node_modules 与 *.spec.ts/*.d.ts）',
});

const actual = measure(tsFiles);
const actualTotal = [...actual.values()].reduce((a, b) => a + b.length, 0);

if (listOnly)
{
    for (const [file, hits] of [...actual].sort())
    {
        console.log(`${String(hits.length).padStart(2)}  ${file}  (行 ${hits.join(', ')})`);
    }
    console.log(`合计 ${actualTotal} 处，涉及 ${actual.size} 个文件`);
    process.exit(0);
}

const declared = parseInventory();
const problems = [];

for (const [file, hits] of actual)
{
    const count = declared.get(file);

    if (count === undefined) problems.push(`${file}: 清单未登记（实测 ${hits.length} 处，行 ${hits.join(', ')}）`);
    else if (count !== hits.length) problems.push(`${file}: 清单记 ${count} 处，实测 ${hits.length} 处（行 ${hits.join(', ')}）`);
}

for (const [file, count] of declared)
{
    if (!actual.has(file)) problems.push(`${file}: 清单登记 ${count} 处，但源码里已无 effect( 调用点`);
}

// 清单首部声明的总数（"全仓库 N 处 effect() 调用"）
const totalMatch = readFileSync(INVENTORY, 'utf8').match(/全仓库\s*(\d+)\s*处\s*`effect\(\)`/);

if (totalMatch && Number(totalMatch[1]) !== actualTotal)
{
    problems.push(`清单首部声明 ${totalMatch[1]} 处，实测 ${actualTotal} 处`);
}

if (problems.length > 0)
{
    console.error('❌ EFFECT_INVENTORY.md 与实际 effect( 调用点不一致：');

    for (const p of problems) console.error(`  - ${p}`);
    console.error('\n实测清单（可用于更新 EFFECT_INVENTORY.md）：');
    for (const [file, hits] of [...actual].sort()) console.error(`| \`${file}\` | ${hits.length} |  |  |`);
    process.exit(1);
}

console.log(`✅ EFFECT_INVENTORY.md 与实测一致：${actualTotal} 处 effect( 调用点，涉及 ${actual.size} 个文件`);
