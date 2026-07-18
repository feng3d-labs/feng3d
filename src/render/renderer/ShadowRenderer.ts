import { Vector3 } from '@feng3d/math';
import { batchRun, Computed, computed, reactive, logic } from '@feng3d/reactivity';
import { RenderPass, RenderPassObject } from '@feng3d/webgpu';
import type { Camera } from '../../cameras/Camera';
import { Object3D } from '../../core/Object3D';
import type { Renderable } from '../../core/Renderable';
import type { DirectionalLight } from '../../light/DirectionalLight';
import type { PointLight } from '../../light/PointLight';
import { ShadowType } from '../../light/shadow/ShadowType';
import type { SpotLight } from '../../light/SpotLight';
import type { Scene } from '../../scene/Scene';
import { shadowVertexWGSL } from '../../shaders/shadow.vertex.wgsl';
import { applyGeometryRenderData, MutableRenderObject } from '../webgpu/MaterialPipeline';

/**
 * 阴影渲染器
 *
 * 负责渲染场景中所有灯光的阴影贴图。
 *
 * 每个光源产出一个独立 RenderPass（写到该光源的 shadowMap / shadowDepthTexture），
 * 与主渲染 Pass 不共享。draw 返回这些 RenderPass 组成的数组，供 View 拼到 submit
 * 的 passEncoders 中（顺序：阴影 Pass 在前写深度，主 Pass 在后采样）。
 */
export class ShadowRenderer
{
    /** 阴影 RenderObject 缓存（按 renderable 缓存，避免每帧重建） */
    private _shadowRenderObjectCache = new WeakMap<Renderable, MutableRenderObject>();
    /** 各光源阴影 RenderPass computed 缓存（按 light 缓存，避免每帧新建导致 texture/textureView 泄漏） */
    private _pointLightRenderPassCache = new WeakMap<PointLight, Computed<RenderPass>>();
    private _spotLightRenderPassCache = new WeakMap<SpotLight, Computed<RenderPass>>();
    private _directionalRenderPassCache = new WeakMap<DirectionalLight, Computed<RenderPass>>();

    /**
     * 渲染对象列表 computed 缓存（按 scene → camera 嵌套）。
     *
     * Scene/Camera 运行时均为普通对象，引用相等即可作 WeakMap key；对象 GC 时对应
     * computed 自动失效，无泄漏。
     */
    private _renderPassesCache = new WeakMap<Scene, WeakMap<Camera, Computed<readonly RenderPass[]>>>();

    /**
     * 渲染
     *
     * 返回 `Computed<readonly RenderPass[]>`，按 (scene, camera) 缓存。
     * 调用方传入 `frame`（每帧自增的版本号 computed）作为响应式驱动源——
     * 每帧 `frame.value` 变化使本 computed 失效，重新填充各光源阴影 Pass。
     *
     * 无激活阴影光源时返回空数组（保持引用稳定，方便下游 spread 合并）。
     *
     * @param scene 场景
     * @param camera 摄像机
     * @param frame 每帧自增的版本号 computed
     */
    draw(scene: Scene, camera: Camera, frame: Computed<number>): Computed<readonly RenderPass[]>
    {
        // 命中缓存直接返回同一 computed 实例，保证下游依赖稳定
        let cameraMap = this._renderPassesCache.get(scene);
        if (!cameraMap)
        {
            cameraMap = new WeakMap();
            this._renderPassesCache.set(scene, cameraMap);
        }
        const cached = cameraMap.get(camera);
        if (cached) return cached;

        const self = this;
        const computedRenderPasses = computed<readonly RenderPass[]>(() =>
        {
            // 每帧驱动源：读 frame 建立依赖
            frame.value;

            const sLogic = logic(scene);
            const renderPasses: RenderPass[] = [];

            const pointLights = sLogic.activePointLights.filter((i) => i.shadowType && i.shadowType !== ShadowType.No_Shadows) as PointLight[];
            for (let i = 0; i < pointLights.length; i++)
            {
                logic(pointLights[i]).updateDebugShadowMap(scene, camera);
                renderPasses.push(self.drawForPointLight(pointLights[i], scene, camera, frame).value);
            }

            const spotLights = sLogic.activeSpotLights.filter((i) => i.shadowType && i.shadowType !== ShadowType.No_Shadows) as SpotLight[];
            for (let i = 0; i < spotLights.length; i++)
            {
                logic(spotLights[i]).updateDebugShadowMap(scene, camera);
                renderPasses.push(self.drawForSpotLight(spotLights[i], scene, camera, frame).value);
            }

            const directionalLights = sLogic.activeDirectionalLights.filter((i) => i.shadowType && i.shadowType !== ShadowType.No_Shadows) as DirectionalLight[];
            for (let i = 0; i < directionalLights.length; i++)
            {
                logic(directionalLights[i]).updateDebugShadowMap(scene, camera);
                renderPasses.push(self.drawForDirectionalLight(directionalLights[i], scene, camera, frame).value);
            }

            return renderPasses;
        });

        cameraMap.set(camera, computedRenderPasses);

        return computedRenderPasses;
    }

