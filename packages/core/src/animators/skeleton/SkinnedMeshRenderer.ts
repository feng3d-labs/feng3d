import { Matrix4x4 } from '@feng3d/math';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { BufferBinding, RenderObject } from '@feng3d/webgpu';
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

declare module '@feng3d/webgpu'
{
    export interface BindingResources
    {
        skinned: BufferBinding<SkinnedUniforms>;
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

    beforeRender(renderObject: RenderObject, scene: Scene, camera: Camera)
    {
        super.beforeRender(renderObject, scene, camera);

        const skinnedUniforms = (renderObject.bindingResources.skinned ||= { value: {} as SkinnedUniforms }).value;

        skinnedUniforms.u_skeletonGlobalMatriices = this.u_skeletonGlobalMatriices;

        renderObject.shaderMacro.HAS_SKELETON_ANIMATION = true;
        renderObject.shaderMacro.NUM_SKELETONJOINT = this.u_skeletonGlobalMatriices.length;
    }

    /**
     * 销毁
     */
    dispose()
    {
        super.dispose();
    }

    private get u_skeletonGlobalMatriices()
    {
        const skeletonComponent = this.getComponentInParent(SkeletonComponent);

        let skeletonGlobalMatriices: Matrix4x4[];
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
