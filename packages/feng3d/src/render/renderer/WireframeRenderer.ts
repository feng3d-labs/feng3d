import { Computed, computed } from '@feng3d/reactivity';
import { RenderObject } from '@feng3d/webgpu';
import type { Camera } from '../../cameras/Camera';
import type { Scene } from '../../scene/Scene';

/**
 * 线框渲染器
 *
 * TODO: 待接入 WebGPU 渲染路径（原依赖已移除的 shader WebGL 兼容机制）。
 *
 * 当前为空实现：draw 返回固定空数组的 computed，保持与 Forward/SkyBox 同范式，
 * 未来接入 WebGPU 实现时只需在 computed 函数体内填充 RenderObject[]，
 * View 端无需改动。
 */
export class WireframeRenderer
{
    /**
     * 渲染对象列表 computed 缓存（按 scene → camera 嵌套）。
     *
     * Scene/Camera 运行时均为普通对象，引用相等即可作 WeakMap key；对象 GC 时对应
     * computed 自动失效，无泄漏。
     */
    private _renderObjectsCache = new WeakMap<Scene, WeakMap<Camera, Computed<readonly RenderObject[]>>>();

    /**
     * 渲染
     *
     * 返回 `Computed<readonly RenderObject[]>`，按 (scene, camera) 缓存。
     * 调用方传入 `frame`（每帧自增的版本号 computed）作为响应式驱动源。
     *
     * 当前为空实现，始终返回空数组。
     *
     * @param scene 场景
     * @param camera 摄像机
     * @param frame 每帧自增的版本号 computed
     */
    draw(scene: Scene, camera: Camera, frame: Computed<number>): Computed<readonly RenderObject[]>
    {
        // 命中缓存直接返回同一 computed 实例，保证下游依赖稳定
        let cameraMap = this._renderObjectsCache.get(scene);
        if (!cameraMap)
        {
            cameraMap = new WeakMap();
            this._renderObjectsCache.set(scene, cameraMap);
        }
        const cached = cameraMap.get(camera);
        if (cached) return cached;

        const computedRenderObjects = computed<readonly RenderObject[]>(() =>
        {
            // 每帧驱动源：读 frame 建立依赖（即便当前返回空数组，也保持响应式链路一致，
            // 未来填充实现时无需改动调用方）
            frame.value;

            // TODO: 遍历 logic(scene).getPickCache(camera).unblenditems，
            // 找出挂 WireframeComponent 的物体，用线框材质重新绘制，返回 RenderObject[]
            return [];
        });

        cameraMap.set(camera, computedRenderObjects);

        return computedRenderObjects;
    }
}

/**
 * 线框渲染器
 */
export const wireframeRenderer = new WireframeRenderer();