    private drawForSpotLight(light: SpotLight, scene: Scene, camera: Camera, frame: Computed<number>): Computed<RenderPass>
    {
        const cached = this._spotLightRenderPassCache.get(light);
        if (cached) return cached;

        const self = this;
        // renderPass + shadowMap texture view 按 light 缓存，避免每帧新建导致缓存失效而泄漏。
        // computed 每帧失效（读 frame.value）后只重算 renderPassObjects，descriptor 引用稳定。
        let renderPass: RenderPass;
        const computedRenderPass = computed<RenderPass>(() =>
        {
            // 每帧驱动源：读 frame 建立依赖
            frame.value;

            const sLogic = logic(scene);
            const ll = logic(light);
            if (!renderPass)
            {
                renderPass = {
                    descriptor: {
                        colorAttachments: [
                            {
                                view: { texture: ll.shadowMap as any },
                                clearValue: [1.0, 1.0, 1.0, 1.0],
                            },
                        ],
                        depthStencilAttachment: {
                            depthClearValue: 1,
                            depthLoadOp: 'clear',
                            depthStoreOp: 'store',
                        },
                    },
                    renderPassObjects: [],
                };
            }

            const shadowCamera = light.shadowCamera;
            {
                const t = logic(shadowCamera).entity;
                let localMatrix = logic(ll.entity).local2world.value.clone();
                const r_parent = logic(t).parent;
                if (r_parent)
                {
                    const parent = r_parent as unknown as Object3D;
                    localMatrix.append(logic(parent).world2local.value);
                }
                const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
                localMatrix.toTRS(pos, rot, scl);
                const r_pos = reactive((t as Object3D).position); const r_rot = reactive((t as Object3D).rotation); const r_scl = reactive((t as Object3D).scale);
                batchRun(() =>
                {
                    r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z;
                    r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z;
                    r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z;
                });
            }

            // 获取影响阴影图的渲染对象
            const models = sLogic.getModelsByCamera(shadowCamera);
            // 筛选投射阴影的渲染对象
            const castShadowsModels = models.filter((i) => i.castShadows);

            const renderObjects: RenderPassObject[] = [];
            castShadowsModels.forEach((renderable) =>
            {
                self.drawObject3D(renderObjects, renderable, shadowCamera, logic(shadowCamera).uniforms, ll);
            });
            // 整体替换 renderPassObjects 引用 → 触发 WGPURenderPass._computedCommands 失效重算
            reactive(renderPass).renderPassObjects = renderObjects;

            return renderPass;
        });

        this._spotLightRenderPassCache.set(light, computedRenderPass);

        return computedRenderPass;
    }

