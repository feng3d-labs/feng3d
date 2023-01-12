import { Node3D } from '../../3d/Node3D';
import { RegisterComponent } from '../../ecs/Component';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { Ray3 } from '../../math/geom/Ray3';
import { Vector2 } from '../../math/geom/Vector2';
import { Vector3 } from '../../math/geom/Vector3';
import { oav } from '../../objectview/ObjectView';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { UIRenderMode } from '../enums/UIRenderMode';
import { Component2D } from './Component2D';

declare module '../../ecs/Component' { interface ComponentMap { Canvas: Canvas } }

declare module '../../3d/Node3D' { interface PrimitiveNode3D { Canvas: Node3D; } }

/**
 * Element that can be used for screen rendering.
 *
 * 能够被用于屏幕渲染的元素
 */
@RegisterComponent({ name: 'Canvas' })
export class Canvas extends Component2D
{
    /**
     * Is the Canvas in World or Overlay mode?
     *
     * 画布是在世界或覆盖模式?
     */
    @SerializeProperty()
    @oav({ component: 'OAVEnum', tooltip: '画布是在世界或覆盖模式', componentParam: { enumClass: UIRenderMode } })
    renderMode = UIRenderMode.ScreenSpaceOverlay;

    /**
     * 获取鼠标射线（与鼠标重叠的摄像机射线）
     */
    mouseRay = new Ray3(new Vector3(), new Vector3(0, 0, 1));

    /**
     * 投影矩阵
     *
     * 渲染前自动更新
     */
    projection = new Matrix4x4();

    /**
     * 最近距离
     */
    @SerializeProperty()
    @oav()
    near = -1000;

    /**
     * 最远距离
     */
    @SerializeProperty()
    @oav()
    far = 10000;

    init()
    {
    }

    /**
     * 更新布局
     *
     * @param width 画布宽度
     * @param height 画布高度
     */
    layout(width: number, height: number)
    {
        if (width === 0) width = 100;
        if (height === 0) height = 100;

        this.node2d.size.x = width;
        this.node2d.size.y = height;

        this.node2d.pivot.set(0, 0);

        const near = this.near;
        const far = this.far;
        this.projection.identity().appendTranslation(0, 0, -(far + near) / 2).appendScale(2 / width, -2 / height, 2 / (far - near)).appendTranslation(-1, 1, 0);
    }

    /**
     * 计算鼠标射线
     *
     * @param mousePos 鼠标所在画布中的位置
     */
    calcMouseRay3D(mousePos: Vector2)
    {
        this.mouseRay.origin.set(mousePos.x, mousePos.y, 0);
    }
}
