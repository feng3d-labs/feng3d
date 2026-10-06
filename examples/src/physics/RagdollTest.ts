import { reactive } from 'feng3d';
import type { Object3D } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import { createBox, createGroundPlane, createSphere } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/** 单位轴（与原版 `CANNON.Vec3.UNIT_Z / UNIT_X` 一致） */
const UNIT_Z = { x: 0, y: 0, z: 1 };
const UNIT_X = { x: 1, y: 0, z: 0 };

/** 一段人体的可选参数 */
interface RagdollOptions
{
    readonly scale?: number;
    readonly angle?: number;
    readonly angleShoulders?: number;
    readonly twistAngle?: number;
}

/**
 * 造一个布娃娃 —— 1:1 移植自 cannon-es `ragdoll.html` 的 `createRagdoll()`。
 *
 * 七段：头（球）/ 上身 / 骨盆 / 两条上腿 / 两条下腿 / 两条上臂 / 两条下臂，质量都是 1；
 * 十二个关节全是 `ConeTwistConstraint`（脖子 / 两个膝 / 两个髋 / 脊柱 / 两个肩 / 两个肘）。
 *
 * 尺寸与位置公式**逐行照搬原版**：人体沿 **Z 轴**向上"站"（Z 是它的上方向），
 * 关节轴除了肩 / 肘用 X 轴，其余都用 Z 轴。
 *
 * @param options 缩放与三档关节角度
 * @returns 所有身体段（关节组件已挂在各自 A 端上）
 */
