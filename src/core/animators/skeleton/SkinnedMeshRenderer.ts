import { Matrix4x4 } from '../../../math/geom/Matrix4x4';
import { RenderAtomic } from '../../../renderer/data/RenderAtomic';
import { serializable } from '../../../serialization/ClassUtils';
import { Camera } from '../../cameras/Camera';
import { RegisterComponent } from '../../component/Component';
import { HideFlags } from '../../core/HideFlags';
import { Renderable } from '../../core/Renderable';
import { Scene } from '../../scene/Scene';
import { SkeletonComponent } from './SkeletonComponent';

declare global
{
    export interface MixinsComponentMap
    {
        SkinnedMeshRenderer: SkinnedMeshRenderer
    }
}

@RegisterComponent()
@serializable()
export class SkinnedMeshRenderer extends Renderable
{
    __class__: 'SkinnedMeshRenderer';

    get single() { return true; }

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
        return this.object3D.globalMatrix;
    }

    private get u_ITModelMatrix()
    {
        return this.object3D.globalNormalMatrix;
    }

    private get u_skeletonGlobalMatrices()
    {
        const skeletonComponent = this.getComponentInParent(SkeletonComponent);

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
