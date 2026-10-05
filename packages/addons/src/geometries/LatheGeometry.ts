import { Vector2 } from '@feng3d/math';
import { Geometry, GeometryLogic, computedAttr, geometryLogicProto, setupGeometryLogicState, type GeometryLogicState } from 'feng3d';
import { registerLogic, reactive, computed, UnReadonly, createLogicProto, type Computed } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        LatheGeometry: LatheGeometryLogic;
    }
}

declare module 'feng3d'
{
    export interface GeometryMap
    {
        LatheGeometry: LatheGeometry;
    }
}

/**
 * 旋转体几何体（纯数据接口）。
 *
 * 由 2D 轮廓线（points）绕 Y 轴旋转生成。移植自 three.js LatheGeometry。
 * points 通过运行时隐藏字段 __points 传递（无法序列化）。
 */
export interface LatheGeometry extends Geometry
{
    readonly __type__: 'LatheGeometry';
    /** 旋转分段数，默认 12 */
    readonly segments: number;
    /** 起始角（弧度），默认 0 */
    readonly phiStart: number;
    /** 扫掠角（弧度），默认 2π */
    readonly phiLength: number;
}

/**
 * 运行时隐藏字段类型（points 无法序列化但运行时需要）。
 */
type LatheGeometryRuntime = LatheGeometry & {
    __points: Vector2[];
};

/**
 * LatheGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 segments/phiStart/phiLength 与运行时隐藏字段 __points。
 */
export interface LatheGeometryLogic extends GeometryLogic
{
}

/** LatheGeometryLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface LatheGeometryLogicState extends GeometryLogicState
{
    _attrTable: VertexAttributes;
    _indicesComputed: Computed<number[]>;
}

/** LatheGeometryLogic 的共享原型：继承 Geometry 基类实现，覆写 vertices / vertexIndices */
const latheGeometryLogicProto = createLogicProto<LatheGeometryLogic>(geometryLogicProto, {
    vertices: {
        get: function (this: LatheGeometryLogic & LatheGeometryLogicState): VertexAttributes { return this._attrTable; },
    },
    /** indices 由 computed 驱动（覆写基类 getter） */
    vertexIndices: {
        get: function (this: LatheGeometryLogic & LatheGeometryLogicState): number[] { return this._indicesComputed.value; },
    },
});

