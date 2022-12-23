import { oav } from '../../objectview/ObjectView';
import { gPartial } from '../../polyfill/Types';
import { serializable } from '../../serialization/ClassUtils';
import { serialize } from '../../serialization/serialize';
import { watcher } from '../../watcher/watcher';
import { MeshRenderer } from '../core/MeshRenderer';
import { Object3D } from '../core/Object3D';
import { Geometry } from '../geometry/Geometry';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { CylinderGeometry } from './CylinderGeometry';

declare global
{
    export interface MixinsGeometryMap
    {
        ConeGeometry: ConeGeometry
    }
    export interface MixinsDefaultGeometry
    {
        Cone: ConeGeometry;
    }
    export interface MixinsPrimitiveObject3D
    {
        Cone: Object3D;
    }
}

/**
 * 圆锥体
 */
@serializable()
export class ConeGeometry extends Geometry
{
    __class__: 'ConeGeometry' = 'ConeGeometry';

    name = 'Cone';

    /**
     * 底部半径
     */
    @serialize
    @oav()
    bottomRadius = 0.5;

    /**
     * 高度
     */
    @serialize
    @oav()
    height = 2;

    /**
     * 横向分割数
     */
    @serialize
    @oav()
    segmentsW = 16;

    /**
     * 纵向分割数
     */
    @serialize
    @oav()
    segmentsH = 1;

    /**
     * 底部是否封口
     */
    @oav()
    @serialize
    bottomClosed = true;

    /**
     * 是否朝上
     */
    @serialize
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

Object3D.registerPrimitive('Cone', (g) =>
{
    g.addComponent(MeshRenderer).geometry = Geometry.getDefault('Cone');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Cone',
        priority: -10000,
        click: () =>
            Object3D.createPrimitive('Cone')
    }
);

