import { globalEmitter, logic as getLogic, Matrix4x4, reactive, ticker, Vector3 } from 'feng3d';
import type { Object3D } from 'feng3d';
import { EditorData } from '../../global/EditorData';

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
            ensureTransform(this._controllerTool);
            // §8.4：从 raw 读当前值，向响应式代理写新值
            const rp = reactive(this._controllerTool.position);
            rp.x = this._position.x; rp.y = this._position.y; rp.z = this._position.z;
            const rr = reactive(this._controllerTool.rotation);
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
            this.controllerTargets = null;
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
        const position = new Vector3();
        if (EditorData.editorData.isBaryCenter)
        {
            // 轴心模式：直接用最后一个对象的世界坐标
            position.copy(worldPosition(transform));
        }
        else
        {
            // 平均模式：所有被操作对象世界坐标的几何中心
            for (let i = 0; i < this._controllerTargets.length; i++)
            {
                position.add(worldPosition(this._controllerTargets[i]));
            }
            position.scaleNumber(1 / this._controllerTargets.length);
        }
        let rotation = new Vector3();
        if (!EditorData.editorData.isWoldCoordinate)
        {
            const r = this._controllerTargets[0].rotation;
            rotation = new Vector3(r.x, r.y, r.z);
        }
        this._position = position;
        this._rotation = rotation;
        this.writeControllerTransform(position, rotation);
    }

    /** 把位置/朝向写入控制器对象（工具 gizmo 的宿主） */
    private writeControllerTransform(position: Vector3, rotation: Vector3): void
    {
        if (!this._controllerTool) return;
        const rp = reactive(this._controllerTool.position);
        rp.x = position.x; rp.y = position.y; rp.z = position.z;
        const rr = reactive(this._controllerTool.rotation);
        rr.x = rotation.x; rr.y = rotation.y; rr.z = rotation.z;
    }

    /**
     * 开始移动
     */
    startTranslation()
    {
        this._startTransformDic = this.snapshotTransforms();
    }

    translation(addPos: Vector3)
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
            let localMove = addPos.clone();
            const parent = getLogic(object3D)?.parent as Object3D | null;
            const parentWorld2Local = parent ? getLogic(parent)?.world2local : null;
            if (parentWorld2Local) localMove = parentWorld2Local.transformVector3(localMove);
            const newPos = transform.position.addTo(localMove);
            const rp = reactive(object3D.position);
            rp.x = newPos.x; rp.y = newPos.y; rp.z = newPos.z;
        }
    }

    stopTranslation()
    {
        this._startTransformDic = null;
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
    rotate1(angle: number, normal: Vector3)
    {
        const objects = this.transformObjects();
        const first = objects[0];
        let localNormal: Vector3;
        if (!EditorData.editorData.isWoldCoordinate && EditorData.editorData.isBaryCenter)
        {
            const parent = first ? getLogic(first)?.parent as Object3D | null : null;
            if (parent) localNormal = getLogic(parent)?.world2local.transformVector3(normal);
        }
        for (let i = 0; i < objects.length; i++)
        {
            const object3D = objects[i];
            const tempTransform = this._startTransformDic?.get(object3D);
            if (!tempTransform) continue;
            const rr = reactive(object3D.rotation);
            if (!EditorData.editorData.isWoldCoordinate && EditorData.editorData.isBaryCenter)
            {
                const newRot = this.rotateRotation(tempTransform.rotation, localNormal, angle);
                rr.x = newRot.x; rr.y = newRot.y; rr.z = newRot.z;
            }
            else
            {
                let axis = normal.clone();
                const parent = getLogic(object3D)?.parent as Object3D | null;
                const parentWorld2Local = parent ? getLogic(parent)?.world2local : null;
                if (parentWorld2Local) axis = parentWorld2Local.transformVector3(axis);
                if (EditorData.editorData.isBaryCenter)
                {
                    const newRot = this.rotateRotation(tempTransform.rotation, axis, angle);
                    rr.x = newRot.x; rr.y = newRot.y; rr.z = newRot.z;
                }
                else
                {
                    // 环绕世界轴心旋转：位置绕轴心旋转 + 自身朝向旋转
                    let localPivotPoint = this._position;
                    if (parentWorld2Local) localPivotPoint = parentWorld2Local.transformPoint3(localPivotPoint);
                    const newPos = Matrix4x4.fromPosition(tempTransform.position.x, tempTransform.position.y, tempTransform.position.z)
                        .appendRotation(axis, angle, localPivotPoint).getPosition();
                    const rp = reactive(object3D.position);
                    rp.x = newPos.x; rp.y = newPos.y; rp.z = newPos.z;
                    const newRot = this.rotateRotation(tempTransform.rotation, axis, angle);
                    rr.x = newRot.x; rr.y = newRot.y; rr.z = newRot.z;
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
    rotate2(angle1: number, normal1: Vector3, angle2: number, normal2: Vector3)
    {
        const objects = this.transformObjects();
        const first = objects[0];
        let worldNormal1 = normal1;
        let worldNormal2 = normal2;
        if (!EditorData.editorData.isWoldCoordinate && EditorData.editorData.isBaryCenter)
        {
            const parent = first ? getLogic(first)?.parent as Object3D | null : null;
            const parentWorld2Local = parent ? getLogic(parent)?.world2local : null;
            if (parentWorld2Local)
            {
                worldNormal1 = parentWorld2Local.transformVector3(normal1);
                worldNormal2 = parentWorld2Local.transformVector3(normal2);
            }
        }
        for (let i = 0; i < objects.length; i++)
        {
            const object3D = objects[i];
            const tempsceneTransform = this._startTransformDic?.get(object3D);
            if (!tempsceneTransform) continue;
            let tempPosition = tempsceneTransform.position.clone();
            let tempRotation = tempsceneTransform.rotation.clone();
            const rr = reactive(object3D.rotation);
            if (!EditorData.editorData.isWoldCoordinate && EditorData.editorData.isBaryCenter)
            {
                tempRotation = this.rotateRotation(tempRotation, worldNormal2, angle2);
                const newRot = this.rotateRotation(tempRotation, worldNormal1, angle1);
                rr.x = newRot.x; rr.y = newRot.y; rr.z = newRot.z;
            }
            else
            {
                const parent = getLogic(object3D)?.parent as Object3D | null;
                const parentWorld2Local = parent ? getLogic(parent)?.world2local : null;
                let localnormal1 = worldNormal1.clone();
                let localnormal2 = worldNormal2.clone();
                if (parentWorld2Local)
                {
                    localnormal1 = parentWorld2Local.transformVector3(localnormal1);
                    localnormal2 = parentWorld2Local.transformVector3(localnormal2);
                }
                if (EditorData.editorData.isBaryCenter)
                {
                    tempRotation = this.rotateRotation(tempRotation, localnormal1, angle1);
                    const newRot = this.rotateRotation(tempRotation, localnormal2, angle2);
                    rr.x = newRot.x; rr.y = newRot.y; rr.z = newRot.z;
                }
                else
                {
                    let localPivotPoint = this._position;
                    if (parentWorld2Local) localPivotPoint = parentWorld2Local.transformPoint3(localPivotPoint);
                    //
                    tempPosition = Matrix4x4.fromPosition(tempPosition.x, tempPosition.y, tempPosition.z)
                        .appendRotation(localnormal1, angle1, localPivotPoint).getPosition();
                    const newPos = Matrix4x4.fromPosition(tempPosition.x, tempPosition.y, tempPosition.z)
                        .appendRotation(localnormal2, angle2, localPivotPoint).getPosition();
                    const rp = reactive(object3D.position);
                    rp.x = newPos.x; rp.y = newPos.y; rp.z = newPos.z;

                    tempRotation = this.rotateRotation(tempRotation, localnormal1, angle1);
                    const newRot = this.rotateRotation(tempRotation, localnormal2, angle2);
                    rr.x = newRot.x; rr.y = newRot.y; rr.z = newRot.z;
                }
            }
        }
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
        const position = object3D.position;
        const rotation = object3D.rotation;
        const scale = object3D.scale;

        return {
            position: new Vector3(position.x, position.y, position.z),
            rotation: new Vector3(rotation.x, rotation.y, rotation.z),
            scale: new Vector3(scale.x, scale.y, scale.z),
        };
    }

    /**
     * 在初始朝向上叠加一次绕轴旋转（返回新的欧拉角，弧度）。
     *
     * 旧实现按角度书写（`/ 180`、`toround(..., 360)`），此处整体换算为弧度。
     */
    private rotateRotation(rotation: Vector3, axis: Vector3, angle: number): Vector3
    {
        const rotationmatrix = new Matrix4x4();
        rotationmatrix.fromRotation(rotation.x, rotation.y, rotation.z);
        rotationmatrix.appendRotation(axis, angle);
        const newrotation = rotationmatrix.toTRS()[1];
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
 * 确保对象具备本地变换数据。
 *
 * 新范式中 `position` / `rotation` / `scale` 的默认值由 `Object3DLogic` 提供，**raw 数据里
 * 可以缺失**；而本类需要逐分量读写这些字段，因此在触达前补齐（缺失时按默认值写入）。
 */
function ensureTransform(object3D: Object3D): void
{
    if (object3D.position && object3D.rotation && object3D.scale) return;

    const r_object3D = reactive(object3D);
    if (!object3D.position) r_object3D.position = { x: 0, y: 0, z: 0 };
    if (!object3D.rotation) r_object3D.rotation = { x: 0, y: 0, z: 0 };
    if (!object3D.scale) r_object3D.scale = { x: 1, y: 1, z: 1 };
}

/** 对象世界坐标（`logic` 未就绪时退化为原点） */
function worldPosition(object3D: Object3D): Vector3
{
    return getLogic(object3D)?.worldPosition ?? new Vector3();
}

interface TransformData
{
    position: Vector3, rotation: Vector3, scale: Vector3
}
