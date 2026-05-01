import { RegisterComponent, Vector3, Vector2, GameObject, IEvent, shortcut, Plane, windowEventProxy, mathUtil } from 'feng3d';
import { editorui } from '../../global/editorui';
import { RToolModel, CoordinateRotationAxis } from './models/RToolModel';
import { MRSToolBase } from './MRSToolBase';

declare global
{
    export interface ComponentMap { RTool: RTool }
}

export interface RTool
{
    get toolModel(): RToolModel;
    set toolModel(v);
}

@RegisterComponent()
export class RTool extends MRSToolBase
{
    private startPlanePos: Vector3;
    private stepPlaneCross: Vector3;
    private startMousePos: Vector2;

    init()
    {
        super.init();
        this.toolModel = new GameObject().addComponent(RToolModel);
    }
    protected onAddedToScene()
    {
        super.onAddedToScene();

        this.toolModel.xAxis.on('mousedown', this.onItemMouseDown, this);
        this.toolModel.yAxis.on('mousedown', this.onItemMouseDown, this);
        this.toolModel.zAxis.on('mousedown', this.onItemMouseDown, this);
        this.toolModel.freeAxis.on('mousedown', this.onItemMouseDown, this);
        this.toolModel.cameraAxis.on('mousedown', this.onItemMouseDown, this);
    }

    protected onRemovedFromScene()
    {
        super.onRemovedFromScene();

        this.toolModel.xAxis.off('mousedown', this.onItemMouseDown, this);
        this.toolModel.yAxis.off('mousedown', this.onItemMouseDown, this);
        this.toolModel.zAxis.off('mousedown', this.onItemMouseDown, this);
        this.toolModel.freeAxis.off('mousedown', this.onItemMouseDown, this);
        this.toolModel.cameraAxis.off('mousedown', this.onItemMouseDown, this);
    }

    protected onItemMouseDown(event: IEvent<any>)
    {
        if (!shortcut.getState('mouseInView3D')) return;
        if (shortcut.keyState.getKeyState('alt')) return;
        if (!this.editorCamera) return;

        super.onItemMouseDown(event);
        // 全局矩阵
        const globalMatrix = this.transform.localToWorldMatrix;
        // 中心与X,Y,Z轴上点坐标
        const pos = globalMatrix.getPosition();
        const xDir = globalMatrix.getAxisX();
        const yDir = globalMatrix.getAxisY();
        const zDir = globalMatrix.getAxisZ();
        // 摄像机前方方向
        const cameraSceneTransform = this.editorCamera.transform.localToWorldMatrix;
        const cameraDir = cameraSceneTransform.getAxisZ();
        this.movePlane3D = new Plane();
        switch (event.currentTarget)
        {
            case this.toolModel.xAxis:
                this.selectedItem = this.toolModel.xAxis;
                this.movePlane3D.fromNormalAndPoint(xDir, pos);
                break;
            case this.toolModel.yAxis:
                this.selectedItem = this.toolModel.yAxis;
                this.movePlane3D.fromNormalAndPoint(yDir, pos);
                break;
            case this.toolModel.zAxis:
                this.selectedItem = this.toolModel.zAxis;
                this.selectedItem = this.toolModel.zAxis;
                this.movePlane3D.fromNormalAndPoint(zDir, pos);
                break;
            case this.toolModel.freeAxis:
                this.selectedItem = this.toolModel.freeAxis;
                this.movePlane3D.fromNormalAndPoint(cameraDir, pos);
                break;
            case this.toolModel.cameraAxis:
                this.selectedItem = this.toolModel.cameraAxis;
                this.movePlane3D.fromNormalAndPoint(cameraDir, pos);
                break;
        }
        this.startPlanePos = this.getMousePlaneCross();
        this.stepPlaneCross = this.startPlanePos.clone();
        //
        this.startMousePos = new Vector2(editorui.stage.stageX, editorui.stage.stageY);
        this.startSceneTransform = globalMatrix.clone();
        this.mrsToolTarget.startRotate();
        //
        windowEventProxy.on('mousemove', this.onMouseMove, this);
    }

    private onMouseMove()
    {
        if (!this.editorCamera) return;

        switch (this.selectedItem)
        {
            case this.toolModel.xAxis:
            case this.toolModel.yAxis:
            case this.toolModel.zAxis:
            case this.toolModel.cameraAxis:
                const origin = this.startSceneTransform.getPosition();
                const planeCross = this.getMousePlaneCross();
                const startDir = this.stepPlaneCross.subTo(origin);
                startDir.normalize();
                const endDir = planeCross.subTo(origin);
                endDir.normalize();
                // 计算夹角
                let cosValue = startDir.dot(endDir);
                cosValue = mathUtil.clamp(cosValue, -1, 1);
                let angle = Math.acos(cosValue) * mathUtil.RAD2DEG;
                // 计算是否顺时针
                let sign = this.movePlane3D.getNormal().cross(startDir).dot(endDir);
                sign = sign > 0 ? 1 : -1;
                angle = angle * sign;
                //
                this.mrsToolTarget.rotate1(angle, this.movePlane3D.getNormal());
                this.stepPlaneCross.copy(planeCross);
                this.mrsToolTarget.startRotate();
                // 绘制扇形区域
                if (this.selectedItem instanceof CoordinateRotationAxis)
                {
                    this.selectedItem.showSector(this.startPlanePos, planeCross);
                }
                break;
            case this.toolModel.freeAxis:
                const endPoint = new Vector2(editorui.stage.stageX, editorui.stage.stageY);
                const offset = endPoint.subTo(this.startMousePos);
                const cameraSceneTransform = this.editorCamera.transform.localToWorldMatrix;
                const right = cameraSceneTransform.getAxisX();
                const up = cameraSceneTransform.getAxisY();
                this.mrsToolTarget.rotate2(-offset.y, right, -offset.x, up);
                //
                this.startMousePos = endPoint;
                this.mrsToolTarget.startRotate();
                break;
        }
    }

    protected onMouseUp()
    {
        super.onMouseUp();
        windowEventProxy.off('mousemove', this.onMouseMove, this);

        if (this.selectedItem instanceof CoordinateRotationAxis)
        {
            this.selectedItem.hideSector();
        }

        this.mrsToolTarget.stopRote();
        this.startMousePos = null;
        this.startPlanePos = null;
        this.startSceneTransform = null;
    }

    protected updateToolModel()
    {
        if (!this.editorCamera) return;

        const cameraSceneTransform = this.editorCamera.transform.localToWorldMatrix.clone();
        const cameraDir = cameraSceneTransform.getAxisZ();
        cameraDir.negate();
        //
        const xyzAxis = [this.toolModel.xAxis, this.toolModel.yAxis, this.toolModel.zAxis];
        for (let i = 0; i < xyzAxis.length; i++)
        {
            const axis = xyzAxis[i];
            axis.filterNormal = cameraDir;
        }
        // 朝向摄像机
        const temp = cameraSceneTransform.clone();
        temp.append(this.toolModel.transform.worldToLocalMatrix);
        const rotation = temp.toTRS()[1];
        this.toolModel.freeAxis.transform.rotation = rotation;
        this.toolModel.cameraAxis.transform.rotation = rotation;
    }
}
