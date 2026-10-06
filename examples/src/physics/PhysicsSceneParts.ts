import type { Object3D } from 'feng3d';
import type { Vector3Like } from '@feng3d/math';

/**
 * 场景零件库 —— 对应 cannon-es `examples/js/three-conversion-utils.js` 的 `shapeToGeometry`。
 *
 * 原版给形状配视觉的规则（这里逐条照搬，尺寸/分段数一致）：
 * | cannon-es 形状 | three.js 几何 | 这里 |
 * |---|---|---|
 * | `Sphere(r)` | `SphereGeometry(r, 8, 8)` | `SphereGeometry` 半径 r、分段 8/8 |
 * | `Box(hx,hy,hz)` | `BoxGeometry(2hx, 2hy, 2hz)` | `CubeGeometry` + scale（宽高深 = 2×半边长） |
 * | `Cylinder(rt,rb,h,n)` | `CylinderGeometry(rt,rb,h,n)` | `CylinderGeometry` 同参 |
 * | `Plane()` | `PlaneGeometry(500, 500, 4, 4)` | `PlaneGeometry` 同参 |
 * | `Particle()` | `SphereGeometry(0.1, 8, 8)` | 同左 |
 * | `ConvexPolyhedron` | 按顶点 + 面构建 | `CustomGeometry`（顶点 + 三角面索引） |
 */

/** 材质颜色（与原版 Demo 的默认材质同色系） */
export interface PartColor
{
    readonly r: number;
    readonly g: number;
    readonly b: number;
}

/** 默认材质色（原版 three.js 默认材质是浅灰） */
export const DEFAULT_COLOR: PartColor = { r: 0.85, g: 0.85, b: 0.85 };

/** 刚体的可选参数（对应原版给 Body 设的那些字段） */
export interface PartOptions
{
    /** 质量（缺失 = 0，静态） */
    readonly mass?: number;
    /** 刚体类型 */
    readonly type?: 'dynamic' | 'static' | 'kinematic';
    /** 初始线速度 */
    readonly velocity?: Vector3Like;
    /** 是否固定旋转 */
    readonly fixedRotation?: boolean;
    /** 线性阻尼 */
    readonly linearDamping?: number;
    /** 角阻尼 */
    readonly angularDamping?: number;
    /** 欧拉角（弧度） */
    readonly rotation?: Vector3Like;
    /** 颜色 */
    readonly color?: PartColor;
    /** 碰撞过滤分组（位掩码，原版的 collisionFilterGroup） */
    readonly collisionFilterGroup?: number;
    /** 碰撞过滤掩码（原版的 collisionFilterMask） */
    readonly collisionFilterMask?: number;
    /** 材质名（原版的 new CANNON.Material(name)） */
    readonly materialName?: string;
    /** 是否触发器（原版的 isTrigger：只报告接触、不产生碰撞响应） */
    readonly isTrigger?: boolean;
}

/**
 * 造一个平色材质。
 *
 * @param color 颜色
 * @returns ColorMaterial 数据
 */
function material(color: PartColor)
{
    return {
        __type__: 'ColorMaterial',
        uniforms: {
            u_diffuseInput: { __type__: 'Color4', r: color.r, g: color.g, b: color.b, a: 1 },
        },
    };
}

/**
 * 给刚体组件补上可选字段（只写声明过的）。
 *
 * @param options 可选参数
 * @returns 刚体组件数据
 */
function rigidbody(options: PartOptions)
{
    const body: Record<string, unknown> = { __type__: 'Rigidbody', mass: options.mass ?? 0 };
    if (options.type !== undefined) body.type = options.type;
    if (options.velocity !== undefined) body.velocity = options.velocity;
    if (options.fixedRotation !== undefined) body.fixedRotation = options.fixedRotation;
    if (options.linearDamping !== undefined) body.linearDamping = options.linearDamping;
    if (options.angularDamping !== undefined) body.angularDamping = options.angularDamping;
    if (options.collisionFilterGroup !== undefined) body.collisionFilterGroup = options.collisionFilterGroup;
    if (options.collisionFilterMask !== undefined) body.collisionFilterMask = options.collisionFilterMask;
    if (options.materialName !== undefined) body.materialName = options.materialName;
    if (options.isTrigger !== undefined) body.isTrigger = options.isTrigger;

    return body;
}

/**
 * 静态地面：一个无限 Plane（视觉按原版 500×500）。
 *
 * Plane 默认法线朝 +Z，绕 X 转 -90° 让法线朝上。
 *
 * @returns 地面的 Object3D
 */
