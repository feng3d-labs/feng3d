import { PickingCollisionVO, rayCast3D } from '../../3d/raycast/rayCast3D';
import { MouseEventMap, MouseInput } from '../../core/MouseInput';
import { WindowMouseInput } from '../../core/WindowMouseInput';
import { RegisterComponent } from '../../ecs/Component';
import { IEvent } from '../../event/IEvent';
import { windowEventProxy } from '../../shortcut/WindowEventProxy';
import { Component3D } from './Component3D';
import { Mesh3D } from './Mesh3D';
import { RenderContext3D } from './RenderContext3D';

declare module './Node3D'
{
    /**
     * 组件事件
     */
    interface Node3DEventMap
    {

        /**
         * 鼠标移出对象
         */
        mouseout: PickingCollisionVO
        /**
         * 鼠标移入对象
         */
        mouseover: PickingCollisionVO
        /**
         * 鼠标在对象上移动
         */
        mousemove: PickingCollisionVO
        /**
         * 鼠标左键按下
         */
        mousedown: PickingCollisionVO
        /**
         * 鼠标左键弹起
         */
        mouseup: PickingCollisionVO
        /**
         * 单击
         */
        click: PickingCollisionVO
        /**
         * 鼠标中键按下
         */
        middlemousedown: PickingCollisionVO
        /**
         * 鼠标中键弹起
         */
        middlemouseup: PickingCollisionVO
        /**
         * 鼠标中键单击
         */
        middleclick: PickingCollisionVO
        /**
         * 鼠标右键按下
         */
        rightmousedown: PickingCollisionVO
        /**
         * 鼠标右键弹起
         */
        rightmouseup: PickingCollisionVO
        /**
         * 鼠标右键单击
         */
        rightclick: PickingCollisionVO
        /**
         * 鼠标双击
         */
        dblclick: PickingCollisionVO
    }
}

declare module '../../ecs/Component'
{
    interface ComponentMap { MouseEvent3D: MouseEvent3D; }
}

/**
 * 3D结点鼠标事件组件。
 *
 * 在 View3D 所在或者子结点中添加该组件，View3D下的3D结点将响应鼠标事件。
 */
@RegisterComponent({ name: 'MouseEvent3D' })
export class MouseEvent3D extends Component3D
{
    init(): void
    {
        this._mouseInput = new WindowMouseInput();

        this.emitter.on('beforeRender', this._onBeforeRender, this);
    }

    destroy(): void
    {
        this._mouseInput = null;
        this.emitter.off('beforeRender', this._onBeforeRender, this);

        super.destroy();
    }

    /**
     * 鼠标事件输入器。
     */
    private get _mouseInput()
    {
        return this.__mouseInput;
    }
    private set _mouseInput(v)
    {
        if (this.__mouseInput)
        {
            mouseEventTypes.forEach((element) =>
            {
                this.__mouseInput.off(element, this._onMouseEvent, this);
            });
        }
        this.__mouseInput = v;
        if (this.__mouseInput)
        {
            mouseEventTypes.forEach((element) =>
            {
                this.__mouseInput.on(element, this._onMouseEvent, this);
            });
        }
    }
    private __mouseInput: MouseInput;

    private _onBeforeRender(event: IEvent<RenderContext3D>)
    {
        if (this._mouseEventTypes.size === 0)
        {
            this._handlePickingCollisionVO(null);

            return;
        }

        const data = event.data;
        const scene = data.scene;

        //
        const viewport = data.viewRect;
        if (viewport)
        {
            if (!viewport.contains(windowEventProxy.clientX, windowEventProxy.clientY))
            {
                this._handlePickingCollisionVO(null);

                return;
            }
        }

        //
        const mouseRay3D = data.getMouseRay3D();

        const meshRenderers = scene.getComponentsInChildren('Mesh3D').filter((mr) => mr.node.mouseEnabled);
        // 计算得到鼠标射线相交的物体
        const pickingCollisionVO = rayCast3D(mouseRay3D, meshRenderers);

        this._handlePickingCollisionVO(pickingCollisionVO);
    }

    private _selectedMeshRenderer: Mesh3D;
    private _mouseEventTypes = new Set<string>();
    /**
     * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
     */
    private _preMouseDownMeshRenderer: Mesh3D;

    /**
     * 统计处理click次数，判断是否达到dblclick
     */
    private _clickNum: number;

    /**
     * 监听鼠标事件收集事件类型
     */
    private _onMouseEvent(event: IEvent<any>)
    {
        this._mouseEventTypes.add(event.type);
    }

    /**
     * 处理拾取的碰撞结果。
     *
     * @param pickingCollisionVO 拾取的碰撞结果。
     */
    private _handlePickingCollisionVO(pickingCollisionVO: PickingCollisionVO)
    {
        const value = pickingCollisionVO?.meshRenderer;

        if (this._selectedMeshRenderer !== value)
        {
            if (this._selectedMeshRenderer)
            {
                this._selectedMeshRenderer.emitter.emit('mouseout', pickingCollisionVO, true);
            }
            if (value)
            {
                value.emitter.emit('mouseover', pickingCollisionVO, true);
            }
        }
        this._selectedMeshRenderer = value;
        this._mouseEventTypes.forEach((element) =>
        {
            switch (element)
            {
                case 'mousedown':
                    if (this._preMouseDownMeshRenderer !== this._selectedMeshRenderer)
                    {
                        this._clickNum = 0;
                        this._preMouseDownMeshRenderer = this._selectedMeshRenderer;
                    }
                    this._selectedMeshRenderer && this._selectedMeshRenderer.emitter.emit(element, pickingCollisionVO, true);
                    break;
                case 'mouseup':
                    if (this._selectedMeshRenderer === this._preMouseDownMeshRenderer)
                    {
                        this._clickNum++;
                    }
                    else
                    {
                        this._clickNum = 0;
                        this._preMouseDownMeshRenderer = null;
                    }
                    this._selectedMeshRenderer && this._selectedMeshRenderer.emitter.emit(element, pickingCollisionVO, true);
                    break;
                case 'mousemove':
                    this._selectedMeshRenderer && this._selectedMeshRenderer.emitter.emit(element, pickingCollisionVO, true);
                    break;
                case 'click':
                    if (this._clickNum > 0)
                    {
                        this._selectedMeshRenderer && this._selectedMeshRenderer.emitter.emit(element, pickingCollisionVO, true);
                    }
                    break;
                case 'dblclick':
                    if (this._clickNum > 1)
                    {
                        this._selectedMeshRenderer && this._selectedMeshRenderer.emitter.emit(element, pickingCollisionVO, true);
                        this._clickNum = 0;
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

