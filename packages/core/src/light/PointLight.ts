import { Vector2 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { PerspectiveLens } from '../cameras/lenses/PerspectiveLens';
import { RegisterComponent } from '../component/Component';
import { GameObject } from '../core/GameObject';
import { AddComponentMenu } from '../Menu';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { Light } from './Light';
import { LightType } from './LightType';

declare global
{
    export interface MixinsComponentMap
    {
        PointLight: PointLight;
    }

    export interface MixinsPrimitiveGameObject
    {
        'Point Light': GameObject;
    }
}

/**
 * 点光源
 */
@AddComponentMenu('Rendering/PointLight')
@RegisterComponent()
export class PointLight extends Light
{
    __class__: 'PointLight';

    lightType = LightType.Point;

    /**
     * 光照范围
     */
    @oav()
    @serialize
    get range()
    {
        return this._range;
    }
    set range(v)
    {
        if (this._range === v) return;
        this._range = v;
        this.invalidRange();
    }
    private _range = 10;

    /**
     * 阴影图尺寸
     */
    get shadowMapSize()
    {
        return this.shadowMap.getSize().multiply(new Vector2(1 / 4, 1 / 2));
    }

    constructor()
    {
        super();
        this.shadowCamera.lens = new PerspectiveLens(90, 1, 0.1, this.range);
    }

    private invalidRange()
    {
        if (this.shadowCamera)
        { this.shadowCamera.lens.far = this.range; }
    }
}

GameObject.registerPrimitive('Point Light', (g) =>
{
    g.addComponent(PointLight);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'Light/Point Light',
        priority: -1,
        click: () =>
            GameObject.createPrimitive('Point Light')
    }
);

