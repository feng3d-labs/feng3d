/**
 * R1：依赖方向只向下（issue #75）。
 *
 * 分层蓝图见 `docs/ARCHITECTURE_V2.md` §2.1：只允许上层依赖下层，同层之间不得互相依赖。
 *
 * 为什么不是 `eslint import/no-restricted-paths`：本仓 ESLint 是 flat config + 新版 eslint，
 * `eslint-plugin-import` 装不上（peer 冲突 ERESOLVE，实测），而它的 zones 需要逐层写路径映射。
 * 这里直接按 **package.json 的包级依赖**做同一件事——比 import 语句粒度更稳（不受相对路径、
 * 类型导入、barrel re-export 的影响），且零新依赖。
 *
 * 存量向上依赖冻结在 `scripts/layer-direction-baseline.json`：**新增即失败**，已存在的允许保留
 * （issue #75 的验收就是"CI 能拦截**新增**的跨层依赖"）。要清偿存量时，删掉基线里的对应条目即可。
 *
 * 用法：
 *   node scripts/check-layer-direction.mjs            # 校验（CI 用）
 *   node scripts/check-layer-direction.mjs --update   # 用当前实测重写基线（清偿后使用）
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const BASELINE_FILE = join(ROOT, 'scripts', 'layer-direction-baseline.json');

/** 分层（§2.1）：level 越大越上层 */
const LAYERS = [
    {
        level: 0,
        name: 'Layer 0 基础库',
        packages: [
            '@feng3d/reactivity', '@feng3d/math', '@feng3d/event', '@feng3d/polyfill',
            '@feng3d/path', '@feng3d/serialization', '@feng3d/watcher', '@feng3d/filesystem',
            '@feng3d/shortcut', '@feng3d/error-logger',
        ],
    },
    { level: 1, name: 'Layer 1 渲染抽象', packages: ['@feng3d/webgpu'] },
    { level: 3, name: 'Layer 3 引擎核心', packages: ['feng3d'] },
    {
        level: 4,
        name: 'Layer 4 领域模块',
        packages: ['@feng3d/particlesystem', '@feng3d/terrain', '@feng3d/addons', '@feng3d/assets'],
    },
    { level: 5, name: 'Layer 5 工具与生态', packages: ['@feng3d/objectview', 'feng3d-editor', 'eslint-plugin-feng3d'] },
    {
        level: 6,
        name: 'Layer 6 编辑器插件',
        packages: ['@feng3d/editor-plugin-rotate'],
    },
];

const LEVEL_OF = new Map();

for (const layer of LAYERS)
{
    for (const pkg of layer.packages) LEVEL_OF.set(pkg, layer.level);
}

/** 收集 workspace 包名 → 依赖集合 */
function collectPackages()
{
    const result = new Map();

    for (const dir of readdirSync(join(ROOT, 'packages'), { withFileTypes: true }))
    {
        if (!dir.isDirectory()) continue;

        const pkgFile = join(ROOT, 'packages', dir.name, 'package.json');

        let json;

        try
        {
            json = JSON.parse(readFileSync(pkgFile, 'utf8'));
        }
        catch
        {
            continue;
        }

        const deps = Object.keys(json.dependencies ?? {});
        const missing = deps.filter((d) => (d.startsWith('@feng3d/') || d === 'feng3d') && !LEVEL_OF.has(d));

        result.set(json.name, { dir: dir.name, deps, missing });
    }

    return result;
}

const packages = collectPackages();
const violations = [];
const unclassified = [];

for (const [name, info] of packages)
{
    const fromLevel = LEVEL_OF.get(name);

    if (fromLevel === undefined)
    {
        unclassified.push(name);
        continue;
    }

    for (const dep of info.deps)
    {
        const toLevel = LEVEL_OF.get(dep);

        if (toLevel === undefined) continue;             // 第三方 / 未登记的 @feng3d-plugins
        if (toLevel > fromLevel) violations.push(`${name} -> ${dep}`);
    }
}

violations.sort();

if (process.argv.includes('--update'))
{
    writeFileSync(BASELINE_FILE, `${JSON.stringify({ violations }, null, 4)}\n`, 'utf8');
    console.log(`已写入基线：${violations.length} 条向上依赖`);
    violations.forEach((v) => console.log(`  ${v}`));
    process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf8')).violations ?? [];
const baselineSet = new Set(baseline);
const currentSet = new Set(violations);
const added = violations.filter((v) => !baselineSet.has(v));
const fixed = baseline.filter((v) => !currentSet.has(v));

if (unclassified.length > 0)
{
    console.error(`❌ 以下 workspace 包未在 LAYERS 里登记层级：${unclassified.join(', ')}`);
    console.error('   新增包时请先在 scripts/check-layer-direction.mjs 的 LAYERS 里登记。');
    process.exit(1);
}

if (added.length > 0)
{
    console.error(`❌ 新增跨层（向上）依赖 ${added.length} 条（R1，issue #75）：`);
    added.forEach((v) => console.error(`  + ${v}`));
    console.error('\n只允许上层依赖下层：把共用的类型/工具下沉到更低的层，或改由上层注入。');
    process.exit(1);
}

console.log(`✅ 依赖方向检查通过：无新增向上依赖（存量 ${violations.length} 条已冻结在基线）`);

if (fixed.length > 0)
{
    console.log(`   提示：基线里有 ${fixed.length} 条已不再违规，可跑 --update 收紧：`);
    fixed.forEach((v) => console.log(`     - ${v}`));
}
