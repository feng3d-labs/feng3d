import type { Object3D, Segment, SegmentGeometry, Vector3Like } from 'feng3d';

/** 直角（弧度）：90° 旋转用于把圆锥箭头从 +Y 轴掰到指定坐标轴 */
const HALF_PI = Math.PI / 2;

/**
 * 生成一条轴向线段几何体（起点为原点，终点为轴向单位向量）。
 *
 * 新范式写法：`SegmentGeometry.segments` 声明线段列表（旧格式为
 * `__class__: 'SegmentGeometry'` + `Vector3` / `Color4` 类实例）；
 * `start` / `end` 是 `{ x, y, z }` 普通对象，`startColor` / `endColor` 是
 * `{ __type__: 'Color4', r, g, b, a }` 字面量，四项**全必填**。
 *
 * @param end 轴向单位向量终点
 * @param color 轴线颜色分量
 */
function createAxisSegment(end: Vector3Like, color: { r: number; g: number; b: number }): SegmentGeometry
{
    const segment: Segment = {
        start: { x: 0, y: 0, z: 0 },
        end,
        startColor: { __type__: 'Color4', r: color.r, g: color.g, b: color.b, a: 1 },
        endColor: { __type__: 'Color4', r: color.r, g: color.g, b: color.b, a: 1 },
    };

    return { __type__: 'SegmentGeometry', segments: [segment] };
}

/**
 * 生成轴箭头渲染器数据（圆锥体 + 纯色材质）。
 *
 * 旧格式用 `Material.shaderName = 'color'` 选择着色器；新范式材质类型即 `__type__`
 * （`ColorMaterial`），漫反射颜色经 `uniforms.u_diffuseInput` 传递。
 */
function createArrowRenderer(radius: number, height: number, color: { r: number; g: number; b: number })
{
    return {
        __type__: 'MeshRenderer' as const,
        geometry: { __type__: 'ConeGeometry' as const, bottomRadius: radius, height },
        material: {
            __type__: 'ColorMaterial' as const,
            uniforms: { u_diffuseInput: { __type__: 'Color4' as const, r: color.r, g: color.g, b: color.b, a: 1 } },
        },
    };
}

/**
 * 生成轴线渲染器数据（线段几何体 + 线段材质）。
 *
 * 旧格式用 `Material.shaderName = 'segment'` + `SegmentUniforms`；新范式类型即
 * `SegmentMaterial`，`uniforms.u_segmentColor` 与顶点色相乘（取白色即只用顶点色，
 * 与旧资源中空的 `SegmentUniforms` 行为一致）。
 */
function createSegmentRenderer(end: Vector3Like, color: { r: number; g: number; b: number })
{
    return {
        __type__: 'MeshRenderer' as const,
        geometry: createAxisSegment(end, color),
        material: {
            __type__: 'SegmentMaterial' as const,
            uniforms: { u_segmentColor: { __type__: 'Color4' as const, r: 1, g: 1, b: 1, a: 1 } },
        },
    };
}

/**
 * 创建坐标轴指示器（trident）：3 条轴线 + 3 个箭头，X 红 / Y 绿 / Z 蓝。
 *
 * **背景（P1 API 迁移）**：原实现从 `resource/gameobjects/Trident.gameobject.json` 加载并
 * `serialization.deserialize`——该资源是**旧格式**（`GameObject` / `Transform` /
 * `Material.shaderName`），旧反序列化走 `classUtils.getInstanceByName`（内部 `new Cls()`），
 * 而主仓这些类型已是纯数据接口（运行时无构造器），加载必然失败
 * （控制台 `无法获取名称为 GameObject 的实例!`）。这里改用纯数据字面量构造。
 *
 * 结构参照旧资源：轴线为 `SegmentGeometry`（原点 → 轴端点），箭头为 `ConeGeometry`
 * （`bottomRadius 0.05` / `height 0.18`）置于轴端点；圆锥默认沿 +Y，X 轴箭头绕 Z 轴 -90°、
 * Z 轴箭头绕 X 轴 +90°（rotation 单位为**弧度**，旧 `Transform.rz/rx` 为角度）。
 *
 * @returns 坐标轴指示器根对象（未挂载；由调用方经响应式 `children.push` 挂到编辑器场景）
 */
export function createTrident(): Object3D
{
    const RED = { r: 1, g: 0, b: 0 };
    const GREEN = { r: 0, g: 1, b: 0 };
    const BLUE = { r: 0, g: 0, b: 1 };

    return {
        __type__: 'Object3D',
        name: 'trident',
        // 坐标轴指示器不参与鼠标拾取（与旧资源 `mouseEnabled: false` 一致）
        mouseEnabled: false,
        children: [
            // ---- 三条轴线 ----
            {
                __type__: 'Object3D',
                name: 'xLine',
                components: [createSegmentRenderer({ x: 1, y: 0, z: 0 }, RED)],
            },
            {
                __type__: 'Object3D',
                name: 'yLine',
                components: [createSegmentRenderer({ x: 0, y: 1, z: 0 }, GREEN)],
            },
            {
                __type__: 'Object3D',
                name: 'zLine',
                components: [createSegmentRenderer({ x: 0, y: 0, z: 1 }, BLUE)],
            },
            // ---- 三个轴箭头（圆锥默认尖端朝 +Y）----
            {
                __type__: 'Object3D',
                name: 'xArrow',
                position: { x: 1, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: -HALF_PI },
                components: [createArrowRenderer(0.05, 0.18, RED)],
            },
            {
                __type__: 'Object3D',
                name: 'yArrow',
                position: { x: 0, y: 1, z: 0 },
                components: [createArrowRenderer(0.05, 0.18, GREEN)],
            },
            {
                __type__: 'Object3D',
                name: 'zArrow',
                position: { x: 0, y: 0, z: 1 },
                rotation: { x: HALF_PI, y: 0, z: 0 },
                components: [createArrowRenderer(0.05, 0.18, BLUE)],
            },
        ],
    };
}
