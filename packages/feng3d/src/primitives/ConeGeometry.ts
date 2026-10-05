import { CylinderGeometry, CylinderGeometryLogic, cylinderGeometryLogic } from './CylinderGeometry';
import { registerLogic } from '@feng3d/reactivity';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ConeGeometry: CylinderGeometryLogic;
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

// ConeGeometry 默认值由 cylinderGeometryLogic 工厂按 __type__ 分支处理（见 CylinderGeometry.ts）

// ConeGeometry 复用 CylinderGeometryLogic 的工厂
registerLogic('ConeGeometry', cylinderGeometryLogic);
