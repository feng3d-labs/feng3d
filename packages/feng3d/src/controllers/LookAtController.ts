import { mat4Copy, mat4LookAt, mat4ToTRS, Matrix4x4, Vector3, Vector3Like } from '@feng3d/math';
import { logic, batchRun, reactive } from '@feng3d/reactivity';
import { Object3D } from '../core/Object3D';
import { ControllerBase } from './ControllerBase';

export class LookAtController extends ControllerBase
{
    protected _lookAtPosition: Vector3;
    protected _lookAtObject: Object3D;
    protected _origin: Vector3 = new Vector3(0.0, 0.0, 0.0);
    protected _upAxis: Vector3 = Vector3.Y_AXIS;
    protected _pos: Vector3 = new Vector3();

    constructor(target?: Object3D, lookAtObject?: Object3D)
    {
        super(target);

        if (lookAtObject)
        { this.lookAtObject = lookAtObject; }
        else
        { this.lookAtPosition = { x: 0, y: 0, z: 0 }; }
    }

    get upAxis(): Vector3
    {
        return this._upAxis;
    }

    /**
     * 向上朝向。
     *
     * 入参放宽为 `Vector3Like`（可直接传 `{ x, y, z }` 字面量）；字段保持 `Vector3`
     * 实例、setter 内做转换，因此 **getter 的返回类型不会跟着退化成 `Vector3Like`**
     * （那是 P8c：消费方的 `.cross()` 这类类方法调用会编译不过）。
     *
     * 代价：存进来的是**副本**，与旧实现「存引用」不同——外部再改传入的那个向量
     * 不会再影响本控制器（仓内 0 处依赖该引用语义的调用点）。
     */
    set upAxis(upAxis: Vector3Like)
    {
        this._upAxis = new Vector3(upAxis.x, upAxis.y, upAxis.z);
    }

    get lookAtPosition(): Vector3
    {
        return this._lookAtPosition;
    }

    /** 注视位置（入参放宽与转换方式同 `upAxis`，getter 返回类型保持 `Vector3`） */
    set lookAtPosition(val: Vector3Like)
    {
        this._lookAtPosition = new Vector3(val.x, val.y, val.z);
    }

    get lookAtObject()
    {
        return this._lookAtObject;
    }

    set lookAtObject(value)
    {
        if (this._lookAtObject === value)
        {
            return;
        }

        this._lookAtObject = value;
    }

    update(_interpolate = true): void
    {
        if (this._targetObject)
        {
            if (this._lookAtPosition)
            {
                this._lookAtTransform(this._targetObject, this.lookAtPosition, this._upAxis);
            }
            else if (this._lookAtObject)
            {
                // 通过 logic().position 读取，使 JSON 字面量（缺失字段）能拿到默认 {0,0,0}
                const pos = logic(this._lookAtObject).position;
                this._pos.set(pos.x, pos.y, pos.z);
                this._lookAtTransform(this._targetObject, this._pos, this._upAxis);
            }
        }
    }

    private _lookAtTransform(t: Object3D, target: Vector3, upAxis: Vector3)
    {
        // 阶段 C-e：`Matrix4x4` 的 class 已删除，改用纯数据 out + 纯函数（就地语义不变）
        const m: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(logic(t).matrix) };
        mat4LookAt(m, target, upAxis, m);
        const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
        mat4ToTRS(m, pos, rot, scl);
        // 整体写回 raw.position/rotation/scale（缺失字段时整体赋值，避免子字段修改崩溃）
        batchRun(() =>
        {
            reactive(t).position = { x: pos.x, y: pos.y, z: pos.z };
            reactive(t).rotation = { x: rot.x, y: rot.y, z: rot.z };
            reactive(t).scale = { x: scl.x, y: scl.y, z: scl.z };
        });
    }
}
