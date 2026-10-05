/**
 * 只读形状（属性与数组都只读）的机器执行者（对齐 AGENTS.md §8.5 / §10 / §11.1 / §15）。
 *
 * ## 口径（2026-10 定，issue #605 收口）
 *
 * 读侧纯数据接口的数组字段一律 `readonly T[]`——**属性与数组都只读**：
 *
 * ```ts
 * // ✓ 合口径
 * export interface FrustumLike { readonly planes: readonly PlaneLike[]; }
 * // ✗ 属性只读、数组可变（面板 `push` / `sort` 能就地改到读侧数据）
 * export interface GradientLike { readonly alphaKeys: GradientAlphaKey[]; }
 * ```
 *
 * 要就地改数组，写侧形状 `WritableXxxLike`（`AGENTS.md` §11.3）就是合法落点；
 * 装配点也可以 `reactive(data) as WritableXxxLike` 后改。
 *
 * ## 判据范围：只约束「机械可判定的纯数据接口」
 *
 * 「读侧纯数据接口」在本脚本里定义为**二者之一**（都可机械判定）：
 *
 * 1. 名字以 `Like` 结尾、且不以 `Writable` 开头（本仓纯函数层的形状命名惯例，见
 *    `packages/math/src/gradient/gradient.ts` 的 `GradientLike` / `WritableGradientLike`）；
 * 2. 声明了 `__type__` 属性（纯数据类，与 `AGENTS.md` §11.4 和 R3 门禁的定义同源）。
 *
 * 两类接口的数组字段若是**外层可变**（`T[]` / `Array<T>` / 元组 `[A, B]`，含
 * `T[] | undefined` 这类联合包装），即违规——**新增即失败**，存量冻结在基线。
 *
 * 其余 `export interface`（WebGPU 描述符、编辑器 UI 类型、GLTF 解析中间类型等）
 * **只统计、不失败**：它们不是 §11 意义的纯数据接口，硬套只读会天天误报。
 * 统计值由 `--stats` 打印，供存量分批参考。
 *
 * ## 有意不查的东西（已知局限，避免"看起来管了其实没管"）
 *
 * - 类型别名里的数组（`type FooList = Foo[]; readonly n: FooList`）；
 * - class 字段、type 字面量（`type X = { readonly a: T[] }`）；
 * - **嵌套数组的内层**（`readonly a: T[][]` 只判最外层——纵深 1 层，深查噪声大于收益）；
 * - 函数签名里的数组、索引签名（`[key: string]: T[]`）。
 *
 * ## 排除项（写在代码里而不是靠人记）
 *
 * - `Writable*` 接口一律不参与（它们就是写侧，`AGENTS.md` §11.3）；
 * - WebGPU 边界（`AGENTS.md` §10：`Matrix4x4.elements`、`RenderPassDescriptor.colorAttachments`
 *   等）**不能**靠删 `readonly` 修——它们冻结在基线里，清理时按 §10 用 `TypeConvert.ts` 转换。
 *
 * 用法：
 *   node scripts/check-readonly-array-fields.mjs            # 校验（进 CI）
 *   node scripts/check-readonly-array-fields.mjs --list     # 打印存量清单
 *   node scripts/check-readonly-array-fields.mjs --stats    # 打印三项分类统计与其余接口分布
 *   node scripts/check-readonly-array-fields.mjs --update   # 重写基线（清理存量后收紧用）
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { assertScanVolume } from './scan-volume.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const ROOT = process.cwd();
const BASELINE = join(ROOT, 'scripts', 'readonly-array-fields-baseline.json');

/** 扫描范围：每个子包的 `src`（与 issue #605 的统计口径一致；`test/` 与 `examples/` 不在内） */
const SCAN_ROOT = 'packages';
const SKIP_DIRS = new Set(['node_modules', 'dist', 'lib', 'public', '.git', 'tmp', 'repositoryRoot']);

const args = process.argv.slice(2);
const update = args.includes('--update');
const list = args.includes('--list');
const stats = args.includes('--stats');

/**
 * 判定一个类型节点是不是数组、外层是否只读。
 *
 * @param typeNode 类型节点
 * @returns `readonly-array`（只读数组）/ `mutable-array`（可变数组）/ `null`（不是数组）
 */
function arrayKind(typeNode)
{
    if (!typeNode) return null;

    // `readonly T[]` / `readonly [A, B]` / `readonly Array<T>`
    if (ts.isTypeOperatorNode(typeNode) && typeNode.operator === ts.SyntaxKind.ReadonlyKeyword)
    {
        return arrayKind(typeNode.type) ? 'readonly-array' : null;
    }

    if (ts.isArrayTypeNode(typeNode)) return 'mutable-array';
    if (ts.isTupleTypeNode(typeNode)) return 'mutable-array';

    if (ts.isTypeReferenceNode(typeNode))
    {
        const name = typeNode.typeName.getText();

        if (name === 'Array') return 'mutable-array';
        if (name === 'ReadonlyArray') return 'readonly-array';
    }

    // `T[] | undefined` 这类联合 / 交叉：只要含数组就按数组算
    if (ts.isUnionTypeNode(typeNode) || ts.isIntersectionTypeNode(typeNode))
    {
        const kinds = typeNode.types.map(arrayKind).filter(Boolean);

        if (kinds.length === 0) return null;
        if (kinds.includes('mutable-array')) return 'mutable-array';

        return kinds[0];
    }

    return null;
}

