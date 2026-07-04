import { Box3, Vector3 } from '@feng3d/math';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { batchRun, reactive } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { Camera } from '../cameras/Camera';
import { OrthographicLens } from '../cameras/lenses/OrthographicLens';
import { RegisterComponent } from '../component/Component';
import { Object3D } from '../core/Object3D';
import { Renderable } from '../core/Renderable';
import { transformLogic } from '../core/transformLogic';
import { AddComponentMenu } from '../Menu';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { Scene } from '../scene/Scene';
import { Light } from './Light';
import { LightType } from './LightType';

declare global
{
    export interface MixinsComponentMap
    {
        DirectionalLight: DirectionalLight;
    }

    export interface MixinsPrimitiveObject3D
    {
        'Directional light': Object3D;
    }
}

/**
 * 方向光源
 */
@AddComponentMenu('Rendering/DirectionalLight')
@RegisterComponent()
@decoratorRegisterClass()
export class DirectionalLight extends Light
{
    __class__: 'DirectionalLight';

    lightType = LightType.Directional;

    private orthographicLens: OrthographicLens;

    /**
     * 光源位置
     */
    get position()
    {
        return transformLogic(this.shadowCamera.transform).worldPosition.value;
    }

    constructor()
    {
        super();
    }

    /**
     * 通过视窗摄像机进行更新
     * @param viewCamera 视窗摄像机
     */
    updateShadowByCamera(scene: Scene, viewCamera: Camera, models: Renderable[])
    {
        const worldBounds: Box3 = models.reduce((pre: Box3, i) =>
        {
            const box = i.object3D.boundingBox.worldBounds;
            if (!pre)
            { return box.clone(); }
            pre.union(box);

            return pre;
        }, null) || new Box3(new Vector3(), new Vector3(1, 1, 1));

        //
        const center = worldBounds.getCenter();
        const radius = worldBounds.getSize().length / 2;
        //
        const _pos = center.addTo(this.direction.scaleNumberTo(radius + this.shadowCameraNear).negate());
        const _r_pos = reactive(this.shadowCamera.transform.position);
        batchRun(() =>
        {
            _r_pos.x = _pos.x;
            _r_pos.y = _pos.y;
            _r_pos.z = _pos.z;
        });
        transformLogic(this.shadowCamera.transform).lookAt(center, transformLogic(this.shadowCamera.transform).rotationMatrix.value.getAxisY());
        //
        if (!this.orthographicLens)
        {
            this.shadowCamera.lens = this.orthographicLens = new OrthographicLens(radius, 1, this.shadowCameraNear, this.shadowCameraNear + radius * 2);
        }
        else
        {
            serialization.setValue(this.orthographicLens, { size: radius, near: this.shadowCameraNear, far: this.shadowCameraNear + radius * 2 });
        }
    }
}

Object3D.registerPrimitive('Directional light', (g) =>
{
    g.addComponent(DirectionalLight);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'Light/Directional light',
        priority: -2,
        click: () =>
            Object3D.createPrimitive('Directional light')
    }
);

