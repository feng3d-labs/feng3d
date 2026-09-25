import { Matrix4x4 } from '../../../math/geom/Matrix4x4';
import { decoratorRegisterClass } from '../../../polyfill/ClassUtils';
import { RenderAtomic } from '../../../renderer/data/RenderAtomic';
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
@decoratorRegisterClass()
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
        renderAtomic.uniforms.u_skeletonGlobalMatriices = this.u_skeletonGlobalMatriices;

        renderAtomic.shaderMacro.HAS_SKELETON_ANIMATION = true;
        renderAtomic.shaderMacro.NUM_SKELETONJOINT = this.u_skeletonGlobalMatriices.length;
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
        return this.transform.localToWorldMatrix;
    }

    private get u_ITModelMatrix()
    {
        return this.transform.ITlocalToWorldMatrix;
    }

    private get u_skeletonGlobalMatriices()
    {
        const skeletonComponent = this.getComponentInParent(SkeletonComponent);

        let skeletonGlobalMatriices: Matrix4x4[] = [];
        if (skeletonComponent)
        {
            skeletonGlobalMatriices = skeletonComponent.globalMatrices;
        }
        else
        {
            skeletonGlobalMatriices = defaultSkeletonGlobalMatriices;
        }

        return skeletonGlobalMatriices;
    }
}

const defaultSkeletonGlobalMatriices: Matrix4x4[] = (() =>
{
    const v = [new Matrix4x4()]; let i = 150; while (i-- > 1) v.push(v[0]);

    return v;
})();
