import { registerLogic } from "@feng3d/reactivity";
import { Box3, Vector3 } from '@feng3d/math';
import { batchRun, reactive } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { Camera } from '../cameras/Camera';
import { cameraLogic } from '../cameras/cameraLogic';
import { OrthographicLens } from '../cameras/lenses/OrthographicLens';
import { Object3D } from '../core/Object3D';
import { logic as getLogic } from '@feng3d/reactivity';
import type { Object3DLogic } from '../core/object3DLogic';
import { renderableLogic } from '../core/renderableLogic';
import type { Renderable } from '../core/Renderable';
import { Scene } from '../scene/Scene';
import { DirectionalLight } from './DirectionalLight';
import { lightLogic, LightLogic } from './lightLogic';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        DirectionalLight: DirectionalLightLogic;
    }
}

/**
 * DirectionalLight 逻辑处理输出。
 *
 * 组合 lightLogic，额外提供 updateShadowByCamera（根据场景包围盒调整阴影相机）。
 */
export interface DirectionalLightLogic extends LightLogic
{
    updateShadowByCamera(scene: Scene, viewCamera: Camera, models: Renderable[]): void;
}


/**
 * 获取 DirectionalLight 的 logic。
 */
export function directionalLightLogic(light: DirectionalLight): DirectionalLightLogic

{
    return getLogic(light);
}

function createDirectionalLightLogic(light: DirectionalLight): DirectionalLightLogic
{
    const base = lightLogic(light);
    let _orthographicLens: OrthographicLens | null = null;

    const logic = {
        ...base,
        get position()
        {
            return getLogic(cameraLogic(light.shadowCamera).object3D).worldPosition.value;
        },
        updateShadowByCamera(scene: Scene, viewCamera: Camera, models: Renderable[])
        {
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
            const _pos = center.addTo(logic.direction.scaleNumberTo(radius + logic.shadowCameraNear).negate());
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
            if (!_orthographicLens)
            {
                light.shadowCamera.lens = _orthographicLens = new OrthographicLens(radius, 1, logic.shadowCameraNear, logic.shadowCameraNear + radius * 2);
            }
            else
            {
                serialization.setValue(_orthographicLens, { size: radius, near: logic.shadowCameraNear, far: logic.shadowCameraNear + radius * 2 });
            }
        },
    };

    return logic as any;
}

// 注册到 componentLogic 分发表
registerLogic('DirectionalLight', (component) =>
{
    return createDirectionalLightLogic(component as DirectionalLight);
});
