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

            // 1. 计算所有可投影物体的世界包围盒
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

            // 2. shadowCamera 放在包围盒中心沿光源反方向后退，看向中心。
            //    用包围盒半径作为后退距离，保证相机在包围盒外。
            const center = worldBounds.getCenter();
            const radius = worldBounds.getSize().length / 2;
            const _pos = center.addTo(this.direction.scaleNumberTo(radius + this.shadowCameraNear).negate());
            const shadowCamObj = getLogic(light.shadowCamera).entity;
            const t = shadowCamObj;
            const r_pos0 = reactive((t as Object3D).position);
            batchRun(() =>
            {
                r_pos0.x = _pos.x;
                r_pos0.y = _pos.y;
                r_pos0.z = _pos.z;
            });
            // lookAt 保留位置仅更新朝向。up 默认用世界 Y 轴，但当光源方向接近垂直
            // （与 Y 轴平行）时 cross(up, zAxis) 退化，改用 Z 轴作为备用 up。
            const m = getLogic(t).matrix.value.clone();
            const lightDir = this.direction;
            const upAxis = Math.abs(lightDir.y) > 0.99 ? Vector3.Z_AXIS : Vector3.Y_AXIS;
            m.lookAt(center, upAxis);
            const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
            m.toTRS(pos, rot, scl);
            const r_pos = reactive((t as Object3D).position); const r_rot = reactive((t as Object3D).rotation); const r_scl = reactive((t as Object3D).scale);
            batchRun(() =>
            {
                r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z;
                r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z;
                r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z;
            });

            // 3. 将世界包围盒 8 角点变换到 shadowCamera 本地空间（light space），
            //    用 light space 包围盒精确计算正交投影的 size/near/far。
            //    这比用世界空间对角线半径更精确，能完整覆盖所有可投影物体。
            const viewMatrix = getLogic(t).world2local.value;
            const { min: wbMin, max: wbMax } = worldBounds;
            const corners: Vector3[] = [];
            for (let i = 0; i < 8; i++)
            {
                const wx = (i & 1) ? wbMax.x : wbMin.x;
                const wy = (i & 2) ? wbMax.y : wbMin.y;
                const wz = (i & 4) ? wbMax.z : wbMin.z;
                corners.push(viewMatrix.transformPoint3(new Vector3(wx, wy, wz)));
            }
            const lsMin = new Vector3(Infinity, Infinity, Infinity);
            const lsMax = new Vector3(-Infinity, -Infinity, -Infinity);
            corners.forEach((c) =>
            {
                if (c.x < lsMin.x) lsMin.x = c.x;
                if (c.y < lsMin.y) lsMin.y = c.y;
                if (c.z < lsMin.z) lsMin.z = c.z;
                if (c.x > lsMax.x) lsMax.x = c.x;
                if (c.y > lsMax.y) lsMax.y = c.y;
                if (c.z > lsMax.z) lsMax.z = c.z;
            });

            // 4. 正交投影参数：
            //    size = light space 中 x/y 方向的最大半边长（覆盖所有角点）
            //    near/far = light space 中 z 方向的范围
            const lsSize = Math.max(
                Math.abs(lsMin.x), Math.abs(lsMax.x),
                Math.abs(lsMin.y), Math.abs(lsMax.y)
            );
            const lsNear = Math.max(0.01, lsMin.z);
            const lsFar = Math.max(lsNear + 0.01, lsMax.z);

            if (!this._orthographicLens)
            {
                light.shadowCamera.lens = this._orthographicLens = new OrthographicLens(lsSize, 1, lsNear, lsFar);
            }
            else
            {
                serialization.setValue(this._orthographicLens, { size: lsSize, near: lsNear, far: lsFar });
            }
        } finally
        {
            this._updatingShadowCamera = false;
        }
    }
}
// 注册到 componentLogic 分发表
registerLogic('DirectionalLight', DirectionalLightLogic);
