import { oav } from '../../objectview/ObjectView';
import { gPartial } from '../../polyfill/Types';
import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { MeshRenderer } from '../core/MeshRenderer';
import { Node3D } from '../core/Node3D';
import { Geometry } from '../geometry/Geometry';
import { createNodeMenu } from '../menu/CreateNodeMenu';

declare global
{
    export interface MixinsGeometryMap
    {
        CylinderGeometry: CylinderGeometry
    }

    export interface MixinsDefaultGeometry
    {
        Cylinder: CylinderGeometry;
    }

    export interface MixinsPrimitiveNode3D
    {
        Cylinder: Node3D;
    }
}

export interface ICylinderGeometry
{
    /**
     * 顶部半径
     */
    topRadius: number;

    /**
     * 底部半径
     */
    bottomRadius: number;

    /**
     * 高度
     */
    height: number;

    /**
     * 横向分割数
     */
    segmentsW: number;

    /**
     * 纵向分割数
     */
    segmentsH: number;

    /**
     * 顶部是否封口
     */
    topClosed: boolean;

    /**
     * 底部是否封口
     */
    bottomClosed: boolean;

    /**
     * 侧面是否封口
     */
    surfaceClosed: boolean;

    /**
     * 是否朝上
     */
    yUp: boolean;
}

export interface CylinderGeometry extends ICylinderGeometry { }

/**
 * 圆柱体几何体
 * @author DawnKing 2016-09-12
 */
@Serializable()
export class CylinderGeometry extends Geometry implements ICylinderGeometry
{
    __class__: 'CylinderGeometry';

    /**
     * 顶部半径
     */
    @SerializeProperty()
    @oav()
    topRadius = 0.5;

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
     * 顶部是否封口
     */
    @oav()
    @SerializeProperty()
    topClosed = true;

    /**
     * 底部是否封口
     */
    @oav()
    @SerializeProperty()
    bottomClosed = true;

    /**
     * 侧面是否封口
     */
    @oav()
    @SerializeProperty()
    surfaceClosed = true;

    /**
     * 是否朝上
     */
    @SerializeProperty()
    @oav()
    yUp = true;

    name = 'Cylinder';

    constructor(param?: gPartial<CylinderGeometry>)
    {
        super();
        Object.assign(this, param);
        watcher.watch(this as CylinderGeometry, 'topRadius', this.invalidateGeometry, this);
        watcher.watch(this as CylinderGeometry, 'bottomRadius', this.invalidateGeometry, this);
        watcher.watch(this as CylinderGeometry, 'height', this.invalidateGeometry, this);
        watcher.watch(this as CylinderGeometry, 'segmentsW', this.invalidateGeometry, this);
        watcher.watch(this as CylinderGeometry, 'segmentsH', this.invalidateGeometry, this);
        watcher.watch(this as CylinderGeometry, 'topClosed', this.invalidateGeometry, this);
        watcher.watch(this as CylinderGeometry, 'bottomClosed', this.invalidateGeometry, this);
        watcher.watch(this as CylinderGeometry, 'surfaceClosed', this.invalidateGeometry, this);
        watcher.watch(this as CylinderGeometry, 'yUp', this.invalidateGeometry, this);
    }

    /**
     * 构建几何体数据
     */
    protected buildGeometry()
    {
        const { positions, normals, tangents, uvs, indices } = CylinderGeometry.buildGeometry(this);

        this.indexBuffer = { array: indices };
        this.attributes.a_position = { array: positions, itemSize: 3 };
        this.attributes.a_normal = { array: normals, itemSize: 3 };
        this.attributes.a_tangent = { array: tangents, itemSize: 3 };
        this.attributes.a_uv = { array: uvs, itemSize: 2 };
    }

