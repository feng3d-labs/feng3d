import { Component3D } from '../Component3D';
import { Scene3D } from '../Scene3D';
import { RegisterComponent } from '../../ecs/Component';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { Camera3D } from '../../core/cameras/Camera3D';
import { HideFlags } from '../../core/core/HideFlags';

declare module '../../ecs/Component'
{
    interface ComponentMap
    {
        SkinnedMesh3D: SkinnedMesh3D
    }
}

@RegisterComponent({ name: 'SkinnedMesh3D', dependencies: ['Mesh3D'], single: true })
export class SkinnedMesh3D extends Component3D
{
    declare __class__: 'SkinnedMesh3D';

    /**
     * 创建一个骨骼动画类
     */
    init()
    {
        super.init();
        this.hideFlags = HideFlags.DontTransform;
    }

    beforeRender(renderAtomic: RenderAtomic, scene: Scene3D, camera: Camera3D)
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
        const skeletonComponent = this.getComponentInParent('Skeleton3D');

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
