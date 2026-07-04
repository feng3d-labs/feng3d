import { decoratorRegisterClass } from '@feng3d/polyfill';

/**
 * 变换
 *
 * 物体的位置、旋转和比例。
 *
 * 场景中的每个对象都有一个变换。它用于存储和操作对象的位置、旋转和缩放。
 * 每个转换都可以有一个父元素，它允许您分层应用位置、旋转和缩放。
 *
 * 纯数据结构体：仅包含 readonly 基础属性，可 JSON 序列化。
 * 所有计算逻辑（矩阵、坐标变换等）由 {@link transformLogic} 提供。
 */
@decoratorRegisterClass()
export class Transform
{
    __class__: 'Transform';

    /**
     * 父级 Transform（只读，响应式）。
     *
     * 通过 reactive(this).parent = value 修改，使 transformLogic 中的 computed 自动建立依赖。
     */
    readonly parent: Transform | null = null;

    /**
     * 本地位移
     */
    readonly position: { readonly x: number; readonly y: number; readonly z: number } = { x: 0, y: 0, z: 0 };

    /**
     * 本地旋转
     */
    readonly rotation: { readonly x: number; readonly y: number; readonly z: number } = { x: 0, y: 0, z: 0 };

    /**
     * 本地缩放
     */
    readonly scale: { readonly x: number; readonly y: number; readonly z: number } = { x: 1, y: 1, z: 1 };
}
