import { Geometry, GeometryLogic, registerCloneFactory } from './Geometry';
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

export class CustomGeometryLogic extends GeometryLogic
{
    constructor(geometry: Geometry)
    {
        // CustomGeometry 没有自身 buildGeometry，数据由外部直接 set 到 logic 上
        super(geometry);

        // 默认值（缺失字段单独赋值）
        const writable = geometry as UnReadonly<CustomGeometry>;
        if (geometry.name === undefined) writable.name = '';
        if (geometry.scaleU === undefined) writable.scaleU = 1;
        if (geometry.scaleV === undefined) writable.scaleV = 1;

        this.attributes = {
            a_position: { data: new Float32Array(), format: 'float32x3' },
            a_color: { data: new Float32Array(), format: 'float32x4' },
            a_uv: { data: new Float32Array(), format: 'float32x2' },
            a_normal: { data: new Float32Array(), format: 'float32x3' },
            a_tangent: { data: new Float32Array(), format: 'float32x3' },
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }
}

registerLogic('CustomGeometry', CustomGeometryLogic);
registerCloneFactory('CustomGeometry', () => createCustomGeometry());
