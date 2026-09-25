import { Transform, Vector3, globalEmitter, ticker, Matrix4x4, reactive, logic } from 'feng3d';
import { EditorData } from '../../global/EditorData';

export class MRSToolTarget
{
    //
    private _controllerTargets: Transform[];
    private _startScaleVec: Vector3[] = [];
    private _controllerTool: Transform;
    private _startTransformDic: Map<Transform, TransformData>;

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

    set controllerTargets(value: Transform[])
    {
        // TODO: Transform refactor removed events; scenetransformChanged is now an Object3D event.
        // Rewire via reactive watch on Object3D if invalidateControllerImage is needed.
        this._controllerTargets = value;
        this.invalidateControllerImage();
    }

    constructor()
    {
        globalEmitter.on('editor.isWoldCoordinateChanged', this.invalidateControllerImage, this);
        globalEmitter.on('editor.isBaryCenterChanged', this.invalidateControllerImage, this);
        //
        globalEmitter.on('editor.selectedObjectsChanged', this.onSelectedObject3DChange, this);
    }

    private onSelectedObject3DChange()
    {
        // 筛选出 工具控制的对象
        const transforms = <Transform[]>EditorData.editorData.selectedObject3Ds.reduce((result, item) =>
        {
            result.push(item.transform);

            return result;
        }, []);
        if (transforms.length > 0)
        {
            this.controllerTargets = transforms;
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
            position.copy(logic(transform).worldPosition);
        }
        else
        {
            for (let i = 0; i < this._controllerTargets.length; i++)
            {
                position.add(logic(this._controllerTargets[i]).worldPosition);
            }
            position.scaleNumber(1 / this._controllerTargets.length);
        }
        let rotation = new Vector3();
        if (!EditorData.editorData.isWoldCoordinate)
        {
            rotation = new Vector3(this._controllerTargets[0].rotation.x, this._controllerTargets[0].rotation.y, this._controllerTargets[0].rotation.z);
        }
        this._position = position;
        this._rotation = rotation;
        if (this._controllerTool)
        {
            const rp = reactive(this._controllerTool.position);
            rp.x = position.x; rp.y = position.y; rp.z = position.z;
            const rr = reactive(this._controllerTool.rotation);
            rr.x = rotation.x; rr.y = rotation.y; rr.z = rotation.z;
        }
    }

    /**
     * 开始移动
     */
    startTranslation()
    {
        this._startTransformDic = new Map<Transform, TransformData>();
        const objects = this._controllerTargets.concat();
        objects.push(this._controllerTool);
        for (let i = 0; i < objects.length; i++)
        {
            const transform = objects[i];
            this._startTransformDic.set(transform, this.getTransformData(transform));
        }
    }

