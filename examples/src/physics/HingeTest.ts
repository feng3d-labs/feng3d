import { reactive } from 'feng3d';
import type { Object3D } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import { createBox, createGroundPlane, createSphere } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/**
 * 铰链示例 —— 1:1 对应 cannon-es 的 `hinge.html`（两幕）。
 *
 * **Car 幕**：一辆用四个铰链装轮子的小车，后轮带**马达**驱动它前进。
 * 地面在 y = -3；轮子是半径 1.2 的球、质量 1；底盘是半边长 (5, 0.5, 2) 的盒子。
 * 四个轮子的铰链轴各不相同（前轮那两根还特意斜了一点），
 * 只有后轮（constraints[2] / [3]）开了马达，转速 ∓14。
 *
 * **Hinge 幕**：最简铰链——一块板吊在另一块**静态**板下面，只能绕 X 轴摆。
 */
demo.addScene('Car', (world) =>
{
    reactive(world).gravity = { x: 0, y: -20, z: 0 };

    const mass = 1;

    // 原版这块地面单独下移了 3
    const ground = createGroundPlane();
    (ground as { position?: unknown }).position = { x: 0, y: -3, z: 0 };

    const chassis = createBox('Chassis', { x: 0, y: 0, z: 0 }, { x: 5, y: 0.5, z: 2 }, {
        mass,
        color: { r: 0.9, g: 0.5, b: 0.35 },
    });

    // 四个轮子（位置与原版逐个一致）+ 各自的铰链约束（挂在底盘上，按名字指向轮子）
    const wheelDefs = [
        { name: 'LeftFrontWheel', position: { x: -5, y: 0, z: 5 }, pivotA: { x: -5, y: 0, z: 5 }, axisA: { x: -0.3, y: 0, z: 0.7 }, axisB: { x: 0, y: 0, z: 1 } },
        { name: 'RightFrontWheel', position: { x: -5, y: 0, z: -5 }, pivotA: { x: -5, y: 0, z: -5 }, axisA: { x: 0.3, y: 0, z: -0.7 }, axisB: { x: 0, y: 0, z: -1 } },
        { name: 'LeftRearWheel', position: { x: 5, y: 0, z: 5 }, pivotA: { x: 5, y: 0, z: 5 }, axisA: { x: 0, y: 0, z: 1 }, axisB: { x: 0, y: 0, z: 1 } },
        { name: 'RightRearWheel', position: { x: 5, y: 0, z: -5 }, pivotA: { x: 5, y: 0, z: -5 }, axisA: { x: 0, y: 0, z: -1 }, axisB: { x: 0, y: 0, z: -1 } },
    ];

    const wheels: Object3D[] = [];
    for (let i = 0; i < wheelDefs.length; i++)
    {
        const def = wheelDefs[i];
        const wheel = createSphere(def.name, def.position, 1.2, { mass, color: { r: 0.3, g: 0.32, b: 0.36 } });
        wheels.push(wheel);

        // 只有后轮开马达（原版取的是 constraints[2] / [3]）
        const isRear = i >= 2;
        (chassis.components as unknown[]).push({
            __type__: 'HingeConstraint',
            targetName: def.name,
            pivotA: def.pivotA,
            axisA: def.axisA,
            pivotB: { x: 0, y: 0, z: 0 },
            axisB: def.axisB,
            enableMotor: isRear,
            motorSpeed: isRear ? (i === 2 ? -14 : 14) : 0,
        });
    }

    return [ground, chassis, ...wheels];
});

demo.addScene('Hinge', (world) =>
{
    reactive(world).gravity = { x: 0, y: -20, z: 5 };

    const mass = 1;
    const size = 5;
    const distance = size * 0.1;

    // 静态板在上面，活动板挂在它下面
    const staticBody = createBox('StaticBody', { x: 0, y: size + distance * 2, z: 0 }, {
        x: size * 0.5, y: size * 0.5, z: size * 0.1,
    }, { mass: 0, color: { r: 0.65, g: 0.65, b: 0.7 } });

    const hingedBody = createBox('HingedBody', { x: 0, y: 0, z: 0 }, {
        x: size * 0.5, y: size * 0.5, z: size * 0.1,
    }, { mass, color: { r: 0.9, g: 0.6, b: 0.35 } });

    (hingedBody.components as unknown[]).push({
        __type__: 'HingeConstraint',
        targetName: 'StaticBody',
        pivotA: { x: 0, y: size * 0.5 + distance, z: 0 },
        axisA: { x: -1, y: 0, z: 0 },
        pivotB: { x: 0, y: -size * 0.5 - distance, z: 0 },
        axisB: { x: -1, y: 0, z: 0 },
    });

    return [staticBody, hingedBody];
});
