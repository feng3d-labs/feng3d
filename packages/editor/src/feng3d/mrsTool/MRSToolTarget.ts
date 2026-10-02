import { globalEmitter, logic as getLogic, mat4AppendRotation, mat4FromPosition, mat4FromRotation, mat4GetPosition, mat4GetRotation, mat4TransformPoint3, mat4TransformVector3, Matrix4x4, reactive, ticker, vec3Add, vec3Copy, vec3Length, vec3Multiply, vec3ScaleNumber, Vector3, Vector3Like, WritableVector3Like } from 'feng3d';
import type { Object3D } from 'feng3d';
import { EditorData } from '../../global/EditorData';
import { isVector3Like } from '../../utils/sceneObjectGuard';

/**
 * 编辑器位移旋转缩放工具的操作目标。
 *
 * 迁移自旧写法（旧类把「工具控制器 + 被操作对象」一律当作 `Transform` 使用）：主仓已把
 * `Transform` 合并进 `Object3D`（position / rotation / scale 为数据字段，世界坐标换算由
 * `logic(object3D)` 提供），因此本类直接持有 `Object3D`。
 *
 * 角度单位：主仓 `Object3D.rotation` 与 `Matrix4x4` 全部使用**弧度**（旧实现按角度书写，
 * 本文件内所有 180 / 360 常量已相应换成 `Math.PI` / `2π`）。
 */
export class MRSToolTarget
{
    //
    private _controllerTargets: Object3D[];
    private _startScaleVec: WritableVector3Like[] = [];
    private _controllerTool: Object3D;
    private _startTransformDic: Map<Object3D, TransformData>;

    private _position = { x: 0, y: 0, z: 0 };
    private _rotation = { x: 0, y: 0, z: 0 };

    get controllerTool()
    {
        return this._controllerTool;
    }

    set controllerTool(value)
    {
        this._controllerTool = value;
        if (this._controllerTool)
        {
            ensureTransform(this._controllerTool);
            // §8.4：从 raw 读当前值，向响应式代理写新值
            const r_position = reactive(this._controllerTool.position!);
            r_position.x = this._position.x; r_position.y = this._position.y; r_position.z = this._position.z;
            const r_rotation = reactive(this._controllerTool.rotation!);
            r_rotation.x = this._rotation.x; r_rotation.y = this._rotation.y; r_rotation.z = this._rotation.z;
        }
    }

    get controllerTargets()
    {
        return this._controllerTargets;
    }

    set controllerTargets(value: Object3D[])
    {
        this._controllerTargets = value;
        if (value) for (const object3D of value) ensureTransform(object3D);
        this.invalidateControllerImage();
    }

    constructor()
    {
        // 世界坐标 / 轴心 开关变化，以及选中对象变化时重算工具位置
        globalEmitter.on('editor.isWoldCoordinateChanged', this.invalidateControllerImage, this);
        globalEmitter.on('editor.isBaryCenterChanged', this.invalidateControllerImage, this);
        //
        globalEmitter.on('editor.selectedObjectsChanged', this.onSelectedObject3DChange, this);

        // 构造时按**当前**选中补一次（issue #173 的同一类问题）：订阅式同步收不到
        // "订阅之前发生的选中"，表现是工具不跟着已有的选中对象走，直到用户重新点一次。
        // 本类不是 Vue 组件、用不了 `useSelectionSync`，所以手写同一条纪律
        this.onSelectedObject3DChange();
    }

    private onSelectedObject3DChange()
    {
        // 筛选出 工具控制的对象
        const objects = EditorData.editorData.selectedObject3Ds.reduce<Object3D[]>((result, item) =>
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
            // 置 null 表示"没有目标"；`null!` 只影响类型（运行时仍是 null），读取点都有真值判断
            this.controllerTargets = null!;
        }
    }

    private invalidateControllerImage()
    {
        ticker.nextframe(this.updateControllerImage, this);
    }

