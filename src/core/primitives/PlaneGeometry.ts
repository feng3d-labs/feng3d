import { GameObject } from '../core/GameObject';
import { MeshRenderer } from '../core/MeshRenderer';
import { Geometry } from '../geometry/Geometry';
import { createNodeMenu } from '../menu/CreateNodeMenu';

declare global
{
    export interface MixinsGeometryTypes
    {
        PlaneGeometry: PlaneGeometry
    }

    export interface MixinsDefaultGeometry
    {
        Plane: PlaneGeometry;
    }
    export interface MixinsPrimitiveGameObject
    {
        Plane: GameObject;
    }
}

/**
 * 平面几何体
 */
@decoratorRegisterClass()
export class PlaneGeometry extends Geometry
{
    __class__: 'PlaneGeometry';

    /**
     * 宽度
     */
    @oav()
    @serialize
    width = 1;

    /**
     * 高度
     */
    @oav()
    @serialize
    height = 1;

    /**
     * 横向分割数
     */
    @oav()
    @serialize
    segmentsW = 1;

    /**
     * 纵向分割数
     */
    @oav()
    @serialize
    segmentsH = 1;

    /**
     * 是否朝上
     */
    @oav()
    @serialize
    yUp = true;

    name = 'Plane';

    constructor()
    {
        super();
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
        const vertexPositionData = this.buildPosition();
        this.positions = vertexPositionData;

        const vertexNormalData = this.buildNormal();
        this.normals = vertexNormalData;

        const vertexTangentData = this.buildTangent();
        this.tangents = vertexTangentData;

        const uvData = this.buildUVs();
        this.uvs = uvData;

        const indices = this.buildIndices();
        this.indices = indices;
    }

    /**
     * 构建顶点坐标
     * @param this.width 宽度
     * @param this.height 高度
     * @param this.segmentsW 横向分割数
     * @param this.segmentsH 纵向分割数
     * @param this.yUp 正面朝向 true:Y+ false:Z+
     */
    private buildPosition()
    {
        const vertexPositionData: number[] = [];
        let x: number; let
            y: number;
        let positionIndex = 0;
        for (let yi = 0; yi <= this.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= this.segmentsW; ++xi)
            {
                x = (xi / this.segmentsW - 0.5) * this.width;
                y = (yi / this.segmentsH - 0.5) * this.height;

                // 设置坐标数据
                vertexPositionData[positionIndex++] = x;
                if (this.yUp)
                {
                    vertexPositionData[positionIndex++] = 0;
                    vertexPositionData[positionIndex++] = y;
                }
                else
                {
                    vertexPositionData[positionIndex++] = y;
                    vertexPositionData[positionIndex++] = 0;
                }
            }
        }

        return vertexPositionData;
    }

    /**
     * 构建顶点法线
     * @param this.segmentsW 横向分割数
     * @param this.segmentsH 纵向分割数
     * @param this.yUp 正面朝向 true:Y+ false:Z+
     */
    private buildNormal()
    {
        const vertexNormalData: number[] = [];

        let normalIndex = 0;
        for (let yi = 0; yi <= this.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= this.segmentsW; ++xi)
            {
                // 设置法线数据
                vertexNormalData[normalIndex++] = 0;
                if (this.yUp)
                {
                    vertexNormalData[normalIndex++] = 1;
                    vertexNormalData[normalIndex++] = 0;
                }
                else
                {
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = 1;
                }
            }
        }

        return vertexNormalData;
    }

    /**
     * 构建顶点切线
     * @param this.segmentsW 横向分割数
     * @param this.segmentsH 纵向分割数
     * @param this.yUp 正面朝向 true:Y+ false:Z+
     */
    private buildTangent()
    {
        const vertexTangentData: number[] = [];
        let tangentIndex = 0;
        for (let yi = 0; yi <= this.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= this.segmentsW; ++xi)
            {
                if (this.yUp)
                {
                    vertexTangentData[tangentIndex++] = 1;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                }
                else
                {
                    vertexTangentData[tangentIndex++] = -1;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                }
            }
        }

        return vertexTangentData;
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
        const tw = this.segmentsW + 1;

        let numIndices = 0;
        let base: number;
        for (let yi = 0; yi <= this.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= this.segmentsW; ++xi)
            {
                // 生成索引数据
                if (xi !== this.segmentsW && yi !== this.segmentsH)
                {
                    base = xi + yi * tw;
                    if (this.yUp)
                    {
                        indices[numIndices++] = base;
                        indices[numIndices++] = base + tw;
                        indices[numIndices++] = base + tw + 1;
                        indices[numIndices++] = base;
                        indices[numIndices++] = base + tw + 1;
                        indices[numIndices++] = base + 1;
                    }
                    else
                    {
                        indices[numIndices++] = base;
                        indices[numIndices++] = base + tw + 1;
                        indices[numIndices++] = base + tw;
                        indices[numIndices++] = base;
                        indices[numIndices++] = base + 1;
                        indices[numIndices++] = base + tw + 1;
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
                if (this.yUp)
                {
                    data[index++] = xi / this.segmentsW;
                    data[index++] = 1 - yi / this.segmentsH;
                }
                else
                {
                    data[index++] = 1 - xi / this.segmentsW;
                    data[index++] = 1 - yi / this.segmentsH;
                }
            }
        }

        return data;
    }
}

Geometry.setDefault('Plane', new PlaneGeometry(), { width: 10, height: 10 });

GameObject.registerPrimitive('Plane', (g) =>
{
    g.addComponent(MeshRenderer).geometry = Geometry.getDefault('Plane');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Plane',
        priority: -5,
        click: () =>
            GameObject.createPrimitive('Plane')
    }
);