    private drawForPointLight(light: PointLight, scene: Scene, camera: Camera, frame: Computed<number>): Computed<RenderPass>
    {
        const cached = this._pointLightRenderPassCache.get(light);
        if (cached) return cached;

        const self = this;
        // renderPass + shadowMap texture view 按 light 缓存，避免每帧新建导致缓存失效而泄漏。
        // computed 每帧失效（读 frame.value）后只重算 renderPassObjects，descriptor 引用稳定。
        let renderPass: RenderPass;
        const computedRenderPass = computed<RenderPass>(() =>
        {
            // 每帧驱动源：读 frame 建立依赖
            frame.value;

            const sLogic = logic(scene);
            const ll = logic(light);
            if (!renderPass)
            {
                renderPass = {
                    descriptor: {
                        colorAttachments: [
                            {
                                view: { texture: ll.shadowMap as any },
                                clearValue: [1.0, 1.0, 1.0, 1.0],
                            },
                        ],
                        depthStencilAttachment: {
                            depthClearValue: 1,
                            depthLoadOp: 'clear',
                            depthStoreOp: 'store',
                        },
                    },
                    renderPassObjects: [],
                };
            }

            const shadowCamera = light.shadowCamera;
            const _r_pos = reactive((logic(shadowCamera).entity as Object3D).position);
            batchRun(() =>
            {
                _r_pos.x = ll.position.x;
                _r_pos.y = ll.position.y;
                _r_pos.z = ll.position.z;
            });

            // cubemap 6 面：每面改 shadowCamera 变换 + 挑 models + 收集 RenderObject。
            // 所有面的 RenderObject 累积到同一个 renderPassObjects（写同一张 cubemap shadowMap）。
            const renderObjects: RenderPassObject[] = [];
            for (let face = 0; face < 6; face++)
            {
                {
                    const t = logic(shadowCamera).entity;
                    const target = ll.position.addTo(cubeDirections[face]);
                    const m = logic(t).matrix.value.clone();
                    m.lookAt(target, cubeUps[face]);
                    const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
                    m.toTRS(pos, rot, scl);
                    const r_pos = reactive((t as Object3D).position); const r_rot = reactive((t as Object3D).rotation); const r_scl = reactive((t as Object3D).scale);
                    batchRun(() =>
                    {
                        r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z;
                        r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z;
                        r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z;
                    });
                }

                // 获取影响阴影图的渲染对象
                const models = sLogic.getModelsByCamera(shadowCamera);
                // 筛选投射阴影的渲染对象
                const castShadowsModels = models.filter((i) => i.castShadows);

                castShadowsModels.forEach((renderable) =>
                {
                    self.drawObject3D(renderObjects, renderable, shadowCamera, logic(shadowCamera).uniforms, ll);
                });
            }
            // 整体替换 renderPassObjects 引用 → 触发 WGPURenderPass._computedCommands 失效重算
            reactive(renderPass).renderPassObjects = renderObjects;

            return renderPass;
        });

        this._pointLightRenderPassCache.set(light, computedRenderPass);

        return computedRenderPass;
    }

    private drawForDirectionalLight(light: DirectionalLight, scene: Scene, camera: Camera, frame: Computed<number>): Computed<RenderPass>
    {
        const cached = this._directionalRenderPassCache.get(light);
        if (cached) return cached;

        const self = this;
        // 复用 renderPass（含 descriptor），避免每帧新建对象导致缓存失效而泄漏。
        // 方向光阴影采用 depth-only Pass：shadowMap 本身是 depth24plus 纹理，既作
        // depthStencilAttachment（深度由光栅化写入），又作主渲染 Pass 的采样纹理。
        // 无需 colorAttachment，也无需额外的深度测试纹理。
        // computed 每帧失效（读 frame.value）后只重算 renderPassObjects，descriptor 引用稳定。
        let renderPass: RenderPass;
        const computedRenderPass = computed<RenderPass>(() =>
        {
            // 每帧驱动源：读 frame 建立依赖
            frame.value;

            const sLogic = logic(scene);
            // 获取影响阴影图的渲染对象
            const models = sLogic.getPickByDirectionalLight(light);
            // 筛选投射阴影的渲染对象
            const castShadowsModels = models.filter((i) => i.castShadows);

            // 根据投射阴影物体的包围盒调整阴影相机（不含 receiveShadows-only 物体如大平面，
            // 否则包围盒过大导致 shadow map 精度不足、阴影畸变）
            logic(light).updateShadowByCamera(scene, camera, castShadowsModels);

            const ll = logic(light);
            if (!renderPass)
            {
                renderPass = {
                    descriptor: {
                        colorAttachments: [],
                        depthStencilAttachment: {
                            view: { texture: ll.shadowDepthTexture as any },
                            depthClearValue: 1,
                            depthLoadOp: 'clear',
                            depthStoreOp: 'store',
                        },
                    },
                    renderPassObjects: [],
                };
            }

            const renderObjects: RenderPassObject[] = [];
            const shadowCamera = (light as any).shadowCamera as Camera;
            const shadowCameraUniforms = logic(shadowCamera).uniforms;
            castShadowsModels.forEach((renderable) =>
            {
                self.drawObject3D(renderObjects, renderable, shadowCamera, shadowCameraUniforms, ll);
            });
            // 整体替换 renderPassObjects 引用 → 触发 WGPURenderPass._computedCommands 失效重算
            reactive(renderPass).renderPassObjects = renderObjects;

            return renderPass;
        });

        this._directionalRenderPassCache.set(light, computedRenderPass);

        return computedRenderPass;
    }

