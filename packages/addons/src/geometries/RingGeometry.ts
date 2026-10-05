import { Geometry, GeometryLogic, geometryUtils, computedAttr, createGeometryLogicState, geometryBeforeRender, geometryBounding, geometryRaycast } from 'feng3d';
import { registerLogic, reactive, computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        RingGeometry: RingGeometryLogic;
    }
}

declare module 'feng3d'
{
    export interface GeometryMap
    {
        RingGeometry: RingGeometry;
    }
}

/**
 * 圆环几何体（纯数据接口）。
 *
 * XY 平面圆环（内圆挖空），法线 +Z。移植自 three.js RingGeometry。
 */
export interface RingGeometry extends Geometry
{
    readonly __type__: 'RingGeometry';
    /** 内半径，默认 0.5 */
    readonly innerRadius: number;
    /** 外半径，默认 1 */
    readonly outerRadius: number;
    /** 圆周分段数（≥3），默认 32 */
    readonly thetaSegments: number;
    /** 径向分段数（≥1），默认 1 */
    readonly phiSegments: number;
    /** 起始角（弧度），默认 0 */
    readonly thetaStart: number;
    /** 扫掠角（弧度），默认 2π */
    readonly thetaLength: number;
}

/**
 * RingGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 innerRadius/outerRadius/thetaSegments/phiSegments/thetaStart/thetaLength。
 */
export interface RingGeometryLogic extends GeometryLogic
{
}