/**
 * 递归收集目录下的 .ts 源文件。
 *
 * @param dir 绝对路径
 * @param out 收集数组
 * @returns 收集数组
 */
function walk(dir, out = [])
{
    let entries;

    try
    {
        entries = readdirSync(dir);
    }
    catch
    {
        return out;
    }

    for (const name of entries)
    {
        if (SKIP_DIRS.has(name)) continue;

        const full = join(dir, name);

        if (statSync(full).isDirectory())
        {
            walk(full, out);
        }
        else if (name.endsWith('.ts') && !name.endsWith('.d.ts') && !name.endsWith('.spec.ts'))
        {
            out.push(full);
        }
    }

    return out;
}

const violations = [];   // 命中硬判据（读侧纯数据接口的可变数组字段）
const compliant = [];    // 判据范围内已合口径（属性与数组都只读）
const statistics = [];   // 其余接口的数组字段（只统计）

/** 每个子包的 src 目录（`packages/<pkg>/src`） */
const scanDirs = readdirSync(join(ROOT, SCAN_ROOT))
    .map((name) => join(ROOT, SCAN_ROOT, name, 'src'))
    .filter((dir) => { try { return statSync(dir).isDirectory(); } catch { return false; } });

/** 扫描到的 .ts 文件（门禁必须先自证扫到了东西，issue #652） */
const scannedFiles = scanDirs.flatMap((dir) => walk(dir));

assertScanVolume({
    label: '只读形状扫描（packages/*/src 下的 .ts）',
    count: scannedFiles.length,
    min: 1,
    detail: `扫描根：packages/*/src；候选目录 ${scanDirs.length} 个。`,
});

for (const file of scannedFiles)
{
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    const code = readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);

    for (const stmt of sf.statements)
    {
        if (!ts.isInterfaceDeclaration(stmt)) continue;

        const ifaceName = stmt.name.getText(sf);
        const isWritable = ifaceName.startsWith('Writable');
        const isLike = ifaceName.endsWith('Like');
        const hasTypeTag = stmt.members.some((m) => ts.isPropertySignature(m)
            && m.name.getText(sf).replace(/^'|'$/g, '') === '__type__');

        // 写侧形状不参与；其余接口只统计
        const guarded = !isWritable && (isLike || hasTypeTag);

        for (const member of stmt.members)
        {
            if (!ts.isPropertySignature(member)) continue;

            const kind = arrayKind(member.type);

            if (!kind) continue;

            const fieldName = member.name.getText(sf).replace(/^'|'$/g, '');
            const propReadonly = !!member.modifiers?.some((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword);
            const key = `${rel}::${ifaceName}.${fieldName}`;

            if (isWritable)
            {
                // 写侧形状的数组本就该可变，什么都不做
                continue;
            }

            if (!guarded)
            {
                statistics.push({ key, kind, propReadonly });

                continue;
            }

            // 「属性与数组都只读」：属性缺 readonly、或数组外层可变，都算违规
            if (!propReadonly || kind === 'mutable-array') violations.push({ key, kind, propReadonly });
            else compliant.push(key);
        }
    }
}

const counts = new Map();

for (const v of violations) counts.set(v.key, (counts.get(v.key) || 0) + 1);

const total = violations.length;

