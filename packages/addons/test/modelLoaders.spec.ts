import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与 addons 其它 spec 同模式）
import './browser-stub';

import { parseOBJ } from '../src/loaders/OBJLoader';
import { parsePLY } from '../src/loaders/PLYLoader';
import { parseSTL } from '../src/loaders/STLLoader';
import { parseGLB } from '../src/loaders/GLTFLoader';

const RES = join(__dirname, '../../../examples/resources');

/** 读资源文件为 ArrayBuffer（fs 的 Buffer 可能带额外偏移，按视图截取） */
function readBuffer(name: string): ArrayBuffer
{
    const buf = readFileSync(join(RES, name));

    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/**
 * 构造 binary_little_endian PLY：3 个顶点（x/y/z）+ 1 个三角形（face 的 list 属性）。
 *
 * header 与 examples/resources/dolphins.ply 同构（vertex 属性 + face 的
 * `property list uchar int vertex_indices`），用于覆盖二进制分支的属性偏移解析。
 *
 * @param lineEnding header 换行符（校验 CRLF 兼容）
 */
function makeBinaryPLY(lineEnding = '\n'): ArrayBuffer
{
    const header = [
        'ply',
        'format binary_little_endian 1.0',
        'element vertex 3',
        'property float x',
        'property float y',
        'property float z',
        'element face 1',
        'property list uchar int vertex_indices',
        'end_header',
        '',
    ].join(lineEnding);
    const headerBytes = new TextEncoder().encode(header);

    const body = new ArrayBuffer(3 * 12 + 1 + 3 * 4);
    const view = new DataView(body);
    [0, 0, 0, 1, 0, 0, 0, 1, 0].forEach((v, i) => view.setFloat32(i * 4, v, true));
    view.setUint8(36, 3); // list 元素个数
    view.setInt32(37, 0, true);
    view.setInt32(41, 1, true);
    view.setInt32(45, 2, true);

    const out = new Uint8Array(headerBytes.length + body.byteLength);
    out.set(headerBytes, 0);
    out.set(new Uint8Array(body), headerBytes.length);

    return out.buffer;
}

/**
 * OBJLoader 回归测试。
 *
 * 原缺陷（issue #34「解决模型解析bug」）：
 * 1. `f` 行被硬截成前 3 个顶点（`for (let i = 1; i <= 3; i++)`），四边形/多边形面每面丢
 *    掉后半个三角形——examples/resources/cube.obj 的 6 个四边形面只产出 6 个三角形；
 * 2. `vt` 引用被存成 `[索引, [u,v]]`，展开时又把这对值当 uv 写入，导致所有带纹理坐标的
 *    OBJ（tree.obj / head.obj）UV 半数元素是数组、半数元素是索引——即纹理完全错乱。
 */
describe('OBJLoader', () =>
{
    it('四边形面扇形三角化：cube.obj 的 6 个四边形面产出 12 个三角形', () =>
    {
        const text = readFileSync(join(RES, 'cube.obj'), 'utf8');
        // 前置事实校验：该模型的面全部是四边形，回归点正是「四边形被截成三角形」
        const faceVertexCounts = text.split('\n')
            .filter((line) => line.trim().startsWith('f '))
            .map((line) => line.trim().split(/\s+/).length - 1);
        expect(faceVertexCounts.length).toBe(6);
        expect(faceVertexCounts.every((n) => n === 4)).toBe(true);

        const geometries = parseOBJ(text);
        expect(geometries.length).toBe(1);

        const geo = geometries[0];
        expect(geo.indices!.length / 3).toBe(12); // 6 个四边形 × 2 个三角形
        expect(geo.positions!.length).toBe(36 * 3);

        // 立方体顶点坐标范围 ±1（原缺陷下丢掉的三角形会让包围盒塌陷），且无 NaN
        for (const v of geo.positions!)
        {
            expect(Number.isFinite(v)).toBe(true);
            expect(Math.abs(v)).toBeLessThanOrEqual(1.000001);
        }
    });

    it('纹理坐标正确：tree.obj 的 uv 与文件 vt 表逐顶点一致', () =>
    {
        const text = readFileSync(join(RES, 'tree.obj'), 'utf8');
        const vt: number[][] = [];
        const faces: string[] = [];
        for (const line of text.split('\n'))
        {
            const trimmed = line.trim();
            if (trimmed.startsWith('vt ')) vt.push(trimmed.split(/\s+/).slice(1).map(Number));
            else if (trimmed.startsWith('f ')) faces.push(trimmed);
        }
        expect(vt.length).toBeGreaterThan(0);

        const geo = parseOBJ(text)[0];
        const uvs = geo.uvs!;
        expect(uvs.length).toBe(faces.length * 3 * 2);

        // 全部 uv 必须是有限数（原缺陷下半数元素是数组而非数字）
        for (const v of uvs) expect(Number.isFinite(v)).toBe(true);

        // 面均为三角形，展开顺序即「面顺序 × 面内顶点顺序」——逐顶点对齐文件 vt 表
        let k = 0;
        for (const face of faces)
        {
            for (const ref of face.split(/\s+/).slice(1))
            {
                const expectUv = vt[Number(ref.split('/')[1]) - 1];
                expect(uvs[k++]).toBeCloseTo(expectUv[0], 5);
                expect(uvs[k++]).toBeCloseTo(expectUv[1], 5);
            }
        }
    });

    it('支持负索引（相对已读入元素）并扇形三角化多边形', () =>
    {
        const text = [
            'v 0 0 0', 'v 1 0 0', 'v 1 1 0', 'v 0 1 0',
            'vt 0 0', 'vt 1 0', 'vt 1 1', 'vt 0 1',
            'vn 0 0 1',
            'f -4/-4/-1 -3/-3/-1 -2/-2/-1 -1/-1/-1',
        ].join('\n');

        const geo = parseOBJ(text)[0];
        // 展开为非索引网格（每面 3 顶点各占一份），indices 为顺序索引
        expect(Array.from(geo.indices!)).toEqual([0, 1, 2, 3, 4, 5]);
        expect(Array.from(geo.positions!)).toEqual([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0]);
        expect(Array.from(geo.uvs!)).toEqual([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]);
        // 法线取自 vn 0 0 1（负索引 -1 → 唯一一条法线）
        expect(Array.from(geo.normals!)).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
    });

    it('越界的 vt/vn 引用按缺失处理，不产生 NaN', () =>
    {
        const text = 'v 0 0 0\nv 1 0 0\nv 0 1 0\nvn 0 0 1\nf 1/9/1 2/9/1 3/9/9\n';

        const geo = parseOBJ(text)[0];
        for (const v of [...geo.positions!, ...geo.uvs!, ...geo.normals!]) expect(Number.isFinite(v)).toBe(true);
    });
});

/**
 * 其它模型加载器测试。
 *
 * 调研（issue #34）时用 examples/resources 下的真实资源逐一实测：STL / GLB 在上述资源上
 * 均无 NaN、顶点与三角形数量与文件头一致，故只留冒烟守住；PLY 的 ASCII 分支同样正常，
 * 但二进制分支存在「face 的 list 属性被当成 vertex 属性逐个读取」的错位缺陷，见下方用例。
 */
describe('模型加载器冒烟', () =>
{
    it('PLY（ASCII，dolphins.ply）按文件头产出顶点与三角形', () =>
    {
        const geo = parsePLY(readBuffer('dolphins.ply'));
        expect(geo.positions!.length).toBe(855 * 3); // element vertex 855
        expect(geo.indices!.length).toBe(1689 * 3); // element face 1689
        for (const v of geo.positions!) expect(Number.isFinite(v)).toBe(true);
    });

    it('PLY（二进制）按属性类型逐项读取，不因 face 的 list 属性错位', () =>
    {
        // 原缺陷：header 里所有 `property` 行（含 face 的 list 属性 vertex_indices）
        // 被并入同一个属性名数组，二进制分支每顶点多读 1 字节 → 第二个顶点起全部错位成垃圾值。
        const geo = parsePLY(makeBinaryPLY());
        expect(Array.from(geo.positions!)).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        expect(Array.from(geo.indices!)).toEqual([0, 1, 2]);
        expect(Array.from(geo.normals!)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]); // header 无法线属性
    });

    it('PLY header 兼容 CRLF 换行', () =>
    {
        const geo = parsePLY(makeBinaryPLY('\r\n'));
        expect(Array.from(geo.positions!)).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    });

    it('STL（二进制，slotted_disk.stl）每面 3 顶点', () =>
    {
        const geo = parseSTL(readBuffer('slotted_disk.stl'));
        expect(geo.positions!.length).toBe(288 * 3 * 3); // 288 面 × 3 顶点 × 3 分量
        expect(geo.normals!.length).toBe(288 * 3 * 3);
        expect(geo.indices!.length).toBe(288 * 3);
    });

    it('GLB（collision-world.glb）解析出场景树与网格', () =>
    {
        const result = parseGLB(readBuffer('collision-world.glb'));
        expect(result.root.children!.length).toBeGreaterThan(0);

        let meshCount = 0;
        let vertexCount = 0;
        const walk = (obj: NonNullable<typeof result.root.children>[number]): void =>
        {
            const renderer = (obj.components ?? []).find((c) => c.__type__ === 'MeshRenderer');
            if (renderer && renderer.__type__ === 'MeshRenderer')
            {
                meshCount++;
                vertexCount += renderer.geometry.positions!.length / 3;
                for (const v of renderer.geometry.positions!) expect(Number.isFinite(v)).toBe(true);
            }
            for (const child of obj.children ?? []) walk(child);
        };
        walk(result.root);

        expect(meshCount).toBeGreaterThan(0);
        expect(vertexCount).toBeGreaterThan(0);
    });
});
