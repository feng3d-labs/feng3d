import { Matrix4x4 } from '@feng3d/math';
import { RenderObject } from '@feng3d/webgpu';
import { registerComponentLogic } from '../../component/componentLogic';
import { getComponentInParent } from '../../component/componentQuery';
import type { Camera } from '../../cameras/Camera';
import type { Scene } from '../../scene/Scene';
import { HideFlags } from '../../core/HideFlags';
import { renderableLogic } from '../../core/renderableLogic';
import { reactive } from '@feng3d/reactivity';
import { SkinnedMeshRenderer } from './SkinnedMeshRenderer';
import { SkeletonComponent, skeletonComponentLogic } from './SkeletonComponent';

/**
 * SkinnedMeshRenderer 逻辑处理输出。
 *
 * 组合 renderableLogic，额外：
 * - init: 设置 hideFlags = DontTransform
 * - beforeRender: 调用基类 beforeRender 后写入骨架 uniform
 */
export function skinnedMeshRendererLogic(skinnedMeshRenderer: SkinnedMeshRenderer)
{
    const base = renderableLogic(skinnedMeshRenderer);
    let _inited = false;

    const logic = {
        ...base,
        init()
        {
            if (_inited) return;
            _inited = true;
            base.init();
            reactive(skinnedMeshRenderer).hideFlags = HideFlags.DontTransform;
        },
        beforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null)
        {
            base.baseBeforeRender(renderObject, scene, camera);

            const skinnedUniforms = ((renderObject.bindingResources as any).skinned ||= { value: {} as SkinnedUniforms }).value;

            skinnedUniforms.u_skeletonGlobalMatriices = getSkeletonGlobalMatriices();
        },
    };

    function getSkeletonGlobalMatriices(): Matrix4x4[]
    {
        const skeletonComponent = getComponentInParent(base.object3D, SkeletonComponent);

        if (skeletonComponent)
        {
            return skeletonComponentLogic(skeletonComponent).globalMatrices;
        }

        return defaultSkeletonGlobalMatriices;
    }

    return logic;
}

const defaultSkeletonGlobalMatriices: Matrix4x4[] = (() =>
{
    const v = [new Matrix4x4()]; let i = 150; while (i-- > 1) v.push(v[0]);

    return v;
})();

// 注册到 componentLogic 分发表
registerComponentLogic('SkinnedMeshRenderer', (component) =>
{
    return skinnedMeshRendererLogic(component as SkinnedMeshRenderer);
});
