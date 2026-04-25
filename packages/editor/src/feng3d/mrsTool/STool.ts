import { RegisterComponent, Vector2, Vector3, GameObject, IEvent, shortcut, Plane, windowEventProxy } from 'feng3d';
import { editorui } from '../../global/editorui';
import { SToolModel } from './models/SToolModel';
import { MRSToolBase } from './MRSToolBase';

declare global
{
    export interface MixinsComponentMap
    {
        STool: STool
    }
}

export interface STool
{
    get toolModel(): SToolModel;
    set toolModel(v: SToolModel);
}

@RegisterComponent()
export class STool extends MRSToolBase
{
    private startMousePos: Vector2;
    /**
     * 用于判断是否改变了XYZ
     */
    private changeXYZ = new Vector3();
    private startPlanePos: Vector3;

    init()
    {
        super.init();
        this.toolModel = new GameObject().addComponent(SToolModel);
    }

    protected onAddedToScene()
    {
        super.onAddedToScene();

        this.toolModel.xCube.on('mousedown', this.onItemMouseDown, this);
        this.toolModel.yCube.on('mousedown', this.onItemMouseDown, this);
        this.toolModel.zCube.on('mousedown', this.onItemMouseDown, this);
        this.toolModel.oCube.on('mousedown', this.onItemMouseDown, this);
    }

    protected onRemovedFromScene()
    {
        super.onRemovedFromScene();

        this.toolModel.xCube.off('mousedown', this.onItemMouseDown, this);
        this.toolModel.yCube.off('mousedown', this.onItemMouseDown, this);
        this.toolModel.zCube.off('mousedown', this.onItemMouseDown, this);
        this.toolModel.oCube.off('mousedown', this.onItemMouseDown, this);
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
        const po = globalMatrix.transformPoint3(new Vector3(0, 0, 0));
        const px = globalMatrix.transformPoint3(new Vector3(1, 0, 0));
        const py = globalMatrix.transformPoint3(new Vector3(0, 1, 0));
        const pz = globalMatrix.transformPoint3(new Vector3(0, 0, 1));
        //
        const ox = px.subTo(po);
        const oy = py.subTo(po);
        const oz = pz.subTo(po);
        // 摄像机前方方向
        const cameraSceneTransform = this.editorCamera.transform.localToWorldMatrix;
        const cameraDir = cameraSceneTransform.getAxisZ();
        this.movePlane3D = new Plane();
        switch (event.currentTarget)
        {
            case this.toolModel.xCube:
                this.selectedItem = this.toolModel.xCube;
                this.movePlane3D.fromNormalAndPoint(cameraDir.crossTo(ox).crossTo(ox), po);
                this.changeXYZ.set(1, 0, 0);
                break;
            case this.toolModel.yCube:
                this.selectedItem = this.toolModel.yCube;
                this.movePlane3D.fromNormalAndPoint(cameraDir.crossTo(oy).crossTo(oy), po);
                this.changeXYZ.set(0, 1, 0);
                break;
            case this.toolModel.zCube:
                this.selectedItem = this.toolModel.zCube;
                this.movePlane3D.fromNormalAndPoint(cameraDir.crossTo(oz).crossTo(oz), po);
                this.changeXYZ.set(0, 0, 1);
                break;
            case this.toolModel.oCube:
                this.selectedItem = this.toolModel.oCube;
                this.startMousePos = new Vector2(editorui.stage.stageX, editorui.stage.stageY);
                this.changeXYZ.set(1, 1, 1);
                break;
        }
        this.startSceneTransform = globalMatrix.clone();
        this.startPlanePos = this.getLocalMousePlaneCross();

        this.mrsToolTarget.startScale();
        //
        windowEventProxy.on('mousemove', this.onMouseMove, this);
    }

    private onMouseMove()
    {
        const addPos = new Vector3();
        const addScale = new Vector3();
        if (this.selectedItem === this.toolModel.oCube)
        {
            const currentMouse = new Vector2(editorui.stage.stageX, editorui.stage.stageY);
            const distance = currentMouse.x - currentMouse.y - this.startMousePos.x + this.startMousePos.y;
            addPos.set(distance, distance, distance);
            const scale = 1 + (addPos.x + addPos.y) / editorui.stage.stageHeight;
            addScale.set(scale, scale, scale);
        }
        else
        {
            const crossPos = this.getLocalMousePlaneCross();
            const offset = crossPos.subTo(this.startPlanePos);
            if (this.changeXYZ.x && this.startPlanePos.x && offset.x !== 0)
            {
                addScale.x = offset.x / this.startPlanePos.x;
            }
            if (this.changeXYZ.y && this.startPlanePos.y && offset.y !== 0)
            {
                addScale.y = offset.y / this.startPlanePos.y;
            }
            if (this.changeXYZ.z && this.startPlanePos.z && offset.z !== 0)
            {
                addScale.z = offset.z / this.startPlanePos.z;
            }
            addScale.x += 1;
            addScale.y += 1;
            addScale.z += 1;
        }
        this.mrsToolTarget.doScale(addScale);
        //
        this.toolModel.xCube.scaleValue = addScale.x;
        this.toolModel.yCube.scaleValue = addScale.y;
        this.toolModel.zCube.scaleValue = addScale.z;
    }

    protected onMouseUp()
    {
        super.onMouseUp();
        windowEventProxy.off('mousemove', this.onMouseMove, this);

        this.mrsToolTarget.stopScale();
        this.startPlanePos = null;
        this.startSceneTransform = null;
        //
        this.toolModel.xCube.scaleValue = 1;
        this.toolModel.yCube.scaleValue = 1;
        this.toolModel.zCube.scaleValue = 1;
    }
}
