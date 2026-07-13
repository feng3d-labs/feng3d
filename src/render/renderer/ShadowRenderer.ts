import { Vector3 } from '@feng3d/math';
import { batchRun, reactive, logic } from '@feng3d/reactivity';
import { RenderPass, RenderPassObject, Submit, RenderObject, BindingResource } from '@feng3d/webgpu';
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
import { shadowFragmentWGSL } from '../../shaders/shadow.fragment.wgsl';

/**
 * 阴影渲染器
 *
 * 负责渲染场景中所有灯光的阴影贴图。
 */
export class ShadowRenderer
{
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
                        view: { texture: { context: { canvasId: ll.shadowMap as any } } },
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
            this.drawObject3D(renderPass, renderable, scene, camera);
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
                        view: { texture: { context: { canvasId: ll.shadowMap as any } } },
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
                this.drawObject3D(renderPass, renderable, scene, camera);
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

        logic(light).updateShadowByCamera(scene, camera, models);

        const ll = logic(light);
        const renderPass: RenderPass = {
            descriptor: {
                colorAttachments: [
                    {
                        view: { texture: { context: { canvasId: ll.shadowMap as any } } },
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

        //
        const shadowCamera = ll._shadowCamera as Camera;
        const shadowCameraUniforms = logic(shadowCamera).uniforms;
        castShadowsModels.forEach((renderable) =>
        {
            this.drawObject3D(renderPass, renderable, scene, shadowCamera, shadowCameraUniforms, ll);
        });

    }

    /**
     * 绘制3D对象（阴影深度）
     */
    private drawObject3D(renderPass: RenderPass, renderable: Renderable, scene: Scene, shadowCamera: Camera, shadowCameraUniforms: any, lightLogic: any)
    {
        const sourceRenderObject = logic(renderable).renderObject.value;

        // 构建阴影专属 RenderObject（用阴影着色器，复用几何体顶点数据）
        const renderObject: RenderObject = {
            pipeline: {
                vertex: { wgsl: shadowVertexWGSL, entryPoint: 'main' },
                fragment: { wgsl: shadowFragmentWGSL, entryPoint: 'main', targets: [{}] },
                primitive: { cullFace: 'back' },
                depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
            },
            vertices: sourceRenderObject.vertices,
            draw: sourceRenderObject.draw,
            bindingResources: {} as any,
        };

        const bindingResources = renderObject.bindingResources as { [key: string]: BindingResource };

        // transform（u_modelMatrix / u_ITModelMatrix）
        if (sourceRenderObject.bindingResources)
        {
            bindingResources.transform = sourceRenderObject.bindingResources.transform;
        }

        // cameraUniforms（u_viewProjection）
        bindingResources.cameraUniforms = { value: shadowCameraUniforms };

        // shadowUniforms（u_lightPosition, u_shadowCameraNear, u_shadowCameraFar）
        bindingResources.shadowUniforms = {
            value: {
                u_lightPosition: lightLogic.position,
                u_shadowCameraNear: lightLogic.shadowCameraNear,
                u_shadowCameraFar: lightLogic.shadowCameraFar,
            },
        };

        (renderPass.renderPassObjects as RenderPassObject[]).push(renderObject);
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
