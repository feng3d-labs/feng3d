import { Geometry, geometryLogic, GeometryLogic, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        CapsuleGeometry: CapsuleGeometry;
    }
}

/**
 * 胶囊体几何体（纯数据接口）。
 */
export interface CapsuleGeometry extends Geometry
{
    readonly __type__: 'CapsuleGeometry';
    /** 胶囊体半径（缺失时由工厂填充默认值） */
    readonly radius?: number;
    /** 胶囊体高度（缺失时由工厂填充默认值） */
    readonly height?: number;
    /** 横向分割数（缺失时由工厂填充默认值） */
    readonly segmentsW?: number;
    /** 纵向分割数（缺失时由工厂填充默认值） */
    readonly segmentsH?: number;
    /** 是否朝上（缺失时由工厂填充默认值） */
    readonly yUp?: boolean;
}

// CapsuleGeometry 默认值由 capsuleGeometryLogic 工厂顶部处理（见下）

/**
 * 创建 CapsuleGeometryLogic 实例（函数式实现）。
 *
 * 组合 {@link geometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 radius/height/segmentsW/segmentsH/yUp。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 */
export function capsuleGeometryLogic(geometry: CapsuleGeometry): GeometryLogic
{
    // 组合基座
    const base = geometryLogic(geometry);

    // 默认值（缺失字段单独赋值）
    const writable = geometry as UnReadonly<CapsuleGeometry>;
    if (geometry.name === undefined) writable.name = 'Capsule';
    if (geometry.scaleU === undefined) writable.scaleU = 1;
    if (geometry.scaleV === undefined) writable.scaleV = 1;
    if (geometry.radius === undefined) writable.radius = 0.5;
    if (geometry.height === undefined) writable.height = 1;
    if (geometry.segmentsW === undefined) writable.segmentsW = 16;
    if (geometry.segmentsH === undefined) writable.segmentsH = 15;
    if (geometry.yUp === undefined) writable.yUp = true;

    // 每个属性独立 computed，仅在实际被读取时计算
    const _positions = computed(() => buildPositions());
    const _normals = computed(() => buildNormals());
    const _tangents = computed(() => buildTangents());
    const _uvs = computed(() => buildUVs());
    const _indicesComputed = computed(() => buildIndices());

    // attributes: data 由 computed getter 驱动
    const _attrTable = createAttributes();
    Object.defineProperty(base, 'vertices', { get() { return _attrTable; }, enumerable: true, configurable: true });

    // indices 由 computed 驱动（覆盖基类 getter）
    Object.defineProperty(base, 'vertexIndices', { get() { return _indicesComputed.value; }, enumerable: true, configurable: true });

    function createAttributes(): Record<string, VertexAttribute>
    {
        const computedAttr = (ref: Computed<Float32Array>, format: VertexAttribute['format']): VertexAttribute =>
        {
            const obj: VertexAttribute = { data: new Float32Array(), format };
            Object.defineProperty(obj, 'data', { get() { return ref.value; }, enumerable: true });

            return obj;
        };

        return {
            a_position: computedAttr(_positions, 'float32x3'),
            a_uv: computedAttr(_uvs, 'float32x2'),
            a_normal: computedAttr(_normals, 'float32x3'),
            a_tangent: computedAttr(_tangents, 'float32x3'),
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }

    // ---- 顶点构建（直接返回 Float32Array，内部 reactive 建立依赖） ----

    function buildPositions(): Float32Array
    {
        const g = reactive(geometry);
        const data: number[] = [];

        let startIndex: number; let index = 0;
        let comp1: number; let comp2: number;
        for (let yi = 0; yi <= g.segmentsH; ++yi)
        {
            startIndex = index;
            const horangle = Math.PI * yi / g.segmentsH;
            const z = -g.radius * Math.cos(horangle);
            const ringradius = g.radius * Math.sin(horangle);

            for (let xi = 0; xi <= g.segmentsW; ++xi)
            {
                const verangle = 2 * Math.PI * xi / g.segmentsW;
                const x = ringradius * Math.cos(verangle);
                const y = ringradius * Math.sin(verangle);
                const offset = yi > g.segmentsH / 2 ? g.height / 2 : -g.height / 2;

                if (g.yUp) { comp1 = -z; comp2 = y; }
                else { comp1 = y; comp2 = z; }

                if (xi === g.segmentsW)
                {
                    data[index] = data[startIndex];
                    data[index + 1] = data[startIndex + 1];
                    data[index + 2] = data[startIndex + 2];
                }
                else
                {
                    data[index] = x;
                    data[index + 1] = g.yUp ? comp1 - offset : comp1;
                    data[index + 2] = g.yUp ? comp2 : comp2 + offset;
                }

                if (xi > 0 && yi > 0)
                {
                    if (yi === g.segmentsH)
                    {
                        data[index] = data[startIndex];
                        data[index + 1] = data[startIndex + 1];
                        data[index + 2] = data[startIndex + 2];
                    }
                }

                index += 3;
            }
        }

        return new Float32Array(data);
    }

    function buildNormals(): Float32Array
    {
        const g = reactive(geometry);
        const data: number[] = [];

        let startIndex: number; let index = 0;
        let comp1: number; let comp2: number;
        for (let yi = 0; yi <= g.segmentsH; ++yi)
        {
            startIndex = index;
            const horangle = Math.PI * yi / g.segmentsH;
            const z = -g.radius * Math.cos(horangle);
            const ringradius = g.radius * Math.sin(horangle);

            for (let xi = 0; xi <= g.segmentsW; ++xi)
            {
                const verangle = 2 * Math.PI * xi / g.segmentsW;
                const x = ringradius * Math.cos(verangle);
                const y = ringradius * Math.sin(verangle);
                const normLen = 1 / Math.sqrt(x * x + y * y + z * z);

                if (g.yUp) { comp1 = -z; comp2 = y; }
                else { comp1 = y; comp2 = z; }

                if (xi === g.segmentsW)
                {
                    data[index] = (data[startIndex] + x * normLen) * 0.5;
                    data[index + 1] = (data[startIndex + 1] + comp1 * normLen) * 0.5;
                    data[index + 2] = (data[startIndex + 2] + comp2 * normLen) * 0.5;
                }
                else
                {
                    data[index] = x * normLen;
                    data[index + 1] = comp1 * normLen;
                    data[index + 2] = comp2 * normLen;
                }

                if (xi > 0 && yi > 0)
                {
                    if (yi === g.segmentsH)
                    {
                        data[index] = data[startIndex];
                        data[index + 1] = data[startIndex + 1];
                        data[index + 2] = data[startIndex + 2];
                    }
                }

                index += 3;
            }
        }

        return new Float32Array(data);
    }

    function buildTangents(): Float32Array
    {
        const g = reactive(geometry);
        const data: number[] = [];

        let startIndex: number; let index = 0;
        let t1: number; let t2: number;
        for (let yi = 0; yi <= g.segmentsH; ++yi)
        {
            startIndex = index;
            const horangle = Math.PI * yi / g.segmentsH;
            const z = -g.radius * Math.cos(horangle);
            const ringradius = g.radius * Math.sin(horangle);

            for (let xi = 0; xi <= g.segmentsW; ++xi)
            {
                const verangle = 2 * Math.PI * xi / g.segmentsW;
                const x = ringradius * Math.cos(verangle);
                const y = ringradius * Math.sin(verangle);
                const tanLen = Math.sqrt(y * y + x * x);

                if (g.yUp) { t1 = 0; t2 = tanLen > 0.007 ? x / tanLen : 0; }
                else { t1 = tanLen > 0.007 ? x / tanLen : 0; t2 = 0; }

                if (xi === g.segmentsW)
                {
                    data[index] = (data[startIndex] + tanLen > 0.007 ? -y / tanLen : 1) * 0.5;
                    data[index + 1] = (data[startIndex + 1] + t1) * 0.5;
                    data[index + 2] = (data[startIndex + 2] + t2) * 0.5;
                }
                else
                {
                    data[index] = tanLen > 0.007 ? -y / tanLen : 1;
                    data[index + 1] = t1;
                    data[index + 2] = t2;
                }

                if (xi > 0 && yi > 0)
                {
                    if (yi === g.segmentsH)
                    {
                        data[index] = data[startIndex];
                        data[index + 1] = data[startIndex + 1];
                        data[index + 2] = data[startIndex + 2];
                    }
                }

                index += 3;
            }
        }

        return new Float32Array(data);
    }

    function buildUVs(): Float32Array
    {
        const g = reactive(geometry);
        const data: number[] = [];
        let index = 0;
        for (let yi = 0; yi <= g.segmentsH; ++yi) for (let xi = 0; xi <= g.segmentsW; ++xi)
        {
            data[index++] = xi / g.segmentsW;
            data[index++] = yi / g.segmentsH;
        }

        return new Float32Array(data);
    }

    function buildIndices(): number[]
    {
        const g = reactive(geometry);
        const indices: number[] = [];
        let n = 0;
        for (let yi = 0; yi <= g.segmentsH; ++yi) for (let xi = 0; xi <= g.segmentsW; ++xi)
        {
            if (xi > 0 && yi > 0)
            {
                const a = (g.segmentsW + 1) * yi + xi;
                const b = (g.segmentsW + 1) * yi + xi - 1;
                const c = (g.segmentsW + 1) * (yi - 1) + xi - 1;
                const d = (g.segmentsW + 1) * (yi - 1) + xi;
                if (yi === g.segmentsH) { indices[n++] = a; indices[n++] = d; indices[n++] = c; }
                else if (yi === 1) { indices[n++] = a; indices[n++] = c; indices[n++] = b; }
                else
                {
                    indices[n++] = a; indices[n++] = c; indices[n++] = b;
                    indices[n++] = a; indices[n++] = d; indices[n++] = c;
                }
            }
        }

        return indices;
    }

    return base;
}

registerLogic('CapsuleGeometry', capsuleGeometryLogic);
registerDefaultGeometryFactory('Capsule', () => ({ __type__: 'CapsuleGeometry' } as CapsuleGeometry));
