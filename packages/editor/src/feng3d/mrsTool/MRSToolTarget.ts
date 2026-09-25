import { Vector3, globalEmitter, ticker, reactive } from 'feng3d';
import type { Object3D } from 'feng3d';
import { EditorData } from '../../global/EditorData';

/**
 * 编辑器位移旋转缩放工具的操作目标。
 *
 * **P0 阶段（编辑器启动解阻塞）说明**：
 * 本类不是组件（不继承 `Component`，也不参与 `logic()` 注册），因此**不是模块加载期崩溃点**。
 * 主仓已删除独立的 `Transform` 对象与 `Transform.*` 事件，本类原先把「控制器 + 被操作对象」
 * 一律当作 `Transform` 使用；P0 只做**类型层面的替换**（`Transform` → `Object3D`），
 * 运行时行为（读写 position / rotation / scale）保持不变——`Object3D` 数据接口自带这三个字段。
 *
 * 待恢复（`TODO(P1 API 迁移)`）：所有矩阵/世界坐标换算方法，迁移方向见各处注释。
 */
export class MRSToolTarget
{
    //
    private _controllerTargets: Object3D[];
    private _startScaleVec: Vector3[] = [];
    private _controllerTool: Object3D;
    private _startTransformDic: Map<Object3D, TransformData>;

    private _position = new Vector3();
    private _rotation = new Vector3();

    get controllerTool()
    {
        return this._controllerTool;
    }

    set controllerTool(value)
    {
        this._controllerTool = value;
        if (this._controllerTool)
        {
            const target = this._controllerTool as { position?: { x: number, y: number, z: number }, rotation?: { x: number, y: number, z: number } };
            // §8.4：从 raw 读当前值，向响应式代理写新值
            const rp = reactive(target.position);
            rp.x = this._position.x; rp.y = this._position.y; rp.z = this._position.z;
            const rr = reactive(target.rotation);
            rr.x = this._rotation.x; rr.y = this._rotation.y; rr.z = this._rotation.z;
        }
    }

    get controllerTargets()
    {
        return this._controllerTargets;
    }

    set controllerTargets(value: Object3D[])
    {
        this._controllerTargets = value;
        this.invalidateControllerImage();
    }

    constructor()
    {
        // TODO(P1 API 迁移)：主仓 `Object3D` 已无 `scenetransformChanged` 事件，此处暂不接线。
        // 迁移方向：用 `effect(() => { ... })` 监听 `logic(object3D).local2world` 变化后置脏。
        globalEmitter.on('editor.isWoldCoordinateChanged', this.invalidateControllerImage, this);
        globalEmitter.on('editor.isBaryCenterChanged', this.invalidateControllerImage, this);
        //
        globalEmitter.on('editor.selectedObjectsChanged', this.onSelectedObject3DChange, this);
    }

    private onSelectedObject3DChange()
    {
        // 筛选出 工具控制的对象（旧 `item.transform` → 新范式直接用 Object3D 自身）
        const objects = <Object3D[]>EditorData.editorData.selectedObject3Ds.reduce((result, item) =>
        {
            result.push(item);

            return result;
        }, []);
        if (objects.length > 0)
        {
            this.controllerTargets = objects;
        }
        else
        {
            this.controllerTargets = null;
        }
    }

    private invalidateControllerImage()
    {
        ticker.nextframe(this.updateControllerImage, this);
    }

    private updateControllerImage()
    {
        // TODO(P1 API 迁移)：原实现用 `logic(transform).worldPosition.value` 求中心/朝向。
        // 新范式 `logic(object3D).worldPosition` 已是 `Vector3`（非 Computed），且
        // `world2local` 同样返回矩阵本身；待 P1 一并改写后恢复本方法。
        // 当前仅保留「把上一次结果同步到控制器」的无害部分。
        if (!this._controllerTargets || this._controllerTargets.length === 0)
        { return; }
        if (this._controllerTool)
        {
            const target = this._controllerTool as { position?: { x: number, y: number, z: number }, rotation?: { x: number, y: number, z: number } };
            const rp = reactive(target.position);
            rp.x = this._position.x; rp.y = this._position.y; rp.z = this._position.z;
            const rr = reactive(target.rotation);
            rr.x = this._rotation.x; rr.y = this._rotation.y; rr.z = this._rotation.z;
        }
    }

    /**
     * 开始移动
     */
    startTranslation()
    {
        // TODO(P1 API 迁移)：原实现用 `startTransformDic` 记录 `Transform` 快照。
        // 新范式改为记录 `Object3D` 的 position/rotation/scale 原始数值（见 getTransformData）。
    }

    translation(_addPos: Vector3)
    {
        // TODO(P1 API 迁移)：原实现依赖 `logic(object3D.parent).world2local.value.transformVector3(...)`。
        // 新范式：`logic(parent).world2local` 直接是矩阵，`new Vector3(...)` 改为 `{ __type__: 'Vector3', x, y, z }` 字面量。
    }

    stopTranslation()
    {
        this._startTransformDic = null;
    }

    startRotate()
    {
        // TODO(P1 API 迁移)：同 startTranslation。
    }

    /**
     * 绕指定轴旋转
     * @param angle 旋转角度
     * @param normal 旋转轴
     */
    rotate1(_angle: number, _normal: Vector3)
    {
        // TODO(P1 API 迁移)：原实现依赖 `logic(...).world2local.value`、`Matrix4x4.fromPosition` 与
        // 命令式 `new Vector3(...)`，待 P1 按 API_MIGRATION.md §3.6 改写后恢复。
    }

    /**
     * 按指定角旋转
     * @param angle1 第一方向旋转角度
     * @param normal1 第一方向旋转轴
     * @param angle2 第二方向旋转角度
     * @param normal2 第二方向旋转轴
     */
    rotate2(_angle1: number, _normal1: Vector3, _angle2: number, _normal2: Vector3)
    {
        // TODO(P1 API 迁移)：同 rotate1。
    }

    stopRote()
    {
        this._startTransformDic = null;
    }

    startScale()
    {
        for (let i = 0; i < this._controllerTargets.length; i++)
        {
            const s = this._controllerTargets[i].scale;
            this._startScaleVec[i] = new Vector3(s.x, s.y, s.z);
        }
    }

    doScale(scale: Vector3)
    {
        console.assert(!!scale.length);
        for (let i = 0; i < this._controllerTargets.length; i++)
        {
            const result = this._startScaleVec[i].multiplyTo(scale);
            const rs = reactive(this._controllerTargets[i].scale);
            rs.x = result.x;
            rs.y = result.y;
            rs.z = result.z;
        }
    }

    stopScale()
    {
        this._startScaleVec.length = 0;
    }
}

/**
 * 变换快照数据（P1 迁移后由 `Object3D` 的 position/rotation/scale 填充）。
 */
interface TransformData
{
    position: Vector3, rotation: Vector3, scale: Vector3
}
