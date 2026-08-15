import { Frustum, Matrix4x4, Vector3 } from '@feng3d/math';
import { Computed, computed, reactive, logic, UnReadonly } from '@feng3d/reactivity';
import { BindingResources, BufferBinding, releaseBindingResources, RenderPass, RenderPassObject, RenderObject, TextureView } from '@feng3d/webgpu';
import type { Renderable } from '../../core/Renderable';
import type { DirectionalLight } from '../../light/DirectionalLight';
import type { LightLogic } from '../../light/Light';
import type { PointLight } from '../../light/PointLight';
import { ShadowType } from '../../light/shadow/ShadowType';
import type { SpotLight } from '../../light/SpotLight';
import type { Camera } from '../../cameras/Camera';
import type { Scene } from '../../scene/Scene';
import { shadowVertexWGSL } from '../../shaders/shadow.vertex.wgsl';
// 引入全局 uniform 类型定义（TransformUniforms 通过 declare global 声明）
import '../../render/data/Uniform';

/**
 * 阴影 uniform 数据（shadow vertex shader 用到的字段）。
 */
interface ShadowUniformData
{
    u_lightPosition: Vector3 | number[];
    u_shadowCameraNear: number;
    u_shadowCameraFar: number;
}

declare module '@feng3d/webgpu'
{
    interface BindingResources
    {
        shadowUniforms?: BufferBinding<ShadowUniformData>;
    }
}

/**
 * 阴影渲染器
 *
 * 负责渲染场景中所有灯光的阴影贴图。
 *
 * 每个光源产出一个独立 RenderPass（写到该光源的 shadowMap / shadowDepthTexture），
 * 与主渲染 Pass 不共享。draw 返回这些 RenderPass 组成的数组，供 View 拼到 submit
 * 的 passEncoders 中（顺序：阴影 Pass 在前写深度，主 Pass 在后采样）。
 *
 * 阴影投影矩阵（viewProjection）由各 LightLogic 子类直接计算并持有，
 * 不再经过 shadowCamera（Camera 组件）中转。
 */
export class ShadowRenderer
{
    /** 阴影 RenderObject 缓存（按 renderable 缓存，避免每帧重建） */
    private _shadowRenderObjectCache = new WeakMap<Renderable, RenderObject>();
    /** 各光源阴影 RenderPass computed 缓存（按 light 缓存，避免每帧新建导致 texture/textureView 泄漏） */
    private _pointLightRenderPassCache = new WeakMap<PointLight, Computed<readonly RenderPass[]>>();
    private _spotLightRenderPassCache = new WeakMap<SpotLight, Computed<RenderPass>>();
    private _directionalRenderPassCache = new WeakMap<DirectionalLight, Computed<RenderPass>>();

    /**
     * 释放渲染对象的阴影 RenderObject 资源（数据 dispose 时由 RenderableLogic 调用）。
     *
     * 确定性释放（设计 7.2）：销毁阴影 bindingResources 名下的 WGPU 实例
     * （bindGroup 等 per renderObject 独占资源）并移除缓存条目。
     */
    release(renderable: Renderable): void
    {
        const renderObject = this._shadowRenderObjectCache.get(renderable);
        if (renderObject)
        {
            if (renderObject.bindingResources)
            {
                releaseBindingResources(renderObject.bindingResources as Record<string, unknown>);
            }
            this._shadowRenderObjectCache.delete(renderable);
        }
    }

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
     * 变更驱动失效（框架设计文档 4.1）：光源集合/变换、渲染对象、树结构
     * 任一变化时自动重算；静态场景零重算。
     *
     * 无激活阴影光源时返回空数组（保持引用稳定，方便下游 spread 合并）。
     *
     * @param scene 场景
     * @param camera 摄像机
     */
    draw(scene: Scene, camera: Camera): Computed<readonly RenderPass[]>
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
            const sLogic = logic(scene);
            const renderPasses: RenderPass[] = [];

