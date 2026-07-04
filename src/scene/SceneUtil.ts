import { Camera } from '../cameras/Camera';
import { Object3D } from '../core/Object3D';
import { object3DLogic } from '../core/object3DLogic';
import { Renderable } from '../core/Renderable';
import { Scene } from './Scene';

/**
 * 用于处理从场景中获取特定数据
 */
export class SceneUtil
{
    /**
     * 获取场景中可视需要混合的渲染对象
     *
     * @param _scene 场景
     * @param _camera 摄像机
     */
    getBlenditems(_scene: Scene, _camera: Camera)
    {
        // throw new Error("Method not implemented.");

        // scene.getComponentsInChildren()

    }

    /**
     * 获取需要渲染的对象
     *
     * #### 渲染需求条件
     * 1. visible == true
     * 1. 在摄像机视锥内
     * 1. model.enabled == true
     *
     * @param object3D
     * @param camera
     */
    getActiveRenderers(scene: Scene, camera: Camera)
    {
        const renderers: Renderable[] = [];
        const frustum = camera.frustum;

        let object3Ds = [scene.object3D];
        while (object3Ds.length > 0)
        {
            const object3D = object3Ds.pop();

            if (!object3D.activeSelf)
            { continue; }
            const renderer = object3D.components.find(c => c instanceof Renderable) as Renderable;
            if (renderer && renderer.enabled)
            {
                if (renderer.selfWorldBounds)
                {
                    if (frustum.intersectsBox(renderer.selfWorldBounds.value))
                    { renderers.push(renderer); }
                }
            }
            object3Ds = object3Ds.concat(object3D.children as Object3D[]);
        }

        return renderers;
    }
}

export const sceneUtil = new SceneUtil();