export function createGroundPlane(options: PartOptions = {}): Object3D
{
    return {
        __type__: 'Object3D',
        name: 'Ground',
        rotation: { x: -Math.PI / 2, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'PlaneGeometry', width: 500, height: 500, segmentsW: 4, segmentsH: 4 },
            material: material(options.color ?? { r: 0.55, g: 0.55, b: 0.55 }),
        }, {
            __type__: 'PlaneCollider',
        }, rigidbody(options) as never],
    };
}

/**
 * 球。
 *
 * @param name 名字
 * @param position 位置
 * @param radius 半径
 * @param options 可选参数
 * @returns 球的 Object3D
 */
export function createSphere(name: string, position: Vector3Like, radius: number, options: PartOptions = {}): Object3D
{
    return {
        __type__: 'Object3D',
        name,
        position,
        rotation: options.rotation,
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SphereGeometry', radius, segmentsW: 8, segmentsH: 8 },
            material: material(options.color ?? DEFAULT_COLOR),
        }, {
            __type__: 'SphereCollider',
            radius,
        }, rigidbody(options) as never],
    };
}

/**
 * 盒子（参数是**半边长**，与原版 `new CANNON.Box(...)` 一致）。
 *
 * @param name 名字
 * @param position 位置
 * @param halfExtents 半边长
 * @param options 可选参数
 * @returns 盒子的 Object3D
 */
export function createBox(name: string, position: Vector3Like, halfExtents: Vector3Like, options: PartOptions = {}): Object3D
{
    const width = halfExtents.x * 2;
    const height = halfExtents.y * 2;
    const depth = halfExtents.z * 2;

    return {
        __type__: 'Object3D',
        name,
        position,
        rotation: options.rotation,
        scale: { x: width, y: height, z: depth },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
            material: material(options.color ?? DEFAULT_COLOR),
        }, {
            __type__: 'BoxCollider',
            width,
            height,
            depth,
        }, rigidbody(options) as never],
    };
}

/**
 * 圆柱 / 圆台。
 *
 * @param name 名字
 * @param position 位置
 * @param radiusTop 顶半径
 * @param radiusBottom 底半径
 * @param height 高
 * @param radialSegments 径向分段
 * @param options 可选参数
 * @returns 圆柱的 Object3D
 */
export function createCylinder(
    name: string,
    position: Vector3Like,
    radiusTop: number,
    radiusBottom: number,
    height: number,
    radialSegments: number,
    options: PartOptions = {},
): Object3D
{
    const geometry = {
        __type__: 'CylinderGeometry',
        topRadius: radiusTop,
        bottomRadius: radiusBottom,
        height,
        segmentsW: radialSegments,
        segmentsH: 1,
        yUp: true,
    } as const;

    return {
        __type__: 'Object3D',
        name,
        position,
        rotation: options.rotation,
        components: [{
            __type__: 'MeshRenderer',
            geometry,
            material: material(options.color ?? DEFAULT_COLOR),
        }, {
            __type__: 'CylinderCollider',
            topRadius: radiusTop,
            bottomRadius: radiusBottom,
            height,
            segmentsW: radialSegments,
        }, rigidbody(options) as never],
    };
}

/**
 * 点状形状（原版 `Particle`）：视觉是半径 0.1 的小球。
 *
 * @param name 名字
 * @param position 位置
 * @param options 可选参数
 * @returns 粒子的 Object3D
 */
export function createParticle(name: string, position: Vector3Like, options: PartOptions = {}): Object3D
{
    return {
        __type__: 'Object3D',
        name,
        position,
        rotation: options.rotation,
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SphereGeometry', radius: 0.1, segmentsW: 8, segmentsH: 8 },
            material: material(options.color ?? DEFAULT_COLOR),
        }, {
            __type__: 'ParticleCollider',
        }, rigidbody(options) as never],
    };
}

/**
 * 凸包：按显式顶点与面构建（对应原版的 `ConvexPolyhedron`，如四面体）。
 *
 * 视觉用 `CustomGeometry`：面按扇形三角化后作为索引。
 *
 * @param name 名字
 * @param position 位置
 * @param vertices 顶点
 * @param faces 面（顶点索引数组）
 * @param options 可选参数
 * @returns 凸包的 Object3D
 */
export function createConvex(
    name: string,
    position: Vector3Like,
    vertices: readonly Vector3Like[],
    faces: readonly (readonly number[])[],
    options: PartOptions = {},
): Object3D
{
    const positions: number[] = [];
    for (const v of vertices) positions.push(v.x, v.y, v.z);

    // 面 → 三角面索引（扇形三角化，与原版 three-conversion-utils 的做法一致）
    const indices: number[] = [];
    for (const face of faces)
    {
        for (let j = 1; j + 1 < face.length; j++) indices.push(face[0], face[j], face[j + 1]);
    }

    return {
        __type__: 'Object3D',
        name,
        position,
        rotation: options.rotation,
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CustomGeometry', positions, indices },
            material: material(options.color ?? DEFAULT_COLOR),
        }, {
            __type__: 'ConvexCollider',
            vertices,
            faces,
        }, rigidbody(options) as never],
    };
}

