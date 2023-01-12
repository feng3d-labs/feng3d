import { RegisterComponent } from '../../../ecs/Component';
import { Matrix4x4 } from '../../../math/geom/Matrix4x4';
import { RenderAtomic } from '../../../renderer/data/RenderAtomic';
import { Camera } from '../../cameras/Camera';
import { Component3D } from '../../../3d/Component3D';
import { HideFlags } from '../../core/HideFlags';
import { Scene } from '../../scene/Scene';

declare module '../../../ecs/Component'
{
    interface ComponentMap
    {
        SkinnedMeshRenderer: SkinnedMeshRenderer
    }
}

@RegisterComponent({ name: 'SkinnedMeshRenderer', dependencies: ['Mesh3D'], single: true })
export class SkinnedMeshRenderer extends Component3D
{
    declare __class__: 'SkinnedMeshRenderer';

    /**
     * 创建一个骨骼动画类
     */
    init()
    {
        super.init();
        this.hideFlags = HideFlags.DontTransform;
    }

    beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
    {
        super.beforeRender(renderAtomic, scene, camera);

        renderAtomic.uniforms.u_modelMatrix = () => this.u_modelMatrix;
        renderAtomic.uniforms.u_ITModelMatrix = () => this.u_ITModelMatrix;
        //
        renderAtomic.uniforms.u_skeletonGlobalMatrices = this.u_skeletonGlobalMatrices;

        renderAtomic.shaderMacro.HAS_SKELETON_ANIMATION = true;
        renderAtomic.shaderMacro.NUM_SKELETONJOINT = this.u_skeletonGlobalMatrices.length;
    }

    /**
     * 销毁
     */
    dispose()
    {
        super.dispose();
    }

    private get u_modelMatrix()
    {
        return this.node3d.globalMatrix;
    }

    private get u_ITModelMatrix()
    {
        return this.node3d.globalNormalMatrix;
    }

    private get u_skeletonGlobalMatrices()
    {
        const skeletonComponent = this.getComponentInParent('SkeletonComponent');

        let skeletonGlobalMatrices: Matrix4x4[] = [];
        if (skeletonComponent)
        {
            skeletonGlobalMatrices = skeletonComponent.globalMatrices;
        }
        else
        {
            skeletonGlobalMatrices = defaultSkeletonGlobalMatrices;
        }

        return skeletonGlobalMatrices;
    }
}

const defaultSkeletonGlobalMatrices: Matrix4x4[] = (() =>
{
    const v = [new Matrix4x4()]; let i = 150; while (i-- > 1) v.push(v[0]);

    return v;
})();
