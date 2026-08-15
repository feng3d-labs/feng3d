import { Color4 as Color4Math, Vector2, Vector3, Vector3Like } from '@feng3d/math';
import type { Color4 } from '../core/Color4';
import { Geometry, GeometryLogic } from './Geometry';
import { registerLogic, reactive, computed } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module './Geometry'
{
    export interface GeometryMap
    {
        PointGeometry: PointGeometry;
    }
}

/**
 * 点信息
 */
export interface PointInfo
{
    readonly position?: Vector3Like;
    readonly color?: Color4;
    readonly normal?: Vector3Like;
    readonly uv?: Vector2;
}

/**
 * 点几何体（纯数据接口）。
 *
 * 通过 {@link points} 列表声明点位，PointGeometryLogic 用 computed 按 points 懒生成
 * positions/uvs/normals/colors/indices。points 变化时 computed 自动失效重算。
 *
 * 每个点扩展成 4 顶点的 billboard 四边形（2 三角形），a_uv 承载角偏移（-1..1），
 * 供 PointMaterial 在屏幕空间按 u_PointSize 展开成可变尺寸的方形点。WebGPU 的
 * point-list 拓扑固定 1 像素、不支持顶点着色器输出点尺寸，故用 triangle-list 画
 * 四边形模拟（与 three.js WebGPU 后端 Points 渲染一致）。
 */
export interface PointGeometry extends Geometry
{
    readonly __type__: 'PointGeometry';
    /** 点数据列表 */
    readonly points: PointInfo[];
}

/**
 * PointGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，用 computed 按 points 懒生成
 * positions/uvs/normals/colors/indices。points 变化时 computed 自动失效重算。
 */
export class PointGeometryLogic extends GeometryLogic
{
    // 响应式参数（不修改原始数据，缺失字段通过 ?? 提供默认值）
    readonly #points = (): PointInfo[] => reactive(this._data as PointGeometry).points ?? [];

    readonly #_positions = computed(() => this.#buildPositions());
    readonly #_normals = computed(() => this.#buildNormals());
    readonly #_uvs = computed(() => this.#buildUVs());
    readonly #_colors = computed(() => this.#buildColors());
    readonly #_indicesComputed = computed(() => this.#buildIndices());

    readonly #_attrTable: VertexAttributes = {
        a_position: this.computedAttr(this.#_positions, 'float32x3'),
        a_color: this.computedAttr(this.#_colors, 'float32x4'),
        a_uv: this.computedAttr(this.#_uvs, 'float32x2'),
        a_normal: this.computedAttr(this.#_normals, 'float32x3'),
        a_tangent: { data: new Float32Array(), format: 'float32x3' },
    };

    protected constructor(data: PointGeometry)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: PointGeometry): PointGeometryLogic
    {
        return new PointGeometryLogic(data);
    }

    override get vertices(): VertexAttributes
    {
        return this.#_attrTable;
    }

    /** indices 由 computed 驱动（覆写基类 getter） */
    override get vertexIndices(): number[]
    {
        return this.#_indicesComputed.value;
    }

    // ---- 顶点构建（直接返回 Float32Array，内部 reactive 建立依赖） ----
    //
    // 每个点扩展成一个面向相机的四边形（4 顶点 × 2 三角形），用 billboard 方式渲染可变
    // 尺寸的点。WebGPU 的 point-list 拓扑固定 1 像素、不支持顶点着色器输出点尺寸，故用
    // triangle-list 画四边形模拟（与 three.js WebGPU 后端 Points 渲染一致）。
    //
    // 顶点布局（每点 4 顶点）：
    //   角偏移 corner（存入 a_uv，范围 [-1,1]²）：左下(-1,-1) 右下(1,-1) 右上(1,1) 左上(-1,1)
    //   索引（每点 6 个，2 三角形）：base+0, base+1, base+2,  base+0, base+2, base+3

    /** 4 个角的偏移（左下/右下/右上/左上），存入 a_uv 供顶点着色器展开四边形 */
    static readonly CORNERS: ReadonlyArray<readonly [number, number]> = [
        [-1, -1], [1, -1], [1, 1], [-1, 1],
    ];

    #buildPositions(): Float32Array
    {
        const numPoints = Math.max(1, this.#points().length);
        const data: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            const element = this.#points()[i];
            const position = (element && element.position) || Vector3.ZERO;
            // 每点重复 4 顶点（四边形 4 角共享同一点位置，由着色器按 corner 展开）
            for (let c = 0; c < 4; c++)
            {
                data.push(position.x, position.y, position.z);
            }
        }

        return new Float32Array(data);
    }

    #buildNormals(): Float32Array
    {
        const numPoints = Math.max(1, this.#points().length);
        const data: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            const element = this.#points()[i];
            const normal = (element && element.normal) || Vector3.ZERO;
            for (let c = 0; c < 4; c++)
            {
                data.push(normal.x, normal.y, normal.z);
            }
        }

        return new Float32Array(data);
    }

    #buildUVs(): Float32Array
    {
        const numPoints = Math.max(1, this.#points().length);
        const data: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            // a_uv 复用：优先用 PointInfo.uv 作为四边形角偏移的基准（默认 corner）。
            // 这里直接写死 4 个角的偏移（-1..1），着色器按此在屏幕空间展开四边形。
            for (let c = 0; c < 4; c++)
            {
                const corner = PointGeometryLogic.CORNERS[c];
                data.push(corner[0], corner[1]);
            }
        }

        return new Float32Array(data);
    }

    #buildColors(): Float32Array
    {
        const numPoints = Math.max(1, this.#points().length);
        const data: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            const element = this.#points()[i];
            const color = (element && element.color) || Color4Math.WHITE;
            for (let c = 0; c < 4; c++)
            {
                data.push(color.r, color.g, color.b, color.a);
            }
        }

        return new Float32Array(data);
    }

    #buildIndices(): number[]
    {
        const numPoints = Math.max(1, this.#points().length);
        const indices: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            const base = i * 4;
            // 两个三角形：base+0, base+1, base+2  与  base+0, base+2, base+3
            indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }

        return indices;
    }
}

registerLogic('PointGeometry', PointGeometryLogic as unknown as new (data: PointGeometry) => PointGeometryLogic);
