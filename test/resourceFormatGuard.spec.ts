import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { serialization } from '@feng3d/serialization';

/**
 * 仓库内资源文件的格式守卫（issue #221）。
 *
 * 背景：场景/资源数据已迁移为**纯数据格式**（`__type__` 字面量 + Logic），旧格式
 * （`__class__` + `GameObject` / `Transform` / 外挂 lens）只能靠 `classUtils.getInstanceByName()`
 * 反射构造，而主仓的数据类型**已经没有构造器**——旧格式资源必然加载失败
 * （详见 docs/SERIALIZATION_MIGRATION.md）。
 *
 * 迁移已完成（S1–S4），本用例守住两件事：
 * 1. 仓库里**不再有**旧格式资源（防止回潮：再有人提交一份 `__class__` 的 scene/gameobject，
 *    这里会直接失败）；
 * 2. 迁移后的 examples 场景确实能被纯数据链路反序列化出结构（不是"文件看着没 __class__ 就算数"）。
 */
const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** 递归收集目录下的 .json 文件（跳过 node_modules / dist / public 等） */
function collectJson(dir: string, out: string[] = []): string[]
{
    let entries: string[];

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
        if (name === 'node_modules' || name === 'dist' || name === 'lib' || name === 'public' || name === '.git') continue;

        const full = join(dir, name);

        if (statSync(full).isDirectory()) collectJson(full, out);
        else if (name.endsWith('.json')) out.push(full);
    }

    return out;
}

/** 收集仓库里"资源目录"下的 json：examples/resources 与各包的 resource/ */
function collectResourceJson(): string[]
{
    const files = collectJson(join(ROOT, 'examples', 'resources'));

    for (const pkg of readdirSync(join(ROOT, 'packages')))
    {
        files.push(...collectJson(join(ROOT, 'packages', pkg, 'resource')));
    }

    return files;
}

describe('资源格式守卫（issue #221）', () =>
{
    it('仓库内资源 json 不再含旧格式 __class__', () =>
    {
        const files = collectResourceJson();

        // 先确认扫描确实覆盖到了目标文件（否则"0 个坏文件"可能只是没扫到）
        expect(files.length).toBeGreaterThan(5);
        expect(files.some((f) => f.endsWith(join('scene', 'Untitled.scene.json')))).toBe(true);

        const offenders = files
            // `*.legacy.json` 是 `scripts/migrate-scene-json.mjs` 的**迁移输入备份**
            // （脚本靠它做到"可重复运行、输出稳定"），见下一条用例；它们不是运行时资源
            .filter((f) => !f.endsWith('.legacy.json'))
            .filter((f) => readFileSync(f, 'utf8').includes('__class__'));

        expect(offenders.map((f) => f.replace(ROOT, ''))).toEqual([]);
    });

    it('迁移备份（*.legacy.json）是仓库里唯一的旧格式来源，且确实只作迁移输入', () =>
    {
        const legacy = collectResourceJson().filter((f) => f.endsWith('.legacy.json'));

        // 备份文件本身必须是旧格式——若某天它变成纯数据，说明有人把"备份"当成了产物；
        // 若它消失，说明迁移脚本的"可重复运行"前提没了（需要重跑就得从 git 历史取）
        for (const file of legacy)
        {
            expect(readFileSync(file, 'utf8')).toContain('__class__');
        }
    });

    it('examples 的场景文件能被纯数据反序列化加载', () =>
    {
        const json = JSON.parse(readFileSync(join(ROOT, 'examples', 'resources', 'scene', 'Untitled.scene.json'), 'utf8'));
        const root = serialization.deserialize<{
            __type__: string,
            name: string,
            components: { __type__: string }[],
            children: { name: string, components: { __type__: string }[] }[],
        }>(json);

        expect(root.__type__).toBe('Object3D');
        expect(root.name).toBe('Untitled');
        expect(root.components.map((c) => c.__type__)).toContain('Scene');

        const camera = root.children.find((c) => c.name === 'Main Camera');

        expect(camera).toBeDefined();
        // 旧格式的 `Camera + 外挂 lens` 已内联为 PerspectiveCamera
        expect(camera!.components.map((c) => c.__type__)).toContain('PerspectiveCamera');
    });
});
