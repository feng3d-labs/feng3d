/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';
import { Quaternion, quatRotatePoint, Vector3 } from '@feng3d/math';
import type { MD5Anim, MD5FrameJoint } from './MD5Anim';
import { getMD5AnimJoint, parseMD5Anim } from './MD5Anim';

/**
 * 真实资源文件：id Tech 4 的 hellknight 模型动画。
 *
 * 以 Vite 的 `?raw` 形式导入，避免在 `packages/feng3d` 的 strict 配置里引入 node 类型。
 */
import standText from '../../../../examples/resources/hellknight/stand.md5anim?raw';
import initialText from '../../../../examples/resources/hellknight/initial.md5anim?raw';

/**
 * 手工构造的极小 `.md5anim`：精确验证「flags 未覆盖的分量必须回退 baseframe」。
 *
 * 每根骨骼消耗的帧数据个数 = flags 中置位的个数（1=tx、2=ty、4=tz、8=qx、16=qy、32=qz）：
 * - `origin`：父 -1，flags 0 —— 不消耗帧数据，全部取自 baseframe；
 * - `partial`：父 0，flags 40（Qy|Qz，位置 8 未置位）—— 只消耗 2 个值（qy、qz = 0、0），
 *   其 baseframe 为 `(1 2 3) (0.5 0.5 0.5)`（补出的 w = 0.5）；
 *   因此 qx 与 w 必须回退 baseframe，归一化后为 `(0, 0.7071, 0, 0.7071)`；
 * - `full`：父 1，flags 63（全部分量）—— 消耗 6 个值，全部取自帧数据。
 *
 * 每帧共 2 + 6 = 8 个值，与 `numAnimatedComponents 8` 一致。
 */
const CRAFTED_ANIM = `MD5Version 10
commandline "crafted"
numFrames 2
numJoints 3
frameRate 24
numAnimatedComponents 8

hierarchy {
	"origin"	-1 0 0
	"partial"	0 2 40
	"full"	1 6 63
}

bounds {
	( -1 -1 -1 ) ( 1 1 1 )
	( -2 -2 -2 ) ( 2 2 2 )
}

baseframe {
	( 0 0 0 ) ( 0 0 0 )
	( 1 2 3 ) ( 0.5 0.5 0.5 )
	( 4 5 6 ) ( 0 0 0 )
}

frame 0 {
	0 0
	0.25 0.25 10 20 30 0.5
}

frame 1 {
	0 0
	0.25 0.25 10 20 30 0.6
}
`;

/** 真实 stand 动画的解析结果缓存（懒初始化） */
let cachedStand: MD5Anim | undefined;

/** 解析真实 stand 动画（同一份文本只解析一次） */
function getStand(): MD5Anim
{
    if (!cachedStand)
    {
        cachedStand = parseMD5Anim(standText);
    }

    return cachedStand;
}

/** 四元数模长 */
function quaternionLength(quaternion: { x: number; y: number; z: number; w: number }): number
{
    return Math.sqrt(
        (quaternion.x * quaternion.x)
        + (quaternion.y * quaternion.y)
        + (quaternion.z * quaternion.z)
        + (quaternion.w * quaternion.w),
    );
}

/** 两个位置是否在给定小数位上相等 */
function positionEquals(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }, digits: number): boolean
{
    return Math.abs(a.x - b.x) < 10 ** -digits
        && Math.abs(a.y - b.y) < 10 ** -digits
        && Math.abs(a.z - b.z) < 10 ** -digits;
}

