import { CylinderGeometry, cylinderGeometryLogic } from './CylinderGeometry';
import { registerLogic } from '@feng3d/reactivity';
import { type GeometryLogic, registerDefaultGeometryFactory } from '../geometry/Geometry';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ConeGeometry: GeometryLogic;
    }
}

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        ConeGeometry: ConeGeometry;
    }
}

/**
 * 圆锥体几何体（纯数据接口，复用 CylinderGeometry）。
 */
export interface ConeGeometry extends Omit<CylinderGeometry, '__type__'>
{
    readonly __type__: 'ConeGeometry';
}

// ConeGeometry 默认值由 CylinderGeometryLogic 构造函数按 __type__ 分支处理（见 CylinderGeometry.ts）

// ConeGeometry 复用 cylinderGeometryLogic
registerLogic('ConeGeometry', cylinderGeometryLogic);
registerDefaultGeometryFactory('Cone', () => ({ __type__: 'ConeGeometry' } as ConeGeometry));
