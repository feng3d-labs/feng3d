import { Vector3 } from '@feng3d/math';
import { batchRun, reactive } from '@feng3d/reactivity';
import { RenderPass, RenderPassObject, Submit } from '@feng3d/webgpu';
import { Camera } from '../../cameras/Camera';
import { Object3D } from '../../core/Object3D';
import { Renderable } from '../../core/Renderable';
import { transformLogic } from '../../core/transformLogic';
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
 */

export class ShadowRenderer
{
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
        {
            const t = shadowCamera.object3D;
            let localMatrix = transformLogic(light.object3D).local2world.value.clone();
            const parent = reactive(t).parent;
            if (parent) localMatrix.append(transformLogic(parent as Object3D).world2local.value);
            const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
            localMatrix.toTRS(pos, rot, scl);
            const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
            batchRun(() =>
            {
                r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z;
                r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z;
                r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z;
            });
        }

        // 获取影响阴影图的渲染对象
        const models = scene.getModelsByCamera(shadowCamera);
        // 筛选投射阴影的渲染对象
        const castShadowsModels = models.filter((i) => i.castShadows);

        castShadowsModels.forEach((renderable) =>
        {
            this.drawObject3D(renderPass, renderable, scene, camera);
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
        const _r_pos = reactive(shadowCamera.object3D.position);
        batchRun(() =>
        {
            _r_pos.x = light.position.x;
            _r_pos.y = light.position.y;
            _r_pos.z = light.position.z;
        });

        for (let face = 0; face < 6; face++)
        {
            {
                const t = shadowCamera.object3D;
                const target = light.position.addTo(cubeDirections[face]);
                const m = transformLogic(t).matrix.value.clone();
                m.lookAt(target, cubeUps[face]);
                const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
                m.toTRS(pos, rot, scl);
                const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
                batchRun(() =>
                {
                    r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z;
                    r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z;
                    r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z;
                });
            }

            // 获取影响阴影图的渲染对象
            const models = scene.getModelsByCamera(shadowCamera);
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

        //
        castShadowsModels.forEach((renderable) =>
        {
            this.drawObject3D(renderPass, renderable, scene, camera);
        });

    }

    /**
     * 绘制3D对象
     */
    private drawObject3D(renderPass: RenderPass, renderable: Renderable, scene: Scene, camera: Camera)
    {
        const renderObject = renderable.renderObject.value;

        // TODO: 使用阴影材质/着色器重新绘制（原依赖已移除的 shader/next 机制）
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