function createRagdoll(options: RagdollOptions = {}): Object3D[]
{
    const scale = options.scale ?? 1;
    const angle = options.angle ?? 0;
    const angleShoulders = options.angleShoulders ?? 0;
    const twistAngle = options.twistAngle ?? 0;

    const shouldersDistance = 0.5 * scale;
    const upperArmLength = 0.4 * scale;
    const lowerArmLength = 0.4 * scale;
    const upperArmSize = 0.2 * scale;
    const lowerArmSize = 0.2 * scale;
    const neckLength = 0.1 * scale;
    const headRadius = 0.25 * scale;
    const upperBodyLength = 0.6 * scale;
    const pelvisLength = 0.4 * scale;
    const upperLegLength = 0.5 * scale;
    const upperLegSize = 0.2 * scale;
    const lowerLegSize = 0.2 * scale;
    const lowerLegLength = 0.5 * scale;

    const mass = 1;
    const skin = { r: 0.85, g: 0.72, b: 0.6 };

    // ---- 下腿（Z 从 0 起） ----
    const lowerLeftLeg = createBox('lowerLeftLeg', { x: shouldersDistance / 2, y: 0, z: lowerLegLength / 2 },
        { x: lowerLegSize * 0.5, y: lowerArmSize * 0.5, z: lowerLegLength * 0.5 }, { mass, color: skin });
    const lowerRightLeg = createBox('lowerRightLeg', { x: -shouldersDistance / 2, y: 0, z: lowerLegLength / 2 },
        { x: lowerLegSize * 0.5, y: lowerArmSize * 0.5, z: lowerLegLength * 0.5 }, { mass, color: skin });

    // ---- 上腿 ----
    const lowerLegZ = lowerLegLength / 2;
    const upperLeftLeg = createBox('upperLeftLeg', { x: shouldersDistance / 2, y: 0, z: lowerLegZ + lowerLegLength / 2 + upperLegLength / 2 },
        { x: upperLegSize * 0.5, y: lowerArmSize * 0.5, z: upperLegLength * 0.5 }, { mass, color: skin });
    const upperRightLeg = createBox('upperRightLeg', { x: -shouldersDistance / 2, y: 0, z: lowerLegZ + lowerLegLength / 2 + upperLegLength / 2 },
        { x: upperLegSize * 0.5, y: lowerArmSize * 0.5, z: upperLegLength * 0.5 }, { mass, color: skin });

    // ---- 骨盆 ----
    const upperLegZ = lowerLegZ + lowerLegLength / 2 + upperLegLength / 2;
    const pelvis = createBox('pelvis', { x: 0, y: 0, z: upperLegZ + upperLegLength / 2 + pelvisLength / 2 },
        { x: shouldersDistance * 0.5, y: lowerArmSize * 0.5, z: pelvisLength * 0.5 }, { mass, color: skin });

    // ---- 上身 ----
    const pelvisZ = upperLegZ + upperLegLength / 2 + pelvisLength / 2;
    const upperBody = createBox('upperBody', { x: 0, y: 0, z: pelvisZ + pelvisLength / 2 + upperBodyLength / 2 },
        { x: shouldersDistance * 0.5, y: lowerArmSize * 0.5, z: upperBodyLength * 0.5 }, { mass, color: skin });

    // ---- 头 ----
    const upperBodyZ = pelvisZ + pelvisLength / 2 + upperBodyLength / 2;
    const head = createSphere('head', { x: 0, y: 0, z: upperBodyZ + upperBodyLength / 2 + headRadius + neckLength },
        headRadius, { mass, color: { r: 0.95, g: 0.8, b: 0.65 } });

    // ---- 上臂 / 下臂 ----
    const upperArmZ = upperBodyZ + upperBodyLength / 2;
    const upperLeftArm = createBox('upperLeftArm', { x: shouldersDistance / 2 + upperArmLength / 2, y: 0, z: upperArmZ },
        { x: upperArmLength * 0.5, y: upperArmSize * 0.5, z: upperArmSize * 0.5 }, { mass, color: skin });
    const upperRightArm = createBox('upperRightArm', { x: -shouldersDistance / 2 - upperArmLength / 2, y: 0, z: upperArmZ },
        { x: upperArmLength * 0.5, y: upperArmSize * 0.5, z: upperArmSize * 0.5 }, { mass, color: skin });

    const upperLeftArmX = shouldersDistance / 2 + upperArmLength / 2;
    const upperRightArmX = -shouldersDistance / 2 - upperArmLength / 2;
    const lowerLeftArm = createBox('lowerLeftArm', { x: upperLeftArmX + lowerArmLength / 2 + upperArmLength / 2, y: 0, z: upperArmZ },
        { x: lowerArmLength * 0.5, y: lowerArmSize * 0.5, z: lowerArmSize * 0.5 }, { mass, color: skin });
    const lowerRightArm = createBox('lowerRightArm', { x: upperRightArmX - lowerArmLength / 2 - upperArmLength / 2, y: 0, z: upperArmZ },
        { x: lowerArmLength * 0.5, y: lowerArmSize * 0.5, z: lowerArmSize * 0.5 }, { mass, color: skin });

    // ---- 关节：挂在 A 端，按名字指向 B 端（与原版的 (bodyA, bodyB) 顺序逐个对应） ----
    const joint = (host: Object3D, targetName: string, pivotA: unknown, pivotB: unknown, axis: unknown, extra: Record<string, unknown>) =>
    {
        (host.components as unknown[]).push({
            __type__: 'ConeTwistConstraint',
            targetName,
            pivotA,
            pivotB,
            axisA: axis,
            axisB: axis,
            angle,
            twistAngle,
            ...extra,
        });
    };

    joint(head, 'upperBody', { x: 0, y: 0, z: -headRadius - neckLength / 2 }, { x: 0, y: 0, z: upperBodyLength / 2 }, UNIT_Z, {});
    joint(lowerLeftLeg, 'upperLeftLeg', { x: 0, y: 0, z: lowerLegLength / 2 }, { x: 0, y: 0, z: -upperLegLength / 2 }, UNIT_Z, {});
    joint(lowerRightLeg, 'upperRightLeg', { x: 0, y: 0, z: lowerLegLength / 2 }, { x: 0, y: 0, z: -upperLegLength / 2 }, UNIT_Z, {});
    joint(upperLeftLeg, 'pelvis', { x: 0, y: 0, z: upperLegLength / 2 }, { x: shouldersDistance / 2, y: 0, z: -pelvisLength / 2 }, UNIT_Z, {});
    joint(upperRightLeg, 'pelvis', { x: 0, y: 0, z: upperLegLength / 2 }, { x: -shouldersDistance / 2, y: 0, z: -pelvisLength / 2 }, UNIT_Z, {});
    joint(pelvis, 'upperBody', { x: 0, y: 0, z: pelvisLength / 2 }, { x: 0, y: 0, z: -upperBodyLength / 2 }, UNIT_Z, {});
    // 左肩原版只给了 angle（没给 twistAngle）——照抄
    joint(upperBody, 'upperLeftArm', { x: shouldersDistance / 2, y: 0, z: upperBodyLength / 2 }, { x: -upperArmLength / 2, y: 0, z: 0 }, UNIT_X, { angle: angleShoulders, twistAngle: undefined });
    joint(upperBody, 'upperRightArm', { x: -shouldersDistance / 2, y: 0, z: upperBodyLength / 2 }, { x: upperArmLength / 2, y: 0, z: 0 }, UNIT_X, { angle: angleShoulders });
    joint(lowerLeftArm, 'upperLeftArm', { x: -lowerArmLength / 2, y: 0, z: 0 }, { x: upperArmLength / 2, y: 0, z: 0 }, UNIT_X, {});
    joint(lowerRightArm, 'upperRightArm', { x: lowerArmLength / 2, y: 0, z: 0 }, { x: -upperArmLength / 2, y: 0, z: 0 }, UNIT_X, {});

    return [
        lowerLeftLeg, lowerRightLeg,
        upperLeftLeg, upperRightLeg,
        pelvis, upperBody, head,
        upperLeftArm, upperRightArm,
        lowerLeftArm, lowerRightArm,
    ];
}

