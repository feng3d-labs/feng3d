import { Vector3 } from '@feng3d/math';
import { RenderObject, RenderPass, RenderPassObject, Submit } from '@feng3d/webgpu';
import { Camera } from '../../cameras/Camera';
import { Renderable } from '../../core/Renderable';
import { DirectionalLight } from '../../light/DirectionalLight';
import { PointLight } from '../../light/PointLight';
import { ShadowType } from '../../light/shadow/ShadowType';
import { SpotLight } from '../../light/SpotLight';
import { Scene } from '../../scene/Scene';

/**
 * 阴影渲染器架构设计文档
 *
 * ## 概述
 * ShadowRenderer 负责渲染场景中所有灯光的阴影贴图。
 * 它支持三种类型的灯光阴影：
 * 1. **点光源阴影** - 使用 6 个面的立方体阴影贴图
 * 2. **聚光灯阴影** - 使用单个 2D 阴影贴图
 * 3. **方向光阴影** - 使用单个 2D 阴影贴图，支持级联阴影
 *
 * ## WebGPU 迁移说明
 * 该类正在进行从 WebGL 到 WebGPU 的迁移：
 * - 使用 WebGPU RenderPass 和 RenderObject
 * - 阴影贴图存储在 GPUTexture 中
 * - 渲染参数使用 WebGPU 的 PrimitiveState、DepthStencilState 等
 *
 * ## 性能优化
 * - 只渲染投射阴影的物体
 * - 使用视口裁剪优化
 * - 支持级联阴影贴图（CSM）优化大场景阴影质量
 *
 * ## 扩展点
 * - shadowShader: 自定义阴影着色器
 */

declare global
{
    export interface MixinsRenderObject
    {
        shadowShader?: string;
    }
}

export class ShadowRenderer
{
    private renderObject = new RenderObject();

    /**
     * 渲染
     */
    draw(submit: Submit, scene: Scene, camera: Camera)
    {
        const pointLights = scene.activePointLights.filter((i) => i.shadowType !== ShadowType.No_Shadows);
        for (let i = 0; i < pointLights.length; i++)
        {
            pointLights[i].updateDebugShadowMap(scene, camera);
            this.drawForPointLight(submit, pointLights[i], scene, camera);
        }

        const spotLights = scene.activeSpotLights.filter((i) => i.shadowType !== ShadowType.No_Shadows);
        for (let i = 0; i < spotLights.length; i++)
        {
            spotLights[i].updateDebugShadowMap(scene, camera);
            this.drawForSpotLight(submit, spotLights[i], scene, camera);
        }

        const directionalLights = scene.activeDirectionalLights.filter((i) => i.shadowType !== ShadowType.No_Shadows);
        for (let i = 0; i < directionalLights.length; i++)
        {
            directionalLights[i].updateDebugShadowMap(scene, camera);
            this.drawForDirectionalLight(submit, directionalLights[i], scene, camera);
        }
    }