describe('assets/MD5Anim', () =>
{
    it('解析出的数量与文件头部声明一致，且帧数据长度等于 numAnimatedComponents', () =>
    {
        const anim = getStand();

        // 头部声明值（stand.md5anim：120 帧 / 110 骨骼 / 24 帧率 / 150 分量）
        expect(anim.version).toBe(10);
        expect(anim.numFrames).toBe(120);
        expect(anim.numJoints).toBe(110);
        expect(anim.frameRate).toBe(24);
        expect(anim.numAnimatedComponents).toBe(150);

        // hierarchy 数量 == numJoints，帧数量 == numFrames
        expect(anim.hierarchy).toHaveLength(anim.numJoints);
        expect(anim.frames).toHaveLength(anim.numFrames);
        expect(anim.baseframe).toHaveLength(anim.numJoints);

        // 每帧的数据长度都等于 numAnimatedComponents
        anim.frames.forEach((frame, i) =>
        {
            expect(frame.components).toHaveLength(anim.numAnimatedComponents);
            expect(frame.joints).toHaveLength(anim.numJoints);
            expect(frame.index).toBe(i);
        });
    });

    it('hierarchy 是合法拓扑：父索引一定指向更早的骨骼', () =>
    {
        const anim = getStand();
        let rootCount = 0;

        anim.hierarchy.forEach((item, i) =>
        {
            expect(item.__type__).toBe('MD5AnimHierarchy');
            expect(typeof item.name).toBe('string');
            expect(Number.isInteger(item.parent)).toBe(true);
            // 父索引必然指向更早的骨骼（保证一次正序遍历即可完成父链累乘）
            expect(item.parent).toBeLessThan(i);
            if (item.parent < 0)
            {
                expect(item.parent).toBe(-1);
                rootCount++;
            }
            expect(item.numComponents).toBeGreaterThanOrEqual(0);
            expect(item.flags).toBeGreaterThanOrEqual(0);
        });

        // 有且只有一根根骨骼
        expect(rootCount).toBe(1);
    });

    it('所有帧的姿态都是有限数、四元数模长 ≈ 1', () =>
    {
        const anim = getStand();
        let checked = 0;

        anim.frames.forEach((frame) =>
        {
            frame.joints.forEach((joint) =>
            {
                for (const value of [
                    joint.position.x, joint.position.y, joint.position.z,
                    joint.orientation.x, joint.orientation.y, joint.orientation.z, joint.orientation.w,
                    joint.absolutePosition.x, joint.absolutePosition.y, joint.absolutePosition.z,
                    joint.absoluteOrientation.x, joint.absoluteOrientation.y, joint.absoluteOrientation.z, joint.absoluteOrientation.w,
                ])
                {
                    expect(Number.isFinite(value)).toBe(true);
                }
                expect(quaternionLength(joint.orientation)).toBeCloseTo(1, 3);
                expect(quaternionLength(joint.absoluteOrientation)).toBeCloseTo(1, 3);
                checked++;
            });
        });

        expect(checked).toBe(anim.numFrames * anim.numJoints);
    });

    it('第 0 帧的局部姿态按 flags/numComp 从帧数据头部取值（body 骨骼逐分量核对）', () =>
    {
        const anim = getStand();
        const body = anim.hierarchy[1];

        // body：parent 0、flags 0（帧数据给出全部 6 个分量）
        expect(body.name).toBe('body');
        expect(body.parent).toBe(0);
        expect(body.flags).toBe(0);

        // 帧数据从下标 0 开始（origin 的 flags 为 0，不消耗数据），
        // 前 6 个数即 body 的 tx ty tz qx qy qz —— 与 stand.md5anim 的 `frame 0` 首行逐值对应
        const frame0 = anim.frames[0];
        expect(frame0.components.slice(0, 6)).toEqual([-0.8947336078, 70.7142486572, -6.5027675629, -0.3258574307, -0.0083037354, 0.0313780755]);

        const bodyJoint = frame0.joints[1];
        expect(bodyJoint.position.x).toBeCloseTo(-0.8947336078, 6);
        expect(bodyJoint.position.y).toBeCloseTo(70.7142486572, 6);
        expect(bodyJoint.position.z).toBeCloseTo(-6.5027675629, 6);
        expect(bodyJoint.orientation.x).toBeCloseTo(-0.3258574307, 6);
        expect(bodyJoint.orientation.y).toBeCloseTo(-0.0083037354, 6);
        expect(bodyJoint.orientation.z).toBeCloseTo(0.0313780755, 6);
        // 帧数据只提供 qx/qy/qz 时，w 由 sqrt(1 - x² - y² - z²) 补出
        expect(bodyJoint.orientation.w).toBeCloseTo(Math.sqrt(1 - (0.3258574307 ** 2) - (0.0083037354 ** 2) - (0.0313780755 ** 2)), 5);
    });

    it('绝对变换是沿父链累乘的结果（有父骨骼的骨骼绝对 ≠ 局部）', () =>
    {
        const anim = getStand();
        const frame = anim.frames[0];

        // 独立实现一遍累乘，与解析结果逐骨骼比对
        const expected: { x: number; y: number; z: number }[] = [];
        frame.joints.forEach((joint, i) =>
        {
            const parentIndex = anim.hierarchy[i].parent;
            if (parentIndex < 0)
            {
                expected.push({ x: joint.position.x, y: joint.position.y, z: joint.position.z });

                return;
            }
            const parentJoint = frame.joints[parentIndex];
            // absoluteOrientation 已放宽为 QuaternionLike（没有实例方法）、joint.position 亦然：
            // 旋转走纯函数 quatRotatePoint
            const rotated = quatRotatePoint(
                parentJoint.absoluteOrientation,
                new Vector3(joint.position.x, joint.position.y, joint.position.z),
            );
            expected.push({
                x: rotated.x + parentJoint.absolutePosition.x,
                y: rotated.y + parentJoint.absolutePosition.y,
                z: rotated.z + parentJoint.absolutePosition.z,
            });
        });

        frame.joints.forEach((joint, i) =>
        {
            expect(positionEquals(joint.absolutePosition, expected[i], 5)).toBe(true);
        });

        // 挑一根有父骨骼、且父链上存在非零平移的骨骼：
        // 绝对位置必须与局部位置不同，否则说明父链累乘没生效
        const deepIndex = 24; // head：父链 origin → body → body2 → SPINNER → waist → chest → loneck → neck
        expect(anim.hierarchy[deepIndex].parent).toBeGreaterThanOrEqual(0);
        const deep = frame.joints[deepIndex];
        expect(Number.isFinite(deep.absolutePosition.x)).toBe(true);
        expect(positionEquals(deep.absolutePosition, deep.position, 3)).toBe(false);

        // 反向对照：根骨骼（origin）没有父，绝对姿态必然等于局部姿态
        const root = frame.joints[0];
        expect(positionEquals(root.absolutePosition, root.position, 9)).toBe(true);
    });

    it('不同帧的姿态确实不同（没有读错帧）', () =>
    {
        const anim = getStand();

        // body（索引 1）是躯干根，stand 动画里相邻帧几乎不变；
        // 取相邻帧之间绝对位置差异最大的骨骼来做「帧确实被逐帧读取」的判据。
        const frame0 = anim.frames[0];
        const frame1 = anim.frames[1];
        let maxDiff = 0;
        let maxIndex = -1;
        frame0.joints.forEach((joint, i) =>
        {
            const other = frame1.joints[i];
            const diff = Math.hypot(
                joint.absolutePosition.x - other.absolutePosition.x,
                joint.absolutePosition.y - other.absolutePosition.y,
                joint.absolutePosition.z - other.absolutePosition.z,
            );
            if (diff > maxDiff)
            {
                maxDiff = diff;
                maxIndex = i;
            }
        });

        // 相邻帧之间存在肉眼可见的姿态差（实测 108 号骨骼 rknee1 差异约 0.72）
        expect(maxIndex).toBeGreaterThanOrEqual(0);
        expect(maxDiff).toBeGreaterThan(0.1);
        expect(positionEquals(frame0.joints[maxIndex].absolutePosition, frame1.joints[maxIndex].absolutePosition, 3)).toBe(false);

        // 帧号与帧数据都逐帧对应
        expect(frame0.index).toBe(0);
        expect(frame1.index).toBe(1);
        expect(frame0.components[0]).not.toBe(frame1.components[0]);

        // 长间隔帧之间的差异更大（frame 0 vs frame 60）
        const frame60 = anim.frames[60];
        expect(positionEquals(frame0.joints[maxIndex].absolutePosition, frame60.joints[maxIndex].absolutePosition, 3)).toBe(false);
    });

    it('flags 未覆盖的分量回退 baseframe（手工构造的最小文件）', () =>
    {
        const anim = parseMD5Anim(CRAFTED_ANIM);

        // 头部与结构
        expect(anim.numFrames).toBe(2);
        expect(anim.numJoints).toBe(3);
        expect(anim.numAnimatedComponents).toBe(8);
        expect(anim.hierarchy.map((item) => item.name)).toEqual(['origin', 'partial', 'full']);
        expect(anim.hierarchy[1].flags).toBe(40);
        expect(anim.frames).toHaveLength(2);
        expect(anim.frames[0].components).toHaveLength(8);

        // baseframe：朝向只有 3 个分量，w 由 sqrt(1 - x² - y² - z²) 补出 —— 0.5/0.5/0.5 → w = 0.5
        expect(anim.baseframe[1].position.x).toBeCloseTo(1, 6);
        expect(anim.baseframe[1].position.y).toBeCloseTo(2, 6);
        expect(anim.baseframe[1].position.z).toBeCloseTo(3, 6);
        expect(anim.baseframe[1].orientation.x).toBeCloseTo(0.5, 6);
        expect(anim.baseframe[1].orientation.w).toBeCloseTo(0.5, 6);

        anim.frames.forEach((frame) =>
        {
            // origin：flags 0，不消耗帧数据，全部回退 baseframe
            expect(frame.joints[0].position.x).toBeCloseTo(0, 6);
            expect(frame.joints[0].position.y).toBeCloseTo(0, 6);
            expect(frame.joints[0].position.z).toBeCloseTo(0, 6);

            // partial：flags 40 只覆盖 qy、qz（帧数据给出 0、0）；
            // 位置三分量与 qx 必须回退 baseframe，w 由 baseframe 的 xyz 补出
            const partial = frame.joints[1];
            expect(partial.position.x).toBeCloseTo(1, 6);
            expect(partial.position.y).toBeCloseTo(2, 6);
            expect(partial.position.z).toBeCloseTo(3, 6);
            expect(partial.orientation.x).toBeCloseTo(0, 6);
            expect(partial.orientation.y).toBeCloseTo(Math.SQRT1_2, 5);
            expect(partial.orientation.z).toBeCloseTo(0, 6);
            expect(partial.orientation.w).toBeCloseTo(Math.SQRT1_2, 5);
        });

        // full：flags 63，6 个分量全部来自帧数据。
        // 原始帧数据 qx/qy/qz/w = 10/20/30/0.5，归一化后约为 (0.5546, 0.8320, 0.0139, 0)
        const full0 = anim.frames[0].joints[2];
        expect(full0.position.x).toBeCloseTo(0.25, 6);
        expect(full0.position.y).toBeCloseTo(0.25, 6);
        expect(full0.position.z).toBeCloseTo(10, 6);
        expect(full0.orientation.x).toBeCloseTo(0.5546, 3);
        expect(full0.orientation.y).toBeCloseTo(0.8320, 3);
        expect(full0.orientation.z).toBeCloseTo(0.0139, 3);

        // 末位分量 0.5 → 0.6，归一化后的朝向随之改变（证明帧数据逐帧读取）
        const full1 = anim.frames[1].joints[2];
        expect(full1.orientation.x).not.toBe(full0.orientation.x);
        expect(full1.orientation.z).toBeGreaterThan(full0.orientation.z);
        expect(quaternionLength(full1.orientation)).toBeCloseTo(1, 6);

        // partial 的 qy/qz 两帧都是 0，因此局部姿态两帧完全相同
        expect(anim.frames[0].joints[1].orientation.y).toBe(anim.frames[1].joints[1].orientation.y);

        // 父链：origin(0) → partial(1) → full(2)，full 的绝对位置必然与局部不同
        const fullJoint = anim.frames[0].joints[2];
        expect(positionEquals(fullJoint.absolutePosition, fullJoint.position, 6)).toBe(false);
    });

    it('numAnimatedComponents 为 0 的动画（initial.md5anim）各帧都沿用 baseframe', () =>
    {
        const anim = parseMD5Anim(initialText);

        expect(anim.numFrames).toBe(2);
        expect(anim.numJoints).toBe(110);
        expect(anim.numAnimatedComponents).toBe(0);
        expect(anim.frames).toHaveLength(2);
        anim.frames.forEach((frame) =>
        {
            expect(frame.components).toHaveLength(0);
            expect(frame.joints).toHaveLength(anim.numJoints);
        });

        // 没有任何帧数据，所有帧的局部姿态都等于 baseframe
        anim.frames.forEach((frame) =>
        {
            frame.joints.forEach((joint, i) =>
            {
                expect(positionEquals(joint.position, anim.baseframe[i].position, 6)).toBe(true);
                expect(joint.orientation.x).toBeCloseTo(anim.baseframe[i].orientation.x, 6);
                expect(joint.orientation.y).toBeCloseTo(anim.baseframe[i].orientation.y, 6);
                expect(joint.orientation.z).toBeCloseTo(anim.baseframe[i].orientation.z, 6);
                expect(joint.orientation.w).toBeCloseTo(anim.baseframe[i].orientation.w, 6);
            });
        });

        // 但绝对变换仍按父链累乘：body（索引 1）的 baseframe 局部平移为 (0, 87.46, 0)，
        // 原点绝对朝向为 (-0.5,-0.5,-0.5,0.5)，累乘后绝对位置不再是简单地相加
        expect(anim.frames[0].joints[1].position.y).toBeCloseTo(87.4640808105, 3);
        expect(positionEquals(anim.frames[0].joints[1].absolutePosition, anim.frames[0].joints[1].position, 3)).toBe(false);
    });

    it('bounds 段按帧解析且 min 不超过 max', () =>
    {
        const anim = getStand();

        expect(anim.frames[0].bounds).toBeDefined();
        anim.frames.forEach((frame) =>
        {
            const bounds = frame.bounds;
            expect(bounds).toBeDefined();
            if (!bounds)
            {
                return;
            }
            expect(bounds.min.x).toBeLessThanOrEqual(bounds.max.x);
            expect(bounds.min.y).toBeLessThanOrEqual(bounds.max.y);
            expect(bounds.min.z).toBeLessThanOrEqual(bounds.max.z);
        });

        // bounds 与帧一一对应（stand.md5anim 的 bounds 段首行）
        expect(anim.frames[0].bounds?.min.x).toBeCloseTo(-24.3102264404, 6);
        expect(anim.frames[0].bounds?.max.z).toBeCloseTo(119.5607299805, 6);
    });

    it('解析结果只包含纯数据字面量，越界访问返回 undefined', () =>
    {
        const anim = getStand();

        expect(anim.__type__).toBe('MD5Anim');
        expect(typeof anim.commandline).toBe('string');
        expect(anim.commandline).toContain('stand');
        anim.baseframe.forEach((joint) =>
        {
            expect(joint.__type__).toBe('MD5FrameJoint');
        });
        anim.frames[0].joints.forEach((joint) =>
        {
            expect(joint.__type__).toBe('MD5FrameJoint');
            expect(Number.isInteger(joint.index)).toBe(true);
        });
        expect(anim.frames[0].__type__).toBe('MD5Frame');

        // 越界访问返回 undefined
        expect(getMD5AnimJoint(anim, anim.numFrames, 0)).toBeUndefined();
        expect(getMD5AnimJoint(anim, 0, anim.numJoints)).toBeUndefined();
    });

    it('MD5FrameJoint 的朝向字段可用纯字面量，解析结果仍是 Quaternion 实例（issue #134 B7）', () =>
    {
        // orientation / absoluteOrientation 已放宽为 QuaternionLike：纯 `{ x, y, z, w }` 即可
        const joint: MD5FrameJoint = {
            __type__: 'MD5FrameJoint',
            index: 0,
            position: { x: 1, y: 2, z: 3 },
            orientation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
            absolutePosition: { x: 1, y: 2, z: 3 },
            absoluteOrientation: { x: 0, y: 0, z: 0, w: 1 },
        };

        expect(joint.orientation.z).toBeCloseTo(Math.SQRT1_2, 12);

        // 运行期形态不退化为纯字面量：解析器写入的仍是 Quaternion 实例（中间态保持 class，产出零包装）
        const parsed = getMD5AnimJoint(getStand(), 0, 0);

        expect(parsed?.orientation).toBeInstanceOf(Quaternion);
        expect(parsed?.absoluteOrientation).toBeInstanceOf(Quaternion);
    });
});
