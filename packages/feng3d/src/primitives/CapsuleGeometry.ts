import { computedAttr, createGeometryLogicState, Geometry, geometryBeforeRender, geometryBounding, geometryRaycast, GeometryLogic } from '../geometry/Geometry';
import { registerLogic, reactive, computed } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        CapsuleGeometry: CapsuleGeometryLogic;
    }
}

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

// CapsuleGeometry 默认值由 CapsuleGeometryLogic 内参数访问器处理（见下）

/**
 * CapsuleGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 radius/height/segmentsW/segmentsH/yUp。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 */
export interface CapsuleGeometryLogic extends GeometryLogic
{
}


/**
 * 工厂函数：CapsuleGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function capsuleGeometryLogic(data: CapsuleGeometry): CapsuleGeometryLogic
{
    // 响应式参数（不修改原始数据，缺失字段通过 ?? 提供默认值）
    const radius = (): number => reactive(data).radius ?? 0.5;
    const height = (): number => reactive(data).height ?? 1;
    const segmentsW = (): number => reactive(data).segmentsW ?? 16;
    const segmentsH = (): number => reactive(data).segmentsH ?? 15;
    const yUp = (): boolean => reactive(data).yUp ?? true;

    // 每个属性独立 computed，仅在实际被读取时计算
    const positions = computed(() => buildPositions());
    const normals = computed(() => buildNormals());
    const tangents = computed(() => buildTangents());
    const uvs = computed(() => buildUVs());
    const colors = computed(() =>
    {
        const pos = positions.value;
        if (pos.length === 0) return new Float32Array(0);
        const count = pos.length / 3;

        return new Float32Array(count * 4).fill(1);
    });
    const indicesComputed = computed(() => buildIndices());

    // attributes: data 由 computed getter 驱动
    const attrTable: VertexAttributes = {
        a_position: computedAttr(positions, 'float32x3'),
        a_color: computedAttr(colors, 'float32x4'),
        a_uv: computedAttr(uvs, 'float32x2'),
        a_normal: computedAttr(normals, 'float32x3'),
        a_tangent: computedAttr(tangents, 'float32x3'),
    };
    const state = createGeometryLogicState(() => attrTable, () => indicesComputed.value, data);

    const logic: CapsuleGeometryLogic = {
        get vertices() { return attrTable; },
        get vertexIndices() { return indicesComputed.value; },
        get indices() { return state.indices.value; },
        get draw() { return state.draw.value; },
        get bounding() { return geometryBounding(logic); },
        raycast(ray, shortestCollisionDistance, cullFace) { return geometryRaycast(logic, ray, shortestCollisionDistance, cullFace); },
        beforeRender(renderObject) { geometryBeforeRender(logic, renderObject); },
    };

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
                const offset = yi > segmentsH() / 2 ? height() / 2 : -height() / 2;

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
                    data[index + 1] = yUp() ? comp1 - offset : comp1;
                    data[index + 2] = yUp() ? comp2 : comp2 + offset;
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
                // 绕序须与顶点法线一致（正面朝外）。原写法 a,d,c / a,c,b 与 SphereGeometry
                // 修复前完全相同，正面被管线 cullFace:'back' 剔除，胶囊体完全不可见。
                if (yi === segmentsH()) { indices[n++] = a; indices[n++] = c; indices[n++] = d; }
                else if (yi === 1) { indices[n++] = a; indices[n++] = b; indices[n++] = c; }
                else
                {
                    indices[n++] = a; indices[n++] = b; indices[n++] = c;
                    indices[n++] = a; indices[n++] = c; indices[n++] = d;
                }
            }
        }

        return indices;
    }

    return logic;
}
registerLogic('CapsuleGeometry', capsuleGeometryLogic);