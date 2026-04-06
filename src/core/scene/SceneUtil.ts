import { Camera } from '../cameras/Camera';
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
     * @param gameObject
     * @param camera
     */
    getActiveRenderers(scene: Scene, camera: Camera)
    {
        const renderers: Renderable[] = [];
        const frustum = camera.frustum;

        let gameObjects = [scene.gameObject];
        while (gameObjects.length > 0)
        {
            const gameObject = gameObjects.pop();

            if (!gameObject.activeSelf)
            { continue; }
            const renderer = gameObject.getComponent(Renderable);
            if (renderer && renderer.enabled)
            {
                if (renderer.selfWorldBounds)
                {
                    if (frustum.intersectsBox(renderer.selfWorldBounds))
                    { renderers.push(renderer); }
                }
            }
            gameObjects = gameObjects.concat(gameObject.children);
        }

        return renderers;
    }
}

export const sceneUtil = new SceneUtil();
