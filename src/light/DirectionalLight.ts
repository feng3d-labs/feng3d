import { Light, createLight } from './Light';
import { LightType } from './LightType';
import { registerLogic, batchRun, reactive, logic as getLogic } from "@feng3d/reactivity";
import { Box3, Vector3 } from '@feng3d/math';
import { serialization } from '@feng3d/serialization';
import { Camera } from '../cameras/Camera';
import { cameraLogic } from '../cameras/Camera';
import { OrthographicLens } from '../cameras/lenses/OrthographicLens';
import { Object3D } from '../core/Object3D';
import type { Object3DLogic } from '../core/Object3D';
import { renderableLogic } from '../core/Renderable';
import type { Renderable } from '../core/Renderable';
import { Scene } from '../scene/Scene';
import { LightLogic } from './Light';

import './DirectionalLight';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        DirectionalLight: DirectionalLight;
    }
}

/**
 * DirectionalLight（纯数据接口）。
 */
export interface DirectionalLight extends Light
{
    readonly __type__: 'DirectionalLight';
    readonly lightType: any;
}

/**
 * 创建 DirectionalLight 实例。
 */
export function createDirectionalLight(): DirectionalLight
{
    return {
        ...createLight(), __type__: 'DirectionalLight',
        lightType: LightType.Directional,
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        DirectionalLight: DirectionalLightLogic;
    }
}

/**
 * DirectionalLight 逻辑处理类。
 *
 * 继承 LightLogic，额外提供 updateShadowByCamera（根据场景包围盒调整阴影相机），
 * 并覆盖 position（以 shadowCamera 的 object3D 世界坐标为准）。
 */
export class DirectionalLightLogic extends LightLogic
{
    private _orthographicLens: OrthographicLens | null = null;

    constructor(light: DirectionalLight)
    {
        super(light);
    }

    /** 平行光 position 取 shadowCamera 的 object3D 世界坐标 */
    get position(): any
    {
        const light = this.component as DirectionalLight;

        return getLogic(cameraLogic(light.shadowCamera).object3D).worldPosition.value;
    }

    updateShadowByCamera(scene: Scene, viewCamera: Camera, models: Renderable[]): void
    {
        const light = this.component as DirectionalLight;

        const worldBounds: Box3 = models.reduce((pre: Box3, i) =>
        {
            const box = getLogic(renderableLogic(i).object3D).boundingBox.value.worldBounds;
            if (!pre)
            {
                return box.clone();
            }
            pre.union(box);

            return pre;
        }, null) || new Box3(new Vector3(), new Vector3(1, 1, 1));

        //
        const center = worldBounds.getCenter();
        const radius = worldBounds.getSize().length / 2;
        //
        const _pos = center.addTo(this.direction.scaleNumberTo(radius + this.shadowCameraNear).negate());
        const shadowCamObj = cameraLogic(light.shadowCamera).object3D;
        const _r_pos = reactive(shadowCamObj.position);
        batchRun(() =>
        {
            _r_pos.x = _pos.x;
            _r_pos.y = _pos.y;
            _r_pos.z = _pos.z;
        });
        {
            const t = shadowCamObj;
            const m = getLogic(t).matrix.value.clone();
            m.lookAt(center, getLogic(t).rotationMatrix.value.getAxisY());
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
        //
        if (!this._orthographicLens)
        {
            light.shadowCamera.lens = this._orthographicLens = new OrthographicLens(radius, 1, this.shadowCameraNear, this.shadowCameraNear + radius * 2);
        }
        else
        {
            serialization.setValue(this._orthographicLens, { size: radius, near: this.shadowCameraNear, far: this.shadowCameraNear + radius * 2 });
        }
    }
}

/**
 * 获取 DirectionalLight 的 logic。
 */
export function directionalLightLogic(light: DirectionalLight): DirectionalLightLogic

{
    return getLogic(light);
}

// 注册到 componentLogic 分发表
registerLogic('DirectionalLight', (component) =>
{
    return new DirectionalLightLogic(component as DirectionalLight);
});
