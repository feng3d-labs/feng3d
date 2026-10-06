import { logic, reactive } from 'feng3d';
import type { Object3D } from 'feng3d';
import { mat4FromQuaternion, mat4GetRotation } from '@feng3d/math';
import type { Vehicle, VehicleLogic, VehicleWheel } from '@feng3d/cannon-plugin';
import { createPhysicsDemo } from './PhysicsDemo';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/** 原版 raycast_vehicle.html 的底盘半边长与车轮半径 */
const CHASSIS_HALF = { x: 2, y: 0.5, z: 1 };
const WHEEL_RADIUS = 0.5;

/** 地形尺寸（原版 64×64，每格 100/64） */
const TERRAIN_SIZE = 64;
const TERRAIN_ELEMENT = 100 / TERRAIN_SIZE;

/**
 * 原版的四个轮子共用一份悬挂配置，只有**连接点**不同：
 * `(-1,0,1) (-1,0,-1) (1,0,1) (1,0,-1)`（前两个转向、后两个驱动）。
 */
const WHEEL_BASE: Omit<VehicleWheel, 'position' | 'steering' | 'driving'> = {
    radius: WHEEL_RADIUS,
    direction: { x: 0, y: -1, z: 0 },
    suspensionStiffness: 30,
    suspensionRestLength: 0.3,
    frictionSlip: 1.4,
    dampingRelaxation: 2.3,
    dampingCompression: 4.4,
    maxSuspensionForce: 100000,
    rollInfluence: 0.01,
    axle: { x: 0, y: 0, z: 1 },
    maxSuspensionTravel: 0.3,
    customSlidingRotationalSpeed: -30,
    useCustomSlidingRotationalSpeed: true,
};

/** 四个车轮：前两个转向、后两个驱动（原版用 applyEngineForce 作用在 2/3 号上） */
const WHEELS: VehicleWheel[] = [
    { ...WHEEL_BASE, position: { x: -1, y: 0, z: 1 }, steering: true },
    { ...WHEEL_BASE, position: { x: -1, y: 0, z: -1 }, steering: true },
    { ...WHEEL_BASE, position: { x: 1, y: 0, z: 1 }, driving: true },
    { ...WHEEL_BASE, position: { x: 1, y: 0, z: -1 }, driving: true },
];

/**
 * 造地形：与 `raycast_vehicle.html` 同一份高度表。
 *
 * 边界一圈高 3 当护栏，内部是 `cos(i/64·5π)·cos(j/64·5π)·2 + 2`——比 heightfield.html
 * 的地形"密"得多（5π 而不是 2π），所以车开起来是连续起伏的坡。
 *
 * @returns 地形 Object3D（视觉与碰撞共用同一份高度数据）
 */
function createTerrain(): Object3D
{
    const matrix: number[][] = [];
    for (let i = 0; i < TERRAIN_SIZE; i++)
    {
        const row: number[] = [];
        for (let j = 0; j < TERRAIN_SIZE; j++)
        {
            if (i === 0 || i === TERRAIN_SIZE - 1 || j === 0 || j === TERRAIN_SIZE - 1)
            {
                row.push(3);
                continue;
            }
            row.push(Math.cos((i / TERRAIN_SIZE) * Math.PI * 5) * Math.cos((j / TERRAIN_SIZE) * Math.PI * 5) * 2 + 2);
        }
        matrix.push(row);
    }

    // 视觉网格：与碰撞体用同一份 matrix、同一个旋转
    const positions: number[] = [];
    for (let i = 0; i < TERRAIN_SIZE; i++)
    {
        for (let j = 0; j < TERRAIN_SIZE; j++) positions.push(i * TERRAIN_ELEMENT, j * TERRAIN_ELEMENT, matrix[i][j]);
    }
    const indices: number[] = [];
    for (let i = 0; i < TERRAIN_SIZE - 1; i++)
    {
        for (let j = 0; j < TERRAIN_SIZE - 1; j++)
        {
            const a = i * TERRAIN_SIZE + j;
            const b = (i + 1) * TERRAIN_SIZE + j;
            const c = i * TERRAIN_SIZE + j + 1;
            const d = (i + 1) * TERRAIN_SIZE + j + 1;
            indices.push(a, b, c, b, d, c);
        }
    }

    return {
        __type__: 'Object3D',
        name: 'Terrain',
        // 原版：位置用 sizeX（不是 sizeX-1），整体下沉 1
        position: {
            x: -(TERRAIN_SIZE * TERRAIN_ELEMENT) / 2,
            y: -1,
            z: (TERRAIN_SIZE * TERRAIN_ELEMENT) / 2,
        },
        rotation: { x: -Math.PI / 2, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CustomGeometry', positions, indices },
            material: {
                __type__: 'ColorMaterial',
                uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.4, g: 0.45, b: 0.36, a: 1 } },
            },
        }, {
            __type__: 'HeightfieldCollider',
            heights: matrix,
            elementSize: TERRAIN_ELEMENT,
        }, {
            __type__: 'Rigidbody',
            mass: 0,
            materialName: 'ground',
        }],
    };
}

