import { Light, createLight } from './Light';
import { LightType } from './LightType';
import { registerLogic, batchRun, reactive, logic as getLogic } from "@feng3d/reactivity";
import { Box3, Vector3 } from '@feng3d/math';
import { serialization } from '@feng3d/serialization';
import { Camera } from '../cameras/Camera';
import { OrthographicLens } from '../cameras/lenses/OrthographicLens';
import { Object3D } from '../core/Object3D';
import type { Object3DLogic } from '../core/Object3D';
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
    /** updateShadowByCamera 重入保护（防止响应式递归） */
    private _updatingShadowCamera = false;

    constructor(light: DirectionalLight)
    {
        super(light);
    }

    /** 平行光 position 取 shadowCamera 的 object3D 世界坐标 */
    get position(): any
    {
        const light = this.component as DirectionalLight;

        return getLogic(getLogic(light.shadowCamera).entity).worldPosition.value;
    }

    updateShadowByCamera(scene: Scene, viewCamera: Camera, models: Renderable[]): void
    {
        // 重入保护：避免写 shadowCamera 变换时触发的 computed 重算递归调用本方法
        if (this._updatingShadowCamera) return;
        this._updatingShadowCamera = true;
        try
        {
            const light = this.component as DirectionalLight;

            const worldBounds: Box3 = models.reduce((pre: Box3, i) =>
            {
                const box = getLogic(getLogic(i).entity).boundingBox.value.worldBounds;
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
            const shadowCamObj = getLogic(light.shadowCamera).entity;
            const t = shadowCamObj;
            // 先写入 _pos（光源后退位置），这样后续 lookAt 矩阵的位置就是 _pos
            const r_pos0 = reactive((t as Object3D).position);
            batchRun(() =>
            {
                r_pos0.x = _pos.x;
                r_pos0.y = _pos.y;
                r_pos0.z = _pos.z;
            });
            // 读取当前矩阵（已含 _pos），lookAt 保留位置仅更新朝向
            const m = getLogic(t).matrix.value.clone();
            m.lookAt(center, getLogic(t).rotationMatrix.value.getAxisY());
            const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
            m.toTRS(pos, rot, scl);
            const r_pos = reactive((t as Object3D).position); const r_rot = reactive((t as Object3D).rotation); const r_scl = reactive((t as Object3D).scale);
            batchRun(() =>
            {
                r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z;
                r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z;
                r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z;
            });
            //
            if (!this._orthographicLens)
            {
                light.shadowCamera.lens = this._orthographicLens = new OrthographicLens(radius, 1, this.shadowCameraNear, this.shadowCameraNear + radius * 2);
            }
            else
            {
                serialization.setValue(this._orthographicLens, { size: radius, near: this.shadowCameraNear, far: this.shadowCameraNear + radius * 2 });
            }
        } finally
        {
            this._updatingShadowCamera = false;
        }
    }
}
// 注册到 componentLogic 分发表
registerLogic('DirectionalLight', DirectionalLightLogic);
