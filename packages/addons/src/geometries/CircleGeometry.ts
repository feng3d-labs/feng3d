import { Geometry, GeometryLogic, geometryUtils, computedAttr, geometryLogicProto, setupGeometryLogicState, type GeometryLogicState } from 'feng3d';
import { registerLogic, reactive, computed, UnReadonly, createLogicProto, type Computed } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        CircleGeometry: CircleGeometryLogic;
    }
}

declare module 'feng3d'
{
    export interface GeometryMap
    {
        CircleGeometry: CircleGeometry;
    }
}

/**
 * 圆盘几何体（纯数据接口）。
 *
 * XY 平面圆盘，法线 +Z。中心顶点 + 扇形三角化。移植自 three.js CircleGeometry。
 */
export interface CircleGeometry extends Geometry
{
    readonly __type__: 'CircleGeometry';
    /** 半径，默认 0.5 */
    readonly radius: number;
    /** 分段数（≥3），默认 32 */
    readonly segments: number;
    /** 起始角（弧度），默认 0 */
    readonly thetaStart: number;
    /** 扫掠角（弧度），默认 2π */
    readonly thetaLength: number;
}

/**
 * CircleGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 radius/segments/thetaStart/thetaLength。
 */
export interface CircleGeometryLogic extends GeometryLogic
{
}

/** CircleGeometryLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface CircleGeometryLogicState extends GeometryLogicState
{
    _attrTable: VertexAttributes;
    _indicesComputed: Computed<number[]>;
}

/** CircleGeometryLogic 的共享原型：继承 Geometry 基类实现，覆写 vertices / vertexIndices */
const circleGeometryLogicProto = createLogicProto<CircleGeometryLogic>(geometryLogicProto, {
    vertices: {
        get: function (this: CircleGeometryLogic & CircleGeometryLogicState): VertexAttributes { return this._attrTable; },
    },
    /** indices 由 computed 驱动（覆写基类 getter） */
    vertexIndices: {
        get: function (this: CircleGeometryLogic & CircleGeometryLogicState): number[] { return this._indicesComputed.value; },
    },
});

/**
 * 工厂函数：CircleGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function circleGeometryLogic(data: CircleGeometry): CircleGeometryLogic
{
    // 默认值填充（工厂内完成，创建完成即已填充）
    const writable = data as UnReadonly<CircleGeometry>;
    if (data.name === undefined) writable.name = 'Circle';
    if (data.scaleU === undefined) writable.scaleU = 1;
    if (data.scaleV === undefined) writable.scaleV = 1;
    if (data.radius === undefined) writable.radius = 0.5;
    if (data.segments === undefined) writable.segments = 32;
    if (data.thetaStart === undefined) writable.thetaStart = 0;
    if (data.thetaLength === undefined) writable.thetaLength = Math.PI * 2;

    // 响应式参数访问器（默认值已填充，直接读取）
    const radius = (): number => reactive(data).radius;
    const segments = (): number => reactive(data).segments;
    const thetaStart = (): number => reactive(data).thetaStart;
    const thetaLength = (): number => reactive(data).thetaLength;

    function buildPositions(): Float32Array
    {
        const radiusValue = radius();
        const segmentsValue = Math.max(3, segments());
        const thetaStartValue = thetaStart();
        const thetaLengthValue = thetaLength();

        const positions: number[] = [];
        // 中心顶点
        positions.push(0, 0, 0);
        for (let s = 0; s <= segmentsValue; s++)
        {
            const segment = thetaStartValue + s / segmentsValue * thetaLengthValue;
            positions.push(radiusValue * Math.cos(segment), radiusValue * Math.sin(segment), 0);
        }

        return new Float32Array(positions);
    }

    function buildNormals(): Float32Array
    {
        const segmentsValue = Math.max(3, segments());
        const count = (segmentsValue + 2); // 中心 + segments+1 个周边
        const normals: number[] = [];
        for (let i = 0; i < count; i++)
        {
            normals.push(0, 0, 1); // 法线 +Z
        }

        return new Float32Array(normals);
    }

    function buildUVs(): Float32Array
    {
        const radiusValue = radius();
        const segmentsValue = Math.max(3, segments());
        const thetaStartValue = thetaStart();
        const thetaLengthValue = thetaLength();

        const uvs: number[] = [];
        // 中心顶点 uv
        uvs.push(0.5, 0.5);
        for (let s = 0; s <= segmentsValue; s++)
        {
            const segment = thetaStartValue + s / segmentsValue * thetaLengthValue;
            const x = radiusValue * Math.cos(segment);
            const y = radiusValue * Math.sin(segment);
            uvs.push((x / radiusValue + 1) / 2, (y / radiusValue + 1) / 2);
        }

        return new Float32Array(uvs);
    }

    function buildIndices(): number[]
    {
        const segmentsValue = Math.max(3, segments());
        const indices: number[] = [];
        for (let i = 1; i <= segmentsValue; i++)
        {
            indices.push(i, i + 1, 0); // CCW（从 +Z 看）
        }

        return indices;
    }

    // 每个属性独立 computed，仅在实际被读取时计算
    const _positions = computed(() => buildPositions());
    const _normals = computed(() => buildNormals());
    const _uvs = computed(() => buildUVs());
    const _indicesComputed = computed(() => buildIndices());
    const _colors = computed(() =>
    {
        const pos = _positions.value;
        if (pos.length === 0) return new Float32Array(0);
        const count = pos.length / 3;

        return new Float32Array(count * 4).fill(1);
    });
    const _tangents = computed(() =>
    {
        const positions = Array.from(_positions.value);
        const uvs = Array.from(_uvs.value);

        return new Float32Array(geometryUtils.createVertexTangents(_indicesComputed.value, positions, uvs, true));
    });

    const logic = setupGeometryLogicState(Object.create(circleGeometryLogicProto) as CircleGeometryLogic & CircleGeometryLogicState, data);
    // attributes: data 由 computed getter 驱动
    logic._attrTable = {
        a_position: computedAttr(_positions, 'float32x3'),
        a_color: computedAttr(_colors, 'float32x4'),
        a_uv: computedAttr(_uvs, 'float32x2'),
        a_normal: computedAttr(_normals, 'float32x3'),
        a_tangent: computedAttr(_tangents, 'float32x3'),
    };
    logic._indicesComputed = _indicesComputed;

    return logic;
}
registerLogic('CircleGeometry', circleGeometryLogic);