if (stats)
{
    const byKind = { like: 0, pure: 0 };

    for (const key of counts.keys())
    {
        const iface = key.split('::')[1].split('.')[0];

        if (iface.endsWith('Like')) byKind.like++;
        else byKind.pure++;
    }

    /** 判据内的四种形态 */
    const inScope = {
        onlyReadonly: compliant.length,
        propOnly: violations.filter((v) => v.kind === 'mutable-array' && v.propReadonly).length,
        both: violations.filter((v) => v.kind === 'mutable-array' && !v.propReadonly).length,
        arrayOnly: violations.filter((v) => v.kind === 'readonly-array' && !v.propReadonly).length,
    };

    /** 按包（`packages/<pkg>`）分组计数 */
    const groupByPackage = (items) =>
    {
        const m = new Map();

        for (const item of items)
        {
            const area = item.split('/').slice(0, 2).join('/');

            m.set(area, (m.get(area) || 0) + 1);
        }

        return [...m].sort().map(([k, v]) => `${k}:${v}`).join('  ') || '（无）';
    };

    console.log('判据范围：`*Like`（非 Writable）接口 + 声明了 `__type__` 的纯数据接口');
    console.log(`判据范围内数组字段：${total + compliant.length} 处——合口径 ${compliant.length} 处、违规存量 ${total} 处（*Like ${byKind.like} 处、纯数据接口 ${byKind.pure} 处）`);
    console.log(`  判据内四态：① 属性只读 + 只读数组 ${inScope.onlyReadonly} 处；② 属性只读 + 数组可变 ${inScope.propOnly} 处；③ 属性与数组都可变 ${inScope.both} 处；④ 属性可写 + 只读数组 ${inScope.arrayOnly} 处`);
    console.log(`  违规存量按包：${groupByPackage([...counts.keys()])}`);

    if (inScope.both > 0)
    {
        console.log(`  ③（属性与数组都可变，违反 §11.1）明细：${violations.filter((v) => v.kind === 'mutable-array' && !v.propReadonly).map((v) => v.key).join('、')}`);
    }
    console.log('');

    const bucket = { '①-readonly': [], '②-propOnly': [], '③-both': [] };

    for (const item of statistics)
    {
        if (item.kind === 'readonly-array') bucket['①-readonly'].push(item.key);
        else if (item.propReadonly) bucket['②-propOnly'].push(item.key);
        else bucket['③-both'].push(item.key);
    }

    console.log(`未纳入判据、仅统计的其他接口数组字段：${statistics.length} 处`);
    console.log(`  ① readonly n: readonly T[]：${bucket['①-readonly'].length} 处  按包：${groupByPackage(bucket['①-readonly'])}`);
    console.log(`  ② readonly n: T[]        ：${bucket['②-propOnly'].length} 处  按包：${groupByPackage(bucket['②-propOnly'])}`);
    console.log(`  ③ n: T[]                 ：${bucket['③-both'].length} 处  按包：${groupByPackage(bucket['③-both'])}`);
    console.log('');
    console.log('② + ③ 明细（存量分批的候选，按包排序）：');
    [...bucket['②-propOnly'], ...bucket['③-both']].sort().forEach((x) => console.log(`  ${x}`));
    process.exit(0);
}

if (list)
{
    [...counts].sort((a, b) => a[0].localeCompare(b[0])).forEach(([key, n]) => console.log(`  ${key}${n > 1 ? `  ×${n}` : ''}`));
    console.log(`\n共 ${counts.size} 个位置、${total} 处`);
    process.exit(0);
}

if (update)
{
    const baseline = {
        note: '只读形状（属性与数组都只读）的存量基线。判据范围只有两类机械可判定的读侧纯数据接口：名字以 `Like` 结尾且不以 `Writable` 开头，或声明了 `__type__` 属性。其余 export interface（WebGPU 描述符 / 编辑器 UI 类型 / GLTF 解析中间类型等）不参与判据——见 scripts/check-readonly-array-fields.mjs 的注释。键是「相对路径::接口名.字段名」，值是出现次数（不含行号：行号会随无关改动漂移）。**新增即失败**；清理完跑 --update 收紧。WebGPU 边界项（如 Matrix4x4.elements）按 AGENTS.md §10 处理，不要靠删 readonly 修。',
        entries: Object.fromEntries([...counts].sort((a, b) => a[0].localeCompare(b[0]))),
    };

    writeFileSync(BASELINE, `${JSON.stringify(baseline, null, 4)}\n`, 'utf8');
    console.log(`✅ 已写入基线（${Object.keys(baseline.entries).length} 个位置、${total} 处）`);
    process.exit(0);
}

let baseline;

try
{
    baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
}
catch
{
    console.error('❌ 读不到基线 scripts/readonly-array-fields-baseline.json：先跑一次 --update 并提交进仓库');
    process.exit(1);
}

const known = baseline.entries ?? {};
const increased = [];
const decreased = [];

for (const [key, n] of counts)
{
    const before = known[key] ?? 0;

    if (n > before) increased.push({ key, before, after: n });
}

for (const [key, before] of Object.entries(known))
{
    const after = counts.get(key) ?? 0;

    if (after < before) decreased.push({ key, before, after });
}

const knownTotal = Object.values(known).reduce((a, b) => a + b, 0);

if (increased.length > 0)
{
    const addCount = increased.reduce((a, v) => a + (v.after - v.before), 0);

    console.error(`❌ 读侧纯数据接口里新增了可变数组字段（属性与数组都要只读）：${addCount} 处`);
    increased.forEach((v) => console.error(`  + ${v.key}  ${v.before} → ${v.after} 次`));
    console.error('\n修法：数组字段写成 `readonly n: readonly T[]`；要就地改数组就改走写侧形状');
    console.error('     `WritableXxxLike`（AGENTS.md §11.3），不要改读侧接口的类型。');
    process.exit(1);
}

if (knownTotal === 0 && total === 0)
{
    console.log('✅ 只读形状：判据范围内无可变数组字段（基线为空，新增即失败）');
}
else
{
    console.log(`✅ 只读形状：判据范围内无新增可变数组字段（存量 ${knownTotal} 处冻结在基线，当前 ${total} 处）`);
}

if (decreased.length > 0)
{
    const goneCount = decreased.reduce((a, v) => a + (v.before - v.after), 0);

    console.log(`   （有 ${goneCount} 处存量已清理，可以跑 --update 收紧基线：${decreased.slice(0, 5).map((v) => v.key).join('、')}${decreased.length > 5 ? ' …' : ''}）`);
}