    private updateControllerImage()
    {
        if (!this._controllerTargets || this._controllerTargets.length === 0)
        { return; }

        const transform = this._controllerTargets[this._controllerTargets.length - 1];
        const position = { x: 0, y: 0, z: 0 };
        if (EditorData.editorData.isBaryCenter)
        {
            // 轴心模式：直接用最后一个对象的世界坐标
            vec3Copy(worldPosition(transform), position);
        }
        else
        {
            // 平均模式：所有被操作对象世界坐标的几何中心
            for (let i = 0; i < this._controllerTargets.length; i++)
            {
                vec3Add(position, worldPosition(this._controllerTargets[i]), position);
            }
            vec3ScaleNumber(position, 1 / this._controllerTargets.length, position);
        }
        let rotation = { x: 0, y: 0, z: 0 };
        if (!EditorData.editorData.isWoldCoordinate)
        {
            const r = this._controllerTargets[0].rotation!;
            rotation = { x: r.x, y: r.y, z: r.z };
        }
        this._position = position;
        this._rotation = rotation;
        this.writeControllerTransform(position, rotation);
    }

    /** 把位置/朝向写入控制器对象（工具 gizmo 的宿主） */
    private writeControllerTransform(position: Vector3Like, rotation: Vector3Like): void
    {
        if (!this._controllerTool) return;
        const r_position = reactive(this._controllerTool.position!);
        r_position.x = position.x; r_position.y = position.y; r_position.z = position.z;
        const r_rotation = reactive(this._controllerTool.rotation!);
        r_rotation.x = rotation.x; r_rotation.y = rotation.y; r_rotation.z = rotation.z;
    }

    /**
     * 开始移动
     */
    startTranslation()
    {
        this._startTransformDic = this.snapshotTransforms();
    }

    translation(addPos: Vector3Like)
    {
        if (!this._controllerTargets || !this._startTransformDic)
        { return; }
        const objects = this.transformObjects();
        for (let i = 0; i < objects.length; i++)
        {
            const object3D = objects[i];
            const transform = this._startTransformDic.get(object3D);
            if (!transform) continue;
            // 世界位移换算到各对象父级空间
            const localMove = vec3Copy(addPos);
            const parent = getLogic(object3D)?.parent as Object3D | null;
            const parentWorld2Local = parent ? getLogic(parent)?.world2local : null;
            // 阶段 C-e：`Matrix4x4.transformVector3` 已删除，就地写入同一个 Vector3（值与原实现一致）
            if (parentWorld2Local) mat4TransformVector3(parentWorld2Local, localMove, localMove);
            const newPos = vec3Add(transform.position, localMove);
            const r_position = reactive(object3D.position!);
            r_position.x = newPos.x; r_position.y = newPos.y; r_position.z = newPos.z;
        }
    }

    stopTranslation()
    {
        // 置 null 表示"没有开始快照"；`null!` 只影响类型（运行时仍是 null）
        this._startTransformDic = null!;
    }

    startRotate()
    {
        this._startTransformDic = this.snapshotTransforms();
    }

