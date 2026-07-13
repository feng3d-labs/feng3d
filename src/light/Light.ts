import { Camera, createCamera } from '../cameras/Camera';
import { Behaviour, createBehaviour } from '../component/Behaviour';
import { FrameBufferObject } from '../render/FrameBufferObject';
import { LightType } from './LightType';
import { ShadowType } from './shadow/ShadowType';
import { isRenderable } from "../component/Component";
import { createBillboardComponent, BillboardComponent } from '../component/BillboardComponent';
import { batchRun, reactive, logic as getLogic } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { BehaviourLogic } from '../component/Behaviour';
import { Object3D } from '../core/Object3D';
import { createObject3D } from '../core/createObject3D';
import { createPrimitive } from "../core/Object3D";
import { Renderable } from '../core/Renderable';
import { createTextureMaterial } from '../materials/TextureMaterial';
import { createPlaneGeometry } from '../primitives/PlaneGeometry';
import type { Color3 } from '../core/Color3';
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
        color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
        intensity: 1,
        shadowType: ShadowType.No_Shadows,
        shadowBias: -0.005,
        shadowRadius: 1,
        shadowCamera: null as any,
        frameBufferObject: new FrameBufferObject(),
        debugShadowMap: false,
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Light: LightLogic;
    }
}

/**
 * Light 逻辑处理类。
 *
 * 继承 BehaviourLogic，额外提供：
 * - position / direction: 由 transform 派生
 * - shadowCameraNear / shadowCameraFar / shadowMapSize / shadowMap: 阴影相关派生
 * - init: 创建 shadowCamera（Object3D + Camera 组件）
 * - updateDebugShadowMap: 调试阴影图对象管理
 *
 * 子类 logic（DirectionalLightLogic / PointLightLogic / SpotLightLogic）继承本类后追加自身行为。
 */
export class LightLogic extends BehaviourLogic
{
    protected _shadowCamera: Camera | null = null;
    private _debugShadowMapObject: Object3D | null = null;
    private _lightInited = false;

    constructor(light: Light)
    {
        super(light);
    }

    /** 光源世界坐标（由 object3D 的 worldPosition 派生） */
    get position(): any
    {
        return getLogic((this.entity)).worldPosition.value;
    }

    /** 光源方向（object3D 的 local2world Z 轴） */
    get direction(): any
    {
        return getLogic((this.entity)).local2world.value.getAxisZ();
    }

    get shadowCameraNear(): number
    {
        return this._shadowCamera!.lens.near;
    }

    get shadowCameraFar(): number
    {
        return this._shadowCamera!.lens.far;
    }

    get shadowMapSize(): any
    {
        return this.shadowMap.getSize();
    }

    get shadowMap(): any
    {
        return (this.component as Light).frameBufferObject.texture;
    }

    /**
     * 初始化：调用 super.init 注入 object3D 后创建 shadowCamera。
     */
    init(object3D?: Object3D): void
    {
        if (this._lightInited) return;
        this._lightInited = true;
        super.init(object3D);

        const light = this.component as Light;

        // 确保 frameBufferObject 存在（声明式字面量可能未提供）
        if (!light.frameBufferObject)
        {
            reactive(light).frameBufferObject = new FrameBufferObject();
        }

        // 创建阴影相机
        const shadowCamObj = Object.assign(createObject3D(), { name: 'LightShadowCamera' });
        const cam = createCamera();
        reactive(shadowCamObj).components.push(cam);
        // 触发 object3DLogic（注册 entityLogic 等效应），确保 Camera 自动 init
        getLogic(shadowCamObj);
        this._shadowCamera = cam;
        reactive(light).shadowCamera = cam;
    }

    updateDebugShadowMap(scene: Scene, viewCamera: Camera): void
    {
        const light = this.component as Light;
        let object3D = this._debugShadowMapObject;
        if (!object3D)
        {
            object3D = this._debugShadowMapObject = createPrimitive('Plane', { name: 'debugShadowMapObject' });
            reactive(object3D).mouseEnabled = false;
            const bb = createBillboardComponent();
            reactive(object3D).components.push(bb);

            // 材质
            const model = object3D.components.find(c => isRenderable(c)) as Renderable;
            if (!model) return;
            reactive(model).geometry = Object.assign(createPlaneGeometry(), { width: light.lightType === LightType.Point ? 1 : 0.5, height: 0.5, segmentsW: 1, segmentsH: 1, yUp: false });
            const textureMaterial = reactive(model).material = Object.assign(createTextureMaterial(), { s_texture: light.frameBufferObject.texture as any });
            reactive(getLogic(textureMaterial).renderPipeline.fragment).targets = [{
                blend: {
                    color: { srcFactor: 'one', dstFactor: 'zero', operation: 'add' },
                    alpha: { srcFactor: 'one', dstFactor: 'zero', operation: 'add' },
                },
            }];
        }

        const viewCameraObj = getLogic(viewCamera).entity;
        const depth = getLogic(viewCamera).lens.near * 2;
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
            reactive((getLogic(scene).entity)).children.push(object3D);
        }
        else
        {
            const parent = getLogic(object3D).parent as Object3D | null;
            if (parent)
            {
                const idx = reactive(parent).children.indexOf(object3D);
                if (idx !== -1) reactive(parent).children.splice(idx, 1);
            }
        }
    }

    dispose(): void
    {
        super.dispose();
    }
}