/**
 * 复合刚体的一段：只给碰撞体（视觉由外层自己拼）。
 *
 * @param offset 相对刚体原点的偏移
 * @param halfExtents 半边长
 * @returns BoxCollider 数据
 */
/** 立方体凸包的顶点（与 cannon-es 的 `Box.convexPolyhedronRepresentation` 同序，从 cannon-es 实测 dump） */
const BOX_CONVEX_VERTICES: readonly Vector3Like[] = [
    { x: -1, y: -1, z: -1 },
    { x: 1, y: -1, z: -1 },
    { x: 1, y: 1, z: -1 },
    { x: -1, y: 1, z: -1 },
    { x: -1, y: -1, z: 1 },
    { x: 1, y: -1, z: 1 },
    { x: 1, y: 1, z: 1 },
    { x: -1, y: 1, z: 1 },
];

/** 立方体凸包的面（与 cannon-es 同序，绕向保证法线朝外） */
const BOX_CONVEX_FACES: readonly (readonly number[])[] = [
    [3, 2, 1, 0],
    [4, 5, 6, 7],
    [5, 4, 0, 1],
    [2, 3, 7, 6],
    [0, 4, 7, 3],
    [1, 2, 6, 5],
];

/**
 * 立方体的**凸包**（对应原版的 `Box(..).convexPolyhedronRepresentation`）。
 *
 * 与 {@link createBox} 的区别：那个用 `Box` 形状，这个用 `ConvexPolyhedron`——
 * 形状类型不同，接触求解走的是不同的路子，所以原版 `convex.html` 特意两者都用了。
 *
 * @param name 名字
 * @param position 位置
 * @param size 半边长
 * @param options 可选参数
 * @returns 立方体凸包的 Object3D
 */
export function createBoxConvex(name: string, position: Vector3Like, size: number, options: PartOptions = {}): Object3D
{
    const vertices = BOX_CONVEX_VERTICES.map((v) => ({ x: v.x * size, y: v.y * size, z: v.z * size }));

    return createConvex(name, position, vertices, BOX_CONVEX_FACES, options);
}

/** 复合刚体的一个子形状 */
export interface CompoundPart
{
    /** 形状类型 */
    readonly shape: 'box' | 'sphere';
    /** 相对刚体原点的偏移 */
    readonly offset: Vector3Like;
    /** box 的半边长 / sphere 的半径 */
    readonly size: number;
}

/**
 * 复合刚体：一个刚体挂多个子形状（对应原版 `body.addShape(shape, offset)`）。
 *
 * 视觉由每个子形状一个**子对象**承担（子对象位置 = offset），
 * 这样视觉与碰撞用的是同一组偏移，不会对不上。
 *
 * @param name 名字
 * @param position 位置
 * @param parts 子形状
 * @param options 可选参数（rotation 会作用在整个刚体上）
 * @returns 复合刚体的 Object3D
 */
export function createCompound(name: string, position: Vector3Like, parts: readonly CompoundPart[], options: PartOptions = {}): Object3D
{
    const color = options.color ?? DEFAULT_COLOR;
    const colliders: unknown[] = [];
    const visuals: Object3D[] = [];

    for (const part of parts)
    {
        if (part.shape === 'box')
        {
            colliders.push(boxColliderAt(part.offset, { x: part.size, y: part.size, z: part.size }));
            visuals.push({
                __type__: 'Object3D',
                name: name + '-part',
                position: part.offset,
                scale: { x: part.size * 2, y: part.size * 2, z: part.size * 2 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry' },
                    material: material(color),
                }],
            });
        }
        else
        {
            colliders.push({
                __type__: 'SphereCollider',
                radius: part.size,
                offset: part.offset,
            });
            visuals.push({
                __type__: 'Object3D',
                name: name + '-part',
                position: part.offset,
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: part.size, segmentsW: 8, segmentsH: 8 },
                    material: material(color),
                }],
            });
        }
    }

    return {
        __type__: 'Object3D',
        name,
        position,
        rotation: options.rotation,
        components: [...colliders, rigidbody(options)] as never,
        children: visuals,
    };
}

/**
 * 复合刚体的一段：只给碰撞体（视觉由外层自己拼）。
 *
 * @param offset 相对刚体原点的偏移
 * @param halfExtents 半边长
 * @returns BoxCollider 数据
 */
export function boxColliderAt(offset: Vector3Like, halfExtents: Vector3Like)
{
    return {
        __type__: 'BoxCollider',
        width: halfExtents.x * 2,
        height: halfExtents.y * 2,
        depth: halfExtents.z * 2,
        offset,
    };
}
