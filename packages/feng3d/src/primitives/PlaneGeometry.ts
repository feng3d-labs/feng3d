import { computedAttr, createGeometryLogicState, Geometry, geometryBeforeRender, geometryBounding, geometryRaycast, GeometryLogic } from '../geometry/Geometry';
import { registerLogic, reactive, computed } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        PlaneGeometry: PlaneGeometryLogic;
    }
}

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        PlaneGeometry: PlaneGeometry;
    }
}

/**
 * 平面几何体（纯数据接口）。
 */
export interface PlaneGeometry extends Geometry
{
    readonly __type__: 'PlaneGeometry';
    /** 宽度（缺失时由工厂填充默认值） */
    readonly width?: number;
    /** 高度（缺失时由工厂填充默认值） */
    readonly height?: number;
    /** 横向分割数（缺失时由工厂填充默认值） */
    readonly segmentsW?: number;
    /** 纵向分割数（缺失时由工厂填充默认值） */
    readonly segmentsH?: number;
    /** 是否朝上（缺失时由工厂填充默认值） */
    readonly yUp?: boolean;
}

// PlaneGeometry 默认值由访问器字段 ?? 处理（见下）

/**
 * PlaneGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 width/height/segmentsW/segmentsH/yUp。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 */
export interface PlaneGeometryLogic extends GeometryLogic
{
}


/**
 * 工厂函数：PlaneGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function planeGeometryLogic(data: PlaneGeometry): PlaneGeometryLogic
{
    // 响应式参数（不修改原始数据，缺失字段通过 ?? 提供默认值）
    const width = (): number => reactive(data).width ?? 1;
    const height = (): number => reactive(data).height ?? 1;
    const segmentsW = (): number => reactive(data).segmentsW ?? 1;
    const segmentsH = (): number => reactive(data).segmentsH ?? 1;
    const yUp = (): boolean => reactive(data).yUp ?? true;

    // ---- 顶点构建（直接返回 Float32Array，内部 reactive 建立依赖） ----

    function buildPositions(): Float32Array
    {

        const data: number[] = [];
        let pi = 0;

        for (let yi = 0; yi <= segmentsH(); ++yi)
        {
            for (let xi = 0; xi <= segmentsW(); ++xi)
            {
                const x = (xi / segmentsW() - 0.5) * width();
                const y = (yi / segmentsH() - 0.5) * height();
                data[pi++] = x;
                if (yUp()) { data[pi++] = 0; data[pi++] = y; }
                else { data[pi++] = y; data[pi++] = 0; }
            }
        }

        return new Float32Array(data);
    }

    function buildNormals(): Float32Array
    {

        const data: number[] = [];
        let ni = 0;

        for (let yi = 0; yi <= segmentsH(); ++yi)
        {
            for (let xi = 0; xi <= segmentsW(); ++xi)
            {
                // yUp:true  → 法线 +Y（水平地板，朝上）
                // yUp:false → 法线 -Z（竖直平面，朝 -Z；右手系下配合 lookAt 的 -Z forward 朝向相机）
                if (yUp()) { data[ni++] = 0; data[ni++] = 1; data[ni++] = 0; }
                else { data[ni++] = 0; data[ni++] = 0; data[ni++] = -1; }
            }
        }

        return new Float32Array(data);
    }

    function buildTangents(): Float32Array
    {

        const data: number[] = [];
        let ti = 0;

        for (let yi = 0; yi <= segmentsH(); ++yi)
        {
            for (let xi = 0; xi <= segmentsW(); ++xi)
            {
                // 切线沿 UV 的 U 增长方向：yUp:true 时 u=xi/W（+X），yUp:false 时 u=1-xi/W（-X）
                if (yUp()) { data[ti++] = 1; data[ti++] = 0; data[ti++] = 0; }
                else { data[ti++] = -1; data[ti++] = 0; data[ti++] = 0; }
            }
        }

        return new Float32Array(data);
    }

    function buildUVs(): Float32Array
    {

        // scaleU/scaleV（Geometry 基类纹理缩放）：UV × scale 后配合 sampler addressMode repeat
        // 即可让纹理在平面内重复平铺（对应 three.js texture.repeat）。
        const su = reactive(data).scaleU ?? 1;
        const sv = reactive(data).scaleV ?? 1;
        const uvData: number[] = [];
        let ui = 0;

        for (let yi = 0; yi <= segmentsH(); ++yi)
        {
            for (let xi = 0; xi <= segmentsW(); ++xi)
            {
                if (yUp()) { uvData[ui++] = (xi / segmentsW()) * su; uvData[ui++] = (1 - yi / segmentsH()) * sv; }
                else { uvData[ui++] = (1 - xi / segmentsW()) * su; uvData[ui++] = (1 - yi / segmentsH()) * sv; }
            }
        }

        return new Float32Array(uvData);
    }

    function buildIndices(): number[]
    {

        const indices: number[] = [];
        const tw = segmentsW() + 1;
        let ii = 0;

        for (let yi = 0; yi <= segmentsH(); ++yi)
        {
            for (let xi = 0; xi <= segmentsW(); ++xi)
            {
                if (xi !== segmentsW() && yi !== segmentsH())
                {
                    const b = xi + yi * tw;
                    // 绕序配合法线方向，使从法线一侧观察时为 CCW（逆时针，frontFace:'ccw' 的正面）。
                    // yUp:true  从 +Y 俯视；yUp:false 从 -Z 正面观察 —— 两者法线侧观察均为 CCW。
                    // 与 CubeGeometry 的 `a,b,d + b,c,d` 同约定：后两个顶点顺序不可调换，
                    // 否则三角形绕序反转（法线朝外、绕序朝内），正面被 cullFace:'back' 剔除。
                    indices[ii++] = b; indices[ii++] = b + tw; indices[ii++] = b + tw + 1;
                    indices[ii++] = b; indices[ii++] = b + tw + 1; indices[ii++] = b + 1;
                }
            }
        }

        return indices;
    }

    // 每个属性独立 computed，仅在实际被读取时计算
    const positions = computed(() => buildPositions());
    const normals = computed(() => buildNormals());
    const tangents = computed(() => buildTangents());
    const uvs = computed(() => buildUVs());

    // 默认白色 color（基于 position 顶点数，StandardMaterial/ColorMaterial 反射需要 a_color）
    const colors = computed(() =>
    {
        const pos = positions.value;
        if (pos.length === 0) return new Float32Array(0);
        const count = pos.length / 3;

        return new Float32Array(count * 4).fill(1); // 全白 (1,1,1,1)
    });

    // attributes: data 由 computed getter 驱动
    const attrTable: VertexAttributes = {
        a_position: computedAttr(positions, 'float32x3'),
        a_color: computedAttr(colors, 'float32x4'),
        a_uv: computedAttr(uvs, 'float32x2'),
        a_normal: computedAttr(normals, 'float32x3'),
        a_tangent: computedAttr(tangents, 'float32x3'),
    };
    const indicesComputed = computed(() => buildIndices());
    const state = createGeometryLogicState(() => attrTable, () => indicesComputed.value, data);

    const logic: PlaneGeometryLogic = {
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
registerLogic('PlaneGeometry', planeGeometryLogic);