    /**
     * 构建几何体数据
     */
    static buildGeometry(cylinderGeometry: ICylinderGeometry)
    {
        const { segmentsW, topClosed, topRadius, segmentsH, height, yUp, bottomClosed, bottomRadius, surfaceClosed } = cylinderGeometry;

        let i: number;
        let j: number;
        let x: number;
        let y: number;
        let z: number;
        let radius: number;
        let revolutionAngle = 0;

        let comp1: number;
        let comp2: number;
        let startIndex = 0;
        let t1: number;
        let t2: number;

        const positions: number[] = [];
        const normals: number[] = [];
        const tangents: number[] = [];

        const revolutionAngleDelta = 2 * Math.PI / segmentsW;

        // 顶部
        if (topClosed && topRadius > 0)
        {
            z = -0.5 * height;

            for (i = 0; i <= segmentsW; ++i)
            {
                // 中心顶点
                if (yUp)
                {
                    positions.push(0, -z, 0);
                    normals.push(0, 1, 0);
                    tangents.push(1, 0, 0);
                }
                else
                {
                    positions.push(0, 0, z);
                    normals.push(0, 0, -1);
                    tangents.push(1, 0, 0);
                }

                // 旋转顶点
                revolutionAngle = i * revolutionAngleDelta;
                x = topRadius * Math.cos(revolutionAngle);
                y = topRadius * Math.sin(revolutionAngle);

                if (yUp)
                {
                    comp1 = -z;
                    comp2 = y;
                }
                else
                {
                    comp1 = y;
                    comp2 = z;
                }

                if (i === segmentsW)
                {
                    positions.push(positions[startIndex + 3], positions[startIndex + 4], positions[startIndex + 5]);
                    normals.push(0, t1, t2);
                    tangents.push(1, 0, 0);
                }
                else
                {
                    positions.push(x, comp1, comp2);
                    normals.push(0, t1, t2);
                    tangents.push(1, 0, 0);
                }
            }
        }

        // 底部
        if (bottomClosed && bottomRadius > 0)
        {
            z = 0.5 * height;
            startIndex = positions.length;
            for (i = 0; i <= segmentsW; ++i)
            {
                // 中心顶点
                if (yUp)
                {
                    t1 = -1;
                    t2 = 0;
                    comp1 = -z;
                    comp2 = 0;
                }
                else
                {
                    t1 = 0;
                    t2 = 1;
                    comp1 = 0;
                    comp2 = z;
                }

                positions.push(0, comp1, comp2);
                normals.push(0, t1, t2);
                tangents.push(1, 0, 0);

                // 旋转顶点
                revolutionAngle = i * revolutionAngleDelta;
                x = bottomRadius * Math.cos(revolutionAngle);
                y = bottomRadius * Math.sin(revolutionAngle);

                if (yUp)
                {
                    comp1 = -z;
                    comp2 = y;
                }
                else
                {
                    comp1 = y;
                    comp2 = z;
                }

                if (i === segmentsW)
                {
                    positions.push(x, positions[startIndex + 1], positions[startIndex + 2]);
                    normals.push(0, t1, t2);
                    tangents.push(1, 0, 0);
                }
                else
                {
                    positions.push(x, comp1, comp2);
                    normals.push(0, t1, t2);
                    tangents.push(1, 0, 0);
                }
            }
        }

        // 侧面
        const dr = bottomRadius - topRadius;
        const latNormElev = dr / height;
        const latNormBase = (latNormElev === 0) ? 1 : height / dr;

        if (surfaceClosed)
        {
            let na0: number; let na1: number; let naComp1: number; let
                naComp2: number;

            for (j = 0; j <= segmentsH; ++j)
            {
                radius = topRadius - ((j / segmentsH) * (topRadius - bottomRadius));
                z = -(height / 2) + (j / segmentsH * height);

                startIndex = positions.length;
                for (i = 0; i <= segmentsW; ++i)
                {
                    revolutionAngle = i * revolutionAngleDelta;
                    x = radius * Math.cos(revolutionAngle);
                    y = radius * Math.sin(revolutionAngle);
                    na0 = latNormBase * Math.cos(revolutionAngle);
                    na1 = latNormBase * Math.sin(revolutionAngle);

                    if (yUp)
                    {
                        t1 = 0;
                        t2 = -na0;
                        comp1 = -z;
                        comp2 = y;
                        naComp1 = latNormElev;
                        naComp2 = na1;
                    }
                    else
                    {
                        t1 = -na0;
                        t2 = 0;
                        comp1 = y;
                        comp2 = z;
                        naComp1 = na1;
                        naComp2 = latNormElev;
                    }

                    if (i === segmentsW)
                    {
                        positions.push(positions[startIndex], positions[startIndex + 1], positions[startIndex + 2]);
                        normals.push(na0, latNormElev, na1);
                        tangents.push(na1, t1, t2);
                    }
                    else
                    {
                        positions.push(x, comp1, comp2);
                        normals.push(na0, naComp1, naComp2);
                        tangents.push(-na1, t1, t2);
                    }
                }
            }
        }

        //
        const uvs = this.buildUVs(cylinderGeometry);
        const indices = this.buildIndices(cylinderGeometry);

        return { positions, normals, tangents, uvs, indices };
    }

