import { reactive } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import { createBox, createGroundPlane } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/**
 * 接触材质示例 —— 1:1 对应 cannon-es 的 `friction.html`。
 *
 * 与 `simple_friction` 的区别：这里摩擦力**不写在材质上**，而是用 `ContactMaterial`
 * **成对声明**——"谁和谁相遇时摩擦是多少"。原版正是拿这个对比两种写法的。
 *
 * 场景（重力同样是带水平分量的 `(3, -60, 0)`）：
 * - 地面材质 `ground`；箱子两块：`slippery`（mass 1，在原点上方）与 `ground`（mass 10，在 x = -4）
 * - `ContactMaterial(ground, ground)`：friction **0.4**、restitution 0.3、接触/摩擦刚度都是 1e8、松弛 3
 * - `ContactMaterial(ground, slippery)`：friction **0**、restitution 0.3、刚度 1e8、松弛 3
 *
 * 于是光滑箱滑走、地面箱停住——而"谁滑谁不滑"完全由这两条成对声明决定。
 */
demo.addScene('Friction', (world) =>
{
    reactive(world).gravity = { x: 3, y: -60, z: 0 };

    reactive(world).contactMaterials = [
        {
            a: 'ground',
            b: 'ground',
            friction: 0.4,
            restitution: 0.3,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3,
            frictionEquationStiffness: 1e8,
            frictionEquationRelaxation: 3,
        },
        {
            a: 'ground',
            b: 'slippery',
            friction: 0,
            restitution: 0.3,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3,
        },
    ];

    const size = 1;

    return [
        createGroundPlane({ materialName: 'ground' }),
        createBox('SlipperyBox', { x: 0, y: 5, z: 0 }, { x: size, y: size, z: size }, {
            mass: 1,
            materialName: 'slippery',
            color: { r: 0.5, g: 0.75, b: 0.95 },
        }),
        createBox('GroundBox', { x: -size * 4, y: 5, z: 0 }, { x: size, y: size, z: size }, {
            mass: 10,
            materialName: 'ground',
            color: { r: 0.9, g: 0.6, b: 0.35 },
        }),
    ];
});
