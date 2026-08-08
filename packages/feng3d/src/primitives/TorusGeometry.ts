import { Geometry, geometryLogic, GeometryLogic } from '../geometry/Geometry';
import { registerLogic, reactive, computed, Computed } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        TorusGeometry: GeometryLogic;
    }
}

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        TorusGeometry: TorusGeometry;
    }
}

/**
 * 圆环几何体（纯数据接口）。
 */
export interface TorusGeometry extends Geometry
{
    readonly __type__: 'TorusGeometry';
    /** 半径（缺失时由工厂填充默认值） */
    readonly radius?: number;
    /** 管道半径（缺失时由工厂填充默认值） */
    readonly tubeRadius?: number;
    /** 半径方向分割数（缺失时由工厂填充默认值） */
    readonly segmentsR?: number;
    /** 管道方向分割数（缺失时由工厂填充默认值） */
    readonly segmentsT?: number;
    /** 是否朝上（缺失时由工厂填充默认值） */
    readonly yUp?: boolean;
}

// TorusGeometry 默认值由 torusGeometryLogic 工厂顶部处理（见下）

/**
 * 创建 TorusGeometryLogic 实例（函数式实现）。
 *
 * 组合 {@link geometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 radius/tubeRadius/segmentsR/segmentsT/yUp。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 */
