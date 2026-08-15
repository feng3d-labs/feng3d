import { logic } from '@feng3d/reactivity';
import { isRenderable } from "../component/Component";
import type { Camera } from '../cameras/Camera';
import { Object3D } from '../core/Object3D';
import type { Renderable } from '../core/Renderable';
import type { Scene } from './Scene';

/**
 * 用于处理从场景中获取特定数据
 */
export class SceneUtil
{
    /**
     * 获取场景中可视需要混合的渲染对象
     */
    getBlenditems(_scene: Scene, _camera: Camera)
    {
        // TODO
    }

    /**
     * 获取需要渲染的对象
     */
    getActiveRenderers(scene: Scene, camera: Camera)
    {
        const renderers: Renderable[] = [];
        const camLogic = logic(camera);
        const frustum = camLogic.frustum;
        const culling = camLogic.frustumCulling;

        let object3Ds: Object3D[] = [logic(scene).entity as Object3D];
        while (object3Ds.length > 0)
        {
            const object3D = object3Ds.pop();

            // 通过 logic().activeSelf 读取，使 JSON 字面量（缺失字段）能拿到默认值 true
            if (!logic(object3D).activeSelf)
            { continue; }
            const renderer = object3D.components.find(c => isRenderable(c)) as Renderable;
            if (renderer && logic(renderer).isVisibleAndEnabled.value)
            {
                if (!culling || frustum.intersectsBox(logic(renderer).selfWorldBounds.value))
                { renderers.push(renderer); }
            }
            object3Ds = object3Ds.concat(object3D.children as Object3D[]);
        }

        return renderers;
    }
}

export const sceneUtil = new SceneUtil();
