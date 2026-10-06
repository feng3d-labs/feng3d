import { reactive } from 'feng3d';
import type { Color4, MeshRenderer, Object3D } from 'feng3d';
import { Vec3, type World } from 'cannon-es';

/**
 * 物理调试可视化 —— 对应 cannon-es `examples/js/Demo.js` 里 Rendering 文件夹的那些开关。
 *
 * 原版用 three.js 的 `Line` / `Mesh` 画；这里用 feng3d 的 {@link SegmentGeometry}（线段几何）
 * 复刻，每一类调试各占一个对象（一个 MeshRenderer + 一个线段几何）：
 *
 * | 开关 | 画什么 |
 * |---|---|
 * | `axes` | 每个刚体三条局部轴（X 红 / Y 绿 / Z 蓝） |
 * | `aabbs` | 每个刚体的包围盒线框 |
 * | `contacts` | 每个接触点一个小十字 |
 * | `cm2contact` | 质心 → 接触点的连线 |
 * | `normals` | 接触点沿法线的一小段 |
 * | `constraints` | 每个约束两端刚体的连线 |
 */
export interface PhysicsDebugSettings
{
    readonly contacts: boolean;
    readonly cm2contact: boolean;
    readonly normals: boolean;
    readonly axes: boolean;
    readonly aabbs: boolean;
    readonly constraints: boolean;
}

/** 一条线段（与 SegmentGeometry 的字段一致） */
interface DebugSegment
{
    start: { x: number; y: number; z: number };
    end: { x: number; y: number; z: number };
    startColor: Color4;
    endColor: Color4;
}

/** 调试可视化的六个层 */
export interface PhysicsDebugLayers
{
    readonly axes: Object3D;
    readonly aabbs: Object3D;
    readonly contacts: Object3D;
    readonly normals: Object3D;
    readonly cm2contact: Object3D;
    readonly constraints: Object3D;
}

const WHITE: Color4 = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };
const RED: Color4 = { __type__: 'Color4', r: 1, g: 0.2, b: 0.2, a: 1 };
const GREEN: Color4 = { __type__: 'Color4', r: 0.2, g: 1, b: 0.2, a: 1 };
const BLUE: Color4 = { __type__: 'Color4', r: 0.3, g: 0.5, b: 1, a: 1 };
const YELLOW: Color4 = { __type__: 'Color4', r: 1, g: 0.9, b: 0.2, a: 1 };
const CYAN: Color4 = { __type__: 'Color4', r: 0.2, g: 0.9, b: 0.9, a: 1 };

/** 局部轴的长度（原版也是 1） */
const AXIS_LENGTH = 1;

/**
 * 造一个调试层（一个线段几何对象）。
 *
 * @param name 对象名
 * @returns 层的 Object3D
 */
function createLayer(name: string): Object3D
{
    return {
        __type__: 'Object3D',
        name,
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SegmentGeometry', segments: [] },
            material: {
                __type__: 'ColorMaterial',
                uniforms: { u_diffuseInput: WHITE },
            },
        }],
    };
}

/**
 * 创建六个调试层（全都挂在返回的对象下，方便一次性加进场景）。
 *
 * @returns 六个层与它们的父节点
 */
export function createPhysicsDebugLayers(): { holder: Object3D; layers: PhysicsDebugLayers }
{
    const layers: PhysicsDebugLayers = {
        axes: createLayer('DebugAxes'),
        aabbs: createLayer('DebugAabbs'),
        contacts: createLayer('DebugContacts'),
        normals: createLayer('DebugNormals'),
        cm2contact: createLayer('DebugCm2Contact'),
        constraints: createLayer('DebugConstraints'),
    };
    const holder: Object3D = {
        __type__: 'Object3D',
        name: 'PhysicsDebugVisuals',
        children: [layers.axes, layers.aabbs, layers.contacts, layers.normals, layers.cm2contact, layers.constraints],
    };

    return { holder, layers };
}

/**
 * 把一组线段写进某个层。
 *
 * @param layer 目标层
 * @param segments 线段集合
 */
function setSegments(layer: Object3D, segments: DebugSegment[]): void
{
    const geometry = (layer.components?.[0] as MeshRenderer | undefined)?.geometry;
    if (geometry === undefined) return;

    (reactive(geometry) as unknown as { segments: DebugSegment[] }).segments = segments;
}

/**
 * 造一条线段。
 *
 * @param ax 起点
 * @param bx 终点
 * @param color 颜色
 * @returns 线段数据
 */
