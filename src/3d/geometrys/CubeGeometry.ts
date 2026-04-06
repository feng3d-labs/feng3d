import { createNodeMenu } from '../../core/CreateNodeMenu';
import { oav } from '../../objectview/ObjectView';
import { gPartial } from '../../polyfill/Types';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { Node3D } from '../core/Node3D';
import { Geometry, RegisterGeometry } from '../geometrys/Geometry';

declare module './Geometry'
{
    interface GeometryMap { CubeGeometry: CubeGeometry }

    interface DefaultGeometryMap { Cube: CubeGeometry; }
}

declare module '../core/Node3D' { interface PrimitiveNode3D { Cube: Node3D; } }

/**
 * 立（长）方体几何体
 */
@RegisterGeometry('CubeGeometry')
export class CubeGeometry extends Geometry
{
    declare __class__: 'CubeGeometry';

    name = 'Cube';

    /**
     * 宽度
     */
    @SerializeProperty()
    @oav()
    width = 1;

    /**
     * 高度
     */
    @SerializeProperty()
    @oav()
    height = 1;

    /**
     * 深度
     */
    @SerializeProperty()
    @oav()
    depth = 1;

    /**
     * 宽度方向分割数
     */
    @SerializeProperty()
    @oav()
    segmentsW = 1;

    /**
     * 高度方向分割数
     */
    @SerializeProperty()
    @oav()
    segmentsH = 1;

    /**
     * 深度方向分割数
     */
    @SerializeProperty()
    @oav()
    segmentsD = 1;

    /**
     * 是否为6块贴图，默认true。
     */
    @SerializeProperty()
    @oav()
    tile6 = false;

    constructor(param?: gPartial<CubeGeometry>)
    {
        super();
        Object.assign(this, param);
        watcher.watch(this as CubeGeometry, 'width', this.invalidateGeometry, this);
        watcher.watch(this as CubeGeometry, 'height', this.invalidateGeometry, this);
        watcher.watch(this as CubeGeometry, 'depth', this.invalidateGeometry, this);
        watcher.watch(this as CubeGeometry, 'segmentsW', this.invalidateGeometry, this);
        watcher.watch(this as CubeGeometry, 'segmentsH', this.invalidateGeometry, this);
        watcher.watch(this as CubeGeometry, 'segmentsD', this.invalidateGeometry, this);
        watcher.watch(this as CubeGeometry, 'tile6', this.invalidateGeometry, this);
    }

    protected buildGeometry()
    {
        const vertexPositionData = this.buildPosition();
        const vertexNormalData = this.buildNormal();
        const vertexTangentData = this.buildTangent();
        const uvData = this.buildUVs();
        const indices = this.buildIndices();

        this.indexBuffer = { array: indices };
        this.attributes.a_position = { array: vertexPositionData, itemSize: 3 };
        this.attributes.a_normal = { array: vertexNormalData, itemSize: 3 };
        this.attributes.a_tangent = { array: vertexTangentData, itemSize: 3 };
        this.attributes.a_uv = { array: uvData, itemSize: 2 };
    }

    /**
     * 构建坐标
     */
    private buildPosition()
    {
        const vertexPositionData: number[] = [];

        let i: number; let
            j: number;

        let outerPos: number;

        // Indices
        let positionIndex = 0;

        // half cube dimensions
        const hw = this.width / 2;
        const hh = this.height / 2;
        const hd = this.depth / 2;

        // Segment dimensions
        const dw = this.width / this.segmentsW;
        const dh = this.height / this.segmentsH;
        const dd = this.depth / this.segmentsD;

        for (i = 0; i <= this.segmentsW; i++)
        {
            outerPos = -hw + i * dw;

            for (j = 0; j <= this.segmentsH; j++)
            {
                // front
                vertexPositionData[positionIndex++] = outerPos;
                vertexPositionData[positionIndex++] = -hh + j * dh;
                vertexPositionData[positionIndex++] = -hd;

                // back
                vertexPositionData[positionIndex++] = outerPos;
                vertexPositionData[positionIndex++] = -hh + j * dh;
                vertexPositionData[positionIndex++] = hd;
            }
        }

        for (i = 0; i <= this.segmentsW; i++)
        {
            outerPos = -hw + i * dw;

            for (j = 0; j <= this.segmentsD; j++)
            {
                // top
                vertexPositionData[positionIndex++] = outerPos;
                vertexPositionData[positionIndex++] = hh;
                vertexPositionData[positionIndex++] = -hd + j * dd;

                // bottom
                vertexPositionData[positionIndex++] = outerPos;
                vertexPositionData[positionIndex++] = -hh;
                vertexPositionData[positionIndex++] = -hd + j * dd;
            }
        }

        for (i = 0; i <= this.segmentsD; i++)
        {
            outerPos = hd - i * dd;

            for (j = 0; j <= this.segmentsH; j++)
            {
                // left
                vertexPositionData[positionIndex++] = -hw;
                vertexPositionData[positionIndex++] = -hh + j * dh;
                vertexPositionData[positionIndex++] = outerPos;

                // right
                vertexPositionData[positionIndex++] = hw;
                vertexPositionData[positionIndex++] = -hh + j * dh;
                vertexPositionData[positionIndex++] = outerPos;
            }
        }

        return vertexPositionData;
    }

