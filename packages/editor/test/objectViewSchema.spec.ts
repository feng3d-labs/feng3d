import { describe, expect, it } from 'vitest';
import { OBJECT_VIEW_CONFIG } from '../src/configs/objectViewSchema';
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
});
