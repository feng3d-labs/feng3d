import { Geometry } from './Geometry';

// 触发 geometryLogic 注册
import './geometryLogic';

/**
 * 自定义几何体（纯数据接口）。
 *
 * 不含自身构造参数，顶点数据由外部通过 geometryLogic(customGeometry).positions/uvs/indices 等
 * 直接设置。
 */
export interface CustomGeometry extends Geometry
{
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
