import { IEvent } from '../../event/IEvent';
import { windowEventProxy } from '../../shortcut/WindowEventProxy';
import { Component3D } from '../core/Component3D';
import { Node3D } from '../core/Node3D';

/**
 * 当鼠标按下时发射一个球，用于验证发射射线的正确性。
 */
export class MouseRay3D extends Component3D
{
    init(): void
    {
        windowEventProxy.on('mousedown', this._onMouseDown, this);
    }

    dispose(): void
    {
        windowEventProxy.off('mousedown', this._onMouseDown, this);
    }

    private _onMouseDown(event: IEvent<MouseEvent>)
    {
        const { clientX, clientY } = event.data;

        const camera = this.getComponentInChildren('Camera3D');
        const ray = camera.getWorldRay3D(0, 0);

        const sphere = Node3D.createPrimitive('Sphere');

        const position = camera.node3d.worldPosition.clone();

        sphere.position
        // this.node

        // 添加到根节点上
        this.node.addChild(sphere);

        let num = 1000;

        const update = () =>
        {


            if (num-- > 0)
            {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);

    }
}
