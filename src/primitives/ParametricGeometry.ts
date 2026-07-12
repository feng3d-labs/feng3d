import { Vector3 } from '@feng3d/math';
import { Geometry, GeometryLogic, createGeometryAttributes, registerCloneFactory } from '../geometry/Geometry';
import { registerLogic } from '@feng3d/reactivity';
import { geometryUtils } from '../geometry/GeometryUtils';
import { Index } from '../render/data/Index';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        ParametricGeometry: ParametricGeometry;
    }
}

/**
 * 参数化曲面几何体（纯数据接口）。
 *
 * 通过构造参数 func/slices/stacks/doubleside 定义，geometryLogic 在 buildGeometry 时
 * 调用 func 生成顶点。func/slices/stacks/doubleside 由 createParametricGeometry 工厂
 * 写入到 `__func/__slices/__stacks/__doubleside` 隐藏字段（无法序列化但运行时需要）。
 */
export interface ParametricGeometry extends Geometry
{
    readonly __type__: 'ParametricGeometry';
    /** 切片数（运行时通过 __slices 读取） */
    readonly slices: number;
    /** 堆叠数（运行时通过 __stacks 读取） */
    readonly stacks: number;
    /** 是否双面（运行时通过 __doubleside 读取） */
    readonly doubleside: boolean;
}

/**
 * 创建 ParametricGeometry 实例。
 *
 * @param func 参数化函数 (u, v) → Vector3
 * @param slices 切片数
 * @param stacks 堆叠数
 * @param doubleside 是否双面
 */
export function createParametricGeometry(func: (u: number, v: number) => Vector3, slices = 8, stacks = 8, doubleside = false): ParametricGeometry
{
    const g: ParametricGeometry & { __func: any; __slices: any; __stacks: any; __doubleside: any } = {
        __type__: 'ParametricGeometry',
        name: '',
        scaleU: 1,
        scaleV: 1,
        slices,
        stacks,
        doubleside,
        __func: func,
        __slices: slices,
        __stacks: stacks,
        __doubleside: doubleside,
    } as any;

    return g;
}

/**
 * 按现有数据克隆一份 ParametricGeometry（用于 clone）。
 */
export function createParametricGeometryWithData(src: ParametricGeometry): ParametricGeometry
{
    const anySrc = src as any;

    return createParametricGeometry(anySrc.__func, anySrc.__slices, anySrc.__stacks, anySrc.__doubleside);
}

export class ParametricGeometryLogic extends GeometryLogic
{
    constructor(geometry: ParametricGeometry)
    {
        super(geometry);
        this.attributes = createGeometryAttributes();
        this.indexBuffer = new Index();
    }

    buildGeometry(): void
    {
        buildParametric(this._geometry as ParametricGeometry, this);
    }
}

function buildParametric(g: ParametricGeometry, lg: GeometryLogic): void
{
    const func = (g as any).__func as ((u: number, v: number) => Vector3) | undefined;
    const slices = (g as any).__slices as number | undefined;
    const stacks = (g as any).__stacks as number | undefined;
    const doubleside = (g as any).__doubleside as boolean | undefined;
    if (!func || slices == null || stacks == null) return;

    let positions: number[] = [];
    const indices: number[] = [];
    let uvs: number[] = [];
    const sliceCount = slices + 1;
    for (let i = 0; i <= stacks; i++)
    {
        const v = i / stacks;
        for (let j = 0; j <= slices; j++)
        {
            const u = j / slices;
            uvs.push(u, v);
            const p = func(u, v);
            positions.push(p.x, p.y, p.z);
            if (i < stacks && j < slices)
            {
                const a = i * sliceCount + j;
                const b = i * sliceCount + j + 1;
                const c = (i + 1) * sliceCount + j + 1;
                const d = (i + 1) * sliceCount + j;
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }
    }
    if (doubleside)
    {
        positions = positions.concat(positions);
        uvs = uvs.concat(uvs);
        const start = (stacks + 1) * (slices + 1);
        for (let i = 0, n = indices.length; i < n; i += 3)
        {
            indices.push(start + indices[i], start + indices[i + 2], start + indices[i + 1]);
        }
    }
    lg.indices = indices;
    lg.positions = positions;
    lg.uvs = uvs;
    lg.normals = geometryUtils.createVertexNormals(lg.indices, lg.positions, true);
    lg.tangents = geometryUtils.createVertexTangents(lg.indices, lg.positions, lg.uvs, true);
}

registerLogic('ParametricGeometry', ParametricGeometryLogic);
registerCloneFactory('ParametricGeometry', (src: ParametricGeometry) => createParametricGeometryWithData(src));
