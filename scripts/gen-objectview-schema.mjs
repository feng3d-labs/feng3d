#!/usr/bin/env node
/**
 * 从 feng3d 的纯数据接口生成「属性面板字段描述表」（issue #147 的方案 B）。
 *
 * 为什么需要生成而不是运行时遍历：
 * 纯数据对象上只有**用户显式写过的**字段（`{ __type__: 'PerspectiveCamera' }` 的
 * `Object.keys` 就只有一个 `__type__`），而字段清单只存在于 TypeScript 类型里，
 * 接口编译后完全消失。所以"面板要列出哪些字段"这件事，只能从**类型**里拿。
 *
 * 为什么这不是"又一个手工清单"：判据是接口自己声明的 `readonly __type__: '<字面量>'`
 * ——谁声明了它，谁就是可挂载的纯数据类型。新增组件只要按范式写接口，本表自动跟随；
 * CI 用 `--check` 跑一遍，产物与源码不一致就变红（根规范 §15：规范必须有机器执行者）。
 *
 * 用法：
 *   node scripts/gen-objectview-schema.mjs            # 生成/更新产物
 *   node scripts/gen-objectview-schema.mjs --check    # 只校验产物是否为最新（CI 用）
 *   node scripts/gen-objectview-schema.mjs --stats    # 只打印统计，不写文件
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const ts = require('typescript');

/** 产物路径（相对仓库根） */
const OUTPUT = 'packages/editor/src/vue-app/objectview/generated/dataTypeSchema.ts';
const TSCONFIG = 'packages/feng3d/tsconfig.json';

const checkOnly = process.argv.includes('--check');
const statsOnly = process.argv.includes('--stats');

// ---------------------------------------------------------------------------
// 1. 建立 program（一次即可，124 个文件约 1 秒）
// ---------------------------------------------------------------------------
const parsed = ts.parseJsonConfigFileContent(
    ts.readConfigFile(resolve(TSCONFIG), ts.sys.readFile).config,
    ts.sys,
    resolve('packages/feng3d'),
);
const program = ts.createProgram(parsed.fileNames, { ...parsed.options, noEmit: true });
const checker = program.getTypeChecker();

// ---------------------------------------------------------------------------
// 2. 类型 → 控件 的映射
// ---------------------------------------------------------------------------

/**
 * 把 TS 类型判成一个"控件种类"。
 *
 * 取值与编辑器既有的 `objectview.setDefaultTypeAttributeView(type, ...)` 注册名一致
 * （见 packages/editor/src/plugins/builtinObjectView.ts）——控件侧早已齐备，这里只是把
 * "用哪个控件"从装饰器参数变成类型推断的结果。
 *
 * @param type 待判类型
 * @returns 控件种类
 */
function controlOf(type)
{
    // 判据全部走**类型标志**，不做字符串比较：
    // `boolean` 在 TS 里是 `true | false` 的联合（`typeToString` 给 'boolean'，但那只是显示），
    // 可选性是符号标志（SymbolFlags.Optional）而不是类型里的 `| undefined`。
    // 早先用字符串比较 + "有属性就是对象"，把布尔字段判成了 Object / Default（实测踩过）
    if (isEnumType(type)) return 'Enum';
    if (type.flags & ts.TypeFlags.BooleanLike) return 'Boolean';
    if (type.flags & ts.TypeFlags.NumberLike) return 'number';
    if (type.flags & ts.TypeFlags.StringLiteral) return 'Enum';

    if (type.isUnion())
    {
        const parts = type.types.filter((t) => !(t.flags & ts.TypeFlags.Undefined) && !(t.flags & ts.TypeFlags.Null));
        // 剥掉 undefined 后只剩一支：按那一支继续判（`T | undefined` 的可选字段）
        if (parts.length === 1) return controlOf(parts[0]);
        const literals = parts.filter((t) => t.isStringLiteral());
        if (literals.length === parts.length && parts.length > 0) return 'Enum';
        // 对象联合（几何 / 材质这类 `XxxMap[keyof XxxMap]`）= 嵌套对象
        if (parts.length > 0 && parts.every(isObjectLike)) return 'Object';

        return 'Default';
    }

    const text = typeText(type);
    if (text === 'string') return 'String';
    // `readonly T[]` 经 typeToString 会丢掉 readonly，只剩 `T[]`；两种写法都要认
    if (/\[\]$/.test(text) || /^Array<.+>$/.test(text)) return 'Array';
    if (isObjectLike(type)) return 'Object';

    return 'Default';
}

/** 类型的显示文本：去掉可选性带来的 ` | undefined` 噪音 */
function typeText(type)
{
    return checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation)
        .replace(/\s*\|\s*undefined$/, '');
}