    /**
     * 绕指定轴旋转
     * @param angle 旋转角度（弧度）
     * @param normal 旋转轴（世界空间）
     */
    rotate1(angle: number, normal: Vector3Like)
    {
        const objects = this.transformObjects();
        const first = objects[0];
        // 只有"非世界坐标 + 轴心模式"才换算局部轴；该模式下没有父级时它保持 undefined，
        // 与改动前一致（原来传 undefined 进去），故如实声明为可选并在使用处断言
        let localNormal: WritableVector3Like | undefined;
        if (!EditorData.editorData.isWoldCoordinate && EditorData.editorData.isBaryCenter)
        {
            const parent = first ? getLogic(first)?.parent as Object3D | null : null;
            if (parent)
            {
                const parentWorld2Local = getLogic(parent)?.world2local;

                if (parentWorld2Local)
                {
                    // 阶段 C-e：纯函数缺省 out 是纯字面量，而 `localNormal` 的类型是 `Vector3`
                    const transformed = { x: 0, y: 0, z: 0 };

                    mat4TransformVector3(parentWorld2Local, normal, transformed);
                    localNormal = transformed;
                }
            }
        }
        for (let i = 0; i < objects.length; i++)
        {
            const object3D = objects[i];
            const tempTransform = this._startTransformDic?.get(object3D);
            if (!tempTransform) continue;
            const r_rotation = reactive(object3D.rotation!);
            if (!EditorData.editorData.isWoldCoordinate && EditorData.editorData.isBaryCenter)
            {
                const newRot = this.rotateRotation(tempTransform.rotation, localNormal!, angle);
                r_rotation.x = newRot.x; r_rotation.y = newRot.y; r_rotation.z = newRot.z;
            }
            else
            {
                const axis = vec3Copy(normal);
                const parent = getLogic(object3D)?.parent as Object3D | null;
                const parentWorld2Local = parent ? getLogic(parent)?.world2local : null;
                if (parentWorld2Local) mat4TransformVector3(parentWorld2Local, axis, axis);
                if (EditorData.editorData.isBaryCenter)
                {
                    const newRot = this.rotateRotation(tempTransform.rotation, axis, angle);
                    r_rotation.x = newRot.x; r_rotation.y = newRot.y; r_rotation.z = newRot.z;
                }
                else
                {
                    // 环绕世界轴心旋转：位置绕轴心旋转 + 自身朝向旋转
                    // 阶段 C-e：`transformPoint3` 的缺省 out 是新建字面量（原实现也不改 `this._position`），
                    // 这里保留「有父级才产生新对象」的语义
                    let localPivotPoint: WritableVector3Like = this._position;
                    if (parentWorld2Local)
                    {
                        const transformed = { x: 0, y: 0, z: 0 };

                        mat4TransformPoint3(parentWorld2Local, localPivotPoint, transformed);
                        localPivotPoint = transformed;
                    }
                    const pivotMatrix = mat4FromPosition(tempTransform.position.x, tempTransform.position.y, tempTransform.position.z);
                    mat4AppendRotation(pivotMatrix, axis, angle, localPivotPoint, pivotMatrix);
                    const newPos = mat4GetPosition(pivotMatrix);
                    const r_position = reactive(object3D.position!);
                    r_position.x = newPos.x; r_position.y = newPos.y; r_position.z = newPos.z;
                    const newRot = this.rotateRotation(tempTransform.rotation, axis, angle);
                    r_rotation.x = newRot.x; r_rotation.y = newRot.y; r_rotation.z = newRot.z;
                }
            }
        }
    }

    /**
     * 按指定角旋转
     * @param angle1 第一方向旋转角度（弧度）
     * @param normal1 第一方向旋转轴
     * @param angle2 第二方向旋转角度（弧度）
     * @param normal2 第二方向旋转轴
     */
    rotate2(angle1: number, normal1: Vector3Like, angle2: number, normal2: Vector3Like)
    {
        const objects = this.transformObjects();
        const first = objects[0];
        const worldNormal1 = normal1;
        const worldNormal2 = normal2;
        if (!EditorData.editorData.isWoldCoordinate && EditorData.editorData.isBaryCenter)
        {
            const parent = first ? getLogic(first)?.parent as Object3D | null : null;
            const parentWorld2Local = parent ? getLogic(parent)?.world2local : null;
            if (parentWorld2Local)
            {
                // 阶段 C-e：就地写入（`worldNormal1/2` 是刚 clone 出来的副本，与原来的新对象语义一致）
                mat4TransformVector3(parentWorld2Local, normal1, worldNormal1);
                mat4TransformVector3(parentWorld2Local, normal2, worldNormal2);            }
        }
        for (let i = 0; i < objects.length; i++)
        {
            const object3D = objects[i];
            const tempsceneTransform = this._startTransformDic?.get(object3D);
            if (!tempsceneTransform) continue;
            const tempPosition = vec3Copy(tempsceneTransform.position);
            let tempRotation = vec3Copy(tempsceneTransform.rotation);
            const r_rotation = reactive(object3D.rotation!);
            if (!EditorData.editorData.isWoldCoordinate && EditorData.editorData.isBaryCenter)
            {
                tempRotation = this.rotateRotation(tempRotation, worldNormal2, angle2);
                const newRot = this.rotateRotation(tempRotation, worldNormal1, angle1);
                r_rotation.x = newRot.x; r_rotation.y = newRot.y; r_rotation.z = newRot.z;
            }
            else
            {
                const parent = getLogic(object3D)?.parent as Object3D | null;
                const parentWorld2Local = parent ? getLogic(parent)?.world2local : null;
                const localnormal1 = vec3Copy(worldNormal1);
                const localnormal2 = vec3Copy(worldNormal2);
                if (parentWorld2Local)
                {
                    mat4TransformVector3(parentWorld2Local, localnormal1, localnormal1);
                    mat4TransformVector3(parentWorld2Local, localnormal2, localnormal2);
                }
                if (EditorData.editorData.isBaryCenter)
                {
                    tempRotation = this.rotateRotation(tempRotation, localnormal1, angle1);
                    const newRot = this.rotateRotation(tempRotation, localnormal2, angle2);
                    r_rotation.x = newRot.x; r_rotation.y = newRot.y; r_rotation.z = newRot.z;
                }
                else
                {
                    let localPivotPoint: WritableVector3Like = this._position;
                    if (parentWorld2Local)
                    {
                        const transformed = { x: 0, y: 0, z: 0 };

                        mat4TransformPoint3(parentWorld2Local, localPivotPoint, transformed);
                        localPivotPoint = transformed;
                    }
                    //
                    const pivotMatrix1 = mat4FromPosition(tempPosition.x, tempPosition.y, tempPosition.z);
                    mat4AppendRotation(pivotMatrix1, localnormal1, angle1, localPivotPoint, pivotMatrix1);
                    mat4GetPosition(pivotMatrix1, tempPosition);
                    const pivotMatrix2 = mat4FromPosition(tempPosition.x, tempPosition.y, tempPosition.z);
                    mat4AppendRotation(pivotMatrix2, localnormal2, angle2, localPivotPoint, pivotMatrix2);
                    const newPos = mat4GetPosition(pivotMatrix2);
                    const r_position = reactive(object3D.position!);
                    r_position.x = newPos.x; r_position.y = newPos.y; r_position.z = newPos.z;

                    tempRotation = this.rotateRotation(tempRotation, localnormal1, angle1);
                    const newRot = this.rotateRotation(tempRotation, localnormal2, angle2);
                    r_rotation.x = newRot.x; r_rotation.y = newRot.y; r_rotation.z = newRot.z;
                }
            }
        }
    }

