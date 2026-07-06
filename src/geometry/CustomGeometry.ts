import { Geometry } from './Geometry';
import { registerDefaults } from '@feng3d/reactivity';

// 触发 geometryLogic 注册
import './geometryLogic';

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
 * 不含自身构造参数，顶点数据由外部通过 geometryLogic(customGeometry).positions/uvs/indices 等
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

// 注册默认值（缺失字段自动填充）
registerDefaults('CustomGeometry', {
    name: '',
    scaleU: 1,
    scaleV: 1,
});
