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
 * 统计口径（与清单首部的说明一致）：
 * - 范围：`packages/**` 下的 `.ts` 源码；
 * - 排除：`*.spec.ts`、`test/`、`dist/`、`node_modules/`、`.d.ts`；
 * - 排除：注释行（`//` 之后）与 `function effect(` 的定义行；
 * - 行内如果 `effect(` 出现在字符串里，会被计入——清单登记的是"调用点"，若误报就把该行说明写进清单。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const PACKAGES = join(ROOT, 'packages');
const INVENTORY = join(ROOT, 'EFFECT_INVENTORY.md');
const START_MARK = '<!-- EFFECT_INVENTORY:START -->';
const END_MARK = '<!-- EFFECT_INVENTORY:END -->';

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

                if (end < 0) { k = raw.length; break; }
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

/** 统计单个文件里的 `effect(` 调用点（返回行号数组） */
function findEffectCalls(text)
{
    const hits = [];

    stripComments(text).forEach((line, i) =>
    {
        if (!/effect\s*\(/.test(line)) return;
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

/** 实测统计：文件 → 调用点行号 */
function measure()
{
    const result = new Map();

    for (const file of collectFiles(PACKAGES))
    {
        const hits = findEffectCalls(readFileSync(file, 'utf8'));

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

const actual = measure();
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
