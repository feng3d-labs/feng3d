import { AddComponentMenu, CullFace, Geometry, Material, RegisterComponent, Renderable, View } from '@feng3d/core';
import { Ray3, Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { RenderObject } from '@feng3d/webgpu';
import { Canvas } from './Canvas';

declare global
{
    export interface MixinsComponentMap
    {
        CanvasRenderer: CanvasRenderer;
    }
}

/**
 * 可在画布上渲染组件，使得拥有该组件的GameObject可以在画布上渲染。
 */
@AddComponentMenu('Rendering/CanvasRenderer')
@RegisterComponent()
@decoratorRegisterClass()
export class CanvasRenderer extends Renderable
{
    readonly renderAtomic = new RenderObject();

    geometry = Geometry.getDefault('Default-UIGeometry');

    @oav()
    material = Material.getDefault('Default-UIMaterial');

    /**
     * 与世界空间射线相交
     *
     * @param worldRay 世界空间射线
     *
     * @return 相交信息
     */
    worldRayIntersection(worldRay: Ray3)
    {
        const canvas = this.getComponentsInParent(Canvas)[0];
        if (canvas)
        {
            worldRay = canvas.mouseRay;
        }

        const localRay = this.transform.rayWorldToLocal(worldRay);
        if (this.transform2D)
        {
            const size = new Vector3(this.transform2D.size.x, this.transform2D.size.y, 1);
            const pivot = new Vector3(this.transform2D.pivot.x, this.transform2D.pivot.y, 0);
            localRay.origin.divide(size).add(pivot);
            localRay.direction.divide(size).normalize();
        }

        const pickingCollisionVO = this.localRayIntersection(localRay);
        if (pickingCollisionVO)
        {
            pickingCollisionVO.cullFace = CullFace.NONE;
        }

        return pickingCollisionVO;
    }

    protected _updateBounds()
    {
        // TODO: WebGPU 迁移后 UI 包围盒计算待重写（原 WebGL 路径）。
        // 此处仅保持编译通过，不更新包围盒。
    }

    /**
     * 渲染
     *
     * 注意：UI 的 Canvas 渲染仍为 WebGL 时代实现，WebGPU 迁移后该路径待重写。
     * 当前仅保持布局计算（layout），实际绘制调用暂未接入 WebGPU。
     */
    static draw(view: View)
    {
        const scene = view.scene;
        const canvas = view.canvas;

        const canvasList = scene.getComponentsInChildren(Canvas).filter((v) => v.isVisibleAndEnabled);
        canvasList.forEach((canvasComp) =>
        {
            canvasComp.layout(canvas.width, canvas.height);

            // 更新鼠标射线
            canvasComp.calcMouseRay3D(view);

            const renderables = canvasComp.getComponentsInChildren(CanvasRenderer).filter((v) => v.isVisibleAndEnabled);
            renderables.forEach((renderable) =>
            {
                // 绘制（WebGPU 迁移后待重写）
                const renderAtomic = renderable.renderAtomic;

                ((renderAtomic as any).uniforms ||= {}).u_viewProjection = canvasComp.projection;

                renderable.beforeRender(renderAtomic as unknown as RenderObject, null, null);

                // view.gl.render(renderAtomic); // WebGL 路径已移除，WebGPU 待接入
            });
        });
    }
}
