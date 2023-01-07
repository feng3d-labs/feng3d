import { oav } from '../../objectview/ObjectView';
import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { Node3D } from '../core/Node3D';
import { Geometry } from '../geometry/Geometry';
import { createNodeMenu } from '../menu/CreateNodeMenu';

declare module '../geometry/Geometry' { interface GeometryMap { CapsuleGeometry: CapsuleGeometry } }

declare module '../geometry/Geometry' { interface DefaultGeometryMap { Capsule: CapsuleGeometry; } }

declare module '../core/Node3D' { interface PrimitiveNode3D { Capsule: Node3D; } }

/**
 * 胶囊体几何体
 */
@Serializable('CapsuleGeometry')
export class CapsuleGeometry extends Geometry
{
    declare __class__: 'CapsuleGeometry';

    /**
     * 胶囊体半径
     */
    @SerializeProperty()
    @oav()
    radius = 0.5;

    /**
     * 胶囊体高度
     */
    @SerializeProperty()
    @oav()
    height = 1;

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
    segmentsH = 15;

    /**
     * 正面朝向 true:Y+ false:Z+
     */
    @SerializeProperty()
    @oav()
    yUp = true;

    name = 'Capsule';

    constructor()
    {
        super();
        watcher.watch(this as CapsuleGeometry, 'radius', this.invalidateGeometry, this);
        watcher.watch(this as CapsuleGeometry, 'height', this.invalidateGeometry, this);
        watcher.watch(this as CapsuleGeometry, 'segmentsW', this.invalidateGeometry, this);
        watcher.watch(this as CapsuleGeometry, 'segmentsH', this.invalidateGeometry, this);
        watcher.watch(this as CapsuleGeometry, 'yUp', this.invalidateGeometry, this);
    }

    /**
     * 构建几何体数据
     */
    protected buildGeometry()
    {
        const vertexPositionData: number[] = [];
        const vertexNormalData: number[] = [];
        const vertexTangentData: number[] = [];

        let startIndex: number;
        let index = 0;
        let comp1: number; let comp2: number; let t1: number; let
            t2: number;
        for (let yi = 0; yi <= this.segmentsH; ++yi)
        {
            startIndex = index;

            const horangle = Math.PI * yi / this.segmentsH;
            const z = -this.radius * Math.cos(horangle);
            const ringradius = this.radius * Math.sin(horangle);

            for (let xi = 0; xi <= this.segmentsW; ++xi)
            {
                const verangle = 2 * Math.PI * xi / this.segmentsW;
                const x = ringradius * Math.cos(verangle);
                const y = ringradius * Math.sin(verangle);
                const normLen = 1 / Math.sqrt(x * x + y * y + z * z);
                const tanLen = Math.sqrt(y * y + x * x);
                const offset = yi > this.segmentsH / 2 ? this.height / 2 : -this.height / 2;

                if (this.yUp)
                {
                    t1 = 0;
                    t2 = tanLen > 0.007 ? x / tanLen : 0;
                    comp1 = -z;
                    comp2 = y;
                }
                else
                {
                    t1 = tanLen > 0.007 ? x / tanLen : 0;
                    t2 = 0;
                    comp1 = y;
                    comp2 = z;
                }

                if (xi === this.segmentsW)
                {
                    vertexPositionData[index] = vertexPositionData[startIndex];
                    vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                    vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];

                    vertexNormalData[index] = (vertexNormalData[startIndex] + x * normLen) * 0.5;
                    vertexNormalData[index + 1] = (vertexNormalData[startIndex + 1] + comp1 * normLen) * 0.5;
                    vertexNormalData[index + 2] = (vertexNormalData[startIndex + 2] + comp2 * normLen) * 0.5;

                    vertexTangentData[index] = (vertexTangentData[startIndex] + tanLen > 0.007 ? -y / tanLen : 1) * 0.5;
                    vertexTangentData[index + 1] = (vertexTangentData[startIndex + 1] + t1) * 0.5;
                    vertexTangentData[index + 2] = (vertexTangentData[startIndex + 2] + t2) * 0.5;
                }
                else
                {
                    vertexPositionData[index] = x;
                    vertexPositionData[index + 1] = this.yUp ? comp1 - offset : comp1;
                    vertexPositionData[index + 2] = this.yUp ? comp2 : comp2 + offset;

                    vertexNormalData[index] = x * normLen;
                    vertexNormalData[index + 1] = comp1 * normLen;
                    vertexNormalData[index + 2] = comp2 * normLen;

                    vertexTangentData[index] = tanLen > 0.007 ? -y / tanLen : 1;
                    vertexTangentData[index + 1] = t1;
                    vertexTangentData[index + 2] = t2;
                }

                if (xi > 0 && yi > 0)
                {
                    if (yi === this.segmentsH)
                    {
                        vertexPositionData[index] = vertexPositionData[startIndex];
                        vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                        vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                    }
                }

                index += 3;
            }
        }
        const uvData = this.buildUVs();
        const indices = this.buildIndices();

        this.indexBuffer = { array: indices };
        this.attributes.a_position = { array: vertexPositionData, itemSize: 3 };
        this.attributes.a_normal = { array: vertexNormalData, itemSize: 3 };
        this.attributes.a_tangent = { array: vertexTangentData, itemSize: 3 };
        this.attributes.a_uv = { array: uvData, itemSize: 2 };
    }

    /**
     * 构建顶点索引
     */
    private buildIndices()
    {
        const indices: number[] = [];

        let numIndices = 0;
        for (let yi = 0; yi <= this.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= this.segmentsW; ++xi)
            {
                if (xi > 0 && yi > 0)
                {
                    const a = (this.segmentsW + 1) * yi + xi;
                    const b = (this.segmentsW + 1) * yi + xi - 1;
                    const c = (this.segmentsW + 1) * (yi - 1) + xi - 1;
                    const d = (this.segmentsW + 1) * (yi - 1) + xi;

                    if (yi === this.segmentsH)
                    {
                        indices[numIndices++] = a;
                        indices[numIndices++] = c;
                        indices[numIndices++] = d;
                    }
                    else if (yi === 1)
                    {
                        indices[numIndices++] = a;
                        indices[numIndices++] = b;
                        indices[numIndices++] = c;
                    }
                    else
                    {
                        indices[numIndices++] = a;
                        indices[numIndices++] = b;
                        indices[numIndices++] = c;
                        indices[numIndices++] = a;
                        indices[numIndices++] = c;
                        indices[numIndices++] = d;
                    }
                }
            }
        }

        return indices;
    }

    /**
     * 构建uv
     */
    private buildUVs()
    {
        const data: number[] = [];
        let index = 0;

        for (let yi = 0; yi <= this.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= this.segmentsW; ++xi)
            {
                data[index++] = xi / this.segmentsW;
                data[index++] = yi / this.segmentsH;
            }
        }

        return data;
    }
}

Geometry.setDefault('Capsule', new CapsuleGeometry());

Node3D.registerPrimitive('Capsule', (g) =>
{
    g.addComponent('MeshRenderer').geometry = Geometry.getDefault('Capsule');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Capsule',
        priority: -3,
        click: () =>
            Node3D.createPrimitive('Capsule')
    }
);

