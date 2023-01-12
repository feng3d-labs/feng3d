import { Node3D } from '../../3d/Node3D';
import { PerspectiveLens } from '../../core/cameras/lenses/PerspectiveLens';
import { createNodeMenu } from '../../core/menu/CreateNodeMenu';
import { RegisterComponent } from '../../ecs/Component';
import { oav } from '../../objectview/ObjectView';
import { mathUtil } from '../../polyfill/MathUtil';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { Light3D } from './Light3D';
import { LightType } from './LightType';

declare module '../../ecs/Component' { interface ComponentMap { SpotLight3D: SpotLight3D; } }
declare module '../../3d/Node3D' { interface PrimitiveNode3D { 'Spot Light': Node3D; } }

/**
 * 聚光灯光源
 */
@RegisterComponent({ name: 'SpotLight3D' })
export class SpotLight3D extends Light3D
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
        watcher.watch(this as SpotLight3D, 'angle', this._invalidAngle, this);
        watcher.watch(this as SpotLight3D, 'range', this._invalidRange, this);
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

Node3D.registerPrimitive('Spot Light', (g) =>
{
    g.addComponent('SpotLight3D');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'Light/Spot Light',
        priority: -2,
        click: () =>
            Node3D.createPrimitive('Spot Light')
    }
);

