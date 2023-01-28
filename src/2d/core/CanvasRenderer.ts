import { Mesh3D } from '../../3d/core/Mesh3D';
import { Geometry } from '../../3d/geometrys/Geometry';
import { Material } from '../../core/Material';
import { RegisterComponent } from '../../ecs/Component';
import { Ray3 } from '../../math/geom/Ray3';
import { oav } from '../../objectview/ObjectView';
import { TransformUtils } from '../../utils/TransformUtils';

declare module '../../ecs/Component' { interface ComponentMap { CanvasRenderer: CanvasRenderer; } }

/**
 * 可在画布上渲染组件，使得拥有该组件的Object3D可以在画布上渲染。
 */
@RegisterComponent({ name: 'CanvasRenderer', menu: 'Rendering/CanvasRenderer' })
export class CanvasRenderer extends Mesh3D
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
     * @param globalRay 全局空间射线
     *
     * @return 相交信息
     */
    globalRayIntersection(globalRay: Ray3)
    {
        const canvas = this.getComponentsInParent('Canvas')[0];
        if (canvas)
        {
            globalRay = canvas.mouseRay;
        }

        const localRay = TransformUtils.rayGlobalToLocal(this.node3d, globalRay);
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
        const transformLayout = this.getComponent('TransformLayout3D');
        if (transformLayout)
        {
            bounding.scale(transformLayout.size);
        }
        this._localBounds = bounding;
    }
}
