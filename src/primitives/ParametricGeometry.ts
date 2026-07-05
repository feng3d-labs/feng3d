import { Vector3 } from '@feng3d/math';
import { Geometry } from '../geometry/Geometry';

/**
 * 参数化曲面几何体（纯数据接口）。
 *
 * 通过构造参数 func/slices/stacks/doubleside 定义，geometryLogic 在 buildGeometry 时
 * 调用 func 生成顶点。func/slices/stacks/doubleside 由 createParametricGeometry 工厂
 * 写入到 `__func/__slices/__stacks/__doubleside` 隐藏字段（无法序列化但运行时需要）。
 */
export interface ParametricGeometry extends Geometry
{
    /** 切片数（运行时通过 __slices 读取） */
    slices: number;
    /** 堆叠数（运行时通过 __stacks 读取） */
    stacks: number;
    /** 是否双面（运行时通过 __doubleside 读取） */
    doubleside: boolean;
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