    translation(addPos: Vector3)
    {
        if (!this._controllerTargets)
        { return; }
        const objects = this._controllerTargets.concat();
        objects.push(this._controllerTool);
        for (let i = 0; i < objects.length; i++)
        {
            const object3D = objects[i];
            const transform = this._startTransformDic.get(object3D);
            let localMove = addPos.clone();
            if (object3D.parent)
            { localMove = logic(object3D.parent).world2local.value.transformVector3(localMove); }
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
        this._startTransformDic = new Map<Transform, TransformData>();
        const objects = this._controllerTargets.concat();
        objects.push(this._controllerTool);
        for (let i = 0; i < objects.length; i++)
        {
            const transform = objects[i];
            this._startTransformDic.set(transform, this.getTransformData(transform));
        }
    }

    /**
     * 绕指定轴旋转
     * @param angle 旋转角度
     * @param normal 旋转轴
     */
    rotate1(angle: number, normal: Vector3)
    {
        const objects = this._controllerTargets.concat();
        objects.push(this._controllerTool);
        let localnormal: Vector3;
        let object3D = objects[0];
        if (!EditorData.editorData.isWoldCoordinate && EditorData.editorData.isBaryCenter)
        {
            if (object3D.parent)
            { localnormal = logic(object3D.parent).world2local.value.transformVector3(normal); }
        }
        for (let i = 0; i < objects.length; i++)
        {
            object3D = objects[i];
            const tempTransform = this._startTransformDic.get(object3D);
            const rr = reactive(object3D.rotation);
            if (!EditorData.editorData.isWoldCoordinate && EditorData.editorData.isBaryCenter)
            {
                const newRot = this.rotateRotation(tempTransform.rotation, localnormal, angle);
                rr.x = newRot.x; rr.y = newRot.y; rr.z = newRot.z;
            }
            else
            {
                localnormal = normal.clone();
                if (object3D.parent)
                { localnormal = logic(object3D.parent).world2local.value.transformVector3(localnormal); }
                if (EditorData.editorData.isBaryCenter)
                {
                    const newRot = this.rotateRotation(tempTransform.rotation, localnormal, angle);
                    rr.x = newRot.x; rr.y = newRot.y; rr.z = newRot.z;
                }
                else
                {
                    let localPivotPoint = this._position;
                    if (object3D.parent)
                    { localPivotPoint = logic(object3D.parent).world2local.value.transformPoint3(localPivotPoint); }
                    const newPos = Matrix4x4.fromPosition(tempTransform.position.x, tempTransform.position.y, tempTransform.position.z).appendRotation(localnormal, angle, localPivotPoint).getPosition();
                    const rp = reactive(object3D.position);
                    rp.x = newPos.x; rp.y = newPos.y; rp.z = newPos.z;
                    const newRot = this.rotateRotation(tempTransform.rotation, localnormal, angle);
                    rr.x = newRot.x; rr.y = newRot.y; rr.z = newRot.z;
                }
            }
        }
    }

    /**
     * 按指定角旋转
     * @param angle1 第一方向旋转角度
     * @param normal1 第一方向旋转轴
     * @param angle2 第二方向旋转角度
     * @param normal2 第二方向旋转轴
     */
    rotate2(angle1: number, normal1: Vector3, angle2: number, normal2: Vector3)
    {
        const objects = this._controllerTargets.concat();
        objects.push(this._controllerTool);
        let object3D = objects[0];
        if (!EditorData.editorData.isWoldCoordinate && EditorData.editorData.isBaryCenter)
        {
            if (object3D.parent)
            {
                normal1 = logic(object3D.parent).world2local.value.transformVector3(normal1);
                normal2 = logic(object3D.parent).world2local.value.transformVector3(normal2);
            }
        }
        for (let i = 0; i < objects.length; i++)
        {
            object3D = objects[i];
            const tempsceneTransform = this._startTransformDic.get(object3D);
            let tempPosition = tempsceneTransform.position.clone();
            let tempRotation = tempsceneTransform.rotation.clone();
            const rr = reactive(object3D.rotation);
            if (!EditorData.editorData.isWoldCoordinate && EditorData.editorData.isBaryCenter)
            {
                tempRotation = this.rotateRotation(tempRotation, normal2, angle2);
                const newRot = this.rotateRotation(tempRotation, normal1, angle1);
                rr.x = newRot.x; rr.y = newRot.y; rr.z = newRot.z;
            }
            else
            {
                let localnormal1 = normal1.clone();
                let localnormal2 = normal2.clone();
                if (object3D.parent)
                {
                    localnormal1 = logic(object3D.parent).world2local.value.transformVector3(localnormal1);
                    localnormal2 = logic(object3D.parent).world2local.value.transformVector3(localnormal2);
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
                    if (object3D.parent)
                    { localPivotPoint = logic(object3D.parent).world2local.value.transformPoint3(localPivotPoint); }
                    //
                    tempPosition = Matrix4x4.fromPosition(tempPosition.x, tempPosition.y, tempPosition.z).appendRotation(localnormal1, angle1, localPivotPoint).getPosition();
                    const newPos = Matrix4x4.fromPosition(tempPosition.x, tempPosition.y, tempPosition.z).appendRotation(localnormal1, angle1, localPivotPoint).getPosition();
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

    private getTransformData(transform: Transform)
    {
        return {
            position: new Vector3(transform.position.x, transform.position.y, transform.position.z),
            rotation: new Vector3(transform.rotation.x, transform.rotation.y, transform.rotation.z),
            scale: new Vector3(transform.scale.x, transform.scale.y, transform.scale.z),
        };
    }

    private rotateRotation(rotation: Vector3, axis: Vector3, angle)
    {
        const rotationmatrix = new Matrix4x4();
        rotationmatrix.fromRotation(rotation.x, rotation.y, rotation.z);
        rotationmatrix.appendRotation(axis, angle);
        const newrotation = rotationmatrix.toTRS()[1];
        const v = Math.round((newrotation.x - rotation.x) / 180);
        if (v % 2 !== 0)
        {
            newrotation.x += 180;
            newrotation.y = 180 - newrotation.y;
            newrotation.z += 180;
        }

        function toround(a: number, b: number, c = 360)
        {
            return Math.round((b - a) / c) * c + a;
        }

        newrotation.x = toround(newrotation.x, rotation.x);
        newrotation.y = toround(newrotation.y, rotation.y);
        newrotation.z = toround(newrotation.z, rotation.z);

        return newrotation;
    }
}

interface TransformData
{
    position: Vector3, rotation: Vector3, scale: Vector3
}
