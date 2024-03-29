import { createNodeMenu } from '../../core/CreateNodeMenu';
import { oav } from '../../objectview/ObjectView';
import { gPartial } from '../../polyfill/Types';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { Node3D } from '../core/Node3D';
import { Geometry, RegisterGeometry } from '../geometrys/Geometry';

declare module './Geometry'
{
    interface GeometryMap { PlaneGeometry: PlaneGeometry }

    interface DefaultGeometryMap { Plane: PlaneGeometry; }
}

declare module '../core/Node3D' { interface PrimitiveNode3D { Plane: Node3D; } }

/**
 * 平面几何体
 */
@RegisterGeometry('PlaneGeometry')
export class PlaneGeometry extends Geometry
{
    declare __class__: 'PlaneGeometry';

    /**
     * 宽度
     */
    @oav()
    @SerializeProperty()
    width = 1;

    /**
     * 高度
     */
    @oav()
    @SerializeProperty()
    height = 1;

    /**
     * 横向分割数
     */
    @oav()
    @SerializeProperty()
    segmentsW = 1;

    /**
     * 纵向分割数
     */
    @oav()
    @SerializeProperty()
    segmentsH = 1;

    /**
     * 是否朝上
     */
    @oav()
    @SerializeProperty()
    yUp = true;

    name = 'Plane';

    constructor(param?: gPartial<PlaneGeometry>)
    {
        super();
        Object.assign(this, param);
        watcher.watch(this as PlaneGeometry, 'width', this.invalidateGeometry, this);
        watcher.watch(this as PlaneGeometry, 'height', this.invalidateGeometry, this);
        watcher.watch(this as PlaneGeometry, 'segmentsW', this.invalidateGeometry, this);
        watcher.watch(this as PlaneGeometry, 'segmentsH', this.invalidateGeometry, this);
        watcher.watch(this as PlaneGeometry, 'yUp', this.invalidateGeometry, this);
    }

    /**
     * 构建几何体数据
     */
    protected buildGeometry()
    {
        const positions: number[] = [];
        let y: number;
        let x: number;
        const normals: number[] = [];
        const tangents: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];
        const tw = this.segmentsW + 1;
        for (let yi = 0; yi <= this.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= this.segmentsW; ++xi)
            {
                x = (xi / this.segmentsW - 0.5) * this.width;
                y = (yi / this.segmentsH - 0.5) * this.height;

                if (this.yUp)
                {
                    positions.push(x, 0, y);
                    normals.push(0, 1, 0);
                    tangents.push(1, 0, 0);
                    uvs.push(xi / this.segmentsW, 1 - yi / this.segmentsH);
                }
                else
                {
                    positions.push(x, y, 0);
                    normals.push(0, 0, 1);
                    tangents.push(-1, 0, 0);
                    uvs.push(1 - xi / this.segmentsW, 1 - yi / this.segmentsH);
                }

                // 生成索引数据
                if (xi !== this.segmentsW && yi !== this.segmentsH)
                {
                    const baseIndex = xi + yi * tw;
                    if (this.yUp)
                    {
                        indices.push(
                            baseIndex, baseIndex + tw, baseIndex + tw + 1,
                            baseIndex, baseIndex + tw + 1, baseIndex + 1);
                    }
                    else
                    {
                        indices.push(
                            baseIndex, baseIndex + tw + 1, baseIndex + tw,
                            baseIndex, baseIndex + 1, baseIndex + tw + 1);
                    }
                }
            }
        }

        this.indexBuffer = { array: indices };
        this.attributes.a_position = { array: positions, itemSize: 3 };
        this.attributes.a_normal = { array: normals, itemSize: 3 };
        this.attributes.a_tangent = { array: tangents, itemSize: 3 };
        this.attributes.a_uv = { array: uvs, itemSize: 2 };
    }
}

Geometry.setDefault('Plane', new PlaneGeometry(), { width: 10, height: 10 });

Node3D.registerPrimitive('Plane', (g) =>
{
    g.addComponent('Mesh3D').geometry = Geometry.getDefault('Plane');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Plane',
        priority: -5,
        click: () =>
            Node3D.createPrimitive('Plane')
    }
);

