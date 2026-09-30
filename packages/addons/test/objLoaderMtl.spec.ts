import { describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与 addons 其它 spec 同模式）
import './browser-stub';

import { parseMTL, parseOBJ, parseOBJWithMTLInfo, parseOBJWithMaterials } from '../src/loaders/OBJLoader';

/**
 * 两个材质的 MTL：颜色不同，且刻意混入注释、空行与 `.5` 简写（issue #12）。
 *
 * `mat_a` 的 Kd 用 `0.5 0.25 0`，`mat_b` 用 `.5 .5 .5`——两者解析结果必须各自正确，
 * 「2 个材质」这条断言才有意义。
 */
const MTL_TEXT = [
    '# 材质库：两个颜色不同的材质',
    '',
    'newmtl mat_a',
    'Ka 0.1 0.2 0.3',
    'Kd 0.5 0.25 0',
    'Ks 1 1 1',
    'Ns 32',
    'd 0.5',
    'illum 2',
    'map_Kd a_diffuse.png',
    '',
    'newmtl mat_b',
    'Kd .5 .5 .5',
    'Ns 96',
    '',
].join('\n');

/**
 * OBJ：`mtllib` + 两个分组（`o`），`usemtl` 在两个分组之间切换。
 *
 * 分组名与材质名刻意不同（cube_a ↔ mat_a）——若解析只记录「第一个 usemtl」，
 * 第二个分组就会拿到 mat_a，断言即失败。
 */
const OBJ_TEXT = [
    '# 两个分组，各用不同材质',
    'mtllib scene.mtl',
    'v 0 0 0',
    'v 1 0 0',
    'v 0 1 0',
    'o cube_a',
    'usemtl mat_a',
    'f 1 2 3',
    'o cube_b',
    'usemtl mat_b',
    'f 1 3 2',
    '',
].join('\n');

/** 没有任何 `usemtl` 的 OBJ（分组不应拿到材质，且不抛错） */
const OBJ_WITHOUT_USEMTL = 'v 0 0 0\nv 1 0 0\nv 0 1 0\no plain\nf 1 2 3\n';

/**
 * 需要逐字段比对的几何数据字段。
 *
 * 用「逐字段数组相等」而不是对象引用相等：`parseOBJ` 每次调用都会新建几何
 * （`reactive` 代理不同实例），引用相等无法成立，逐字段比对才是真正的等价性断言。
 */
const GEOMETRY_FIELDS = ['positions', 'normals', 'uvs', 'indices', 'colors'] as const;

describe('MTL 解析（issue #12）', () =>
{
    it('两个 newmtl：材质表 2 项，Kd 逐分量正确，Material.name 正确', () =>
    {
        const { materials } = parseMTL(MTL_TEXT);

        // 材质表项数：只有 newmtl 开材质，注释/空行不产生材质
        expect(materials.size).toBe(2);
        expect([...materials.keys()]).toEqual(['mat_a', 'mat_b']);

        const a = materials.get('mat_a')!;
        // Kd 0.5 0.25 0 → u_diffuse 逐分量
        expect(a.material.name).toBe('mat_a');
        expect(a.material.__type__).toBe('StandardMaterial');
        expect(a.material.uniforms!.u_diffuse!.r).toBeCloseTo(0.5, 6);
        expect(a.material.uniforms!.u_diffuse!.g).toBeCloseTo(0.25, 6);
        expect(a.material.uniforms!.u_diffuse!.b).toBeCloseTo(0, 6);
        // Ka → u_ambient、Ks → u_specular、Ns → u_glossiness
        expect(a.material.uniforms!.u_ambient!.r).toBeCloseTo(0.1, 6);
        expect(a.material.uniforms!.u_ambient!.g).toBeCloseTo(0.2, 6);
        expect(a.material.uniforms!.u_ambient!.b).toBeCloseTo(0.3, 6);
        expect(a.material.uniforms!.u_specular!.r).toBeCloseTo(1, 6);
        expect(a.material.uniforms!.u_glossiness).toBe(32);

        // `Kd .5 .5 .5`（省略前导 0）与 `Kd 0.5 0.5 0.5` 必须等价
        const b = materials.get('mat_b')!;
        expect(b.material.name).toBe('mat_b');
        expect(b.material.uniforms!.u_diffuse!.r).toBeCloseTo(0.5, 6);
        expect(b.material.uniforms!.u_diffuse!.g).toBeCloseTo(0.5, 6);
        expect(b.material.uniforms!.u_diffuse!.b).toBeCloseTo(0.5, 6);
        expect(b.material.uniforms!.u_glossiness).toBe(96);

        // 两个材质的 Kd 不同（否则「2 个材质」的断言没有区分力）
        expect(a.material.uniforms!.u_diffuse!.g).not.toBeCloseTo(b.material.uniforms!.u_diffuse!.g);
    });

    it('未映射字段如实保留（d / illum 原文保留），map_Kd 只记录文件名不加载', () =>
    {
        const { materials, sourceFiles } = parseMTL(MTL_TEXT, 'scene.mtl');

        const a = materials.get('mat_a')!;
        // d / illum 没有可写开关：不映射到任何 StandardMaterial 字段，只留原文
        expect(a.d).toBeCloseTo(0.5, 6);
        expect(a.illum).toBe(2);
        expect(a.material.uniforms!.u_alphaThreshold).toBeUndefined();
        // map_Kd 只记录文件名（`Texture` 需要异步加载图片，本次不做）
        expect(a.textureFiles.map_Kd).toBe('a_diffuse.png');
        expect(a.material.s_diffuse).toBeUndefined();
        // sourceFiles 记录材质所属 mtl 文件名（便于调用方按文件加载）
        expect([...sourceFiles.keys()]).toEqual(['mat_a', 'mat_b']);
        expect(sourceFiles.get('mat_a')).toBe('scene.mtl');
        expect(sourceFiles.get('mat_b')).toBe('scene.mtl');
    });
});

describe('OBJ 与 MTL 的绑定（issue #12）', () =>
{
    it('usemtl 在两个 o 分组之间切换：每个分组拿到的材质名正确', () =>
    {
        const items = parseOBJWithMaterials(OBJ_TEXT, [MTL_TEXT]);

        expect(items.length).toBe(2);
        expect(items[0].name).toBe('cube_a');
        expect(items[1].name).toBe('cube_b');

        // 每条断言都必须能区分两个分组：材质名与材质数据都不同
        expect(items[0].materials.map((m) => m.name)).toEqual(['mat_a']);
        expect(items[1].materials.map((m) => m.name)).toEqual(['mat_b']);
        expect(items[0].materials[0].name).toBe('mat_a');
        expect(items[1].materials[0].name).toBe('mat_b');
        // newmtl 名 → Material.name（绑定到模型上的材质带得走名字）
        expect(items[0].materials[0].material.name).toBe('mat_a');
        expect(items[1].materials[0].material.name).toBe('mat_b');
        // 两个分组各持一份材质数据（不共享实例，避免"改一处影响全部"）
        expect(items[0].materials[0].material).not.toBe(items[1].materials[0].material);
        // 且两份数据的 Kd 各自正确（不是复制了同一份颜色）
        expect(items[0].materials[0].material.uniforms!.u_diffuse!.g).toBeCloseTo(0.25, 6);
        expect(items[1].materials[0].material.uniforms!.u_diffuse!.g).toBeCloseTo(0.5, 6);

        // 几何与 parseOBJ 完全一致（带材质的入口不改变几何产出；逐字段比对顶点数据）
        const geometryOfParseOBJ = parseOBJ(OBJ_TEXT);
        for (let i = 0; i < items.length; i++)
        {
            expect(items[i].geometry.__type__).toBe('CustomGeometry');
            for (const field of GEOMETRY_FIELDS)
            {
                expect(Array.from(items[i].geometry[field]!)).toEqual(Array.from(geometryOfParseOBJ[i][field]!));
            }
        }
        expect(Array.from(items[0].geometry.indices!)).toEqual([0, 1, 2]);
        expect(Array.from(items[1].geometry.indices!)).toEqual([0, 1, 2]);
    });

    it('记录 mtllib 与逐条 usemtl（parseOBJWithMTLInfo 不改几何）', () =>
    {
        const info = parseOBJWithMTLInfo(OBJ_TEXT);

        expect(info.mtlLibs).toEqual(['scene.mtl']);
        expect(info.materialUses).toEqual([
            { groupName: 'cube_a', materialName: 'mat_a' },
            { groupName: 'cube_b', materialName: 'mat_b' },
        ]);
        expect(info.groupNames).toEqual(['cube_a', 'cube_b']);
        // 同一段文本下与 parseOBJ 的几何逐字段一致（几何产出不分叉）
        const geometries = parseOBJ(OBJ_TEXT);
        expect(info.geometries.length).toBe(geometries.length);
        for (let i = 0; i < geometries.length; i++)
        {
            for (const field of GEOMETRY_FIELDS)
            {
                expect(Array.from(info.geometries[i][field]!)).toEqual(Array.from(geometries[i][field]!));
            }
        }
    });

    it('OBJ 没有 usemtl：分组材质为空数组且不抛错', () =>
    {
        const items = parseOBJWithMaterials(OBJ_WITHOUT_USEMTL, [MTL_TEXT]);

        expect(items.length).toBe(1);
        expect(items[0].geometry.positions!.length).toBe(9);
        expect(items[0].materials).toEqual([]);
        expect(parseOBJWithMTLInfo(OBJ_WITHOUT_USEMTL).materialUses).toEqual([]);
    });

    it('usemtl 引用了 MTL 里不存在的名字：抛可判别的错误，不静默成功', () =>
    {
        const objText = OBJ_TEXT.replace('usemtl mat_b', 'usemtl mat_missing');

        expect(() => parseOBJWithMaterials(objText, [MTL_TEXT])).toThrowError(/mat_missing/);
        // 错误信息里带上可用材质名，便于排查
        expect(() => parseOBJWithMaterials(objText, [MTL_TEXT])).toThrowError(/mat_a/);
    });

    it('parseOBJ 既有行为不变：返回 CustomGeometry[]，顶点数与改动前一致', () =>
    {
        const geometries = parseOBJ(OBJ_TEXT);

        expect(Array.isArray(geometries)).toBe(true);
        expect(geometries.length).toBe(2);
        for (const geometry of geometries)
        {
            expect(geometry.__type__).toBe('CustomGeometry');
            // 每个分组 1 个三角形：3 顶点 × 3 分量
            expect(geometry.positions!.length).toBe(9);
            expect(geometry.normals!.length).toBe(9);
            expect(geometry.uvs!.length).toBe(6);
            expect(Array.from(geometry.indices!)).toEqual([0, 1, 2]);
            expect(geometry.colors!.length).toBe(12);
        }
        // 两个分组的面绕序不同（立方体两侧），顶点坐标按面顺序展开
        expect(Array.from(geometries[0].positions!)).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        expect(Array.from(geometries[1].positions!)).toEqual([0, 0, 0, 0, 1, 0, 1, 0, 0]);
    });
});
