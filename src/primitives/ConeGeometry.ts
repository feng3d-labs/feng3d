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

/**
 * 创建 ConeGeometry 实例（topRadius=0，topClosed=false）。
 */
export function createConeGeometry(): ConeGeometry
{
    return {
        __type__: 'ConeGeometry',
        name: 'Cone',
        scaleU: 1,
        scaleV: 1,
        topRadius: 0,
        bottomRadius: 0.5,
        height: 2,
        segmentsW: 16,
        segmentsH: 1,
        topClosed: false,
        bottomClosed: true,
        surfaceClosed: true,
        yUp: true,
    };
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
registerDefaultGeometryFactory('Cone', createConeGeometry);
