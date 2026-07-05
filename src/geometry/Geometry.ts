/**
 * 几何体（纯数据接口）。
 *
 * 仅保留 `__type__` 与构造参数；顶点数据（positions/normals/uvs/indices 等）与行为
 * （buildGeometry/beforeRender/bounding/raycast/clone）由 {@link geometryLogic} 提供。
 *
 * 具体子类（CubeGeometry/PlaneGeometry 等）继承本接口，添加自身构造参数字段，
 * 并通过 `declare module './Geometry'` 注册到 {@link GeometryMap} 以纳入 {@link Geometrys} 联合类型。
 */
export interface Geometry
{
    /** 数据类型标识，对应 geometryLogic 工厂注册名 */
    readonly __type__: string;
    /** 名称（缺失时由 registerDefaults 自动填充） */
    name?: string;
    /** 纹理U缩放，默认为1（缺失时由 registerDefaults 自动填充） */
    scaleU?: number;
    /** 纹理V缩放，默认为1（缺失时由 registerDefaults 自动填充） */
    scaleV?: number;
}

/**
 * Geometry 类型注册表，由各子类通过 `declare module './Geometry'` 扩展。
 */
export interface GeometryMap { }

/**
 * 所有 Geometry 具体子类型的联合类型（含基类 Geometry 兜底）。
 *
 * 用于 Renderable.geometry 等字段，使 TS 可按 `__type__` 识别具体子类型，
 * 同时允许基类 Geometry（如 getDefaultGeometry 返回值）赋值。
 */
export type Geometrys = GeometryMap[keyof GeometryMap] | Geometry;

/**
 * 任意 Geometry 类型别名（向后兼容）。
 */
export type GeometryLike = Geometry;