/**
 * 工厂函数：RingGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function ringGeometryLogic(data: RingGeometry): RingGeometryLogic
{
    // 默认值填充（工厂内完成，创建完成即已填充）
    const writable = data as UnReadonly<RingGeometry>;
    if (data.name === undefined) writable.name = 'Ring';
    if (data.scaleU === undefined) writable.scaleU = 1;
    if (data.scaleV === undefined) writable.scaleV = 1;
    if (data.innerRadius === undefined) writable.innerRadius = 0.5;
    if (data.outerRadius === undefined) writable.outerRadius = 1;
    if (data.thetaSegments === undefined) writable.thetaSegments = 32;
    if (data.phiSegments === undefined) writable.phiSegments = 1;
    if (data.thetaStart === undefined) writable.thetaStart = 0;
    if (data.thetaLength === undefined) writable.thetaLength = Math.PI * 2;

    // 每个属性独立 computed，仅在实际被读取时计算
    const positionsComputed = computed(() => buildPositions());
    const normalsComputed = computed(() => buildNormals());
    const uvsComputed = computed(() => buildUVs());
    const indicesComputed = computed(() => buildIndices());
    const colorsComputed = computed(() =>
    {
        const pos = positionsComputed.value;
        if (pos.length === 0) return new Float32Array(0);
        const count = pos.length / 3;

        return new Float32Array(count * 4).fill(1);
    });
    const tangentsComputed = computed(() =>
    {
        const positions = Array.from(positionsComputed.value);
        const uvs = Array.from(uvsComputed.value);

        return new Float32Array(geometryUtils.createVertexTangents(indicesComputed.value, positions, uvs, true));
    });

    function buildPositions(): Float32Array
    {
        const r_g = reactive(data);
        const innerRadius = r_g.innerRadius;
        const outerRadius = r_g.outerRadius;
        const thetaSegmentsRaw = r_g.thetaSegments;
        const phiSegmentsRaw = r_g.phiSegments;
        const thetaSegments = Math.max(3, thetaSegmentsRaw);
        const phiSegments = Math.max(1, phiSegmentsRaw);
        const thetaStart = r_g.thetaStart;
        const thetaLength = r_g.thetaLength;

        const positions: number[] = [];
        let radius = innerRadius;
        const radiusStep = (outerRadius - innerRadius) / phiSegments;

        for (let j = 0; j <= phiSegments; j++)
        {
            for (let i = 0; i <= thetaSegments; i++)
            {
                const segment = thetaStart + i / thetaSegments * thetaLength;
                positions.push(radius * Math.cos(segment), radius * Math.sin(segment), 0);
            }
            radius += radiusStep;
        }

        return new Float32Array(positions);
    }

    function buildNormals(): Float32Array
    {
        const r_g = reactive(data);
        const thetaSegmentsRaw = r_g.thetaSegments;
        const phiSegmentsRaw = r_g.phiSegments;
        const thetaSegments = Math.max(3, thetaSegmentsRaw);
        const phiSegments = Math.max(1, phiSegmentsRaw);
        const count = (thetaSegments + 1) * (phiSegments + 1);
        const normals: number[] = [];
        for (let i = 0; i < count; i++)
        {
            normals.push(0, 0, 1); // 法线 +Z
        }

        return new Float32Array(normals);
    }

    function buildUVs(): Float32Array
    {
        const r_g = reactive(data);
        const outerRadius = r_g.outerRadius;
        const thetaSegmentsRaw = r_g.thetaSegments;
        const phiSegmentsRaw = r_g.phiSegments;
        const thetaSegments = Math.max(3, thetaSegmentsRaw);
        const phiSegments = Math.max(1, phiSegmentsRaw);
        const thetaStart = r_g.thetaStart;
        const thetaLength = r_g.thetaLength;

        const uvs: number[] = [];
        let radius = r_g.innerRadius;
        const radiusStep = (r_g.outerRadius - r_g.innerRadius) / phiSegments;
        for (let j = 0; j <= phiSegments; j++)
        {
            for (let i = 0; i <= thetaSegments; i++)
            {
                const segment = thetaStart + i / thetaSegments * thetaLength;
                const x = radius * Math.cos(segment);
                const y = radius * Math.sin(segment);
                uvs.push((x / outerRadius + 1) / 2, (y / outerRadius + 1) / 2);
            }
            radius += radiusStep;
        }

        return new Float32Array(uvs);
    }

    function buildIndices(): number[]
    {
        const r_g = reactive(data);
        const thetaSegmentsRaw = r_g.thetaSegments;
        const phiSegmentsRaw = r_g.phiSegments;
        const thetaSegments = Math.max(3, thetaSegmentsRaw);
        const phiSegments = Math.max(1, phiSegmentsRaw);
        const indices: number[] = [];
        for (let j = 0; j < phiSegments; j++)
        {
            const thetaSegmentLevel = j * (thetaSegments + 1);
            for (let i = 0; i < thetaSegments; i++)
            {
                const segment = i + thetaSegmentLevel;
                const a = segment;
                const b = segment + thetaSegments + 1;
                const c = segment + thetaSegments + 2;
                const d = segment + 1;
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        return indices;
    }

    // attributes: data 由 computed getter 驱动
    const attrTable: VertexAttributes = {
        a_position: computedAttr(positionsComputed, 'float32x3'),
        a_color: computedAttr(colorsComputed, 'float32x4'),
        a_uv: computedAttr(uvsComputed, 'float32x2'),
        a_normal: computedAttr(normalsComputed, 'float32x3'),
        a_tangent: computedAttr(tangentsComputed, 'float32x3'),
    };
    const state = createGeometryLogicState(() => attrTable, () => indicesComputed.value, data);

    const logic: RingGeometryLogic = {
        get vertices() { return attrTable; },
        get vertexIndices() { return indicesComputed.value; },
        get indices() { return state.indices.value; },
        get draw() { return state.draw.value; },
        get bounding() { return geometryBounding(logic); },
        raycast(ray, shortestCollisionDistance, cullFace) { return geometryRaycast(logic, ray, shortestCollisionDistance, cullFace); },
        beforeRender(renderObject) { geometryBeforeRender(logic, renderObject); },
    };

    return logic;
}
registerLogic('RingGeometry', ringGeometryLogic);
