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
        const frustum = logic(camera).frustum;

        let object3Ds: Object3D[] = [logic(scene).entity];
        while (object3Ds.length > 0)
        {
            const object3D = object3Ds.pop();

            if (!object3D.activeSelf)
            { continue; }
            const renderer = object3D.components.find(c => isRenderable(c)) as Renderable;
            if (renderer && renderer.enabled)
            {
                const worldBounds = logic(renderer).selfWorldBounds.value;
                if (frustum.intersectsBox(worldBounds))
                { renderers.push(renderer); }
            }
            object3Ds = object3Ds.concat(object3D.children as Object3D[]);
        }

        return renderers;
    }
}

export const sceneUtil = new SceneUtil();
