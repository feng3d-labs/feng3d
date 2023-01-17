import { createNodeMenu } from '../../core/CreateNodeMenu';
import { RegisterComponent } from '../../ecs/Component';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { Vector2 } from '../../math/geom/Vector2';
import { oav } from '../../objectview/ObjectView';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Node3D } from '../core/Node3D';
import { Light3D } from './Light3D';
import { LightType } from './LightType';

declare module '../../ecs/Component' { interface ComponentMap { PointLight3D: PointLight3D; } }

declare module '../core/Node3D' { interface PrimitiveNode3D { 'Point Light': Node3D; } }

/**
 * 点光源
 */
@RegisterComponent({ name: 'PointLight3D', menu: 'Rendering/PointLight' })
export class PointLight3D extends Light3D
{
    declare __class__: 'PointLight3D';

    lightType = LightType.Point;

    /**
     * 光照范围
     */
    @oav()
    @SerializeProperty()
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
        const { x, y } = this.shadowMap.getSize();

        return new Vector2(x / 4, y / 2);
    }

    init(): void
    {
        super.init();

        this.shadowCamera.projectionMatrix = new Matrix4x4().setPerspectiveFromFOV(90, 1, 0.1, this.range);
    }

    private invalidRange()
    {
        if (this.shadowCamera)
        {
            this.shadowCamera.far = this.range;
        }
    }
}

Node3D.registerPrimitive('Point Light', (g) =>
{
    g.addComponent('PointLight3D');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'Light/Point Light',
        priority: -1,
        click: () =>
            Node3D.createPrimitive('Point Light')
    }
);