            const pointLights = sLogic.activePointLights.filter((i) => (i.shadowType ?? ShadowType.No_Shadows) !== ShadowType.No_Shadows) as PointLight[];
            for (let i = 0; i < pointLights.length; i++)
            {
                // PointLight 产出 6 个 depth-only Pass（cubemap 每 face 一个），展开 push
                const pointPasses = self.drawForPointLight(pointLights[i], scene).value;
                for (let f = 0; f < pointPasses.length; f++)
                {
                    renderPasses.push(pointPasses[f]);
                }
            }

            const spotLights = sLogic.activeSpotLights.filter((i) => (i.shadowType ?? ShadowType.No_Shadows) !== ShadowType.No_Shadows) as SpotLight[];
            for (let i = 0; i < spotLights.length; i++)
            {
                renderPasses.push(self.drawForSpotLight(spotLights[i], scene).value);
            }

            const directionalLights = sLogic.activeDirectionalLights.filter((i) => (i.shadowType ?? ShadowType.No_Shadows) !== ShadowType.No_Shadows) as DirectionalLight[];
            for (let i = 0; i < directionalLights.length; i++)
            {
                renderPasses.push(self.drawForDirectionalLight(directionalLights[i], scene, camera).value);
            }

            return renderPasses;
        });

        cameraMap.set(camera, computedRenderPasses);

        return computedRenderPasses;
    }

    private drawForSpotLight(light: SpotLight, scene: Scene): Computed<RenderPass>
    {
        const cached = this._spotLightRenderPassCache.get(light);
        if (cached) return cached;

        const self = this;
        // renderPass + shadowMap texture view 按 light 缓存，避免每帧新建导致缓存失效而泄漏。
        // computed 失效（光源/渲染对象数据变化驱动）后只重算 renderPassObjects，descriptor 引用稳定。
        // VP 由 SpotLightLogic 的 _shadowViewProjectionComputed 自动求值（依赖 world2local/angle/range），无需主动调。
        let renderPass: RenderPass;
        const computedRenderPass = computed<RenderPass>(() =>
        {
            const ll = logic(light);

            if (!renderPass)
            {
                renderPass = {
                    descriptor: {
                        colorAttachments: [
                            {
                                view: { texture: ll.shadowMap as unknown as TextureView['texture'] },
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

            // 用阴影 VP 构造临时 Frustum 做视锥剔除（VP 是 computed，读取时自动建立依赖）
            const shadowVP = ll.shadowViewProjection;
            const frustum = new Frustum();
            frustum.fromMatrix(shadowVP);
            const castShadowsModels = getCastShadowsModelsByFrustum(scene, frustum);

            const renderObjects: RenderPassObject[] = [];
            castShadowsModels.forEach((renderable) =>
            {
                self.drawObject3D(renderObjects, renderable, shadowVP, ll);
            });
            // 整体替换 renderPassObjects 引用 → 触发 WGPURenderPass._computedCommands 失效重算
            reactive(renderPass).renderPassObjects = renderObjects;

            return renderPass;
        });

        this._spotLightRenderPassCache.set(light, computedRenderPass);

        return computedRenderPass;
    }

    private drawForPointLight(light: PointLight, scene: Scene): Computed<readonly RenderPass[]>
    {
        const cached = this._pointLightRenderPassCache.get(light);
        if (cached) return cached;

        const self = this;
        // depth cubemap：6 个 depth-only Pass，每个写 cubemap 的一个 face layer。
        // WebGPU 不允许 cube view 作 attachment，必须用 per-face 的 2D view（baseArrayLayer=face）。
        // VP 由 PointLightLogic 的 _shadowViewProjectionsComputed 自动求值（依赖 worldPosition/range），无需主动调。
        // 6 个 renderPass 对象按 light 缓存（descriptor 引用稳定，避免每帧重建 TextureView 导致缓存膨胀）。
        const renderPasses: RenderPass[] = [];
        const computedRenderPasses = computed<readonly RenderPass[]>(() =>
        {
            const ll = logic(light);
            // 读取 6 面 VP（computed 求值，建立依赖）
            const shadowVPs = ll.shadowViewProjections;
            const depthTexture = ll.shadowDepthTexture;
            const result: RenderPass[] = [];

            for (let face = 0; face < 6; face++)
            {
                // 懒创建 6 个 renderPass（depth-only，view 指向 cubemap face layer）
                if (!renderPasses[face])
                {
                    renderPasses[face] = {
                        descriptor: {
                            colorAttachments: [],
                            depthStencilAttachment: {
                                view: {
                                    texture: depthTexture,
                                    dimension: '2d',
                                    baseArrayLayer: face,
                                    arrayLayerCount: 1,
                                    aspect: 'depth-only',
                                },
                                depthClearValue: 1,
                                depthLoadOp: 'clear',
                                depthStoreOp: 'store',
                            },
                        },
                        renderPassObjects: [],
                    };
                }

                // 每 face 用对应 VP 构造 Frustum 剔除 + 收集 RenderObject
                const shadowVP = shadowVPs[face];
                const frustum = new Frustum();
                frustum.fromMatrix(shadowVP);
                const castShadowsModels = getCastShadowsModelsByFrustum(scene, frustum);

                const renderObjects: RenderPassObject[] = [];
                castShadowsModels.forEach((renderable) =>
                {
                    self.drawObject3D(renderObjects, renderable, shadowVP, ll);
                });
                // 整体替换 renderPassObjects 引用 → 触发 WGPURenderPass._computedCommands 失效重算
                reactive(renderPasses[face]).renderPassObjects = renderObjects;
                result.push(renderPasses[face]);
            }

            return result;
        });

        this._pointLightRenderPassCache.set(light, computedRenderPasses);

        return computedRenderPasses;
    }

    private drawForDirectionalLight(light: DirectionalLight, scene: Scene, camera: Camera): Computed<RenderPass>
    {
        const cached = this._directionalRenderPassCache.get(light);
        if (cached) return cached;

        const self = this;
        // 方向光阴影采用 depth-only Pass：shadowDepthTexture 本身是 depth24plus 纹理，既作
        // depthStencilAttachment（深度由光栅化写入），又作主渲染 Pass 的采样纹理。
        // 无需 colorAttachment，也无需额外的深度测试纹理。
        // computed 失效（光源/渲染对象数据变化驱动）后只重算 renderPassObjects，descriptor 引用稳定。
        let renderPass: RenderPass;
        const computedRenderPass = computed<RenderPass>(() =>
        {
            const ll = logic(light);
            const sLogic = logic(scene);
            // 获取影响阴影图的渲染对象
            const models = sLogic.getPickByDirectionalLight(light);
            // 筛选投射阴影的渲染对象
            const castShadowsModels = models.filter((i) => (i.castShadows ?? true));

            // 根据所有相关物体（投射 + 接收）的包围盒调整阴影 VP。
            // 仅用 castShadowsModels 会让 receiveShadows-only 的地面落在阴影视锥外，
            // 导致地面片元采样 shadowMap 时越界，看不到阴影。
            ll.updateShadowByCamera(scene, camera, models);

            if (!renderPass)
            {
                renderPass = {
                    descriptor: {
                        colorAttachments: [],
                        depthStencilAttachment: {
                            view: { texture: ll.shadowDepthTexture as unknown as TextureView['texture'] },
                            depthClearValue: 1,
                            depthLoadOp: 'clear',
                            depthStoreOp: 'store',
                        },
                    },
                    renderPassObjects: [],
                };
            }

            const renderObjects: RenderPassObject[] = [];
            const shadowVP = ll.shadowViewProjection;
            castShadowsModels.forEach((renderable) =>
            {
                self.drawObject3D(renderObjects, renderable, shadowVP, ll);
            });
            // 整体替换 renderPassObjects 引用 → 触发 WGPURenderPass._computedCommands 失效重算
            reactive(renderPass).renderPassObjects = renderObjects;

            return renderPass;
        });

        this._directionalRenderPassCache.set(light, computedRenderPass);

        return computedRenderPass;
    }

    /**
     * 绘制3D对象（阴影深度）— 使用缓存的 RenderObject，push 到传入的 renderObjects 数组。
     *
     * @param renderObjects 累积目标数组
     * @param renderable 待渲染对象
     * @param shadowVP 阴影 view-projection 矩阵（直接写入 cameraUniforms.u_viewProjection）
     * @param lightLogic 光源 logic（提供 shadowCameraNear/Far、lightPosition）
     */
    private drawObject3D(renderObjects: RenderPassObject[], renderable: Renderable, shadowVP: Matrix4x4, lightLogic: LightLogic)
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
                bindingResources: {} as BindingResources,
            };
            this._shadowRenderObjectCache.set(renderable, renderObject);
        }

        // 几何体数据：beforeRender 写入 vertices/indices/draw（computed 缓存复用，
        // 避免每次新建对象导致 renderPipeline/顶点 buffer 泄漏；渲染数据不对外暴露）
        const geometry = renderable.geometry;
        logic(geometry).beforeRender(renderObject);

        // 更新 binding resources（transform + camera + shadow params）
        // 复用 binding 对象引用，仅更新 .value，避免每帧创建新对象导致 GPU 缓存膨胀。
        // cameraUniforms 只填 u_viewProjection（shadow vertex shader 只用这个字段，
        // WGPUBufferBinding 按 paths 逐项写入，其他字段 undefined 被跳过）。
        const bindingResources = renderObject.bindingResources;
        const entityLogic = logic(logic(renderable).entity);
        if (!bindingResources.transform)
        {
            // 阴影 Pass 使用独立的 transform value（读取当前矩阵）：与主 Pass 共享 wrapper
            // 存在确定性渲染差异（a17f5851，pull 化后复试仍复现）。已实证排除数据层
            // （共享时矩阵上传完全正确、双份同值），差异在更深的绑定/GPU 状态层，
            // 待 bufferView 独立化或绑定层专项排查。GPUBuffer 每对象 2 份为已知成本。
            bindingResources.transform = { value: {
                u_modelMatrix: entityLogic.local2world,
                u_ITModelMatrix: entityLogic.ITlocal2world,
            } };
            bindingResources.cameraUniforms = { value: { u_viewProjection: shadowVP } };
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
            reactive(bindingResources.transform.value).u_modelMatrix = entityLogic.local2world;
            reactive(bindingResources.transform.value).u_ITModelMatrix = entityLogic.ITlocal2world;
            reactive(bindingResources.cameraUniforms).value = { u_viewProjection: shadowVP };
            const r_shadowValue = reactive(bindingResources.shadowUniforms.value as ShadowUniformData);
            r_shadowValue.u_lightPosition = lightLogic.position;
            r_shadowValue.u_shadowCameraNear = lightLogic.shadowCameraNear;
            r_shadowValue.u_shadowCameraFar = lightLogic.shadowCameraFar;
        }

        console.log('[DBG-F] shadow RO draw', (renderObject as any).draw?.__type__, (renderObject as any).draw?.indexCount, 'u_modelMatrix:', ((renderObject as any).bindingResources.transform.value).u_modelMatrix instanceof Object);
        renderObjects.push(renderObject as unknown as RenderPassObject);
    }
}

/**
 * 按 Frustum 剔除场景中投射阴影的渲染对象。
 *
 * 替代原 getModelsByCamera(shadowCamera)——不再依赖 shadowCamera 的 frustum computed，
 * 直接用阴影 VP 构造临时 Frustum。
 */
function getCastShadowsModelsByFrustum(scene: Scene, frustum: Frustum): Renderable[]
{
    const sLogic = logic(scene);
    const models = sLogic.visibleAndEnabledModels;
    const results: Renderable[] = [];
    for (let i = 0; i < models.length; i++)
    {
        const renderable = models[i];
        if (!renderable.castShadows) continue;
        const worldBounds = logic(renderable).selfWorldBounds.value;
        if (frustum.intersectsBox(worldBounds))
        {
            results.push(renderable);
        }
    }

    return results;
}

/**
 * 阴影图渲染器
 */
export const shadowRenderer = new ShadowRenderer();
