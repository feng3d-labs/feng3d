/**
 * 几何体（纯数据接口）。
 *
 * 仅保留 `__type__` 与构造参数；顶点数据（positions/normals/uvs/indices 等）与行为
 * （buildGeometry/beforeRender/bounding/raycast/clone）由 {@link geometryLogic} 提供。
 *
 * 具体子类（CubeGeometry/PlaneGeometry 等）继承本接口，添加自身构造参数字段。
 */
export interface Geometry
{
    /** 数据类型标识，对应 geometryLogic 工厂注册名 */
    readonly __type__: string;
    /** 名称 */
    name: string;
    /** 纹理U缩放，默认为1 */
    scaleU: number;
    /** 纹理V缩放，默认为1 */
    scaleV: number;
}

/**
 * 任意 Geometry 类型别名（向后兼容）。
 */
export type GeometryLike = Geometry;
