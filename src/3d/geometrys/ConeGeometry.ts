import { createNodeMenu } from '../../core/CreateNodeMenu';
import { oav } from '../../objectview/ObjectView';
import { gPartial } from '../../polyfill/Types';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { Node3D } from '../core/Node3D';
import { Geometry, RegisterGeometry } from '../geometrys/Geometry';
import { CylinderGeometry } from './CylinderGeometry';

declare module './Geometry'
{
    interface GeometryMap { ConeGeometry: ConeGeometry }
    interface DefaultGeometryMap { Cone: ConeGeometry; }
}

declare module '../core/Node3D' { interface PrimitiveNode3D { Cone: Node3D; } }

/**
 * 圆锥体
 */
@RegisterGeometry('ConeGeometry')
export class ConeGeometry extends Geometry
{
    declare __class__: 'ConeGeometry';

    name = 'Cone';

    /**
     * 底部半径
     */
    @SerializeProperty()
    @oav()
    bottomRadius = 0.5;

    /**
     * 高度
     */
    @SerializeProperty()
    @oav()
    height = 2;

    /**
     * 横向分割数
     */
    @SerializeProperty()
    @oav()
    segmentsW = 16;

    /**
     * 纵向分割数
     */
    @SerializeProperty()
    @oav()
    segmentsH = 1;

    /**
     * 底部是否封口
     */
    @oav()
    @SerializeProperty()
    bottomClosed = true;

    /**
     * 是否朝上
     */
    @SerializeProperty()
    @oav()
    yUp = true;

    constructor(param?: gPartial<ConeGeometry>)
    {
        super();
        Object.assign(this, param);
        watcher.watch(this as ConeGeometry, 'bottomRadius', this.invalidateGeometry, this);
        watcher.watch(this as ConeGeometry, 'height', this.invalidateGeometry, this);
        watcher.watch(this as ConeGeometry, 'segmentsW', this.invalidateGeometry, this);
        watcher.watch(this as ConeGeometry, 'segmentsH', this.invalidateGeometry, this);
        watcher.watch(this as ConeGeometry, 'bottomClosed', this.invalidateGeometry, this);
        watcher.watch(this as ConeGeometry, 'yUp', this.invalidateGeometry, this);
    }

    /**
     * 构建几何体数据
     */
    protected buildGeometry()
    {
        const { positions, normals, tangents, uvs, indices } = CylinderGeometry.buildGeometry({
            bottomRadius: this.bottomRadius,
            height: this.height,
            segmentsW: this.segmentsW,
            segmentsH: this.segmentsH,
            bottomClosed: this.bottomClosed,
            yUp: this.yUp,
            topRadius: 0,
            topClosed: false,
            surfaceClosed: true,
        });

        this.indexBuffer = { array: indices };
        this.attributes.a_position = { array: positions, itemSize: 3 };
        this.attributes.a_normal = { array: normals, itemSize: 3 };
        this.attributes.a_tangent = { array: tangents, itemSize: 3 };
        this.attributes.a_uv = { array: uvs, itemSize: 2 };
    }
}

Geometry.setDefault('Cone', new ConeGeometry());

Node3D.registerPrimitive('Cone', (g) =>
{
    g.addComponent('Mesh3D').geometry = Geometry.getDefault('Cone');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Cone',
        priority: -10000,
        click: () =>
            Node3D.createPrimitive('Cone')
    }
);

