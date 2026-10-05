/**
 * R1 守卫：最底层包不得依赖上层包（issue #87）。
 *
 * 背景：`@feng3d/math` 曾经依赖 `@feng3d/objectview`（UI 元数据层）——只为 5 个数据类上的
 * `@oav()` 注解。底层依赖上层是**分层倒置**：math 是所有人的地基，它一旦依赖 UI 层，
 * 依赖图就出现回边，tree-shaking 与分层约束都失效。
 *
 * 修法（issue #87）：这些字段本来就能从 TypeScript 类型推出来，编辑器的属性面板走的是
 * `scripts/gen-objectview-schema.mjs` 生成的 `DATA_TYPE_SCHEMA`（实测：删掉全部 `@oav()` 后
 * `--check` 与 editor 的 23 条 schema 测试全绿），所以注解是冗余的，直接移除。
 *
 * 本脚本把「math 的依赖集合」冻结成白名单：新增任何 `@feng3d/*` 依赖都必须先在这里登记并说明理由，
 * 否则 CI 失败。这样倒置不会悄悄回来。
 *
 * 用法：`node scripts/check-layer-deps.mjs`
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/** Layer 0（地基）包的允许依赖：只允许同为地基/无 `@feng3d/*` 的第三方 */
const LAYER0 = [
    {
        pkg: 'packages/math',
        allowed: [],
        reason: '数学库不依赖任何其它 @feng3d 包——`polyfill` 已于 `MathUtil` 迁移批解开'
            + '（`MathUtil` 迁入本包纯函数化为 `mathutil.ts`，`ArrayUtils.unique` 就地内联）；'
            + '`serialization` 也从未真正使用（实测 src/test 里 `@serialize` / `serialization` / '
            + '`serializers` 全部零命中，`package.json` 里也没有该依赖）——原白名单里那一项是过期的允许项',
    },
    {
        pkg: 'packages/reactivity',
        allowed: [],
        reason: '响应式内核不依赖任何其它 @feng3d 包（`logic()` 分发表自带）',
    },
];

const problems = [];

for (const { pkg, allowed, reason } of LAYER0)
{
    const json = JSON.parse(readFileSync(join(ROOT, pkg, 'package.json'), 'utf8'));
    const deps = Object.keys(json.dependencies ?? {}).filter((d) => d.startsWith('@feng3d/'));
    const extra = deps.filter((d) => !allowed.includes(d));

    if (extra.length > 0)
    {
        problems.push(`${pkg} 依赖了未登记的上层包：${extra.join(', ')}（该包定位：${reason}）`);
    }
}

/**
 * 上层扩展包：它们的源码 `import ... from 'feng3d'`，因此必须声明 feng3d 依赖；
 * 反过来 feng3d **不得**依赖它们（否则依赖图成环，issue #86）。
 */
const UPPER_EXTENSIONS = ['packages/particlesystem', 'packages/terrain'];

const feng3dJson = JSON.parse(readFileSync(join(ROOT, 'packages/feng3d/package.json'), 'utf8'));
const feng3dDeps = Object.keys(feng3dJson.dependencies ?? {});

for (const pkg of UPPER_EXTENSIONS)
{
    const name = pkg.split('/').pop();

    if (feng3dDeps.includes(`@feng3d/${name}`))
    {
        problems.push(`packages/feng3d 依赖了上层扩展 @feng3d/${name}（成环：${name} 的源码 import 'feng3d'）`);
    }

    const json = JSON.parse(readFileSync(join(ROOT, pkg, 'package.json'), 'utf8'));

    if (!(json.dependencies ?? {})['feng3d'])
    {
        problems.push(`${pkg} 源码 import 'feng3d' 却没声明该依赖（monorepo 直连能跑，但依赖图是错的）`);
    }
}
if (problems.length > 0)
{
    console.error(`❌ 分层倒置（R1，issue #87）：${problems.length} 项`);

    for (const p of problems) console.error(`  - ${p}`);
    console.error('\n修法：把上层才需要的东西（装饰器元数据、UI 描述）从底层包里拿出来——');
    console.error('字段描述交给 scripts/gen-objectview-schema.mjs 从类型生成，而不是在底层包里 @oav() 标注。');
    process.exit(1);
}

console.log(`✅ 分层依赖检查通过：${LAYER0.map((l) => l.pkg.split('/')[1]).join(' / ')} 无未登记的上层依赖`);
