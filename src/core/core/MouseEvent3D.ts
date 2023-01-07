import { IEvent } from '../../event/IEvent';
import { windowEventProxy } from '../../shortcut/WindowEventProxy';
import { Camera } from '../cameras/Camera';
import { rayCast } from '../pick/Raycaster';
import { Scene } from '../scene/Scene';
import { Component3D } from './Component3D';
import { MeshRenderer } from './MeshRenderer';
import { MouseInput } from './MouseInput';
import { Node3D } from './Node3D';
import { BeforeRenderEventData, View3D } from './View3D';
import { WindowMouseInput } from './WindowMouseInput';

/**
 * 3D结点鼠标事件组件。
 *
 * 在 View3D 所在或者子结点中添加该组件，View3D下的3D结点将响应鼠标事件。
 */
export class MouseEvent3D extends Component3D
{
    /**
     * 鼠标事件输入器。
     */
    private get mouseInput()
    {
        return this._mouseInput;
    }
    private set mouseInput(v)
    {
        if (this._mouseInput)
        {
            mouseEventTypes.forEach((element) =>
            {
                this._mouseInput.off(element, this.onMouseEvent, this);
            });
        }
        this._mouseInput = v;
        if (this._mouseInput)
        {
            mouseEventTypes.forEach((element) =>
            {
                this._mouseInput.on(element, this.onMouseEvent, this);
            });
        }
    }
    private _mouseInput: MouseInput;

    init(): void
    {
        this.mouseInput = new WindowMouseInput();

        this.emitter.on('beforeRender', this._onBeforeRender, this);
    }

    dispose(): void
    {
        this.emitter.off('beforeRender', this._onBeforeRender, this);

        super.dispose();
    }

    private _onBeforeRender(event: IEvent<BeforeRenderEventData>)
    {
        if (this._mouseEventTypes.size === 0)
        {
            this.setSelectedObject3D(null);

            return;
        }

        const { view, scene, camera } = event.data;

        //
        const viewport = view.viewRect;
        if (viewport)
        {
            if (!viewport.contains(windowEventProxy.clientX, windowEventProxy.clientY))
            {
                this.setSelectedObject3D(null);

                return;
            }
        }

        // 鼠标拾取渲染
        const result = pick(view, scene, camera);

        this.setSelectedObject3D(result);
    }

    private _selectedObject3D: Node3D;
    private _mouseEventTypes = new Set<string>();

    /**
     * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
     */
    private preMouseDownObject3D: Node3D | null;
    /**
     * 统计处理click次数，判断是否达到dblclick
     */
    private object3DClickNum: number;

    /**
     * 监听鼠标事件收集事件类型
     */
    private onMouseEvent(event: IEvent<any>)
    {
        this._mouseEventTypes.add(event.type);
    }

    /**
     * 设置选中对象
     */
    private setSelectedObject3D(value: Node3D)
    {
        if (this._selectedObject3D !== value)
        {
            if (this._selectedObject3D)
            {
                this._selectedObject3D.emitter.emit('mouseout', null, true);
            }
            if (value)
            {
                value.emitter.emit('mouseover', null, true);
            }
        }
        this._selectedObject3D = value;
        this._mouseEventTypes.forEach((element) =>
        {
            switch (element)
            {
                case 'mousedown':
                    if (this.preMouseDownObject3D !== this._selectedObject3D)
                    {
                        this.object3DClickNum = 0;
                        this.preMouseDownObject3D = this._selectedObject3D;
                    }
                    this._selectedObject3D && this._selectedObject3D.emitter.emit(element, null, true);
                    break;
                case 'mouseup':
                    if (this._selectedObject3D === this.preMouseDownObject3D)
                    {
                        this.object3DClickNum++;
                    }
                    else
                    {
                        this.object3DClickNum = 0;
                        this.preMouseDownObject3D = null;
                    }
                    this._selectedObject3D && this._selectedObject3D.emitter.emit(element, null, true);
                    break;
                case 'mousemove':
                    this._selectedObject3D && this._selectedObject3D.emitter.emit(element, null, true);
                    break;
                case 'click':
                    if (this.object3DClickNum > 0)
                    { this._selectedObject3D && this._selectedObject3D.emitter.emit(element, null, true); }
                    break;
                case 'dblclick':
                    if (this.object3DClickNum > 1)
                    {
                        this._selectedObject3D && this._selectedObject3D.emitter.emit(element, null, true);
                        this.object3DClickNum = 0;
                    }
                    break;
            }
        });
        this._mouseEventTypes.clear();
    }
}

/**
 * 鼠标事件列表
 */
const mouseEventTypes: (keyof MouseEventMap)[]
    = [
        'mouseout',
        'mouseover',
        'mousemove',
        'mousedown',
        'mouseup',
        'click',
        'middlemousedown',
        'middlemouseup',
        'middleclick',
        'rightmousedown',
        'rightmouseup',
        'rightclick',
        'dblclick',
    ];

export interface MouseEventMap
{
    /**
     * 鼠标移出对象
     */
    mouseout: { clientX: number, clientY: number }
    /**
     * 鼠标移入对象
     */
    mouseover: { clientX: number, clientY: number }
    /**
     * 鼠标在对象上移动
     */
    mousemove: { clientX: number, clientY: number }
    /**
     * 鼠标左键按下
     */
    mousedown: { clientX: number, clientY: number }
    /**
     * 鼠标左键弹起
     */
    mouseup: { clientX: number, clientY: number }
    /**
     * 单击
     */
    click: { clientX: number, clientY: number }
    /**
     * 鼠标中键按下
     */
    middlemousedown: { clientX: number, clientY: number }
    /**
     * 鼠标中键弹起
     */
    middlemouseup: { clientX: number, clientY: number }
    /**
     * 鼠标中键单击
     */
    middleclick: { clientX: number, clientY: number }
    /**
     * 鼠标右键按下
     */
    rightmousedown: { clientX: number, clientY: number }
    /**
     * 鼠标右键弹起
     */
    rightmouseup: { clientX: number, clientY: number }
    /**
     * 鼠标右键单击
     */
    rightclick: { clientX: number, clientY: number }
    /**
     * 鼠标双击
     */
    dblclick: { clientX: number, clientY: number }
}

/**
 * 拾取
 * @param scene 场景
 * @param camera 摄像机
 */
function pick(view: View3D, scene: Scene, camera: Camera)
{
    const mouseRay3D = view.getMouseRay3D(camera);

    const meshRenderers = scene.getComponentsInChildren(MeshRenderer).filter((mr) => mr.node.mouseEnabled);
    // 计算得到鼠标射线相交的物体
    const pickingCollisionVO = rayCast(mouseRay3D, meshRenderers);

    const node3d = pickingCollisionVO && pickingCollisionVO.node3d;

    return node3d;
}
