import { Matrix4x4, Vector2 } from '@feng3d/math';
import { Behaviour, createBehaviour } from '../component/Behaviour';
import { LightType } from './LightType';
import { ShadowType } from './shadow/ShadowType';
import { isRenderable } from "../component/Component";
import { createBillboardComponent, BillboardComponent } from '../component/BillboardComponent';
import { batchRun, reactive, logic as getLogic } from '@feng3d/reactivity';
import { BehaviourLogic } from '../component/Behaviour';
import { Object3D } from '../core/Object3D';
import { createPrimitive } from "../core/Object3D";
import { Renderable } from '../core/Renderable';
import { createTextureMaterial } from '../materials/TextureMaterial';
import { createPlaneGeometry } from '../primitives/PlaneGeometry';
import type { Camera } from '../cameras/Camera';
import type { Color3 } from '../core/Color3';
import type { Scene } from '../scene/Scene';
import type { Texture2D } from '../textures/Texture2D';

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
 *
 * 阴影投影矩阵与深度纹理由 LightLogic 持有，不再经过 shadowCamera（Camera 组件）
 * 与 frameBufferObject（颜色附件 RT）中转。
 */
export interface Light extends Behaviour
{
    readonly lightType: LightType;
    readonly color: Color3;
    readonly intensity: number;
    readonly shadowType: any;
    readonly shadowBias: number;
    readonly shadowRadius: number;
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
 * - shadowViewProjection: 阴影投影矩阵（VP），由子类 updateShadowXxx 主动写入
 * - shadowCameraNear / shadowCameraFar / shadowMapSize: 阴影参数（供 shader uniform）
 * - shadowMap / debugShadowTexture: 阴影纹理（子类覆盖）
 * - updateDebugShadowMap: 调试阴影图对象管理
 *
 * 子类 logic（DirectionalLightLogic / PointLightLogic / SpotLightLogic）继承本类后追加自身行为。
 */
export class LightLogic extends BehaviourLogic
{
    /**
     * 阴影 view-projection 矩阵缓存。
     *
     * 由子类的 updateShadowXxx 方法写入（SpotLight/DirectionalLight 单矩阵；
     * PointLight 用 shadowViewProjections 数组）。
     * ShadowRenderer 与 ForwardRenderer 读取此值作为 u_viewProjection / u_shadowVP。
     */
    protected _shadowViewProjection: Matrix4x4 = new Matrix4x4();
    /** 阴影相机近/远平面，由子类 updateShadowXxx 写入，供 shader uniform */
    protected _shadowNear = 0.3;
    protected _shadowFar = 1000;

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

    /**
     * 阴影 view-projection 矩阵（SpotLight / DirectionalLight 用）。
     *
     * 子类的 updateShadowXxx 方法每帧写入。ShadowRenderer 读取后作为 cameraUniforms.u_viewProjection，
     * ForwardRenderer 读取后作为 shadowData.u_shadowVP。
     */
    get shadowViewProjection(): Matrix4x4
    {
        return this._shadowViewProjection;
    }

    get shadowCameraNear(): number
    {
        return this._shadowNear;
    }

    get shadowCameraFar(): number
    {
        return this._shadowFar;
    }

    /**
     * 阴影图尺寸（默认 1024×1024，PointLight 覆盖为 cubemap atlas 布局 1/4 × 1/2）。
     */
    get shadowMapSize(): Vector2
    {
        return new Vector2(1024, 1024);
    }

    /**
     * 阴影采样纹理（PointLight/SpotLight 覆盖返回各自的 RenderTargetTexture2D）。
     * DirectionalLight 不实现此 getter（用 shadowDepthTexture）。
     */
    get shadowMap(): any
    {
        return null;
    }

    /**
     * 调试阴影图用的纹理（updateDebugShadowMap 把它贴到 debug 平面上）。
     * 子类覆盖：DirectionalLight 返回 shadowDepthTexture，PointLight/SpotLight 返回 shadowMap。
     */
    get debugShadowTexture(): Texture2D | null
    {
        return null;
    }

    /**
     * 初始化：调用 super.init 注入 object3D。子类 override 追加 lens/纹理创建。
     */
    init(object3D?: Object3D): void
    {
        if (this._lightInited) return;
        this._lightInited = true;
        super.init(object3D);
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
            const textureMaterial = reactive(model).material = Object.assign(createTextureMaterial(), { s_texture: this.debugShadowTexture as any });
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