    /**
     * 构建顶点索引
     */
    private static buildIndices(cylinderGeometry: ICylinderGeometry)
    {
        const { topClosed, bottomRadius, bottomClosed, surfaceClosed, segmentsH, segmentsW, topRadius } = cylinderGeometry;
        let i: number;
        let j: number;
        let index = 0;

        const indices: number[] = [];
        let numIndices = 0;
        // 顶部
        if (topClosed && topRadius > 0)
        {
            for (i = 0; i <= segmentsW; ++i)
            {
                index += 2;
                if (i > 0)
                {
                    addTriangleClockWise(index - 1, index - 3, index - 2);
                }
            }
        }

        // 底部
        if (bottomClosed && bottomRadius > 0)
        {
            for (i = 0; i <= segmentsW; ++i)
            {
                index += 2;
                if (i > 0)
                {
                    addTriangleClockWise(index - 2, index - 3, index - 1);
                }
            }
        }

        // 侧面
        if (surfaceClosed)
        {
            let a: number; let b: number; let c: number; let
                d: number;
            for (j = 0; j <= segmentsH; ++j)
            {
                for (i = 0; i <= segmentsW; ++i)
                {
                    index++;
                    if (i > 0 && j > 0)
                    {
                        a = index - 1;
                        b = index - 2;
                        c = b - segmentsW - 1;
                        d = a - segmentsW - 1;

                        addTriangleClockWise(a, b, c);
                        addTriangleClockWise(a, c, d);
                    }
                }
            }
        }

        return indices;

        function addTriangleClockWise(cwVertexIndex0: number, cwVertexIndex1: number, cwVertexIndex2: number)
        {
            indices[numIndices++] = cwVertexIndex0;
            indices[numIndices++] = cwVertexIndex1;
            indices[numIndices++] = cwVertexIndex2;
        }
    }

    /**
     * 构建uv
     */
    private static buildUVs(cylinderGeometry: ICylinderGeometry)
    {
        const { bottomClosed, segmentsW, segmentsH, surfaceClosed, topClosed } = cylinderGeometry;

        let i: number;
        let j: number;
        let x: number;
        let y: number;
        let revolutionAngle: number;

        const data: number[] = [];
        const revolutionAngleDelta = 2 * Math.PI / segmentsW;
        let index = 0;

        // 顶部
        if (topClosed)
        {
            for (i = 0; i <= segmentsW; ++i)
            {
                revolutionAngle = i * revolutionAngleDelta;
                x = 0.5 + 0.5 * -Math.cos(revolutionAngle);
                y = 0.5 + 0.5 * Math.sin(revolutionAngle);

                // 中心顶点
                data[index++] = 0.5;
                data[index++] = 0.5;
                // 旋转顶点
                data[index++] = x;
                data[index++] = y;
            }
        }
        // 底部
        if (bottomClosed)
        {
            for (i = 0; i <= segmentsW; ++i)
            {
                revolutionAngle = i * revolutionAngleDelta;
                x = 0.5 + 0.5 * Math.cos(revolutionAngle);
                y = 0.5 + 0.5 * Math.sin(revolutionAngle);

                // 中心顶点
                data[index++] = 0.5;
                data[index++] = 0.5;
                // 旋转顶点
                data[index++] = x;
                data[index++] = y;
            }
        }
        // 侧面
        if (surfaceClosed)
        {
            for (j = 0; j <= segmentsH; ++j)
            {
                for (i = 0; i <= segmentsW; ++i)
                {
                    // 旋转顶点
                    data[index++] = (i / segmentsW);
                    data[index++] = (j / segmentsH);
                }
            }
        }

        return data;
    }
}

Geometry.setDefault('Cylinder', new CylinderGeometry());

Node3D.registerPrimitive('Cylinder', (g) =>
{
    g.addComponent(MeshRenderer).geometry = Geometry.getDefault('Cylinder');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Cylinder',
        priority: -4,
        click: () =>
            Node3D.createPrimitive('Cylinder')
    }
);