/**
 * 射线车辆示例 —— 1:1 对应 cannon-es 的 `raycast_vehicle.html`（一幕 `Car`）。
 *
 * 原版场景（重力 **-10**，而且把**世界默认摩擦设为 0**，全靠车胎与地面的 ContactMaterial 出摩擦力）：
 * - 底盘：半边长 `(2, 0.5, 1)`、**质量 150**、放在 (0,4,0)，还给了一个初始自转 (0,0.5,0)
 * - 四个轮子：半径 0.5、悬挂硬度 30、静止长度 0.3、抓地 1.4，压缩/回弹阻尼 4.4/2.3，
 *   最大受力 100000、侧倾 0.01、行程 0.3，还开了"自定义滑动转速 -30"
 * - 地面是 **64×64 的高度场**（5π 频率的连绵坡地，边界高 3）
 * - 车胎×地面：摩擦 0.3、弹性 0、接触刚度 1000
 *
 * **车轮视觉是独立于底盘的对象**：`RaycastVehicle` 的车轮是射线虚拟出来的，
 * 每步之后从 `wheelInfos[i].worldTransform` 取出物理算出的真实姿态（含悬挂行程）再摆过去——
 * 这也是原版 `postStep` 里做的事。
 *
 * **驾驶**：W/S 油门、A/D 转向、B 刹车（方向键同义），与原版键位一致。
 */
demo.addScene('Car', (world, _context) =>
{
    reactive(world).gravity = { x: 0, y: -10, z: 0 };
    // 原版把世界默认摩擦关掉，摩擦完全由下面的成对声明决定
    reactive(world).friction = 0;
    reactive(world).contactMaterials = [{
        a: 'wheel',
        b: 'ground',
        friction: 0.3,
        restitution: 0,
        contactEquationStiffness: 1000,
    }];

    const vehicleData: Vehicle = {
        __type__: 'Vehicle',
        wheels: WHEELS,
        engineForce: 0,
        steering: 0,
        brake: 0,
    };

    const chassis: Object3D = {
        __type__: 'Object3D',
        name: 'Chassis',
        position: { x: 0, y: 4, z: 0 },
        scale: { x: CHASSIS_HALF.x * 2, y: CHASSIS_HALF.y * 2, z: CHASSIS_HALF.z * 2 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
            material: {
                __type__: 'ColorMaterial',
                uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.85, g: 0.45, b: 0.3, a: 1 } },
            },
        }, {
            __type__: 'BoxCollider',
            width: CHASSIS_HALF.x * 2,
            height: CHASSIS_HALF.y * 2,
            depth: CHASSIS_HALF.z * 2,
        }, {
            __type__: 'Rigidbody',
            mass: 150,
            angularVelocity: { x: 0, y: 0.5, z: 0 },
        }, vehicleData as never],
    };

    // 车轮视觉：独立对象（世界坐标），姿态由 postStep 同步
    const wheelMeshes: Object3D[] = WHEELS.map((wheel, index) => ({
        __type__: 'Object3D',
        name: 'Wheel-' + index,
        position: wheel.position,
        components: [{
            __type__: 'MeshRenderer',
            geometry: {
                __type__: 'CylinderGeometry',
                topRadius: WHEEL_RADIUS,
                bottomRadius: WHEEL_RADIUS,
                height: WHEEL_RADIUS / 2,
                segmentsW: 20,
                yUp: true,
            },
            material: {
                __type__: 'ColorMaterial',
                uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.18, g: 0.19, b: 0.22, a: 1 } },
            },
        }],
    }));

    // 每步之后把物理算出的车轮姿态摆到视觉上（对应原版的 postStep 监听）
    const vehicleLogic = logic(vehicleData) as VehicleLogic | null;
    const worldLogic = logic(world) as { onAfterStep?: (listener: () => void) => () => void } | null;
    worldLogic?.onAfterStep?.(() =>
    {
        const vehicle = vehicleLogic?.raycastVehicle;
        if (vehicle === null || vehicle === undefined) return;

        for (let i = 0; i < vehicle.wheelInfos.length; i++)
        {
            vehicle.updateWheelTransform(i);
            const transform = vehicle.wheelInfos[i].worldTransform;
            const euler = mat4GetRotation(mat4FromQuaternion(transform.quaternion));
            const writable = reactive(wheelMeshes[i]) as unknown as { position: unknown; rotation: unknown };
            writable.position = { x: transform.position.x, y: transform.position.y, z: transform.position.z };
            writable.rotation = { x: euler.x, y: euler.y, z: euler.z };
        }
    });

    // 键盘驾驶（与原版键位一致）
    const MAX_STEER = 0.5;
    const MAX_FORCE = 1000;
    const BRAKE_FORCE = 1000000;
    const setVehicle = (patch: Partial<Vehicle>) =>
    {
        const writable = reactive(vehicleData) as unknown as Record<string, unknown>;
        for (const key of Object.keys(patch)) writable[key] = (patch as Record<string, unknown>)[key];
    };

    document.addEventListener('keydown', (event) =>
    {
        switch (event.key)
        {
            case 'w':
            case 'ArrowUp':
                setVehicle({ engineForce: -MAX_FORCE });
                break;
            case 's':
            case 'ArrowDown':
                setVehicle({ engineForce: MAX_FORCE });
                break;
            case 'a':
            case 'ArrowLeft':
                setVehicle({ steering: MAX_STEER });
                break;
            case 'd':
            case 'ArrowRight':
                setVehicle({ steering: -MAX_STEER });
                break;
            case 'b':
                setVehicle({ brake: BRAKE_FORCE });
                break;
            default:
                break;
        }
    });

    document.addEventListener('keyup', (event) =>
    {
        switch (event.key)
        {
            case 'w':
            case 'ArrowUp':
            case 's':
            case 'ArrowDown':
                setVehicle({ engineForce: 0 });
                break;
            case 'a':
            case 'ArrowLeft':
            case 'd':
            case 'ArrowRight':
                setVehicle({ steering: 0 });
                break;
            case 'b':
                setVehicle({ brake: 0 });
                break;
            default:
                break;
        }
    });

    return [createTerrain(), chassis, ...wheelMeshes];
});
