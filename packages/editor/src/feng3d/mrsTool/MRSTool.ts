import { Camera, Component, Object3D, globalEmitter, HideFlags, RegisterComponent, Renderable, serialization, ticker } from 'feng3d';
import { EditorData, MRSToolType } from '../../global/EditorData';
import { MRSToolBase } from './MRSToolBase';
import { MRSToolTarget } from './MRSToolTarget';
import { MTool } from './MTool';
import { RTool } from './RTool';
import { STool } from './STool';
import { setDepthTest } from '../../utils/materialRenderState';

declare global
{
    export interface MixinsComponentMap
    {
        MRSTool: MRSTool
    }
}

/**
 * 设置永久可见
 */
function setAwaysVisible(component: Component)
{
    const models = component.getComponentsInChildren(Renderable);
    models.forEach((element) =>
    {
        if (element.material)
        {
            setDepthTest(element.material, false);
        }
    });
}

/**
 * 位移旋转缩放工具
 */
@RegisterComponent()
export class MRSTool extends Component
{
    private mTool: MTool;
    private rTool: RTool;
    private sTool: STool;

    private _currentTool: MRSToolBase;

    private mrsToolObject: Object3D;
    private mrsToolTarget = new MRSToolTarget();

    get editorCamera() { return this._editorCamera; }
    set editorCamera(v) { this._editorCamera = v; this.invalidate(); }
    private _editorCamera: Camera;

    init()
    {
        super.init();

        this.mrsToolObject = serialization.setValue(new Object3D(), { name: 'MRSTool' });

        this.mTool = serialization.setValue(new Object3D(), { name: 'MTool' }).addComponent(MTool);
        this.rTool = serialization.setValue(new Object3D(), { name: 'RTool' }).addComponent(RTool);
        this.sTool = serialization.setValue(new Object3D(), { name: 'STool' }).addComponent(STool);

        this.mTool.mrsToolTarget = this.mrsToolTarget;
        this.rTool.mrsToolTarget = this.mrsToolTarget;
        this.sTool.mrsToolTarget = this.mrsToolTarget;

        setAwaysVisible(this.mTool);
        setAwaysVisible(this.rTool);
        setAwaysVisible(this.sTool);
        //
        this.currentTool = this.mTool;
        //
        globalEmitter.on('editor.selectedObjectsChanged', this.onSelectedObject3DChange, this);
        globalEmitter.on('editor.toolTypeChanged', this.onToolTypeChange, this);
    }

    dispose()
    {
        //
        this.currentTool = null;
        //
        this.mrsToolObject.dispose();
        this.mrsToolObject = null;
        //
        this.mTool.dispose();
        this.mTool = null;
        this.rTool.dispose();
        this.rTool = null;
        this.sTool.dispose();
        this.sTool = null;
        //
        globalEmitter.off('editor.selectedObjectsChanged', this.onSelectedObject3DChange, this);
        globalEmitter.off('editor.toolTypeChanged', this.onToolTypeChange, this);

        super.dispose();
    }

    private invalidate()
    {
        ticker.nextframe(this.update, this);
    }

    private update()
    {
        this.mTool.editorCamera = this._editorCamera;
        this.rTool.editorCamera = this._editorCamera;
        this.sTool.editorCamera = this._editorCamera;
    }

    private onSelectedObject3DChange()
    {
        const objects = EditorData.editorData.selectedObject3Ds.filter((v) => !(v.hideFlags & HideFlags.DontTransform));

        // 筛选出 工具控制的对象
        if (objects.length > 0)
        {
            this.object3D.addChild(this.mrsToolObject);
        }
        else
        {
            this.mrsToolObject.remove();
        }
    }

    private onToolTypeChange()
    {
        switch (EditorData.editorData.toolType)
        {
            case MRSToolType.MOVE:
                this.currentTool = this.mTool;
                break;
            case MRSToolType.ROTATION:
                this.currentTool = this.rTool;
                break;
            case MRSToolType.SCALE:
                this.currentTool = this.sTool;
                break;
        }
    }

    private get currentTool()
    {
        return this._currentTool;
    }

    private set currentTool(value)
    {
        if (this._currentTool === value)
        {
            return;
        }
        if (this._currentTool)
        {
            this._currentTool.object3D.remove();
        }
        this._currentTool = value;
        if (this._currentTool)
        {
            this.mrsToolObject.addChild(this._currentTool.object3D);
        }
    }
}
