import { reactive } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import { createBox, createGroundPlane } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/**
 * 逐材质摩擦示例 —— 1:1 对应 cannon-es 的 `simple_friction.html`（两幕）。
 *
 * 关键在**重力带水平分量**：`gravity.set(3, -60, 0)`——原版注释写着
 * "Gravity set so the boxes will slide along x axis"。有了这个水平的 3，
 * 箱子落地后会被推着沿 X 滑，摩擦大小才看得出来。
 *
 * 摩擦的写法是**给材质本身赋值**（没有 ContactMaterial）：
 * 地面材质 0.3、光滑材质 0——cannon-es 里两个材质相遇取**乘积**，
 * 所以"光滑箱 × 地面" = `0.3 × 0 = 0`（一路滑走），而"地面箱 × 地面" = `0.3 × 0.3`（很快停住）。
 *
 * 两幕的区别只是**摩擦设在哪一层**：`Friction` 设在**刚体**的材质上，
 * `Per shape` 设在**形状**的材质上。这里每个刚体只有一个形状，所以两者等价。
 */
function addFrictionScene(title: string)
{
    demo.addScene(title, (world) =>
    {
        reactive(world).gravity = { x: 3, y: -60, z: 0 };
        reactive(world).materials = [
            { name: 'ground', friction: 0.3 },
            { name: 'slippery', friction: 0 },
        ];

        const size = 1;

        return [
            createGroundPlane({ materialName: 'ground' }),
            // 光滑箱：mass 1，会一路滑
            createBox('SlipperyBox', { x: 0, y: 5, z: 0 }, { x: size, y: size, z: size }, {
                mass: 1,
                materialName: 'slippery',
                color: { r: 0.5, g: 0.75, b: 0.95 },
            }),
            // 地面材质的箱子：mass 10，滑不动
            createBox('GroundBox', { x: -size * 4, y: 5, z: 0 }, { x: size, y: size, z: size }, {
                mass: 10,
                materialName: 'ground',
                color: { r: 0.9, g: 0.6, b: 0.35 },
            }),
        ];
    });
}

addFrictionScene('Friction');
addFrictionScene('Per shape');