/**
 * 工厂函数：LatheGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function latheGeometryLogic(data: LatheGeometry): LatheGeometryLogic
{
    // 默认值填充（工厂内完成，创建完成即已填充）
    const writable = data as UnReadonly<LatheGeometry>;
    if (data.name === undefined) writable.name = 'Lathe';
    if (data.scaleU === undefined) writable.scaleU = 1;
    if (data.scaleV === undefined) writable.scaleV = 1;
    if (data.segments === undefined) writable.segments = 12;
    if (data.phiStart === undefined) writable.phiStart = 0;
    if (data.phiLength === undefined) writable.phiLength = Math.PI * 2;

    // 响应式参数访问器（默认值已填充，直接读取；__points 为运行时隐藏字段）
    const points = (): Vector2[] => reactive(data as unknown as LatheGeometryRuntime).__points;
    const segments = (): number => reactive(data).segments;
    const phiStart = (): number => reactive(data).phiStart;
    const phiLength = (): number => reactive(data).phiLength;

    function buildPositions(): Float32Array
    {
        const pointsValue = points();
        const segmentsValue = Math.floor(segments());
        const phiStartValue = phiStart();
        const phiLengthValue = phiLength();
        if (!pointsValue || pointsValue.length === 0) return new Float32Array(0);

        const positions: number[] = [];
        const inverseSegments = 1 / segmentsValue;
        for (let i = 0; i <= segmentsValue; i++)
        {
            const phi = phiStartValue + i * inverseSegments * phiLengthValue;
            const sin = Math.sin(phi);
            const cos = Math.cos(phi);
            for (let j = 0; j <= pointsValue.length - 1; j++)
            {
                positions.push(pointsValue[j].x * sin, pointsValue[j].y, pointsValue[j].x * cos);
            }
        }

        return new Float32Array(positions);
    }

    function buildNormals(): Float32Array
    {
        const pointsValue = points();
        const segmentsValue = Math.floor(segments());
        const phiStartValue = phiStart();
        const phiLengthValue = phiLength();
        if (!pointsValue || pointsValue.length === 0) return new Float32Array(0);

        // 预计算 2D 轮廓线每个点的法线（在 XY 平面，垂直于切线）
        const initNormals: number[] = [];
        const pointCount = pointsValue.length;
        let prevNormal = { x: 0, y: 0 };
        for (let j = 0; j < pointCount; j++)
        {
            let dx: number; let dy: number;
            if (j === 0)
            {
                dx = pointsValue[j + 1].x - pointsValue[j].x;
                dy = pointsValue[j + 1].y - pointsValue[j].y;
            }
            else if (j === pointCount - 1)
            {
                // 用前一个法线
                initNormals.push(prevNormal.x, prevNormal.y);
                continue;
            }
            else
            {
                dx = pointsValue[j + 1].x - pointsValue[j].x;
                dy = pointsValue[j + 1].y - pointsValue[j].y;
            }
            const normal = { x: dy, y: -dx };
            if (j > 0)
            {
                normal.x += prevNormal.x;
                normal.y += prevNormal.y;
            }
            prevNormal = normal;
            initNormals.push(normal.x, normal.y);
        }
        // 归一化并对第一个点也做处理（three.js 的算法在 j=0 时不归一化，但实际效果上需归一化）
        for (let j = 0; j < pointCount; j++)
        {
            const nx = initNormals[j * 2];
            const ny = initNormals[j * 2 + 1];
            const len = Math.sqrt(nx * nx + ny * ny);
            if (len > 1e-6)
            {
                initNormals[j * 2] = nx / len;
                initNormals[j * 2 + 1] = ny / len;
            }
        }

        const normals: number[] = [];
        const inverseSegments = 1 / segmentsValue;
        for (let i = 0; i <= segmentsValue; i++)
        {
            const phi = phiStartValue + i * inverseSegments * phiLengthValue;
            const sin = Math.sin(phi);
            const cos = Math.cos(phi);
            for (let j = 0; j <= pointCount - 1; j++)
            {
                const nx = initNormals[j * 2] * sin;
                const ny = initNormals[j * 2 + 1];
                const nz = initNormals[j * 2] * cos;
                normals.push(nx, ny, nz);
            }
        }

        return new Float32Array(normals);
    }

    function buildUVs(): Float32Array
    {
        const pointsValue = points();
        const segmentsValue = Math.floor(segments());
        if (!pointsValue || pointsValue.length === 0) return new Float32Array(0);

        const uvs: number[] = [];
        for (let i = 0; i <= segmentsValue; i++)
        {
            for (let j = 0; j <= pointsValue.length - 1; j++)
            {
                uvs.push(i / segmentsValue, j / (pointsValue.length - 1));
            }
        }

        return new Float32Array(uvs);
    }

    function buildIndices(): number[]
    {
        const pointsValue = points();
        const segmentsValue = Math.floor(segments());
        if (!pointsValue || pointsValue.length === 0) return [];

        const indices: number[] = [];
        const pointCount = pointsValue.length;
        for (let i = 0; i < segmentsValue; i++)
        {
            for (let j = 0; j < pointCount - 1; j++)
            {
                const baseIdx = j + i * pointCount;
                const a = baseIdx;
                const b = baseIdx + pointCount;
                const c = baseIdx + pointCount + 1;
                const d = baseIdx + 1;
                indices.push(a, b, d);
                indices.push(c, d, b); // three.js 原始顺序（注意与 Ring 反向）
            }
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
    const _tangents = computed(() => new Float32Array(_positions.value.length / 3 * 3));

    const logic = setupGeometryLogicState(Object.create(latheGeometryLogicProto) as LatheGeometryLogic & LatheGeometryLogicState, data);
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
registerLogic('LatheGeometry', latheGeometryLogic);