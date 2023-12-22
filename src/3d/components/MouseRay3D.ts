import { RegisterComponent } from '@feng3d/ecs';
import { IEvent } from '@feng3d/event';
import { windowEventProxy } from '../../shortcut/WindowEventProxy';
import { Component3D } from '../core/Component3D';
import { Node3D } from '../core/Node3D';
import { RenderContext3D } from '../core/RenderContext3D';

declare module '@feng3d/ecs' { interface ComponentMap { MouseRay3D: MouseRay3D; } }

/**
 * 当鼠标按下时发射一个球，用于验证发射射线的正确性。
 */
@RegisterComponent({ name: 'MouseRay3D', menu: 'test/MouseRay3D' })
export class MouseRay3D extends Component3D
{
    /**
     * 是否需要发射
     */
    private _needShoot: boolean;

    init(): void
    {
        windowEventProxy.on('mousedown', this._onMouseDown, this);

        this.emitter.on('beforeRender', this._onBeforeRender, this);
    }

    destroy(): void
    {
        this.emitter.on('beforeRender', this._onBeforeRender, this);

        windowEventProxy.off('mousedown', this._onMouseDown, this);
    }

    private _onMouseDown(event: IEvent<MouseEvent>)
    {
        this._needShoot = true;
    }

    private _onBeforeRender(event: IEvent<RenderContext3D>)
    {
        if (!this._needShoot) return;

        this._needShoot = false;

        const globalRay = event.data.getMouseRay3D();
        const localRay = this.entity.invertGlobalMatrix.transformRay(globalRay);

        // 本地空间摄像机坐标
        const cameraLP = this.entity.invertGlobalMatrix.transformPoint3(localRay.origin);
        // 本地空间摄像机方向
        const cameraLD = this.entity.invertGlobalMatrix.transformVector3(localRay.direction);
        cameraLD.normalize();

        const sphere = Node3D.createPrimitive('Sphere');
        sphere.position.copy(cameraLP);
        sphere.mouseEnabled = false;
        // 添加到根节点上
        this.node.addChild(sphere);

        let num = 1000;
        const speed = 1;

        const update = () =>
        {
            sphere.position.add(cameraLD.scaleNumberTo(speed));

            if (num-- > 0)
            {
                requestAnimationFrame(update);
            }
            else
            {
                sphere.remove();
                sphere.destroy();
            }
        };

        requestAnimationFrame(update);
    }
}
