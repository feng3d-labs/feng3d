import { Vector3 } from '@feng3d/math';
import { batchRun, reactive, logic } from '@feng3d/reactivity';
import { RenderPass, RenderPassObject, Submit } from '@feng3d/webgpu';
import type { Camera } from '../../cameras/Camera';
import { Object3D } from '../../core/Object3D';
import { ContainerLogic } from "../../core/Container";
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
 */
export class ShadowRenderer
{
    /** 阴影 RenderObject 缓存（按 renderable 缓存，避免每帧重建） */
    private _shadowRenderObjectCache = new WeakMap<Renderable, MutableRenderObject>();
    /** 方向光阴影 RenderPass 缓存（按 light 缓存，避免每帧新建导致 texture/textureView 泄漏） */
    private _directionalRenderPassCache = new WeakMap<DirectionalLight, RenderPass>();

    /**
     * 渲染
     */
    draw(submit: Submit, scene: Scene, camera: Camera)
    {
        const sLogic = logic(scene);
        const pointLights = sLogic.activePointLights.filter((i) => i.shadowType && i.shadowType !== ShadowType.No_Shadows) as PointLight[];
        for (let i = 0; i < pointLights.length; i++)
        {
            logic(pointLights[i]).updateDebugShadowMap(scene, camera);
            this.drawForPointLight(submit, pointLights[i], scene, camera);
        }

        const spotLights = sLogic.activeSpotLights.filter((i) => i.shadowType && i.shadowType !== ShadowType.No_Shadows) as SpotLight[];
        for (let i = 0; i < spotLights.length; i++)
        {
            logic(spotLights[i]).updateDebugShadowMap(scene, camera);
            this.drawForSpotLight(submit, spotLights[i], scene, camera);
        }

        const directionalLights = sLogic.activeDirectionalLights.filter((i) => i.shadowType && i.shadowType !== ShadowType.No_Shadows) as DirectionalLight[];
        for (let i = 0; i < directionalLights.length; i++)
        {
            logic(directionalLights[i]).updateDebugShadowMap(scene, camera);
            this.drawForDirectionalLight(submit, directionalLights[i], scene, camera);
        }
    }

    private drawForSpotLight(submit: Submit, light: SpotLight, scene: Scene, camera: Camera): any
    {
        const sLogic = logic(scene);
        const ll = logic(light);
        const renderPass: RenderPass = {
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

        submit.commandEncoders[0].passEncoders.push(renderPass);

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

        castShadowsModels.forEach((renderable) =>
        {
            this.drawObject3D(renderPass, renderable, shadowCamera, logic(shadowCamera).uniforms, ll);
        });
    }

    private drawForPointLight(submit: Submit, light: PointLight, scene: Scene, camera: Camera): any
    {
        const sLogic = logic(scene);
        const ll = logic(light);
        const renderPass: RenderPass = {
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

        submit.commandEncoders[0].passEncoders.push(renderPass);

        const shadowCamera = light.shadowCamera;
        const _r_pos = reactive((logic(shadowCamera).entity as Object3D).position);
        batchRun(() =>
        {
            _r_pos.x = ll.position.x;
            _r_pos.y = ll.position.y;
            _r_pos.z = ll.position.z;
        });

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
                this.drawObject3D(renderPass, renderable, shadowCamera, logic(shadowCamera).uniforms, ll);
            });
        }
    }

    private drawForDirectionalLight(submit: Submit, light: DirectionalLight, scene: Scene, camera: Camera): any
    {
        const sLogic = logic(scene);
        // 获取影响阴影图的渲染对象
        const models = sLogic.getPickByDirectionalLight(light);
        // 筛选投射阴影的渲染对象
        const castShadowsModels = models.filter((i) => i.castShadows);

        // 根据投射阴影物体的包围盒调整阴影相机（不含 receiveShadows-only 物体如大平面，
        // 否则包围盒过大导致 shadow map 精度不足、阴影畸变）
        logic(light).updateShadowByCamera(scene, camera, castShadowsModels);

        const ll = logic(light);
        // 复用 renderPass（含 descriptor），避免每帧新建对象导致缓存失效而泄漏。
        // 方向光阴影采用 depth-only Pass：shadowMap 本身是 depth24plus 纹理，既作
        // depthStencilAttachment（深度由光栅化写入），又作主渲染 Pass 的采样纹理。
        // 无需 colorAttachment，也无需额外的深度测试纹理。
        let renderPass = this._directionalRenderPassCache.get(light);
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
            this._directionalRenderPassCache.set(light, renderPass);
        }
        // 通过响应式代理操作 renderPassObjects，确保 WGPURenderPass 的 computed
        // （依赖 renderPassObjects.concat()）能感知变化并重算 draw commands。
        const r_renderPassObjects = reactive(renderPass).renderPassObjects as unknown as RenderPassObject[];
        r_renderPassObjects.length = 0;

        submit.commandEncoders[0].passEncoders.push(renderPass);

        //
        const shadowCamera = (light as any).shadowCamera as Camera;
        const shadowCameraUniforms = logic(shadowCamera).uniforms;
        castShadowsModels.forEach((renderable) =>
        {
            this.drawObject3D(renderPass, renderable, shadowCamera, shadowCameraUniforms, ll);
        });

    }

    /**
     * 绘制3D对象（阴影深度）— 使用缓存的 RenderObject
     */
    private drawObject3D(renderPass: RenderPass, renderable: Renderable, shadowCamera: Camera, shadowCameraUniforms: any, lightLogic: any)
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

        // 通过响应式代理 push，确保 WGPURenderPass 的 computed 感知变化
        (reactive(renderPass).renderPassObjects as unknown as RenderPassObject[]).push(renderObject as unknown as RenderPassObject);
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