/**
 * 是否是对象类型。
 *
 * **不能**用 `getProperties().length > 0` 判：`boolean` 是 `true | false` 的联合，
 * 而 `true` / `false` 这些字面量类型也带属性（`valueOf` 之类），于是布尔字段会被误判成对象。
 * 这里只看类型标志。
 */
function isObjectLike(type)
{
    return (type.flags & ts.TypeFlags.Object) !== 0;
}

/** 取 TS enum 的声明（数字枚举与字符串枚举都算） */
function enumDeclarationOf(type)
{
    // 先看类型自身的符号：`RunEnvironment` 这种枚举类型（含它的字面量联合）都带得到
    const own = type.getSymbol()?.declarations?.find((d) => ts.isEnumDeclaration(d));
    if (own) return own;

    for (const candidate of type.isUnion() ? type.types : [type])
    {
        const declaration = candidate.getSymbol()?.declarations?.find((d) => ts.isEnumDeclaration(d));
        if (declaration) return declaration;
    }

    return undefined;
}

/** 是否是 TS enum 类型 */
function isEnumType(type)
{
    return enumDeclarationOf(type) !== undefined;
}

/**
 * 取枚举的成员名，并区分**普通枚举**与**位标志**。
 *
 * 判据是成员的常量值是否连续（`0,1,2,…` / `1,2,3,…`）：
 * - `ShadowType` = `No_Shadows, Hard_Shadows, PCF_Shadows, PCF_Soft_Shadows` → 值连续 → 普通枚举，
 *   面板上应当用下拉单选（写回对应的数值）；
 * - `RunEnvironment` = `1 << 0, 1 << 1, (1 << 8) - 1` → 值不连续（1, 2, 255）→ 位标志，
 *   可以用位或组合，用下拉单选表达它是错的 → 只读展示。
 *
 * 早先只看"是不是数字枚举"，把 `shadowType` 这类普通枚举也判成了只读（实测发现）。
 */
function enumValuesOf(type)
{
    const declaration = enumDeclarationOf(type);
    if (declaration)
    {
        const names = declaration.members.map((m) => m.name.getText());
        if (names.length === 0) return undefined;

        // 取常量值走成员的**字面量类型**而不是 `ts.getConstantValue`：
        // 后者对自动递增成员（`enum X { A, B }`）与位移表达式（`1 << 0`）都返回 undefined，
        // 于是位标志判据整个失效（实测发现）。成员的声明类型在这里就是数值/字符串字面量。
        const constants = declaration.members.map((member) =>
        {
            const memberType = checker.getTypeAtLocation(member);
            if (memberType.isNumberLiteral()) return memberType.value;
            if (memberType.isStringLiteral()) return memberType.value;

            return undefined;
        });
        const allNumeric = constants.every((value) => typeof value === 'number');
        if (allNumeric)
        {
            const sorted = [...constants].sort((a, b) => a - b);
            const sequential = sorted.every((value, index) => index === 0 || value === sorted[index - 1] + 1);
            if (!sequential) return { values: names, numeric: true };

            // 普通数字枚举：把 名字 → 数值 一并给出，控件据此写回数值
            return {
                values: names,
                numeric: false,
                numericValues: Object.fromEntries(names.map((name, index) => [name, constants[index]])),
            };
        }

        return { values: names, numeric: false };
    }

    // 字符串字面量联合也是枚举
    const parts = type.isUnion() ? type.types : [type];
    const literals = parts.filter((t) => t.isStringLiteral()).map((t) => t.value);

    return literals.length === parts.length && literals.length > 0 ? { values: literals, numeric: false } : undefined;
}

/** 取对象类型的形状特征（x/y/z、r/g/b/a 这类），用于识别 Vector / Color */
function shapeOf(type)
{
    // 可选字段的类型是 `{x,y,z} | undefined`，联合上取不到成员属性——先挑出对象那支
    const target = type.isUnion() ? type.types.find((t) => (t.flags & ts.TypeFlags.Object) !== 0) : type;
    if (!target) return null;

    const names = new Set(target.getProperties().map((p) => p.name));
    if (names.has('x') && names.has('y') && names.has('z') && names.has('w')) return 'Vector4';
    if (names.has('x') && names.has('y') && names.has('z')) return 'Vector3';
    if (names.has('x') && names.has('y')) return 'Vector2';
    if (names.has('r') && names.has('g') && names.has('b') && names.has('a')) return 'Color4';
    if (names.has('r') && names.has('g') && names.has('b')) return 'Color3';

    return null;
}

/** 取数组元素的控件种类 */
function itemControlOf(type)
{
    const text = checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
    const element = checker.getIndexTypeOfType(type, ts.IndexKind.Number);
    if (!element) return undefined;

    return controlOf(element);
}

