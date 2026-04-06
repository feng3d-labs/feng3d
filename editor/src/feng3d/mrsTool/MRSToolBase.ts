import { Camera, Component, HoldSizeComponent, IEvent, Matrix4x4, Plane, shortcut, ticker, Vector3, windowEventProxy } from 'feng3d';
import { CoordinateAxis, CoordinateCube, CoordinatePlane } from './models/MToolModel';
import { CoordinateRotationAxis, CoordinateRotationFreeAxis } from './models/RToolModel';
import { CoordinateScaleCube } from './models/SToolModel';
import { MRSToolTarget } from './MRSToolTarget';

export class MRSToolBase extends Component
{
    private _selectedItem: CoordinateAxis | CoordinatePlane | CoordinateCube | CoordinateScaleCube | CoordinateRotationAxis | CoordinateRotationFreeAxis;
    //
    private _toolModel: Component;

    protected ismouseDown = false;

    // 平移平面，该平面处于场景空间，用于计算位移量
    protected movePlane3D: Plane;
    protected startSceneTransform: Matrix4x4;

    get editorCamera() { return this._editorCamera; }
    set editorCamera(v) { this._editorCamera = v; this.invalidate(); }
    private _editorCamera: Camera;

    mrsToolTarget: MRSToolTarget;

    init()
    {
        super.init();
        const holdSizeComponent = this.gameObject.addComponent(HoldSizeComponent);
        holdSizeComponent.holdSize = 0.005;
        //
        this.on('addedToScene', this.onAddedToScene, this);
        this.on('removedFromScene', this.onRemovedFromScene, this);
    }

    protected onAddedToScene()
    {
        this.mrsToolTarget.controllerTool = this.transform;
        //
        windowEventProxy.on('mousedown', this.onMouseDown, this);
        windowEventProxy.on('mouseup', this.onMouseUp, this);

        ticker.onframe(this.updateToolModel, this);
    }

    protected onRemovedFromScene()
    {
        this.mrsToolTarget.controllerTool = null;
        //
        windowEventProxy.off('mousedown', this.onMouseDown, this);
        windowEventProxy.off('mouseup', this.onMouseUp, this);

        ticker.offframe(this.updateToolModel, this);
    }

    private invalidate()
    {
        ticker.nextframe(this.update, this);
    }

    private update()
    {
        const holdSizeComponent = this.gameObject.getComponent(HoldSizeComponent);
        holdSizeComponent.camera = this._editorCamera;
    }

    protected onItemMouseDown(_event: IEvent<any>)
    {
        shortcut.activityState('inTransforming');
    }

    protected get toolModel()
    {
        return this._toolModel;
    }

    protected set toolModel(value)
    {
        if (this._toolModel)
        { this.gameObject.removeChild(this._toolModel.gameObject); }
        this._toolModel = value;
        if (this._toolModel)
        {
            this.gameObject.addChild(this._toolModel.gameObject);
        }
    }

    get selectedItem()
    {
        return this._selectedItem;
    }

    set selectedItem(value)
    {
        if (this._selectedItem === value)
        {
            return;
        }
        if (this._selectedItem)
        {
            this._selectedItem.selected = false;
        }
        this._selectedItem = value;
        if (this._selectedItem)
        {
            this._selectedItem.selected = true;
        }
    }

    protected updateToolModel()
    {

    }

    protected onMouseDown()
    {
        this.selectedItem = null;
        this.ismouseDown = true;
    }

    protected onMouseUp()
    {
        this.ismouseDown = false;
        this.movePlane3D = null;
        this.startSceneTransform = null;

        ticker.nextframe(() =>
        {
            shortcut.deactivityState('inTransforming');
        });
    }

    /**
     * 获取鼠标射线与移动平面的交点（模型空间）
     */
    protected getLocalMousePlaneCross()
    {
        // 射线与平面交点
        let crossPos = this.getMousePlaneCross();
        // 把交点从世界转换为模型空间
        const inverseGlobalMatrix = this.startSceneTransform.clone();
        inverseGlobalMatrix.invert();
        crossPos = inverseGlobalMatrix.transformPoint3(crossPos);

        return crossPos;
    }

    protected getMousePlaneCross()
    {
        const line3D = this.gameObject.scene.mouseRay3D;
        // 射线与平面交点
        const crossPos = this.movePlane3D.intersectWithLine3(line3D) as Vector3;

        return crossPos;
    }
}