/**
 * 布娃娃示例 —— 1:1 对应 cannon-es 的 `ragdoll.html`（三幕）。
 *
 * 三幕的**场景完全相同**（重力 -5、地面在 y=-1、圆心 (0,-1,0) 半径 4 的静态球，
 * 人体整体上移到 y=10 后落下），**只有三个关节角度不同**——这正是原版想对比的：
 *
 * | 幕 | angle（一般关节） | angleShoulders（肩） | twistAngle（扭转） |
 * |---|---|---|---|
 * | No cone joints | π | π | π |
 * | Normal cone joints | π/4 | π/3 | π/8 |
 * | Thin cone joints | 0 | 0 | 0 |
 *
 * 角度越大关节越"松"（π 相当于不限），越小越"僵"。人体落在球上摊开的样子因此不同。
 */
function addRagdollScene(title: string, options: RagdollOptions)
{
    demo.addScene(title, (world) =>
    {
        reactive(world).gravity = { x: 0, y: -5, z: 0 };

        // 地面单独下移到 y = -1
        const ground = createGroundPlane();
        (ground as { position?: unknown }).position = { x: 0, y: -1, z: 0 };

        // 落在它上面的静态大球
        const ball = createSphere('StaticSphere', { x: 0, y: -1, z: 0 }, 4, {
            mass: 0,
            color: { r: 0.55, g: 0.6, b: 0.7 },
        });

        // 人体整体上移 (0, 10, 0)（原版就是给每段 position 加上这个偏移）
        const parts = createRagdoll(options);
        for (const part of parts)
        {
            const position = part.position ?? { x: 0, y: 0, z: 0 };
            (part as { position?: unknown }).position = { x: position.x, y: position.y + 10, z: position.z };
        }

        return [ground, ball, ...parts];
    });
}

addRagdollScene('No cone joints', { scale: 3, angle: Math.PI, angleShoulders: Math.PI, twistAngle: Math.PI });
addRagdollScene('Normal cone joints', { scale: 3, angle: Math.PI / 4, angleShoulders: Math.PI / 3, twistAngle: Math.PI / 8 });
addRagdollScene('Thin cone joints', { scale: 3, angle: 0, angleShoulders: 0, twistAngle: 0 });