    stopRote()
    {
        // 置 null 表示"没有开始快照"；`null!` 只影响类型（运行时仍是 null）
        this._startTransformDic = null!;
    }

    startScale()
    {
        // 拖拽期间选中可能被清空（controllerTargets 置 null），此处必须防护
        if (!this._controllerTargets) return;
        for (let i = 0; i < this._controllerTargets.length; i++)
        {
            const s = this._controllerTargets[i].scale!;
            this._startScaleVec[i] = { x: s.x, y: s.y, z: s.z };
        }
    }

    doScale(scale: Vector3Like)
    {
        if (!this._controllerTargets) return;
        console.assert(!!vec3Length(scale));
        for (let i = 0; i < this._controllerTargets.length; i++)
        {
            const result = vec3Multiply(this._startScaleVec[i], scale);
            const r_scale = reactive(this._controllerTargets[i].scale!);
            r_scale.x = result.x;
            r_scale.y = result.y;
            r_scale.z = result.z;
        }
    }

    stopScale()
    {
        this._startScaleVec.length = 0;
    }

    /** 被操作对象 + 控制器对象的合集（变换需同时作用于两者） */
    private transformObjects(): Object3D[]
    {
        const objects = this._controllerTargets ? this._controllerTargets.concat() : [];
        if (this._controllerTool) objects.push(this._controllerTool);
        for (const object3D of objects) ensureTransform(object3D);

        return objects;
    }

    /** 记录所有被操作对象 + 控制器的初始变换快照 */
    private snapshotTransforms(): Map<Object3D, TransformData>
    {
        const dic = new Map<Object3D, TransformData>();
        for (const object3D of this.transformObjects())
        {
            dic.set(object3D, this.getTransformData(object3D));
        }

        return dic;
    }

    private getTransformData(object3D: Object3D): TransformData
    {
        const position = object3D.position!;
        const rotation = object3D.rotation!;
        const scale = object3D.scale!;

        return {
            position: { x: position.x, y: position.y, z: position.z },
            rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
            scale: { x: scale.x, y: scale.y, z: scale.z },
        };
    }

