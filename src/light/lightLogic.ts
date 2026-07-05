import { Color3 } from '@feng3d/math';
import { batchRun, reactive } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { Camera } from '../cameras/Camera';
import { cameraLogic } from '../cameras/cameraLogic';
import { BehaviourLogic, behaviourLogic } from '../component/behaviourLogic';
import { BillboardComponent } from '../component/BillboardComponent';
import { Object3D } from '../core/Object3D';
import { containerLogic } from "../core/containerLogic";
import { createObject3D } from '../core/createObject3D';
import { logic } from '../core/logic';
import { createPrimitive } from "../core/object3DLogic";
import type { Object3DLogic } from '../core/object3DLogic';
import { Renderable } from '../core/Renderable';
import { transformLogic } from '../core/transformLogic';
import { Material } from '../materials/Material';
import { PlaneGeometry } from '../primitives/PlaneGeometry';
import { Scene, sceneLogic } from '../scene/Scene';
import { Light } from './Light';
import { LightType } from './LightType';

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

const lightLogicMap = new WeakMap<Light, LightLogic>();

/**
 * 获取 Light 的 logic。
 */
export function lightLogic(light: Light): LightLogic
{
    let logic = lightLogicMap.get(light);
    if (logic) return logic;

    logic = createLightLogic(light);
    lightLogicMap.set(light, logic);

    return logic;
}

function createLightLogic(light: Light): LightLogic
{
    const base = behaviourLogic(light);
    let _shadowCamera: Camera | null = null;
    let _debugShadowMapObject: Object3D | null = null;
    let _inited = false;

    const logic: LightLogic = {
        object3D: null as any,
        get isVisibleAndEnabled() { return base.isVisibleAndEnabled; },
        get position()
        {
            return transformLogic(logic.object3D).worldPosition.value;
        },
        get direction()
        {
            return transformLogic(logic.object3D).local2world.value.getAxisZ();
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
            const cam = new Camera();
            reactive(shadowCamObj).components.push(cam);
            // 触发 object3DLogic（注册 entityLogic 等效应），确保 Camera 自动 init
            object3DLogicEnsure(shadowCamObj);
            _shadowCamera = cam;
            light.shadowCamera = cam;
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
                const bb = new BillboardComponent();
                reactive(object3D).components.push(bb);

                // 材质
                const model = object3D.components.find(c => c instanceof Renderable) as Renderable;
                model.geometry = serialization.setValue(new PlaneGeometry(), { width: light.lightType === LightType.Point ? 1 : 0.5, height: 0.5, segmentsW: 1, segmentsH: 1, yUp: false });
                const textureMaterial = model.material = serialization.setValue(new Material(), { shaderName: 'texture', uniforms: { s_texture: light.frameBufferObject.texture as any } } as any);
                reactive(textureMaterial.renderPipeline.fragment).targets = [{
                    blend: {
                        color: { srcFactor: 'one', dstFactor: 'zero', operation: 'add' },
                        alpha: { srcFactor: 'one', dstFactor: 'zero', operation: 'add' },
                    },
                }];
            }

            const viewCameraObj = cameraLogic(viewCamera).object3D;
            const depth = cameraLogic(viewCamera).lens.near * 2;
            const _pos = transformLogic(viewCameraObj).worldPosition.value.addTo(transformLogic(viewCameraObj).local2world.value.getAxisZ().scaleNumberTo(depth));
            const _r_pos = reactive(object3D.position);
            batchRun(() =>
            {
                _r_pos.x = _pos.x;
                _r_pos.y = _pos.y;
                _r_pos.z = _pos.z;
            });
            const billboardComponent = object3D.components.find(c => c instanceof BillboardComponent) as BillboardComponent;
            billboardComponent.camera = viewCamera;

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
            lightLogicMap.delete(light);
        },
    };

    return logic;
}

function object3DLogicEnsure(object3D: Object3D): void
{
    logic<Object3DLogic>(object3D);
}
