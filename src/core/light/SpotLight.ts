import { oav } from '../../objectview/ObjectView';
import { mathUtil } from '../../polyfill/MathUtil';
import { serialize } from '../../serialization/Serialization';
import { watcher } from '../../watcher/watcher';
import { PerspectiveLens } from '../cameras/lenses/PerspectiveLens';
import { RegisterComponent } from '../component/Component';
import { GameObject } from '../core/GameObject';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { Light } from './Light';
import { LightType } from './LightType';

declare global
{
    export interface MixinsComponentMap
    {
        SpotLight: SpotLight;
    }

    export interface MixinsPrimitiveGameObject
    {
        'Spot Light': GameObject;
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
    @serialize
    range = 10;

    /**
     *
     */
    @oav()
    @serialize
    angle = 60;

    /**
     * 半影.
     */
    @oav()
    @serialize
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

GameObject.registerPrimitive('Spot Light', (g) =>
{
    g.addComponent(SpotLight);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'Light/Spot Light',
        priority: -2,
        click: () =>
            GameObject.createPrimitive('Spot Light')
    }
);

