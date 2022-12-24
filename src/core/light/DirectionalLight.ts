import { Box3 } from '../../math/geom/Box3';
import { Vector3 } from '../../math/geom/Vector3';
import { Serializable } from '../../serialization/Serializable';
import { serialization } from '../../serialization/Serialization';
import { Camera } from '../cameras/Camera';
import { OrthographicLens } from '../cameras/lenses/OrthographicLens';
import { RegisterComponent } from '../../ecs/Component';
import { Object3D } from '../core/Object3D';
import { Renderable } from '../core/Renderable';
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
@Serializable()
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
        return this.shadowCamera.object3D.worldPosition;
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
        this.shadowCamera.object3D.position = center.addTo(this.direction.scaleNumberTo(radius + this.shadowCameraNear).negate());
        this.shadowCamera.object3D.lookAt(center, this.shadowCamera.object3D.matrix.getAxisY());
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

