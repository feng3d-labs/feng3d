import { Geometry, geometryLogic, GeometryLogic, registerCloneFactory } from './Geometry';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';

// 触发 geometryLogic 注册
import './Geometry';

declare module './Geometry'
{
    export interface GeometryMap
    {
        CustomGeometry: CustomGeometry;
    }
}

/**
 * 自定义几何体（纯数据接口）。
 *
 * 不含自身构造参数，顶点数据由外部通过 logic(customGeometry).positions/uvs/indices 等
 * 直接设置。
 */
export interface CustomGeometry extends Geometry
{
    readonly __type__: 'CustomGeometry';
}

/**
 * 创建 CustomGeometry 实例。
 */
export function createCustomGeometry(): CustomGeometry
{
    return {
        __type__: 'CustomGeometry',
        name: '',
        scaleU: 1,
        scaleV: 1,
    };
}

/**
 * 创建 CustomGeometryLogic 实例（函数式实现）。
 *
 * CustomGeometry 没有自身 buildGeometry，数据由外部直接 set 到 logic 上。
 * 组合 {@link geometryLogic} 获得全部通用顶点/索引/包围盒行为，仅注入空属性表。
 */
export function customGeometryLogic(geometry: Geometry): GeometryLogic
{
    // 组合基座
    const base = geometryLogic(geometry);

    // 默认值（缺失字段单独赋值）
    const writable = geometry as UnReadonly<CustomGeometry>;
    if (geometry.name === undefined) writable.name = '';
    if (geometry.scaleU === undefined) writable.scaleU = 1;
    if (geometry.scaleV === undefined) writable.scaleV = 1;

    // CustomGeometry 没有自身 buildGeometry，数据由外部直接 set 到 logic 上
    base.setAttributes({
        a_position: { data: new Float32Array(), format: 'float32x3' },
        a_color: { data: new Float32Array(), format: 'float32x4' },
        a_uv: { data: new Float32Array(), format: 'float32x2' },
        a_normal: { data: new Float32Array(), format: 'float32x3' },
        a_tangent: { data: new Float32Array(), format: 'float32x3' },
        a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
        a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
        a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
        a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
    });

    return base;
}

registerLogic('CustomGeometry', customGeometryLogic);
registerCloneFactory('CustomGeometry', () => createCustomGeometry());
