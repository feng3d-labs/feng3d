import { Color3 } from '@feng3d/math';
import { Camera, createCamera } from '../cameras/Camera';
import { Behaviour, createBehaviour } from '../component/Behaviour';
import { FrameBufferObject } from '../render/FrameBufferObject';
import { LightType } from './LightType';
import { ShadowType } from './shadow/ShadowType';
import { isRenderable } from "../component/Component";
import { createBillboardComponent, BillboardComponent } from '../component/BillboardComponent';
import { batchRun, reactive, logic as getLogic } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { cameraLogic } from '../cameras/Camera';
import { BehaviourLogic, behaviourLogic } from '../component/Behaviour';
import { Object3D } from '../core/Object3D';
import { containerLogic } from "../core/Container";
import { createObject3D } from '../core/createObject3D';
import { createPrimitive, Object3DLogic } from "../core/Object3D";
import { Renderable } from '../core/Renderable';
import { materialLogic } from '../materials/Material';
import { createTextureMaterial } from '../materials/TextureMaterial';
import { createPlaneGeometry } from '../primitives/PlaneGeometry';
import { sceneLogic } from '../scene/Scene';
import type { Scene } from '../scene/Scene';

import './Light';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        Light: Light;
    }
}

/**
 * Light（纯数据接口）。
 */
export interface Light extends Behaviour
{
    readonly lightType: LightType;
    readonly color: Color3;
    readonly intensity: number;
    readonly shadowType: any;
    readonly shadowBias: number;
    readonly shadowRadius: number;
    readonly shadowCamera: Camera;
    readonly frameBufferObject: FrameBufferObject;
    readonly debugShadowMap: boolean;
}

/**
 * 创建 Light 实例。
 */
export function createLight(): Light
{
    return {
        ...createBehaviour(), __type__: 'Light',
        lightType: null as any,
        color: new Color3(),
        intensity: 1,
        shadowType: ShadowType.No_Shadows,
        shadowBias: -0.005,
        shadowRadius: 1,
        shadowCamera: null as any,
        frameBufferObject: new FrameBufferObject(),
        debugShadowMap: false,
    };
}

/**
 * Light 逻辑处理输出。
 *
 * 组合 behaviourLogic，额外提供：
 * - position / direction: 由 transform 派生
 * - shadowCameraNear / shadowCameraFar / shadowMapSize / shadowMap: 阴影相关派生
 * - init: 创建 shadowCamera（Object3D + Camera 组件）
 * - updateDebugShadowMap: 调试阴影图对象管理
 */
export interface LightLogic extends BehaviourLogic
{
    readonly position: any;
    readonly direction: any;
    readonly shadowCameraNear: number;
    readonly shadowCameraFar: number;
    readonly shadowMapSize: any;
    readonly shadowMap: any;
    updateDebugShadowMap(scene: Scene, viewCamera: Camera): void;
}

/**
 * 获取 Light 的 logic。
 */
export function lightLogic(light: Light): LightLogic

{
    return getLogic(light);
}

function createLightLogic(light: Light): LightLogic
{
    const base = behaviourLogic(light);
    let _shadowCamera: Camera | null = null;
    let _debugShadowMapObject: Object3D | null = null;
    let _inited = false;

    const logic = {
        object3D: null as any,
        get isVisibleAndEnabled() { return base.isVisibleAndEnabled; },
        get position()
        {
            return getLogic(logic.object3D).worldPosition.value;
        },
        get direction()
        {
            return getLogic(logic.object3D).local2world.value.getAxisZ();
        },
        get shadowCameraNear()
        {
            return _shadowCamera.lens.near;
        },
        get shadowCameraFar()
        {
            return _shadowCamera.lens.far;
        },
        get shadowMapSize()
        {
            return logic.shadowMap.getSize();
        },
        get shadowMap()
        {
            return light.frameBufferObject.texture;
        },
        init()
        {
            if (_inited) return;
            _inited = true;
            base.init();

            // 创建阴影相机
            const shadowCamObj = Object.assign(createObject3D(), { name: 'LightShadowCamera' });
            const cam = createCamera();
            reactive(shadowCamObj).components.push(cam);
            // 触发 object3DLogic（注册 entityLogic 等效应），确保 Camera 自动 init
            object3DLogicEnsure(shadowCamObj);
            _shadowCamera = cam;
            reactive(light).shadowCamera = cam;
        },
        beforeRender(ro, scene, camera) { base.beforeRender(ro, scene, camera); },
        update(interval: number) { base.update(interval); },
        updateDebugShadowMap(scene: Scene, viewCamera: Camera)
        {
            let object3D = _debugShadowMapObject;
            if (!object3D)
            {
                object3D = _debugShadowMapObject = createPrimitive('Plane', { name: 'debugShadowMapObject' });
                reactive(object3D).mouseEnabled = false;
                const bb = createBillboardComponent();
                reactive(object3D).components.push(bb);

                // 材质
                const model = object3D.components.find(c => isRenderable(c)) as Renderable;
                reactive(model).geometry = Object.assign(createPlaneGeometry(), { width: light.lightType === LightType.Point ? 1 : 0.5, height: 0.5, segmentsW: 1, segmentsH: 1, yUp: false });
                const textureMaterial = reactive(model).material = Object.assign(createTextureMaterial(), { s_texture: light.frameBufferObject.texture as any });
                reactive(materialLogic(textureMaterial).renderPipeline.fragment).targets = [{
                    blend: {
                        color: { srcFactor: 'one', dstFactor: 'zero', operation: 'add' },
                        alpha: { srcFactor: 'one', dstFactor: 'zero', operation: 'add' },
                    },
                }];
            }

            const viewCameraObj = cameraLogic(viewCamera).object3D;
            const depth = cameraLogic(viewCamera).lens.near * 2;
            const _pos = getLogic(viewCameraObj).worldPosition.value.addTo(getLogic(viewCameraObj).local2world.value.getAxisZ().scaleNumberTo(depth));
            const _r_pos = reactive(object3D.position);
            batchRun(() =>
            {
                _r_pos.x = _pos.x;
                _r_pos.y = _pos.y;
                _r_pos.z = _pos.z;
            });
            const billboardComponent = object3D.components.find(c => c.__type__ === 'BillboardComponent') as BillboardComponent;
            reactive(billboardComponent).camera = viewCamera;

            if (light.debugShadowMap)
            {
                reactive(sceneLogic(scene).object3D).children.push(object3D);
            }
            else
            {
                const parent = containerLogic(object3D).parent as Object3D | null;
                if (parent)
                {
                    const idx = reactive(parent).children.indexOf(object3D);
                    if (idx !== -1) reactive(parent).children.splice(idx, 1);
                }
            }
        },
        dispose()
        {
            base.dispose();
                    },
    };

    return logic as any;
}

function object3DLogicEnsure(object3D: Object3D): void
{
    getLogic(object3D);
}
