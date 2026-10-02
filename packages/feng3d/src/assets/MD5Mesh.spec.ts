/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';
import { QuaternionLike, quatCopy, quatMult, quatRotatePoint, Vector3, Vector3Like } from '@feng3d/math';
import { getMD5WeightPosition, parseMD5Mesh } from './MD5Mesh';
import type { MD5Joint, MD5Mesh, MD5Vertex, MD5Weight } from './MD5Mesh';

/**
 * 真实资源文件：id Tech 4 的 hellknight 模型。
 *
 * 以 Vite 的 `?raw` 形式导入，避免在 `packages/feng3d` 的 strict 配置里引入 node 类型。
 */
import meshText from '../../../../examples/resources/hellknight/hellknight.md5mesh?raw';

/** 解析结果缓存（懒初始化） */
let cachedMesh: MD5Mesh | undefined;

/**
 * 解析真实资源文件（同一份文本只解析一次）。
 */
function getMesh(): MD5Mesh
{
    if (!cachedMesh)
    {
        cachedMesh = parseMD5Mesh(meshText);
    }

    return cachedMesh;
}

/**
 * 从文件文本中提取某个声明的全部数值（如所有 `numverts 1656` 的 1656）。
 */
function findDeclaration(text: string, keyword: string): number[]
{
    const values: number[] = [];
    const regex = new RegExp(`^[ \\t]*${keyword}\\s+(\\d+)`, 'gm');
    let match = regex.exec(text);
    while (match)
    {
        values.push(Number(match[1]));
        match = regex.exec(text);
    }

    return values;
}

