import { mat4Copy, mat4LookAt, mat4ToTRS, Matrix4x4, VEC3_Y_AXIS, vec3From, Vector3, Vector3Like, WritableVector3Like } from '@feng3d/math';
import { logic, batchRun, reactive } from '@feng3d/reactivity';
import { Object3D } from '../core/Object3D';
import { ControllerBase } from './ControllerBase';

export class LookAtController extends ControllerBase
{
    protected _lookAtPosition: Vector3;
    protected _lookAtObject: Object3D;
    // 阶段 C-f：`Vector3` 的 class 已删除，字段类型保持 `Vector3`（getter 对外仍是它），
    // 装配点显式写判别字段
    //
    // 阶段 C 收尾：`_origin` / `_pos` 是**就地写入的计算工作变量**（`vec3From` / `vec3Copy` /
    // `mat4TransformPoint3` 的 `out`，以及子类 `HoverController` 的 `this._pos.x = ...`），
    // 不参与序列化，所以类型改为 `WritableVector3Like`（`Vector3Like` 已统一为只读）。
    protected _origin: WritableVector3Like = { x: 0.0, y: 0.0, z: 0.0 };
    protected _upAxis: Vector3 = { __type__: 'Vector3', ...VEC3_Y_AXIS };
    protected _pos: WritableVector3Like = { x: 0, y: 0, z: 0 };

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
        this._upAxis = { __type__: 'Vector3', x: upAxis.x, y: upAxis.y, z: upAxis.z };
    }

    get lookAtPosition(): Vector3
    {
        return this._lookAtPosition;
    }

    /** 注视位置（入参放宽与转换方式同 `upAxis`，getter 返回类型保持 `Vector3`） */
    set lookAtPosition(val: Vector3Like)
    {
        this._lookAtPosition = { __type__: 'Vector3', x: val.x, y: val.y, z: val.z };
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
                vec3From(pos.x, pos.y, pos.z, this._pos);
                this._lookAtTransform(this._targetObject, this._pos, this._upAxis);
            }
        }
    }

    // `target` / `upAxis` 放宽为 `Vector3Like`（纯函数化的一贯做法：入参只用最小形状，
    // `mat4LookAt` 正好接受它）——这样上面那两个 `WritableVector3Like` 工作变量能直接传入
    private _lookAtTransform(t: Object3D, target: Vector3Like, upAxis: Vector3Like)
    {
        // 阶段 C-e：`Matrix4x4` 的 class 已删除，改用纯数据 out + 纯函数（就地语义不变）
        const m: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(logic(t).matrix) };
        mat4LookAt(m, target, upAxis, m);
        const pos = { x: 0, y: 0, z: 0 }; const rot = { x: 0, y: 0, z: 0 }; const scl = { x: 0, y: 0, z: 0 };
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
