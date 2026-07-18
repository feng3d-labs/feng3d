import { Computed, computed, logic } from '@feng3d/reactivity';
import { BindingResource, RenderObject } from '@feng3d/webgpu';
import type { Camera } from '../cameras/Camera';
import type { Scene } from '../scene/Scene';
import { skyboxVertexWGSL } from '../shaders/skybox.vertex.wgsl';
import { skyboxFragmentWGSL } from '../shaders/skybox.fragment.wgsl';
import { SkyBox } from './SkyBox';

/**
 * 天空盒渲染器
 */
export class SkyBoxRenderer
{
    private renderObject: RenderObject = {
        pipeline: {
            vertex: { wgsl: skyboxVertexWGSL, entryPoint: 'main' },
            fragment: { wgsl: skyboxFragmentWGSL, entryPoint: 'main' },
            primitive: { cullFace: 'none' },
            depthStencil: { depthWriteEnabled: false, depthCompare: 'less-equal' }
        },
        draw: { __type__: 'DrawVertex' as const, vertexCount: 36, instanceCount: 1, firstVertex: 0, firstInstance: 0 },
        bindingResources: {} as any,
    };

    /**
     * 渲染对象列表 computed 缓存（按 scene → camera 嵌套）。
     *
     * Scene/Camera 运行时均为普通对象，引用相等即可作 WeakMap key；对象 GC 时对应
     * computed 自动失效，无泄漏。
     */
    private _renderObjectsCache = new WeakMap<Scene, WeakMap<Camera, Computed<readonly RenderObject[]>>>();

    /**
     * 绘制场景中天空盒
     *
     * 返回 `Computed<readonly RenderObject[]>`，按 (scene, camera) 缓存。
     * 调用方传入 `frame`（每帧自增的版本号 computed）作为响应式驱动源——
     * 每帧 `frame.value` 变化使本 computed 失效，重算 cameraUniforms 注入。
     *
     * 无激活天空盒时返回空数组（保持引用稳定，方便下游 spread 合并）。
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

        const self = this;
        const computedRenderObjects = computed<readonly RenderObject[]>(() =>
        {
            // 每帧驱动源：读 frame 建立依赖
            frame.value;

            const activeSkyBoxs = logic(scene).activeSkyBoxs;
            const skybox = activeSkyBoxs[0];

            // 无激活天空盒：返回空数组（保持引用稳定）
            if (!skybox) return [];

            //
            logic(skybox).beforeRender(self.renderObject, scene, camera);

            const cameraUniforms = logic(camera).uniforms;
            const bindingResources = self.renderObject.bindingResources as { [key: string]: BindingResource };

            bindingResources.cameraUniforms = { value: cameraUniforms };

            return [self.renderObject];
        });

        cameraMap.set(camera, computedRenderObjects);

        return computedRenderObjects;
    }
}

/**
 * 天空盒渲染器
 */
export const skyboxRenderer = new SkyBoxRenderer();
