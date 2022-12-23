import { oav } from '../../objectview/ObjectView';
import { serializable } from '../../serialization/serializable';
import { serialize } from '../../serialization/serialize';
import { watcher } from '../../watcher/watcher';
import { MeshRenderer } from '../core/MeshRenderer';
import { Object3D } from '../core/Object3D';
import { Geometry } from '../geometry/Geometry';
import { createNodeMenu } from '../menu/CreateNodeMenu';

declare global
{
    export interface MixinsGeometryMap
    {
        SphereGeometry: SphereGeometry
    }
    export interface MixinsDefaultGeometry
    {
        Sphere: SphereGeometry;
    }
    export interface MixinsPrimitiveObject3D
    {
        Sphere: Object3D;
    }
}

/**
 * 球体几何体
 * @author DawnKing 2016-09-12
 */
@serializable()
export class SphereGeometry extends Geometry
{
    __class__: 'SphereGeometry';

    /**
     * 球体半径
     */
    @serialize
    @oav()
    radius = 0.5;

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
    segmentsH = 12;

    /**
     * 是否朝上
     */
    @serialize
    @oav()
    yUp = true;

    name = 'Sphere';

    constructor(param?: Partial<SphereGeometry>)
    {
        super();
        Object.assign(this, param);
        watcher.watch(this as SphereGeometry, 'radius', this.invalidateGeometry, this);
        watcher.watch(this as SphereGeometry, 'segmentsW', this.invalidateGeometry, this);
        watcher.watch(this as SphereGeometry, 'segmentsH', this.invalidateGeometry, this);
        watcher.watch(this as SphereGeometry, 'yUp', this.invalidateGeometry, this);
    }

    /**
     * 构建几何体数据
     * @param this.radius 球体半径
     * @param this.segmentsW 横向分割数
     * @param this.segmentsH 纵向分割数
     * @param this.yUp 正面朝向 true:Y+ false:Z+
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

                    vertexNormalData[index] = vertexNormalData[startIndex] + x * normLen * 0.5;
                    vertexNormalData[index + 1] = vertexNormalData[startIndex + 1] + comp1 * normLen * 0.5;
                    vertexNormalData[index + 2] = vertexNormalData[startIndex + 2] + comp2 * normLen * 0.5;

                    vertexTangentData[index] = tanLen > 0.007 ? -y / tanLen : 1;
                    vertexTangentData[index + 1] = t1;
                    vertexTangentData[index + 2] = t2;
                }
                else
                {
                    vertexPositionData[index] = x;
                    vertexPositionData[index + 1] = comp1;
                    vertexPositionData[index + 2] = comp2;

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
     * @param this.segmentsW 横向分割数
     * @param this.segmentsH 纵向分割数
     * @param this.yUp 正面朝向 true:Y+ false:Z+
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
     * @param this.segmentsW 横向分割数
     * @param this.segmentsH 纵向分割数
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

Geometry.setDefault('Sphere', new SphereGeometry());

Object3D.registerPrimitive('Sphere', (g) =>
{
    g.addComponent(MeshRenderer).geometry = Geometry.getDefault('Sphere');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Sphere',
        priority: -2,
        click: () =>
            Object3D.createPrimitive('Sphere')
    }
);