    /**
     * 构建法线
     */
    private buildNormal()
    {
        const vertexNormalData: number[] = [];

        let i: number; let
            j: number;

        // Indices
        let normalIndex = 0;

        for (i = 0; i <= this.segmentsW; i++)
        {
            for (j = 0; j <= this.segmentsH; j++)
            {
                // front
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = -1;

                // back
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = 1;
            }
        }

        for (i = 0; i <= this.segmentsW; i++)
        {
            for (j = 0; j <= this.segmentsD; j++)
            {
                // top
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = 1;
                vertexNormalData[normalIndex++] = 0;

                // bottom
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = -1;
                vertexNormalData[normalIndex++] = 0;
            }
        }

        for (i = 0; i <= this.segmentsD; i++)
        {
            for (j = 0; j <= this.segmentsH; j++)
            {
                // left
                vertexNormalData[normalIndex++] = -1;
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = 0;

                // right
                vertexNormalData[normalIndex++] = 1;
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = 0;
            }
        }

        return vertexNormalData;
    }

    /**
     * 构建切线
     */
    private buildTangent()
    {
        const vertexTangentData: number[] = [];

        let i: number; let
            j: number;

        // Indices
        let tangentIndex = 0;

        for (i = 0; i <= this.segmentsW; i++)
        {
            for (j = 0; j <= this.segmentsH; j++)
            {
                // front
                vertexTangentData[tangentIndex++] = 1;
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = 0;

                // back
                vertexTangentData[tangentIndex++] = -1;
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = 0;
            }
        }

        for (i = 0; i <= this.segmentsW; i++)
        {
            for (j = 0; j <= this.segmentsD; j++)
            {
                // top
                vertexTangentData[tangentIndex++] = 1;
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = 0;

                // bottom
                vertexTangentData[tangentIndex++] = 1;
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = 0;
            }
        }

        for (i = 0; i <= this.segmentsD; i++)
        {
            for (j = 0; j <= this.segmentsH; j++)
            {
                // left
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = -1;

                // right
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = 1;
            }
        }

        return vertexTangentData;
    }

    /**
     * 构建索引
     * @param   segmentsW       宽度方向分割
     * @param   segmentsH       高度方向分割
     * @param   segmentsD       深度方向分割
     */
    private buildIndices()
    {
        const indices: number[] = [];

        let tl: number; let tr: number; let bl: number; let
            br: number;
        let i: number; let j: number; let
            inc = 0;

        let fidx = 0;

        for (i = 0; i <= this.segmentsW; i++)
        {
            for (j = 0; j <= this.segmentsH; j++)
            {
                // front
                // back
                if (i && j)
                {
                    tl = 2 * ((i - 1) * (this.segmentsH + 1) + (j - 1));
                    tr = 2 * (i * (this.segmentsH + 1) + (j - 1));
                    bl = tl + 2;
                    br = tr + 2;

                    indices[fidx++] = tl;
                    indices[fidx++] = bl;
                    indices[fidx++] = br;
                    indices[fidx++] = tl;
                    indices[fidx++] = br;
                    indices[fidx++] = tr;
                    indices[fidx++] = tr + 1;
                    indices[fidx++] = br + 1;
                    indices[fidx++] = bl + 1;
                    indices[fidx++] = tr + 1;
                    indices[fidx++] = bl + 1;
                    indices[fidx++] = tl + 1;
                }
            }
        }

        inc += 2 * (this.segmentsW + 1) * (this.segmentsH + 1);

        for (i = 0; i <= this.segmentsW; i++)
        {
            for (j = 0; j <= this.segmentsD; j++)
            {
                // top
                // bottom
                if (i && j)
                {
                    tl = inc + 2 * ((i - 1) * (this.segmentsD + 1) + (j - 1));
                    tr = inc + 2 * (i * (this.segmentsD + 1) + (j - 1));
                    bl = tl + 2;
                    br = tr + 2;

                    indices[fidx++] = tl;
                    indices[fidx++] = bl;
                    indices[fidx++] = br;
                    indices[fidx++] = tl;
                    indices[fidx++] = br;
                    indices[fidx++] = tr;
                    indices[fidx++] = tr + 1;
                    indices[fidx++] = br + 1;
                    indices[fidx++] = bl + 1;
                    indices[fidx++] = tr + 1;
                    indices[fidx++] = bl + 1;
                    indices[fidx++] = tl + 1;
                }
            }
        }

        inc += 2 * (this.segmentsW + 1) * (this.segmentsD + 1);

        for (i = 0; i <= this.segmentsD; i++)
        {
            for (j = 0; j <= this.segmentsH; j++)
            {
                // left
                // right

                if (i && j)
                {
                    tl = inc + 2 * ((i - 1) * (this.segmentsH + 1) + (j - 1));
                    tr = inc + 2 * (i * (this.segmentsH + 1) + (j - 1));
                    bl = tl + 2;
                    br = tr + 2;

                    indices[fidx++] = tl;
                    indices[fidx++] = bl;
                    indices[fidx++] = br;
                    indices[fidx++] = tl;
                    indices[fidx++] = br;
                    indices[fidx++] = tr;
                    indices[fidx++] = tr + 1;
                    indices[fidx++] = br + 1;
                    indices[fidx++] = bl + 1;
                    indices[fidx++] = tr + 1;
                    indices[fidx++] = bl + 1;
                    indices[fidx++] = tl + 1;
                }
            }
        }

        return indices;
    }

