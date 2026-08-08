import { Geometry, geometryLogic, GeometryLogic } from '../geometry/Geometry';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SphereGeometry: GeometryLogic;
    }
}

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        SphereGeometry: SphereGeometry;
    }
}

/**
 * 球体几何体（纯数据接口）。
 */
export interface SphereGeometry extends Geometry
{
    readonly __type__: 'SphereGeometry';
    /** 球体半径（缺失时由工厂填充默认值） */
    readonly radius?: number;
    /** 横向分割数（缺失时由工厂填充默认值） */
    readonly segmentsW?: number;
    /** 纵向分割数（缺失时由工厂填充默认值） */
    readonly segmentsH?: number;
    /** 是否朝上（缺失时由工厂填充默认值） */
    readonly yUp?: boolean;
}

// SphereGeometry 默认值由 sphereGeometryLogic 工厂顶部处理（见下）

/**
 * 创建 SphereGeometryLogic 实例（函数式实现）。
 *
 * 组合 {@link geometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 radius/segmentsW/segmentsH/yUp。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 */
export function sphereGeometryLogic(geometry: SphereGeometry): GeometryLogic
{
    // 组合基座
    const base = geometryLogic(geometry);

    // 响应式参数（不修改原始数据，缺失字段通过 ?? 提供默认值）
    const r_geometry = reactive(geometry);
    const radius = () => r_geometry.radius ?? 0.5;
    const segmentsW = () => r_geometry.segmentsW ?? 16;
    const segmentsH = () => r_geometry.segmentsH ?? 12;
    const yUp = () => r_geometry.yUp ?? true;

    // 每个属性独立 computed，仅在实际被读取时计算
    const _positions = computed(() => buildPositions());
    const _normals = computed(() => buildNormals());
    const _tangents = computed(() => buildTangents());
    const _uvs = computed(() => buildUVs());
    const _colors = computed(() =>
    {
        const pos = _positions.value;
        if (pos.length === 0) return new Float32Array(0);
        const count = pos.length / 3;

        return new Float32Array(count * 4).fill(1);
    });
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
            a_color: computedAttr(_colors, 'float32x4'),
            a_uv: computedAttr(_uvs, 'float32x2'),
            a_normal: computedAttr(_normals, 'float32x3'),
            a_tangent: computedAttr(_tangents, 'float32x3'),
        };
    }

    // ---- 顶点构建（直接返回 Float32Array，内部 reactive 建立依赖） ----

    function buildPositions(): Float32Array
    {
        
        const data: number[] = [];

        let startIndex: number; let index = 0;
        let comp1: number; let comp2: number;
        for (let yi = 0; yi <= segmentsH(); ++yi)
        {
            startIndex = index;
            const horangle = Math.PI * yi / segmentsH();
            const z = -radius() * Math.cos(horangle);
            const ringradius = radius() * Math.sin(horangle);

            for (let xi = 0; xi <= segmentsW(); ++xi)
            {
                const verangle = 2 * Math.PI * xi / segmentsW();
                const x = ringradius * Math.cos(verangle);
                const y = ringradius * Math.sin(verangle);

                if (yUp()) { comp1 = -z; comp2 = y; }
                else { comp1 = y; comp2 = z; }

                if (xi === segmentsW())
                {
                    data[index] = data[startIndex];
                    data[index + 1] = data[startIndex + 1];
                    data[index + 2] = data[startIndex + 2];
                }
                else
                {
                    data[index] = x;
                    data[index + 1] = comp1;
                    data[index + 2] = comp2;
                }

                if (xi > 0 && yi > 0)
                {
                    if (yi === segmentsH())
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
        
        const data: number[] = [];

        let startIndex: number; let index = 0;
        let comp1: number; let comp2: number;
        for (let yi = 0; yi <= segmentsH(); ++yi)
        {
            startIndex = index;
            const horangle = Math.PI * yi / segmentsH();
            const z = -radius() * Math.cos(horangle);
            const ringradius = radius() * Math.sin(horangle);

            for (let xi = 0; xi <= segmentsW(); ++xi)
            {
                const verangle = 2 * Math.PI * xi / segmentsW();
                const x = ringradius * Math.cos(verangle);
                const y = ringradius * Math.sin(verangle);
                const normLen = 1 / Math.sqrt(x * x + y * y + z * z);

                if (yUp()) { comp1 = -z; comp2 = y; }
                else { comp1 = y; comp2 = z; }

                if (xi === segmentsW())
                {
                    data[index] = data[startIndex] + x * normLen * 0.5;
                    data[index + 1] = data[startIndex + 1] + comp1 * normLen * 0.5;
                    data[index + 2] = data[startIndex + 2] + comp2 * normLen * 0.5;
                }
                else
                {
                    data[index] = x * normLen;
                    data[index + 1] = comp1 * normLen;
                    data[index + 2] = comp2 * normLen;
                }

                if (xi > 0 && yi > 0)
                {
                    if (yi === segmentsH())
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
        
        const data: number[] = [];

        let startIndex: number; let index = 0;
        let t1: number; let t2: number;
        for (let yi = 0; yi <= segmentsH(); ++yi)
        {
            startIndex = index;
            const horangle = Math.PI * yi / segmentsH();
            const z = -radius() * Math.cos(horangle);
            const ringradius = radius() * Math.sin(horangle);

            for (let xi = 0; xi <= segmentsW(); ++xi)
            {
                const verangle = 2 * Math.PI * xi / segmentsW();
                const x = ringradius * Math.cos(verangle);
                const y = ringradius * Math.sin(verangle);
                const tanLen = Math.sqrt(y * y + x * x);

                if (yUp()) { t1 = 0; t2 = tanLen > 0.007 ? x / tanLen : 0; }
                else { t1 = tanLen > 0.007 ? x / tanLen : 0; t2 = 0; }

                if (xi === segmentsW())
                {
                    data[index] = tanLen > 0.007 ? -y / tanLen : 1;
                    data[index + 1] = t1;
                    data[index + 2] = t2;
                }
                else
                {
                    data[index] = tanLen > 0.007 ? -y / tanLen : 1;
                    data[index + 1] = t1;
                    data[index + 2] = t2;
                }

                if (xi > 0 && yi > 0)
                {
                    if (yi === segmentsH())
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
        
        const data: number[] = [];
        let index = 0;
        for (let yi = 0; yi <= segmentsH(); ++yi) for (let xi = 0; xi <= segmentsW(); ++xi)
        {
            data[index++] = xi / segmentsW();
            data[index++] = yi / segmentsH();
        }

        return new Float32Array(data);
    }

    function buildIndices(): number[]
    {
        
        const indices: number[] = [];
        let n = 0;
        for (let yi = 0; yi <= segmentsH(); ++yi) for (let xi = 0; xi <= segmentsW(); ++xi)
        {
            if (xi > 0 && yi > 0)
            {
                const a = (segmentsW() + 1) * yi + xi;
                const b = (segmentsW() + 1) * yi + xi - 1;
                const c = (segmentsW() + 1) * (yi - 1) + xi - 1;
                const d = (segmentsW() + 1) * (yi - 1) + xi;
                if (yi === segmentsH()) { indices[n++] = a; indices[n++] = d; indices[n++] = c; }
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

registerLogic('SphereGeometry', sphereGeometryLogic);
