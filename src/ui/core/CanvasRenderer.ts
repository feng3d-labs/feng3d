import { MeshRenderer } from '../../core/core/MeshRenderer';
import { View3D } from '../../core/core/View3D';
import { Geometry } from '../../core/geometry/Geometry';
import { Material } from '../../core/materials/Material';
import { AddComponentMenu } from '../../core/Menu';
import { TransformUtils } from '../../core/utils/TransformUtils';
import { RegisterComponent } from '../../ecs/Component';
import { Ray3 } from '../../math/geom/Ray3';
import { oav } from '../../objectview/ObjectView';
import { Serializable } from '../../serialization/Serializable';

declare global
{
    export interface MixinsComponentMap
    {
        CanvasRenderer: CanvasRenderer;
    }
}

/**
 * 可在画布上渲染组件，使得拥有该组件的Object3D可以在画布上渲染。
 */
@AddComponentMenu('Rendering/CanvasRenderer')
@RegisterComponent({ name: 'CanvasRenderer' })
@Serializable('CanvasRenderer')
export class CanvasRenderer extends MeshRenderer
{
    @oav()
    material = Material.getDefault('Default-UIMaterial');

    init()
    {
        this.geometry = Geometry.getDefault('Default-UIGeometry');
    }

    /**
     * 与世界空间射线相交
     *
     * @param worldRay 世界空间射线
     *
     * @return 相交信息
     */
    worldRayIntersection(worldRay: Ray3)
    {
        const canvas = this.getComponentsInParent('Canvas')[0];
        if (canvas)
        {
            worldRay = canvas.mouseRay;
        }

        const localRay = TransformUtils.rayWorldToLocal(this.node3d, worldRay);
        // if (this.transform2D)
        // {
        //     const size = new Vector3(this.transform2D.size.x, this.transform2D.size.y, 1);
        //     const pivot = new Vector3(this.transform2D.pivot.x, this.transform2D.pivot.y, 0);
        //     localRay.origin.divide(size).add(pivot);
        //     localRay.direction.divide(size).normalize();
        // }

        const pickingCollisionVO = this.localRayIntersection(localRay);
        if (pickingCollisionVO)
        {
            pickingCollisionVO.cullFace = 'NONE';
        }

        return pickingCollisionVO;
    }

    protected _updateBounds()
    {
        const bounding = this.geometry.bounding.clone();
        const transformLayout = this.getComponent('TransformLayout');
        if (transformLayout)
        {
            bounding.scale(transformLayout.size);
        }
        this._selfLocalBounds = bounding;
    }

    /**
     * 渲染
     */
    static draw(view: View3D)
    {
        const gl = view.webGLRenderer.gl;
        let scene = view.scene;
        if (!scene)
        {
            scene = view.getComponentInChildren('Scene');
        }

        const canvasList = scene.getComponentsInChildren('Canvas').filter((v) => v.isVisibleAndEnabled);
        canvasList.forEach((canvas) =>
        {
            canvas.layout(gl.canvas.width, gl.canvas.height);

            // 更新鼠标射线
            canvas.calcMouseRay3D(view);

            const renderables = canvas.getComponentsInChildren('CanvasRenderer').filter((v) => v.isVisibleAndEnabled);
            renderables.forEach((renderable) =>
            {
                // 绘制
                const renderAtomic = renderable.renderAtomic;

                renderAtomic.uniforms.u_viewProjection = canvas.projection;

                renderable.beforeRender(renderAtomic, null, null);

                view.webGLRenderer.render(renderAtomic);
            });
        });
    }
}