    /**
     * 构建uv
     * @param   segmentsW       宽度方向分割
     * @param   segmentsH       高度方向分割
     * @param   segmentsD       深度方向分割
     * @param   tile6           是否为6块贴图
     */
    private buildUVs()
    {
        let i: number; let j: number; let
            uidx: number;
        const data: number[] = [];

        let uTileDim: number; let
            vTileDim: number;
        let uTileStep: number; let
            vTileStep: number;
        let tl0u: number; let
            tl0v: number;
        let tl1u: number; let
            tl1v: number;
        let du: number; let
            dv: number;

        if (this.tile6)
        {
            uTileDim = uTileStep = 1 / 3;
            vTileDim = vTileStep = 1 / 2;
        }
        else
        {
            uTileDim = vTileDim = 1;
            uTileStep = vTileStep = 0;
        }

        // Create planes two and two, the same way that they were
        // constructed in the this.buildGeometry() function. First calculate
        // the top-left UV coordinate for both planes, and then loop
        // over the points, calculating the UVs from these numbers.

        // When this.tile6 is true, the layout is as follows:
        //       .-----.-----.-----. (1,1)
        //       | Bot |  T  | Bak |
        //       |-----+-----+-----|
        //       |  L  |  F  |  R  |
        // (0,0)'-----'-----'-----'

        uidx = 0;

        // FRONT / BACK
        tl0u = Number(uTileStep);
        tl0v = Number(vTileStep);
        tl1u = 2 * uTileStep;
        tl1v = 0 * vTileStep;
        du = uTileDim / this.segmentsW;
        dv = vTileDim / this.segmentsH;
        for (i = 0; i <= this.segmentsW; i++)
        {
            for (j = 0; j <= this.segmentsH; j++)
            {
                data[uidx++] = tl0u + i * du;
                data[uidx++] = tl0v + (vTileDim - j * dv);
                data[uidx++] = tl1u + (uTileDim - i * du);
                data[uidx++] = tl1v + (vTileDim - j * dv);
            }
        }

        // TOP / BOTTOM
        tl0u = Number(uTileStep);
        tl0v = 0 * vTileStep;
        tl1u = 0 * uTileStep;
        tl1v = 0 * vTileStep;
        du = uTileDim / this.segmentsW;
        dv = vTileDim / this.segmentsD;
        for (i = 0; i <= this.segmentsW; i++)
        {
            for (j = 0; j <= this.segmentsD; j++)
            {
                data[uidx++] = tl0u + i * du;
                data[uidx++] = tl0v + (vTileDim - j * dv);
                data[uidx++] = tl1u + i * du;
                data[uidx++] = tl1v + j * dv;
            }
        }

        // LEFT / RIGHT
        tl0u = 0 * uTileStep;
        tl0v = Number(vTileStep);
        tl1u = 2 * uTileStep;
        tl1v = Number(vTileStep);
        du = uTileDim / this.segmentsD;
        dv = vTileDim / this.segmentsH;
        for (i = 0; i <= this.segmentsD; i++)
        {
            for (j = 0; j <= this.segmentsH; j++)
            {
                data[uidx++] = tl0u + i * du;
                data[uidx++] = tl0v + (vTileDim - j * dv);
                data[uidx++] = tl1u + (uTileDim - i * du);
                data[uidx++] = tl1v + (vTileDim - j * dv);
            }
        }

        return data;
    }
}

Geometry.setDefault('Cube', new CubeGeometry());

Node3D.registerPrimitive('Cube', (g) =>
{
    g.addComponent('Mesh3D').geometry = Geometry.getDefault('Cube');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Cube',
        priority: -1,
        click: () =>
            Node3D.createPrimitive('Cube')
    }
);

