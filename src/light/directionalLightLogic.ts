import { Box3, Vector3 } from '@feng3d/math';
import { batchRun, reactive } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { Camera } from '../cameras/Camera';
import { cameraLogic } from '../cameras/cameraLogic';
import { OrthographicLens } from '../cameras/lenses/OrthographicLens';
import { registerComponentLogic } from '../component/componentLogic';
import { Object3D } from '../core/Object3D';
import { logic as getLogic } from '../core/logic';
import type { Object3DLogic } from '../core/object3DLogic';
import { renderableLogic } from '../core/renderableLogic';
import type { Renderable } from '../core/Renderable';
import { transformLogic } from '../core/transformLogic';
import { Scene } from '../scene/Scene';
import { DirectionalLight } from './DirectionalLight';
import { lightLogic, LightLogic } from './lightLogic';

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
    return getLogic<DirectionalLightLogic>(light);
}

function createDirectionalLightLogic(light: DirectionalLight): DirectionalLightLogic
{
    const base = lightLogic(light);
    let _orthographicLens: OrthographicLens | null = null;

    const logic: DirectionalLightLogic = {
        ...base,
        get position()
        {
            return transformLogic(cameraLogic(light.shadowCamera).object3D).worldPosition.value;
        },
        updateShadowByCamera(scene: Scene, viewCamera: Camera, models: Renderable[])
        {
            const worldBounds: Box3 = models.reduce((pre: Box3, i) =>
            {
                const box = getLogic<Object3DLogic>(renderableLogic(i).object3D).boundingBox.value.worldBounds;
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
                const m = transformLogic(t).matrix.value.clone();
                m.lookAt(center, transformLogic(t).rotationMatrix.value.getAxisY());
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

    return logic;
}

// 注册到 componentLogic 分发表
registerComponentLogic('DirectionalLight', (component) =>
{
    return createDirectionalLightLogic(component as DirectionalLight);
});