    /**
     * 绘制3D对象（阴影深度）— 使用缓存的 RenderObject，push 到传入的 renderObjects 数组
     */
    private drawObject3D(renderObjects: RenderPassObject[], renderable: Renderable, shadowCamera: Camera, shadowCameraUniforms: any, lightLogic: any)
    {
        let renderObject = this._shadowRenderObjectCache.get(renderable);
        if (!renderObject)
        {
            // 首次创建，后续帧复用
            renderObject = {
                pipeline: {
                    // depth-only Pass：vertex-only pipeline（无 fragment），深度由光栅化写入。
                    // 参照 webgpu shadowMapping 示例：vertex-only pipeline 是 depth-only 渲染的标准做法。
                    vertex: { wgsl: shadowVertexWGSL, entryPoint: 'main' },
                    primitive: { cullFace: 'back' },
                    depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
                },
                vertices: undefined,
                indices: undefined,
                draw: undefined,
                bindingResources: {} as any,
            };
            this._shadowRenderObjectCache.set(renderable, renderObject);
        }

        // 几何体数据（vertices/indices/draw）复用 applyGeometryRenderData 的缓存，
        // 避免 buildVertices 每帧新建对象导致 renderPipeline/顶点 buffer 泄漏
        const geometry = (renderable as any).geometry;
        applyGeometryRenderData(renderObject as any, logic(geometry));

        // 更新 binding resources（transform + camera + shadow params）
        // 复用 binding 对象引用，仅更新 .value，避免每帧创建新对象导致 GPU 缓存膨胀
        const bindingResources = renderObject.bindingResources as { [key: string]: any };
        const entityLogic = logic(logic(renderable).entity);
        if (!bindingResources.transform)
        {
            bindingResources.transform = { value: { u_modelMatrix: entityLogic.local2world.value, u_ITModelMatrix: entityLogic.ITlocal2world.value } };
            bindingResources.cameraUniforms = { value: shadowCameraUniforms };
            bindingResources.shadowUniforms = {
                value: {
                    u_lightPosition: lightLogic.position,
                    u_shadowCameraNear: lightLogic.shadowCameraNear,
                    u_shadowCameraFar: lightLogic.shadowCameraFar,
                },
            };
        }
        else
        {
            bindingResources.transform.value.u_modelMatrix = entityLogic.local2world.value;
            bindingResources.transform.value.u_ITModelMatrix = entityLogic.ITlocal2world.value;
            bindingResources.cameraUniforms.value = shadowCameraUniforms;
            bindingResources.shadowUniforms.value.u_lightPosition = lightLogic.position;
            bindingResources.shadowUniforms.value.u_shadowCameraNear = lightLogic.shadowCameraNear;
            bindingResources.shadowUniforms.value.u_shadowCameraFar = lightLogic.shadowCameraFar;
        }

        renderObjects.push(renderObject as unknown as RenderPassObject);
    }
}

/**
 * 阴影图渲染器
 */
export const shadowRenderer = new ShadowRenderer();

const cubeUps = [
    new Vector3(0, 1, 0), new Vector3(0, 1, 0), new Vector3(0, 1, 0),
    new Vector3(0, 1, 0), new Vector3(0, 0, 1), new Vector3(0, 0, -1)
];
const cubeDirections = [
    new Vector3(1, 0, 0), new Vector3(-1, 0, 0), new Vector3(0, 0, 1),
    new Vector3(0, 0, -1), new Vector3(0, 1, 0), new Vector3(0, -1, 0)
];