describe('assets/MD5Mesh', () =>
{
    it('解析出的关节数与子网格数与文件头部声明一致', () =>
    {
        const mesh = getMesh();

        expect(mesh.numJoints).toBeGreaterThan(0);
        expect(mesh.numMeshes).toBeGreaterThan(0);
        expect(mesh.joints).toHaveLength(mesh.numJoints);
        expect(mesh.meshes).toHaveLength(mesh.numMeshes);
    });

    it('每个子网格的顶点数、三角形数、权重数与文件声明一致', () =>
    {
        const mesh = getMesh();
        const numverts = findDeclaration(meshText, 'numverts');
        const numtris = findDeclaration(meshText, 'numtris');
        const numweights = findDeclaration(meshText, 'numweights');

        expect(mesh.meshes.length).toBeGreaterThan(0);
        mesh.meshes.forEach((subMesh, i) =>
        {
            expect(subMesh.vertices).toHaveLength(numverts[i]);
            expect(subMesh.triangles).toHaveLength(numtris[i]);
            expect(subMesh.weights).toHaveLength(numweights[i]);
        });
    });

    it('所有顶点位置都是有限数且落在合理包围盒内', () =>
    {
        const mesh = getMesh();
        let vertexCount = 0;
        mesh.meshes.forEach((subMesh) =>
        {
            subMesh.vertices.forEach((vertex) =>
            {
                expect(Number.isFinite(vertex.position.x)).toBe(true);
                expect(Number.isFinite(vertex.position.y)).toBe(true);
                expect(Number.isFinite(vertex.position.z)).toBe(true);
                expect(Math.abs(vertex.position.x)).toBeLessThan(300);
                expect(Math.abs(vertex.position.y)).toBeLessThan(300);
                expect(Math.abs(vertex.position.z)).toBeLessThan(400);
                vertexCount++;
            });
        });
        expect(vertexCount).toBeGreaterThan(0);
    });

    it('每个顶点的权重和都约等于 1（MD5 的权重语义）', () =>
    {
        const mesh = getMesh();
        let checked = 0;
        mesh.meshes.forEach((subMesh) =>
        {
            subMesh.vertices.forEach((vertex) =>
            {
                expect(vertex.weightCount).toBeGreaterThan(0);
                let biasSum = 0;
                for (let i = vertex.weightStart; i < vertex.weightStart + vertex.weightCount; i++)
                {
                    biasSum += subMesh.weights[i].bias;
                }
                expect(biasSum).toBeCloseTo(1, 4);
                checked++;
            });
        });
        expect(checked).toBeGreaterThan(0);
    });

    it('关节的绝对绑定姿态与文件声明一致（局部姿态沿父链累乘可还原）', () =>
    {
        const mesh = getMesh();
        expect(mesh.joints.length).toBeGreaterThan(0);

        // 独立实现一遍：从局部姿态沿父链累乘
        // 关节的位置/朝向字段都已放宽为 *Like（没有 clone() / multTo() 等实例方法）：
        // 阶段 C-e 起 `Quaternion` 的 class 也已删除，副本用纯函数产生
        const toVector3 = (v: Vector3Like) => new Vector3(v.x, v.y, v.z);
        const toQuaternion = (q: QuaternionLike) => quatCopy(q);
        const accumulated: { position: Vector3; orientation: QuaternionLike }[] = [];
        mesh.joints.forEach((joint) =>
        {
            const parent = joint.parent >= 0 ? accumulated[joint.parent] : undefined;
            if (!parent)
            {
                accumulated.push({ position: toVector3(joint.localPosition), orientation: toQuaternion(joint.localOrientation) });

                return;
            }
            const rotated = new Vector3();
            quatRotatePoint(parent.orientation, toVector3(joint.localPosition), rotated);
            rotated.add(parent.position);
            accumulated.push({
                position: rotated,
                orientation: quatMult(toQuaternion(joint.localOrientation), parent.orientation),
            });
        });

        mesh.joints.forEach((joint, i) =>
        {
            // 累乘结果应等于文件声明的绝对绑定姿态
            expect(accumulated[i].position.x).toBeCloseTo(joint.position.x, 3);
            expect(accumulated[i].position.y).toBeCloseTo(joint.position.y, 3);
            expect(accumulated[i].position.z).toBeCloseTo(joint.position.z, 3);
            expect(accumulated[i].orientation.x).toBeCloseTo(joint.orientation.x, 3);
            expect(accumulated[i].orientation.y).toBeCloseTo(joint.orientation.y, 3);
            expect(accumulated[i].orientation.z).toBeCloseTo(joint.orientation.z, 3);
            expect(accumulated[i].orientation.w).toBeCloseTo(joint.orientation.w, 3);
            // 解析结果中的绝对姿态同样等于声明值
            expect(joint.absolutePosition.x).toBeCloseTo(joint.position.x, 3);
            expect(joint.absolutePosition.y).toBeCloseTo(joint.position.y, 3);
            expect(joint.absolutePosition.z).toBeCloseTo(joint.position.z, 3);
        });
    });

    it('关节姿态数值有效：四元数已单位化、位置有限', () =>
    {
        const mesh = getMesh();
        mesh.joints.forEach((joint) =>
        {
            const length = Math.sqrt(
                (joint.orientation.x * joint.orientation.x)
                + (joint.orientation.y * joint.orientation.y)
                + (joint.orientation.z * joint.orientation.z)
                + (joint.orientation.w * joint.orientation.w),
            );
            expect(length).toBeCloseTo(1, 4);
            expect(Number.isFinite(joint.position.x)).toBe(true);
            expect(Number.isFinite(joint.position.y)).toBe(true);
            expect(Number.isFinite(joint.position.z)).toBe(true);
            expect(Number.isFinite(joint.localPosition.x)).toBe(true);
            expect(Number.isFinite(joint.localPosition.y)).toBe(true);
            expect(Number.isFinite(joint.localPosition.z)).toBe(true);
        });
    });

    it('共享同一个 weight 的顶点在该 weight 影响下位置一致', () =>
    {
        const mesh = getMesh();
        let checked = 0;
        mesh.meshes.forEach((subMesh) =>
        {
            // 只引用一个 weight 的顶点，其最终位置就等于该 weight 的世界位置
            const groups = new Map<number, MD5Vertex[]>();
            subMesh.vertices.forEach((vertex) =>
            {
                if (vertex.weightCount !== 1)
                {
                    return;
                }
                const list: MD5Vertex[] = groups.get(vertex.weightStart) || [];
                list.push(vertex);
                groups.set(vertex.weightStart, list);
            });
            groups.forEach((vertices, weightIndex) =>
            {
                if (vertices.length < 2)
                {
                    return;
                }
                const weight = subMesh.weights[weightIndex];
                const expected = getMD5WeightPosition(weight, mesh.joints[weight.joint]);
                vertices.forEach((vertex) =>
                {
                    expect(vertex.position.x).toBeCloseTo(expected.x, 4);
                    expect(vertex.position.y).toBeCloseTo(expected.y, 4);
                    expect(vertex.position.z).toBeCloseTo(expected.z, 4);
                    checked++;
                });
            });
        });
        expect(checked).toBeGreaterThan(0);
    });

    it('解析结果只包含纯数据字面量', () =>
    {
        const mesh = getMesh();

        expect(mesh.__type__).toBe('MD5Mesh');
        expect(mesh.version).toBe(10);
        expect(typeof mesh.commandline).toBe('string');
        mesh.joints.forEach((joint) =>
        {
            expect(joint.__type__).toBe('MD5Joint');
            expect(typeof joint.name).toBe('string');
            expect(Number.isInteger(joint.parent)).toBe(true);
        });
        mesh.meshes.forEach((subMesh) =>
        {
            expect(subMesh.__type__).toBe('MD5SubMesh');
            expect(typeof subMesh.shader).toBe('string');
            subMesh.vertices.forEach((vertex) =>
            {
                expect(vertex.__type__).toBe('MD5Vertex');
            });
            subMesh.weights.forEach((weight) =>
            {
                expect(weight.__type__).toBe('MD5Weight');
                expect(weight.joint).toBeGreaterThanOrEqual(0);
                expect(weight.joint).toBeLessThan(mesh.joints.length);
            });
            subMesh.triangles.forEach((triangle) =>
            {
                expect(triangle.__type__).toBe('MD5Triangle');
                expect(triangle.v0).toBeLessThan(subMesh.vertices.length);
                expect(triangle.v1).toBeLessThan(subMesh.vertices.length);
                expect(triangle.v2).toBeLessThan(subMesh.vertices.length);
            });
        });
    });

    it('getMD5WeightPosition：位置/朝向字段可用纯字面量，返回值仍是 Vector3 实例（issue #134 B7）', () =>
    {
        // 关节/权重的字段都已放宽为 *Like（纯 `{ x, y, z }` / `{ x, y, z, w }` 即可）；
        // 但该函数的**返回类型不放宽**（P8c）：blendVertexPosition 要拿它当 Vector3 用
        const weight: MD5Weight = {
            __type__: 'MD5Weight',
            index: 0,
            joint: 0,
            bias: 1,
            position: { x: 1, y: 0, z: 0 },
        };
        const joint: MD5Joint = {
            __type__: 'MD5Joint',
            name: 'root',
            parent: -1,
            position: { x: 0, y: 0, z: 0 },
            orientation: { x: 0, y: 0, z: 0, w: 1 },
            localPosition: { x: 0, y: 0, z: 0 },
            localOrientation: { x: 0, y: 0, z: 0, w: 1 },
            absolutePosition: { x: 10, y: 0, z: 0 },
            // 绕 z 轴 90°：把局部 (1, 0, 0) 转到 (0, 1, 0)，用于验证走的是纯函数 quatRotatePoint
            absoluteOrientation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
        };

        const result = getMD5WeightPosition(weight, joint);

        expect(result).toBeInstanceOf(Vector3);
        expect(result.x).toBeCloseTo(10, 10);
        expect(result.y).toBeCloseTo(1, 10);
        expect(result.z).toBeCloseTo(0, 10);

        // 阶段 C-e 起 `Quaternion` 的 class 已删除：解析器写入的是**纯数据字面量**
        // （只有 x/y/z/w 四个可枚举键，没有原型方法）
        const parsed = getMesh();

        expect(Object.getPrototypeOf(parsed.joints[0].orientation)).toBe(Object.prototype);
        expect(Object.getPrototypeOf(parsed.joints[0].localOrientation)).toBe(Object.prototype);
        expect(Object.getPrototypeOf(parsed.joints[0].absoluteOrientation)).toBe(Object.prototype);
    });
});