/**
 * 取对象联合/对象类型里各成员的 `__type__` 字面量（嵌套对象控件用）。
 *
 * 有了它，面板才能在 `geometry` 这种字段上给出"可换成哪种几何"的选择，
 * 并递归展开所选类型自己的字段。
 */
function typeNamesOf(type)
{
    const parts = type.isUnion() ? type.types : [type];
    const names = [];
    for (const part of parts)
    {
        const prop = part.getProperty('__type__');
        if (!prop) continue;
        const propType = checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration ?? prop.declarations[0]);
        const literal = propType.isUnion() ? propType.types.find((t) => t.isStringLiteral()) : propType;
        if (literal?.isStringLiteral()) names.push(literal.value);
    }

    return names.length > 0 ? names : undefined;
}

// ---------------------------------------------------------------------------
// 3. 扫描「可挂载的纯数据类型」：导出的 interface 自带 `readonly __type__: '<字面量>'`
// ---------------------------------------------------------------------------
/** @type {{name: string, fields: unknown[]}[]} */
const types = [];

for (const source of program.getSourceFiles())
{
    // Windows 上 `source.fileName` 用反斜杠，统一成正斜杠再匹配（否则一个类型都扫不到）
    const file = source.fileName.replace(/\\/g, '/');
    if (file.includes('/node_modules/') || !file.includes('/packages/feng3d/src/')) continue;
    if (file.endsWith('.spec.ts')) continue;

    const moduleSymbol = checker.getSymbolAtLocation(source);
    if (!moduleSymbol) continue;

    for (const symbol of checker.getExportsOfModule(moduleSymbol))
    {
        const declaration = symbol.declarations?.[0];
        if (!declaration || !ts.isInterfaceDeclaration(declaration)) continue;

        // 必须用 getDeclaredTypeOfSymbol：interface 是「类型符号」，
        // getTypeOfSymbolAtLocation 对它拿不到实例类型（会得到 any），后面的属性全空
        const type = checker.getDeclaredTypeOfSymbol(symbol);
        const typeProp = type.getProperty('__type__');
        if (!typeProp) continue;

        const typePropType = checker.getTypeOfSymbolAtLocation(typeProp, typeProp.valueDeclaration ?? typeProp.declarations[0]);
        const literal = typePropType.isUnion()
            ? typePropType.types.find((t) => t.isStringLiteral())
            : typePropType;
        const typeName = literal?.isStringLiteral() ? literal.value : symbol.name;

        const fields = [];
        for (const prop of type.getProperties())
        {
            // `__type__` 是判别字段，不是可编辑数据（面板的 C 兜底也天然把它滤掉了）
            if (prop.name === '__type__') continue;
            const propDeclaration = prop.valueDeclaration ?? prop.declarations?.[0];
            const propType = checker.getTypeOfSymbolAtLocation(prop, propDeclaration ?? declaration);
            const optional = (prop.flags & ts.SymbolFlags.Optional) !== 0;
            const readonly = propDeclaration
                ? (ts.getCombinedModifierFlags(propDeclaration) & ts.ModifierFlags.Readonly) !== 0
                : false;

            let control = controlOf(propType);
            // 形状比"是不是对象"更具体时（Vector3 / Color4 这些内联字面量类型），用形状
            if (control === 'Object')
            {
                const shape = shapeOf(propType);
                if (shape) control = shape;
            }
            const unionTypes = control === 'Object' ? typeNamesOf(propType) : undefined;
            const enumInfo = control === 'Enum' ? enumValuesOf(propType) : undefined;

            const field = {
                name: prop.name,
                type: typeText(propType),
                control,
                ...(optional ? { optional: true } : {}),
                ...(readonly ? { readonly: true } : {}),
                ...(enumInfo ? { values: enumInfo.values } : {}),
                ...(enumInfo?.numeric ? { numeric: true } : {}),
                ...(enumInfo?.numericValues ? { numericValues: enumInfo.numericValues } : {}),
                ...(unionTypes ? { typeNames: unionTypes } : {}),
                ...(control === 'Array' ? { itemControl: itemControlOf(propType) } : {}),
            };
            // 数组元素是 `Components`（所有可挂载组件的联合）时改用**组件列表**控件：
            // 这个字段承载的是对象挂了哪些组件，"把每个组件自己的属性视图渲染出来"才是它的语义，
            // 交给通用数组控件只会显示成一串看不懂的对象（实测：面板里看不到 MeshRenderer 的字段）
            if (control === 'Array' && typeText(propType) === 'Components[]')
            {
                field.control = 'Components';
            }
            fields.push(field);
        }

        types.push({ name: typeName, fields });
    }
}

