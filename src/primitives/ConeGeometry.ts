import { CylinderGeometry, cylinderGeometryLogic } from './CylinderGeometry';
import { registerLogic } from '@feng3d/reactivity';
import { registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';

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

/**
 * 按现有数据克隆一份 ConeGeometry（用于 clone）。
 */
export function createConeGeometryWithData(src: ConeGeometry): ConeGeometry
{
    return {
        __type__: 'ConeGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        topRadius: src.topRadius,
        bottomRadius: src.bottomRadius,
        height: src.height,
        segmentsW: src.segmentsW,
        segmentsH: src.segmentsH,
        topClosed: src.topClosed,
        bottomClosed: src.bottomClosed,
        surfaceClosed: src.surfaceClosed,
        yUp: src.yUp,
    };
}

// ConeGeometry 复用 cylinderGeometryLogic
registerLogic('ConeGeometry', cylinderGeometryLogic);
registerCloneFactory('ConeGeometry', (src: ConeGeometry) => createConeGeometryWithData(src));
registerDefaultGeometryFactory('Cone', () => ({ __type__: 'ConeGeometry' }));
