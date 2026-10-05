import { Behaviour, Object3D, RegisterComponent, registerPrimitive, View } from 'feng3d';
import { reactive } from '@feng3d/reactivity';
import { Matrix4x4, Ray3, Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { UIRenderMode } from '../enums/UIRenderMode';
import { Transform2D } from './Transform2D';

declare global
{
    export interface MixinsComponentMap
    {
        Canvas: Canvas
    }

    export interface MixinsPrimitiveObject3D
    {
        Canvas: Object3D;
    }
}

/**
 * Element that can be used for screen rendering.
 *
 * 能够被用于屏幕渲染的元素
 */
@RegisterComponent()
@decoratorRegisterClass()
export class Canvas extends Behaviour
{
    /**
     * Is the Canvas in World or Overlay mode?
     *
     * 画布是在世界或覆盖模式?
     */
    @serialize
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
    @serialize
    @oav()
    near = -1000;

    /**
     * 最远距离
     */
    @serialize
    @oav()
    far = 10000;

    init()
    {
        // this.transform.hideFlags = this.transform.hideFlags | HideFlags.Hide;
        // this.object3D.hideFlags = this.object3D.hideFlags | HideFlags.DontTransform;
    }

    /**
     * 更新布局
     *
     * @param width 画布宽度
     * @param height 画布高度
     */
    layout(width: number, height: number)
    {
        this.transform2D.size.x = width;
        this.transform2D.size.y = height;

        this.transform2D.pivot.set(0, 0);

        const r_position = reactive(this.transform.position);
        r_position.x = 0;
        r_position.y = 0;
        r_position.z = 0;

        const r_rotation = reactive(this.transform.rotation);
        r_rotation.x = 0;
        r_rotation.y = 0;
        r_rotation.z = 0;

        const r_scale = reactive(this.transform.scale);
        r_scale.x = 1;
        r_scale.y = 1;
        r_scale.z = 1;

        const near = this.near;
        const far = this.far;
        this.projection.identity().appendTranslation(0, 0, -(far + near) / 2).appendScale(2 / width, -2 / height, 2 / (far - near)).appendTranslation(-1, 1, 0);
    }

    /**
     * 计算鼠标射线
     *
     * @param view
     */
    calcMouseRay3D(view: View)
    {
        this.mouseRay.origin.set(view.mousePos.x, view.mousePos.y, 0);
    }
}

registerPrimitive('Canvas', (g) =>
{
    const t = new Transform2D(); reactive(g).components.push(t); t.setObject3D(g); t.init();
    const c = new Canvas(); reactive(g).components.push(c); c.setObject3D(g); c.init();
});