    private drawForSpotLight(submit: Submit, light: SpotLight, scene: Scene, camera: Camera): any
    {
        const renderPass: RenderPass = {
            descriptor: {
                colorAttachments: [
                    {
                        view: { texture: { context: { canvasId: light.shadowMap as any } } },
                        clearValue: [1.0, 1.0, 1.0, 1.0],
                    },
                ],
                depthStencilAttachment: {
                    depthClearValue: 1,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            }
        };

        submit.commandEncoders[0].passEncoders.push(renderPass);

        const shadowCamera = light.shadowCamera;
        shadowCamera.transform.setLocalToWorldMatrix(light.transform.localToWorldMatrix.value);

        const renderObject = this.renderObject;

        // 获取影响阴影图的渲染对象
        const models = scene.getModelsByCamera(shadowCamera);
        // 筛选投射阴影的渲染对象
        const castShadowsModels = models.filter((i) => i.castShadows);

        //
        renderObject.uniforms.u_projectionMatrix = shadowCamera.lens.matrix;
        renderObject.uniforms.u_viewProjection = shadowCamera.viewProjection;
        renderObject.uniforms.u_viewMatrix = shadowCamera.transform.worldToLocalMatrix;
        renderObject.uniforms.u_cameraMatrix = shadowCamera.transform.localToWorldMatrix;
        renderObject.uniforms.u_cameraPos = shadowCamera.transform.worldPosition;
        //
        renderObject.uniforms.u_lightType = light.lightType;
        renderObject.uniforms.u_lightPosition = light.position;
        renderObject.uniforms.u_shadowCameraNear = light.shadowCameraNear;
        renderObject.uniforms.u_shadowCameraFar = light.shadowCameraFar;

        castShadowsModels.forEach((renderable) =>
        {
            this.drawGameObject(renderPass, renderable, scene, camera);
        });
    }

    private drawForPointLight(submit: Submit, light: PointLight, scene: Scene, camera: Camera): any
    {
        const renderPass: RenderPass = {
            descriptor: {
                colorAttachments: [
                    {
                        view: { texture: { context: { canvasId: light.shadowMap as any } } },
                        clearValue: [1.0, 1.0, 1.0, 1.0],
                    },
                ],
                depthStencilAttachment: {
                    depthClearValue: 1,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            }
        };

        submit.commandEncoders[0].passEncoders.push(renderPass);

        const shadowCamera = light.shadowCamera;
        shadowCamera.transform.setPosition(light.transform.position);

        const renderObject = this.renderObject;

        for (let face = 0; face < 6; face++)
        {
            shadowCamera.transform.lookAt(light.position.addTo(cubeDirections[face]), cubeUps[face]);

            // 获取影响阴影图的渲染对象
            const models = scene.getModelsByCamera(shadowCamera);
            // 筛选投射阴影的渲染对象
            const castShadowsModels = models.filter((i) => i.castShadows);

            //
            renderObject.uniforms.u_projectionMatrix = shadowCamera.lens.matrix;
            renderObject.uniforms.u_viewProjection = shadowCamera.viewProjection;
            renderObject.uniforms.u_viewMatrix = shadowCamera.transform.worldToLocalMatrix;
            renderObject.uniforms.u_cameraMatrix = shadowCamera.transform.localToWorldMatrix;
            renderObject.uniforms.u_cameraPos = shadowCamera.transform.worldPosition;
            //
            renderObject.uniforms.u_lightType = light.lightType;
            renderObject.uniforms.u_lightPosition = light.position;
            renderObject.uniforms.u_shadowCameraNear = light.shadowCameraNear;
            renderObject.uniforms.u_shadowCameraFar = light.shadowCameraFar;

            castShadowsModels.forEach((renderable) =>
            {
                this.drawGameObject(renderPass, renderable, scene, camera);
            });
        }
    }

    private drawForDirectionalLight(submit: Submit, light: DirectionalLight, scene: Scene, camera: Camera): any
    {
        // 获取影响阴影图的渲染对象
        const models = scene.getPickByDirectionalLight(light);
        // 筛选投射阴影的渲染对象
        const castShadowsModels = models.filter((i) => i.castShadows);

        light.updateShadowByCamera(scene, camera, models);

        const renderPass: RenderPass = {
            descriptor: {
                colorAttachments: [
                    {
                        view: { texture: { context: { canvasId: light.shadowMap as any } } },
                        clearValue: [1.0, 1.0, 1.0, 1.0],
                    },
                ],
                depthStencilAttachment: {
                    depthClearValue: 1,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            }
        };

        submit.commandEncoders[0].passEncoders.push(renderPass);

        const shadowCamera = light.shadowCamera;

        const renderObject = this.renderObject;
        //
        renderObject.uniforms.u_projectionMatrix = shadowCamera.lens.matrix;
        renderObject.uniforms.u_viewProjection = shadowCamera.viewProjection;
        renderObject.uniforms.u_viewMatrix = shadowCamera.transform.worldToLocalMatrix;
        renderObject.uniforms.u_cameraMatrix = shadowCamera.transform.localToWorldMatrix;
        renderObject.uniforms.u_cameraPos = shadowCamera.transform.worldPosition;
        //
        renderObject.uniforms.u_lightType = light.lightType;
        renderObject.uniforms.u_lightPosition = shadowCamera.transform.worldPosition;
        renderObject.uniforms.u_shadowCameraNear = light.shadowCameraNear;
        renderObject.uniforms.u_shadowCameraFar = light.shadowCameraFar;
        //
        castShadowsModels.forEach((renderable) =>
        {
            this.drawGameObject(renderPass, renderable, scene, camera);

            (renderPass.renderPassObjects as RenderPassObject[]).push(this.renderObject);
        });

    }

    /**
     * 绘制3D对象
     */
    private drawGameObject(renderPass: RenderPass, renderable: Renderable, scene: Scene, camera: Camera)
    {
        const renderObject = renderable.renderObject.value;
        renderObject.shadowShader = renderObject.shadowShader || 'shadow';

        //
        this.renderObject.next = renderObject;

        // 使用shadowShader
        this.renderObject.shader = renderObject.shadowShader;
        (renderPass.renderPassObjects as RenderPassObject[]).push(this.renderObject);
        this.renderObject.shader = null;
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
