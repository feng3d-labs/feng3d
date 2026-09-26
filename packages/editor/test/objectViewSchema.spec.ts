import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { OBJECT_VIEW_CONFIG } from '../src/configs/objectViewSchema';
import { OBJECT_VIEW_PLUGIN } from '../src/plugins/builtinObjectView';
import { DATA_TYPE_SCHEMA } from '../src/vue-app/objectview/generated/dataTypeSchema';

/**
 * 人工配置表（分组 / 显示名 / 视图）的体检。
 *
 * 配置里写错一个字段名或分组名，**面板上不会报错**——只会多出一个永远不显示的配置项、
 * 或者某几个字段静静落进一个没声明过的分组。这类问题只有真去点开面板才看得见，
 * 所以在这里用描述表当"事实来源"逐条核对。
 */
describe('属性面板人工配置', () =>
{
    /**
     * 允许配置里出现、但描述表里没有的字段。
     *
     * 配置**可以**追加字段（那是它的能力之一），因此不能一概判为错误；
     * 但每一条都该是有意为之，所以列在这里——没列进来的就是拼错了。
     */
    const INTENTIONAL_EXTRA_FIELDS: readonly string[] = [];

    it('每个配置的 __type__ 都在描述表里（拼错类型名等于整套配置不生效）', () =>
    {
        const unknown = Object.keys(OBJECT_VIEW_CONFIG).filter((type) => !(type in DATA_TYPE_SCHEMA));

        expect(unknown).toEqual([]);
    });

    it('配置引用的字段名确实存在于该类型的描述表（或已在白名单里登记）', () =>
    {
        const typos: string[] = [];
        for (const [typeName, config] of Object.entries(OBJECT_VIEW_CONFIG))
        {
            const known = new Set((DATA_TYPE_SCHEMA[typeName] ?? []).map((field) => field.name));
            for (const fieldName of Object.keys(config.attributes ?? {}))
            {
                if (known.has(fieldName)) continue;
                if (INTENTIONAL_EXTRA_FIELDS.includes(`${typeName}.${fieldName}`)) continue;
                typos.push(`${typeName}.${fieldName}`);
            }
        }

        expect(typos).toEqual([]);
    });

    it('字段引用的分组都在该类型的 blocks 里声明过（否则分组顺序会失控）', () =>
    {
        const undeclared: string[] = [];
        for (const [typeName, config] of Object.entries(OBJECT_VIEW_CONFIG))
        {
            const declared = new Set((config.blocks ?? []).map((block) => block.name));
            for (const [fieldName, attribute] of Object.entries(config.attributes ?? {}))
            {
                if (attribute.block === undefined || attribute.block === '') continue;
                if (declared.has(attribute.block)) continue;
                undeclared.push(`${typeName}.${fieldName} → ${attribute.block}`);
            }
        }

        expect(undeclared).toEqual([]);
    });

    it('分组名不重复', () =>
    {
        const duplicated: string[] = [];
        for (const [typeName, config] of Object.entries(OBJECT_VIEW_CONFIG))
        {
            const names = (config.blocks ?? []).map((block) => block.name);
            if (new Set(names).size !== names.length) duplicated.push(typeName);
        }

        expect(duplicated).toEqual([]);
    });

    it('主要类型都配了分组（否则面板上是一长条没有分节的字段）', () =>
    {
        for (const typeName of ['Object3D', 'MeshRenderer', 'PerspectiveCamera', 'Scene', 'StandardMaterial'])
        {
            expect(OBJECT_VIEW_CONFIG[typeName]?.blocks?.length ?? 0).toBeGreaterThan(0);
        }
    });

    it('每个被配置的字段都给了显示名（这是这一层存在的主要理由）', () =>
    {
        const missing: string[] = [];
        for (const [typeName, config] of Object.entries(OBJECT_VIEW_CONFIG))
        {
            for (const [fieldName, attribute] of Object.entries(config.attributes ?? {}))
            {
                // 只排除展示的字段不需要显示名
                if (attribute.exclude) continue;
                if (attribute.label === undefined) missing.push(`${typeName}.${fieldName}`);
            }
        }

        expect(missing).toEqual([]);
    });

    it('分组指定的块视图控件确实注册过（写错名字只会静默落回默认块视图）', () =>
    {
        // 注册表在 registerComponents.ts 里（运行时才建，且需要 DOM），所以这里对着源码核对
        const source = readFileSync(
            new URL('../src/vue-app/objectview/registerComponents.ts', import.meta.url),
            'utf8',
        );
        const registered = new Set([...source.matchAll(/createOBVComponent\(\s*'([^']+)'/g)].map((match) => match[1]));

        const unknown: string[] = [];
        for (const [typeName, config] of Object.entries(OBJECT_VIEW_CONFIG))
        {
            for (const block of config.blocks ?? [])
            {
                if (block.component === undefined) continue;
                if (!registered.has(block.component)) unknown.push(`${typeName}.${block.name} → ${block.component}`);
            }
        }

        expect(unknown).toEqual([]);
        // 顺带确认核对本身没落空（注册表至少得有默认块视图）
        expect(registered.has('OBVDefault')).toBe(true);
    });

    it('描述表/配置里用到的控件种类都已注册（漏注册只会静默退化成默认控件）', () =>
    {
        // 这条是踩坑后补的：描述表把 `cullFace` / `shadowType` 标成 `Enum`，
        // 但类型→控件表里没有 `Enum` 映射，面板上就没出现下拉，而 schema 与配置都"看起来对"。
        //
        // issue #170 之前这条只能对着源码文本做正则匹配（`readFileSync` + `matchAll`），
        // 因为注册表原先写在 `configs/ObjectViewConfig.ts` 的模块顶层、import 它要拉整个 feng3d + DOM。
        // 那份配置变成**纯数据清单**之后，这里可以直接读数据——比正则可靠得多
        // （正则连"这行在不在注释里"都分不清）。
        const registered = new Set(
            (OBJECT_VIEW_PLUGIN.contributes.objectView?.typeAttributeViews ?? []).map((entry) => entry.type),
        );

        // 描述表里实际用到的控件种类。
        // `Default` = 故意落到默认视图；`Object` = 嵌套对象，由 OAVDefault 递归展开，都不需要专门注册
        const usedBySchema = new Set(Object.values(DATA_TYPE_SCHEMA).flat().map((field) => field.control));
        usedBySchema.delete('Default');
        usedBySchema.delete('Object');

        expect([...usedBySchema].filter((control) => !registered.has(control))).toEqual([]);

        // 配置里覆盖的控件种类同样要注册
        const configTypes = Object.values(OBJECT_VIEW_CONFIG)
            .flatMap((config) => Object.values(config.attributes ?? {}))
            .map((attribute) => attribute.type)
            .filter((type): type is string => type !== undefined);
        expect(configTypes.filter((type) => !registered.has(type))).toEqual([]);

        // 核对本身别落空
        expect(registered.has('number')).toBe(true);
    });

    it('「基本信息」排在 Object3D 最前，且用紧凑块视图（名称/标签/启用/可拾取 自适应排布）', () =>
    {
        const blocks = OBJECT_VIEW_CONFIG.Object3D?.blocks ?? [];

        expect(blocks[0]?.name).toBe('基本信息');
        expect(blocks[0]?.component).toBe('OBVInline');
    });
});