    /**
     * 在初始朝向上叠加一次绕轴旋转（返回新的欧拉角，弧度）。
     *
     * 旧实现按角度书写（`/ 180`、`toround(..., 360)`），此处整体换算为弧度。
     */
    private rotateRotation(rotation: Vector3Like, axis: Vector3Like, angle: number): WritableVector3Like
    {
        // 阶段 C-e：`Matrix4x4` 的 class 已删除，`fromRotation` / `appendRotation` / `toTRS()[1]`
        // 换成纯函数；`mat4GetRotation` 与 `toTRS()[1]` 是同一份欧拉角分解
        const rotationmatrix = mat4FromRotation(rotation.x, rotation.y, rotation.z);

        mat4AppendRotation(rotationmatrix, axis, angle, undefined, rotationmatrix);
        const newrotation = { x: 0, y: 0, z: 0 };

        mat4GetRotation(rotationmatrix, newrotation);
        const v = Math.round((newrotation.x - rotation.x) / Math.PI);
        if (v % 2 !== 0)
        {
            newrotation.x += Math.PI;
            newrotation.y = Math.PI - newrotation.y;
            newrotation.z += Math.PI;
        }

        function toround(a: number, b: number, c = Math.PI * 2)
        {
            return Math.round((b - a) / c) * c + a;
        }

        newrotation.x = toround(newrotation.x, rotation.x);
        newrotation.y = toround(newrotation.y, rotation.y);
        newrotation.z = toround(newrotation.z, rotation.z);

        return newrotation;
    }
}

/**
 * 确保对象具备**可逐分量读写**的本地变换数据。
 *
 * 新范式中 `position` / `rotation` / `scale` 的默认值由 `Object3DLogic` 提供，**raw 数据里
 * 可以缺失**；而本类需要逐分量读写这些字段，因此在触达前补齐。
 *
 * 判据是"**能不能用**"而不是"有没有值"（issue #184）：属性面板失焦时会把展示文本
 * `" (Object)"` 写回字段，那是 truthy 的字符串，`r_position.x = …` 直接抛
 * `Cannot create property 'x' on string`（用户报的现场，未捕获 TypeError 打断拖动）。
 * 损坏的字段在这里按默认值重建，并报一次（不刷屏）——体检的 `invalid-field` 会给定位。
 *
 * @param object3D 目标对象
 */
function ensureTransform(object3D: Object3D): void
{
    const defaults = {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
    };

    let r_object3D: Record<string, unknown> | null = null;

    for (const field of ['position', 'rotation', 'scale'] as const)
    {
        const value = object3D[field] as unknown;
        // 缺失：合法（默认值由 Object3DLogic 提供），静默补齐
        if (value === undefined || value === null)
        {
            r_object3D = r_object3D ?? (reactive(object3D) as unknown as Record<string, unknown>);
            r_object3D[field] = defaults[field];
            continue;
        }
        if (isVector3Like(value)) continue;

        reportBrokenTransform(object3D, field, value);
        r_object3D = r_object3D ?? (reactive(object3D) as unknown as Record<string, unknown>);
        r_object3D[field] = defaults[field];
    }
}

/** 已报告过"变换字段损坏"的对象（lazy-init：模块级不得有副作用，见根规范 R2） */
let _reportedBrokenTransform: WeakSet<object> | null = null;

/**
 * 报告一次变换字段损坏（同一对象只报一次）。
 *
 * @param object3D 目标对象
 * @param field 字段名
 * @param value 损坏的值
 */
function reportBrokenTransform(object3D: Object3D, field: string, value: unknown): void
{
    _reportedBrokenTransform = _reportedBrokenTransform ?? new WeakSet<object>();
    if (_reportedBrokenTransform.has(object3D)) return;
    _reportedBrokenTransform.add(object3D);

    console.error(`[MRSTool] 「${object3D.name ?? '(未命名)'}」的 ${field} 不是 { x, y, z } 对象`
        + `（实际是 ${typeof value}：${JSON.stringify(value)}）——已重建为默认值；`
        + '这类损坏常见于属性面板把展示文本写回数据，可用 scene.validate 的 invalid-field 定位');
}

/** 对象世界坐标（`logic` 未就绪时退化为原点） */
function worldPosition(object3D: Object3D): WritableVector3Like
{
    return getLogic(object3D)?.worldPosition ?? { x: 0, y: 0, z: 0 };
}

interface TransformData
{
    position: WritableVector3Like, rotation: WritableVector3Like, scale: WritableVector3Like
}