function seg(ax: number, ay: number, az: number, bx: number, by: number, bz: number, color: Color4): DebugSegment
{
    return { start: { x: ax, y: ay, z: az }, end: { x: bx, y: by, z: bz }, startColor: color, endColor: color };
}

/** 复用的向量，避免每帧新建（调试可视化每帧都跑） */
const v1 = new Vec3();
const v2 = new Vec3();

/**
 * 按开关刷新六个调试层（每帧物理步进后调用）。
 *
 * @param world 物理世界
 * @param settings 开关
 * @param layers 六个层
 */
export function updatePhysicsDebugVisuals(world: World, settings: PhysicsDebugSettings, layers: PhysicsDebugLayers): void
{
    // ---- axes：每个刚体的三条局部轴 ----
    const axes: DebugSegment[] = [];
    if (settings.axes)
    {
        for (const body of world.bodies)
        {
            const p = body.position;
            for (const [axis, color] of [[v1.set(1, 0, 0), RED], [v1.set(0, 1, 0), GREEN], [v1.set(0, 0, 1), BLUE]] as [Vec3, Color4][])
            {
                body.quaternion.vmult(axis, v2);
                axes.push(seg(
                    p.x, p.y, p.z,
                    p.x + v2.x * AXIS_LENGTH, p.y + v2.y * AXIS_LENGTH, p.z + v2.z * AXIS_LENGTH,
                    color,
                ));
            }
        }
    }
    setSegments(layers.axes, axes);

    // ---- aabbs：每个刚体的包围盒线框（12 条棱） ----
    const aabbs: DebugSegment[] = [];
    if (settings.aabbs)
    {
        for (const body of world.bodies)
        {
            const lo = body.aabb.lowerBound;
            const hi = body.aabb.upperBound;
            const xs = [lo.x, hi.x];
            const ys = [lo.y, hi.y];
            const zs = [lo.z, hi.z];
            for (const i of [0, 1])
            {
                for (const j of [0, 1])
                {
                    // 沿 X / Y / Z 各四条棱
                    aabbs.push(seg(xs[0], ys[i], zs[j], xs[1], ys[i], zs[j], YELLOW));
                    aabbs.push(seg(xs[i], ys[0], zs[j], xs[i], ys[1], zs[j], YELLOW));
                    aabbs.push(seg(xs[i], ys[j], zs[0], xs[i], ys[j], zs[1], YELLOW));
                }
            }
        }
    }
    setSegments(layers.aabbs, aabbs);

    // ---- contacts / normals / cm2contact：都来自 world.contacts ----
    const contacts: DebugSegment[] = [];
    const normals: DebugSegment[] = [];
    const cm2contact: DebugSegment[] = [];
    if (settings.contacts || settings.normals || settings.cm2contact)
    {
        for (const c of world.contacts)
        {
            // 接触点（A 侧）：bodyA.position + ri
            const px = c.bi.position.x + c.ri.x;
            const py = c.bi.position.y + c.ri.y;
            const pz = c.bi.position.z + c.ri.z;

            if (settings.contacts)
            {
                // 用小十字表示接触点（原版是一颗小球）
                const r = 0.05;
                contacts.push(seg(px - r, py, pz, px + r, py, pz, WHITE));
                contacts.push(seg(px, py - r, pz, px, py + r, pz, WHITE));
                contacts.push(seg(px, py, pz - r, px, py, pz + r, WHITE));
            }
            if (settings.normals)
            {
                const n = c.ni;
                normals.push(seg(px, py, pz, px + n.x * 0.5, py + n.y * 0.5, pz + n.z * 0.5, CYAN));
            }
            if (settings.cm2contact)
            {
                const b = c.bi.position;
                cm2contact.push(seg(b.x, b.y, b.z, px, py, pz, GREEN));
            }
        }
    }
    setSegments(layers.contacts, contacts);
    setSegments(layers.normals, normals);
    setSegments(layers.cm2contact, cm2contact);

    // ---- constraints：每个约束两端刚体的连线 ----
    const constraints: DebugSegment[] = [];
    if (settings.constraints)
    {
        for (const c of world.constraints)
        {
            const a = c.bodyA?.position;
            const b = c.bodyB?.position;
            if (a === undefined || b === undefined) continue;
            constraints.push(seg(a.x, a.y, a.z, b.x, b.y, b.z, RED));
        }
    }
    setSegments(layers.constraints, constraints);
}
