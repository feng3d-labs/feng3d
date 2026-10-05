import { Behaviour, BehaviourLogic, Object3D } from 'feng3d';
import { reactive, registerLogic } from '@feng3d/reactivity';
import {
    mat4AppendScale,
    mat4AppendTranslation,
    mat4Identity,
    Matrix4x4,
    Ray3,
    Vector2Like,
    WritableLine3Like,
} from '@feng3d/math';
import { UIRenderMode } from '../enums/UIRenderMode';
import { getTransform2D } from './Transform2D';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        Canvas: Canvas;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Canvas: CanvasLogic;
    }
}

/**
 * Element that can be used for screen rendering.
 *
 * 能够被用于屏幕渲染的元素（纯数据接口）。
 *
 * 行为由 {@link CanvasLogic} 提供：布局（写 2D 变换与宿主对象的变换）、投影矩阵、鼠标射线。
 * 字段一律 `readonly`，修改经 `reactive(canvas).field = value` 写入。
 */
export interface Canvas extends Behaviour
{
    readonly __type__: 'Canvas';

    /**
     * Is the Canvas in World or Overlay mode?
     *
     * 画布是在世界或覆盖模式（缺失时按 {@link UIRenderMode.ScreenSpaceOverlay} 处理）。
     */
    readonly renderMode?: UIRenderMode;

    /**
     * 最近距离（缺失时按 -1000 处理）
     */
    readonly near?: number;

    /**
     * 最远距离（缺失时按 10000 处理）
     */
    readonly far?: number;
}

/**
 * Canvas 逻辑类。
 *
 * 投影矩阵与鼠标射线是**行为派生的内部状态**（迁移前是组件上的可变字段，
 * 但它们并不参与序列化），按根规范 §11.2 收进 logic，对外只读。
 */
export class CanvasLogic extends BehaviourLogic
{
    /** 纯数据引用（对外只读） */
    readonly #data: Canvas;

    /**
     * 鼠标射线（与鼠标重叠的摄像机射线）。
     *
     * 用可写形状持有：{@link calcMouseRay3D} 就地更新 origin 的分量，
     * 与迁移前的 `mouseRay.origin.set(...)` 语义一致（对象身份不变）。
     */
    readonly #mouseRay: WritableLine3Like = { origin: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: 1 } };

    /** 投影矩阵（{@link layout} 时按画布尺寸与 near/far 重算） */
    readonly #projection: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Identity() };

    protected constructor(data: Canvas)
    {
        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: Canvas): CanvasLogic
    {
        return new CanvasLogic(data);
    }

    /** 鼠标射线（只读；origin 为画布内鼠标位置，direction 为 +Z） */
    get mouseRay(): Ray3
    {
        return this.#mouseRay as Ray3;
    }

    /** 投影矩阵（只读；{@link layout} 时更新） */
    get projection(): Matrix4x4
    {
        return this.#projection;
    }

    /**
     * 更新布局
     *
     * 把画布尺寸写到 2D 变换上，并把宿主对象的位移/旋转/缩放复位，
     * 最后按画布尺寸与 near/far 重算投影矩阵。
     *
     * @param width 画布宽度
     * @param height 画布高度
     */
    layout(width: number, height: number): void
    {
        const entity = this.entity;
        if (entity)
        {
            const transform2D = getTransform2D(entity);
            if (transform2D)
            {
                // 迁移前逐分量赋值（size.x / size.y / pivot.set）；纯数据字段只读，改为整体写入
                const r_transform2D = reactive(transform2D);
                r_transform2D.size = { x: width, y: height };
                r_transform2D.pivot = { x: 0, y: 0 };
            }

            // 迁移前写的是已删除的 Transform 组件，主仓的变换数据直接挂在 Object3D 上
            const r_entity = reactive(entity);
            r_entity.position = { x: 0, y: 0, z: 0 };
            r_entity.rotation = { x: 0, y: 0, z: 0 };
            r_entity.scale = { x: 1, y: 1, z: 1 };
        }

        const r_data = reactive(this.#data);
        const near = r_data.near ?? -1000;
        const far = r_data.far ?? 10000;

        // 阶段 C-e：Matrix4x4 的链式方法已删除，改用纯函数（out 传自身 = 原地运算，与旧链式语义一致）
        mat4Identity(this.#projection);
        mat4AppendTranslation(this.#projection, 0, 0, -(far + near) / 2, this.#projection);
        mat4AppendScale(this.#projection, 2 / width, -2 / height, 2 / (far - near), undefined, this.#projection);
        mat4AppendTranslation(this.#projection, -1, 1, 0, this.#projection);
    }

    /**
     * 计算鼠标射线
     *
     * @param mousePos 鼠标位置（画布内坐标，`x` / `y`）
     */
    calcMouseRay3D(mousePos: Vector2Like): void
    {
        // 迁移前签名是 `calcMouseRay3D(view: View)` 并读 `view.mousePos`；
        // 主仓 View 已无 mousePos 字段（鼠标位置由输入层持有），故改为显式传入。
        this.#mouseRay.origin.x = mousePos.x;
        this.#mouseRay.origin.y = mousePos.y;
        this.#mouseRay.origin.z = 0;
    }
}

// 注册到统一 logic 分发表
registerLogic('Canvas', CanvasLogic as unknown as new (data: Canvas) => CanvasLogic);

/**
 * 创建 Canvas 对象（带 2D 变换与画布组件的 Object3D 字面量）。
 *
 * 迁移前这里是 `registerPrimitive('Canvas', handler)`：把「如何拼装一个 Canvas 对象」
 * 注册进原语注册表，供 `Object3D.createPrimitive('Canvas')` / 层级面板右键菜单取用。
 * 主仓已整体移除 primitive 体系（`registerPrimitive` / `createPrimitive` /
 * `MixinsPrimitiveObject3D` 都不存在），故改为直接返回纯数据字面量；
 * 编辑器侧若要恢复「新建 UI 对象」菜单，需要另行接线（见本批迁移报告）。
 *
 * @returns 含 Transform2D 与 Canvas 组件的 Object3D 数据
 */
export function createCanvasObject3D(): Object3D
{
    return {
        __type__: 'Object3D',
        components: [{ __type__: 'Transform2D' }, { __type__: 'Canvas' }],
    };
}
