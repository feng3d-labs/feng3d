import { validateFieldTypes } from '../core/Validate';
import { computedAttr, createGeometryLogicState, Geometry, geometryBeforeRender, geometryBounding, geometryRaycast, GeometryLogic } from '../geometry/Geometry';
import { registerLogic, reactive, computed } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SphereGeometry: SphereGeometryLogic;
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

// SphereGeometry 默认值由 SphereGeometryLogic 内参数访问器处理（见下）

/**
 * SphereGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 radius/segmentsW/segmentsH/yUp。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 */
export interface SphereGeometryLogic extends GeometryLogic
{
}


/**
 * 工厂函数：SphereGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function sphereGeometryLogic(data: SphereGeometry): SphereGeometryLogic
{
    validateFieldTypes(data, { radius: 'number', segmentsW: 'number', segmentsH: 'number', yUp: 'boolean' }, 'SphereGeometry');

    // 响应式参数（不修改原始数据，缺失字段通过 ?? 提供默认值）
    const radius = (): number => reactive(data).radius ?? 0.5;
    const segmentsW = (): number => reactive(data).segmentsW ?? 16;
    const segmentsH = (): number => reactive(data).segmentsH ?? 12;
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

    const logic: SphereGeometryLogic = {
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
                    // 接缝重复点与环首顶点**位置完全相同**，法线也应完全相同（直接复制）。
                    //
                    // 原实现写作 `n0 + n * 0.5`，得到长度为 1.5 的非单位法线：该列会因光照
                    // 偏亮而与相邻列出现可见色差，也不再是单位向量（不再是合法法线）。
                    data[index] = data[startIndex];
                    data[index + 1] = data[startIndex + 1];
                    data[index + 2] = data[startIndex + 2];
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
                // 绕序：顶点法线朝外（球面法线 = 归一化位置），因此正面必须为逆时针
                // （管线 `frontFace: 'ccw'`）。原实现的 (a,c,b) / (a,d,c) 与顶点法线相反，
                // 正面被 `cullFace: 'back'` 整片剔除，导致整个球体完全不可见。
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
registerLogic('SphereGeometry', sphereGeometryLogic);