types.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
// 同名类型取字段最多的那份（联合类型的分支接口会重复出现）
const deduped = new Map();
for (const item of types)
{
    const previous = deduped.get(item.name);
    if (!previous || item.fields.length > previous.fields.length) deduped.set(item.name, item);
}

const totalFields = [...deduped.values()].reduce((sum, t) => sum + t.fields.length, 0);
const controlCounts = {};
for (const item of deduped.values())
{
    for (const field of item.fields) controlCounts[field.control] = (controlCounts[field.control] ?? 0) + 1;
}

console.log(`可挂载纯数据类型 ${deduped.size} 个，字段合计 ${totalFields} 个`);
console.log(`控件分布：${Object.entries(controlCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(', ')}`);

if (statsOnly) process.exit(0);

// ---------------------------------------------------------------------------
// 4. 产出 TypeScript（格式化好的：本文件会被 eslint 检查，产物必须合规）
// ---------------------------------------------------------------------------
/** 生成一个字段字面量的源码文本 */
function fieldSource(field)
{
    const parts = [`name: '${field.name}'`, `type: '${field.type.replace(/'/g, "\\'")}'`, `control: '${field.control}'`];
    if (field.optional) parts.push('optional: true');
    if (field.readonly) parts.push('readonly: true');
    if (field.values) parts.push(`values: [${field.values.map((v) => `'${v}'`).join(', ')}]`);
    if (field.numeric) parts.push('numeric: true');
    if (field.numericValues)
    {
        const pairs = Object.entries(field.numericValues).map(([name, value]) => `${name}: ${value}`);
        parts.push(`numericValues: { ${pairs.join(', ')} }`);
    }
    if (field.typeNames) parts.push(`typeNames: [${field.typeNames.map((v) => `'${v}'`).join(', ')}]`);
    if (field.itemControl) parts.push(`itemControl: '${field.itemControl}'`);

    return `        { ${parts.join(', ')} },`;
}

const lines = [
    '/**',
    ' * 属性面板的字段描述表：`__type__` → 该类型的纯数据字段清单。',
    ' *',
    ' * **本文件由脚本生成，请勿手工编辑。**',
    ' * 重新生成：`node scripts/gen-objectview-schema.mjs`',
    ' * 校验是否为最新（CI 门禁）：`node scripts/gen-objectview-schema.mjs --check`',
    ' *',
    ` * 来源：packages/feng3d 里所有自带 \`readonly __type__: '<字面量>'\` 的导出 interface`,
    ` * （共 ${deduped.size} 个类型 / ${totalFields} 个字段）。判据是接口自己声明的 \`__type__\`——`,
    ' * 新增组件按范式写接口，本表自动跟随，面板无需改代码。',
    ' */',
    "import type { DataTypeFieldSchema } from '../dataTypeSchema';",
    '',
    '/** `__type__` → 该类型的字段清单 */',
    'export type DataTypeSchema = Record<string, readonly DataTypeFieldSchema[]>;',
    '',
    'export const DATA_TYPE_SCHEMA: DataTypeSchema = {',
];
for (const item of deduped.values())
{
    lines.push(`    '${item.name}': [`);
    for (const field of item.fields) lines.push(fieldSource(field));
    lines.push('    ],');
}
lines.push('};', '');

const output = lines.join('\n');
const absolute = resolve(OUTPUT);

if (checkOnly)
{
    let current = '';
    try { current = readFileSync(absolute, 'utf8'); }
    catch { /* 产物不存在，按"不是最新"处理 */ }

    if (current === output)
    {
        console.log(`✅ ${OUTPUT} 与源码一致（${deduped.size} 个类型 / ${totalFields} 个字段）`);
        process.exit(0);
    }

    const currentLines = current.split('\n');
    const nextLines = output.split('\n');
    const at = currentLines.findIndex((line, i) => line !== nextLines[i]);
    console.error(`❌ ${OUTPUT} 不是最新，请运行：node scripts/gen-objectview-schema.mjs`);
    console.error(`   首个差异在第 ${at < 0 ? '(行数不同)' : at + 1} 行：`);
    console.error(`   产物：${(currentLines[at] ?? '(文件更短)').trim().slice(0, 160)}`);
    console.error(`   应为：${(nextLines[at] ?? '(文件更长)').trim().slice(0, 160)}`);
    process.exit(1);
}

mkdirSync(dirname(absolute), { recursive: true });
writeFileSync(absolute, output, 'utf8');
console.log(`已写入 ${OUTPUT}（${output.split('\n').length} 行，${(output.length / 1024).toFixed(1)} KB）`);