export function torusGeometryLogic(geometry: TorusGeometry): GeometryLogic
{
    // 组合基座
    const base = geometryLogic(geometry);

    // 响应式参数（不修改原始数据，缺失字段通过 ?? 提供默认值）
    const r_geometry = reactive(geometry);
    const radius = () => r_geometry.radius ?? 0.5;
    const tubeRadius = () => r_geometry.tubeRadius ?? 0.1;
    const segmentsR = () => r_geometry.segmentsR ?? 16;
    const segmentsT = () => r_geometry.segmentsT ?? 8;
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

    // ---- 顶点构建（直接返回 Float32Array/number[]，内部 reactive 建立依赖） ----

    function buildPositions(): Float32Array
    {
        
        let i: number; let j: number;
        let x: number; let y: number; let z: number;
        let nx: number; let ny: number; let nz: number;
        let revolutionAngleR: number; let revolutionAngleT: number;
        const vertexPositionStride = 3;
        const numVertices = (segmentsT() + 1) * (segmentsR() + 1);
        const vertexPositionData: number[] = new Array(numVertices * vertexPositionStride);

        const revolutionAngleDeltaR = 2 * Math.PI / segmentsR();
        const revolutionAngleDeltaT = 2 * Math.PI / segmentsT();

        let startPositionIndex: number; let length: number;
        let comp1: number; let comp2: number;

        for (j = 0; j <= segmentsT(); ++j)
        {
            startPositionIndex = j * (segmentsR() + 1) * vertexPositionStride;
            for (i = 0; i <= segmentsR(); ++i)
            {
                const vertexIndex = j * (segmentsR() + 1) + i;
                revolutionAngleR = i * revolutionAngleDeltaR;
                revolutionAngleT = j * revolutionAngleDeltaT;
                length = Math.cos(revolutionAngleT);
                nx = length * Math.cos(revolutionAngleR);
                ny = length * Math.sin(revolutionAngleR);
                nz = Math.sin(revolutionAngleT);
                x = radius() * Math.cos(revolutionAngleR) + tubeRadius() * nx;
                y = radius() * Math.sin(revolutionAngleR) + tubeRadius() * ny;
                z = (j === segmentsT()) ? 0 : tubeRadius() * nz;
                if (yUp())
                {
                    comp1 = -z; comp2 = y;
                }
                else
                {
                    comp1 = y; comp2 = z;
                }
                if (i === segmentsR())
                {
                    vertexPositionData[vertexIndex * vertexPositionStride] = x;
                    vertexPositionData[vertexIndex * vertexPositionStride + 1] = vertexPositionData[startPositionIndex + 1];
                    vertexPositionData[vertexIndex * vertexPositionStride + 2] = vertexPositionData[startPositionIndex + 2];
                }
                else
                {
                    vertexPositionData[vertexIndex * vertexPositionStride] = x;
                    vertexPositionData[vertexIndex * vertexPositionStride + 1] = comp1;
                    vertexPositionData[vertexIndex * vertexPositionStride + 2] = comp2;
                }
            }
        }

        return new Float32Array(vertexPositionData);
    }

    function buildNormals(): Float32Array
    {
        
        let i: number; let j: number;
        let nx: number; let ny: number; let nz: number;
        let revolutionAngleR: number; let revolutionAngleT: number;
        const vertexPositionStride = 3;
        const numVertices = (segmentsT() + 1) * (segmentsR() + 1);
        const vertexNormalData: number[] = new Array(numVertices * vertexPositionStride);

        const revolutionAngleDeltaR = 2 * Math.PI / segmentsR();
        const revolutionAngleDeltaT = 2 * Math.PI / segmentsT();

        let length: number; let n1: number; let n2: number;

        for (j = 0; j <= segmentsT(); ++j)
        {
            for (i = 0; i <= segmentsR(); ++i)
            {
                const vertexIndex = j * (segmentsR() + 1) + i;
                revolutionAngleR = i * revolutionAngleDeltaR;
                revolutionAngleT = j * revolutionAngleDeltaT;
                length = Math.cos(revolutionAngleT);
                nx = length * Math.cos(revolutionAngleR);
                ny = length * Math.sin(revolutionAngleR);
                nz = Math.sin(revolutionAngleT);
                if (yUp())
                {
                    n1 = -nz; n2 = ny;
                }
                else
                {
                    n1 = ny; n2 = nz;
                }
                vertexNormalData[vertexIndex * vertexPositionStride] = nx;
                vertexNormalData[vertexIndex * vertexPositionStride + 1] = n1;
                vertexNormalData[vertexIndex * vertexPositionStride + 2] = n2;
            }
        }

        return new Float32Array(vertexNormalData);
    }

    function buildTangents(): Float32Array
    {
        
        let i: number; let j: number;
        let nx: number; let ny: number;
        let x: number; let y: number;
        let revolutionAngleR: number; let revolutionAngleT: number;
        const vertexPositionStride = 3;
        const numVertices = (segmentsT() + 1) * (segmentsR() + 1);
        const vertexTangentData: number[] = new Array(numVertices * vertexPositionStride);

        const revolutionAngleDeltaR = 2 * Math.PI / segmentsR();
        const revolutionAngleDeltaT = 2 * Math.PI / segmentsT();

        let length: number; let t1: number; let t2: number;

        for (j = 0; j <= segmentsT(); ++j)
        {
            for (i = 0; i <= segmentsR(); ++i)
            {
                const vertexIndex = j * (segmentsR() + 1) + i;
                revolutionAngleR = i * revolutionAngleDeltaR;
                revolutionAngleT = j * revolutionAngleDeltaT;
                length = Math.cos(revolutionAngleT);
                nx = length * Math.cos(revolutionAngleR);
                ny = length * Math.sin(revolutionAngleR);
                x = radius() * Math.cos(revolutionAngleR) + tubeRadius() * nx;
                y = radius() * Math.sin(revolutionAngleR) + tubeRadius() * ny;
                if (yUp())
                {
                    t1 = 0;
                    t2 = (length ? nx / length : x / radius());
                }
                else
                {
                    t1 = (length ? nx / length : x / radius());
                    t2 = 0;
                }
                vertexTangentData[vertexIndex * vertexPositionStride] = -(length ? ny / length : y / radius());
                vertexTangentData[vertexIndex * vertexPositionStride + 1] = t1;
                vertexTangentData[vertexIndex * vertexPositionStride + 2] = t2;
            }
        }

        return new Float32Array(vertexTangentData);
    }

    function buildUVs(): Float32Array
    {
        
        let i: number; let j: number;
        const stride = 2;
        const numVertices = (segmentsT() + 1) * (segmentsR() + 1);
        const data: number[] = new Array(numVertices * stride);
        let index = 0;
        for (j = 0; j <= segmentsT(); ++j) for (i = 0; i <= segmentsR(); ++i)
        {
            index = j * (segmentsR() + 1) + i;
            data[index * stride] = i / segmentsR();
            data[index * stride + 1] = j / segmentsT();
        }

        return new Float32Array(data);
    }

    function buildIndices(): number[]
    {
        
        let i: number; let j: number;
        const rawIndices: number[] = [];
        let currentTriangleIndex = 0;
        let a: number; let b: number; let c: number; let d: number;

        for (j = 0; j <= segmentsT(); ++j)
        {
            for (i = 0; i <= segmentsR(); ++i)
            {
                const vertexIndex = j * (segmentsR() + 1) + i;
                if (i > 0 && j > 0)
                {
                    a = vertexIndex; b = vertexIndex - 1;
                    c = b - segmentsR() - 1; d = a - segmentsR() - 1;
                    rawIndices[currentTriangleIndex * 3] = a;
                    rawIndices[currentTriangleIndex * 3 + 1] = c;
                    rawIndices[currentTriangleIndex * 3 + 2] = b;
                    currentTriangleIndex++;
                    rawIndices[currentTriangleIndex * 3] = a;
                    rawIndices[currentTriangleIndex * 3 + 1] = d;
                    rawIndices[currentTriangleIndex * 3 + 2] = c;
                    currentTriangleIndex++;
                }
            }
        }

        return rawIndices;
    }

    return base;
}

registerLogic('TorusGeometry', torusGeometryLogic);
