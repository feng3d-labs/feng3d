import { oav } from '../../objectview/ObjectView';
import { mathUtil } from '../../polyfill/MathUtil';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { PerspectiveLens } from '../cameras/lenses/PerspectiveLens';
import { RegisterComponent } from '../../ecs/Component';
import { Object3D } from '../core/Object3D';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { Light } from './Light';
import { LightType } from './LightType';

declare global
{
    export interface MixinsComponentMap
    {
        SpotLight: SpotLight;
    }

    export interface MixinsPrimitiveObject3D
    {
        'Spot Light': Object3D;
    }
}

/**
 * 聚光灯光源
 */
@RegisterComponent()
export class SpotLight extends Light
{
    lightType = LightType.Spot;

    /**
     * 光照范围
     */
    @oav()
    @SerializeProperty()
    range = 10;

    /**
     *
     */
    @oav()
    @SerializeProperty()
    angle = 60;

    /**
     * 半影.
     */
    @oav()
    @SerializeProperty()
    penumbra = 0;

    /**
     * 椎体cos值
     */
    get coneCos()
    {
        return Math.cos(this.angle * 0.5 * mathUtil.DEG2RAD);
    }

    get penumbraCos()
    {
        return Math.cos(this.angle * 0.5 * mathUtil.DEG2RAD * (1 - this.penumbra));
    }

    private perspectiveLens: PerspectiveLens;

    constructor()
    {
        super();
        watcher.watch(this as SpotLight, 'angle', this._invalidAngle, this);
        watcher.watch(this as SpotLight, 'range', this._invalidRange, this);
        this.perspectiveLens = this.shadowCamera.lens = new PerspectiveLens(this.angle, 1, 0.1, this.range);
    }

    private _invalidRange()
    {
        if (this.shadowCamera)
        {
            this.shadowCamera.lens.far = this.range;
        }
    }

    private _invalidAngle()
    {
        if (this.perspectiveLens)
        {
            this.perspectiveLens.fov = this.angle;
        }
    }
}

Object3D.registerPrimitive('Spot Light', (g) =>
{
    g.addComponent(SpotLight);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'Light/Spot Light',
        priority: -2,
        click: () =>
            Object3D.createPrimitive('Spot Light')
    }
);
