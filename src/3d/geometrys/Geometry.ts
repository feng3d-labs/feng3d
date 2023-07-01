import { EventEmitter } from '@feng3d/event';
import { Constructor, gPartial, Lazy } from '@feng3d/polyfill';
import { AssetType } from '../../assets/AssetType';
import { AssetData } from '../../core/AssetData';
import { Box3 } from '@feng3d/math';
import { Matrix4x4 } from '@feng3d/math';
import { Ray3 } from '@feng3d/math';
import { Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { AttributeBuffer, AttributeBufferSourceTypes } from '../../renderer/data/AttributeBuffer';
import { ElementBuffer } from '../../renderer/data/ElementBuffer';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { CullFace } from '../../renderer/data/RenderParams';
import { getInstance } from '@feng3d/serialization';
import { Serializable } from '@feng3d/serialization';
import { SerializeProperty } from '@feng3d/serialization';
import { geometryUtils } from './GeometryUtils';

declare module '@feng3d/serialization' { interface SerializableMap extends GeometryMap { } }

declare module '../../core/AssetData' { interface DefaultAssetDataMap extends DefaultGeometryMap { } }

export interface GeometryMap { }
/**
 * 默认几何体
 */
export interface DefaultGeometryMap { }

/**
 * 几何体类型
 */
export type GeometryLike = GeometryMap[keyof GeometryMap];

export interface GeometryEventMap
{
    /**
     * 包围盒失效
     */
    boundsInvalid: Geometry;
}

/**
 * 注册几何体
 *
 * 使用 @RegisterGeometry 注册几何体，配合扩展 GeometryMap 接口后可使用 Geometry.create 方法构造几何体。
 *
 * 将同时使用 @Serializable 进行注册为可序列化。
 *
 * @param geometry 几何体名称，默认使用类名称。
 *
 * @see Serializable
 */
export function RegisterGeometry<K extends keyof GeometryMap>(geometry: K)
{
    return (constructor: Constructor<GeometryMap[K]>) =>
    {
        Serializable(geometry)(constructor as any);
    };
}

/**
 * 几何体
 *
 * 可使用 Geometry.create 进行构建。
 */
export class Geometry
{
    /**
     * 事件发射器。
     */
    readonly emitter: EventEmitter<GeometryEventMap> = new EventEmitter(this);

    @oav({ component: 'OAVFeng3dPreView' })
    private preview = '';

    @oav()
    declare name: string;

    /**
     * 资源编号
     */
    assetId: string;

    assetType = AssetType.geometry;

    /**
     * 几何体信息
     */
    @oav({ component: 'OAVMultiText', priority: -10 })
    get geometryInfo()
    {
        const str = [
            `Geometry Info`,
            `  Vertices    ${this.numVertex}`,
            `  Triangles    ${this.numTriangles}`,
            `  Attributes    ${Object.keys(this.attributes).join(',')}`,
        ].join('\n');

        return str;
    }

    /**
     * 标记需要更新几何体，在更改几何体数据后需要调用该函数。
     */
    @oav({ tooltip: '标记需要更新几何体，在更改几何体数据后需要调用该函数。' })
    invalidateGeometry()
    {
        this._geometryInvalid = true;
        this.invalidateBounds();
    }

    /**
     * 更新几何体
     */
    updateGrometry()
    {
        if (this._geometryInvalid)
        {
            this._geometryInvalid = false;
            this.buildGeometry();
        }
    }

    /**
     * 构建几何体
     */
    protected buildGeometry()
    {
    }

    /**
     * 顶点数量
     */
    get numVertex()
    {
        const attributes = this.attributes;
        const attribute = attributes[Object.keys(attributes)[0]];
        const count = attribute.array.length / attribute.itemSize;

        return count;
    }

    /**
     * 三角形数量
     */
    get numTriangles()
    {
        const count = this.indexBuffer.array.length / 3;

        return count;
    }

    /**
     * 添加几何体
     * @param geometry          被添加的几何体
     * @param transform         变换矩阵，把克隆被添加几何体的数据变换后再添加到该几何体中
     */
    addGeometry(geometry: Geometry, transform?: Matrix4x4)
    {
        // 更新几何体
        this.updateGrometry();
        geometry.updateGrometry();
        // 变换被添加的几何体
        if (transform)
        {
            geometry = geometry.clone();
            geometry.applyTransformation(transform);
        }
        const indices = this.indexBuffer?.array;

        // 如果自身为空几何体
        if (!indices)
        {
            this.cloneFrom(geometry);

            return;
        }

        //
        const attributes = this.attributes;
        const addAttributes = geometry.attributes;
        // 当前顶点数量
        const oldNumVertex = this.numVertex;
        // 合并索引
        const targetIndices = geometry.indexBuffer.array;
        const totalIndices = cloneArrayLike(indices);
        for (let i = 0; i < targetIndices.length; i++)
        {
            totalIndices[indices.length + i] = targetIndices[i] + oldNumVertex;
        }
        this.indexBuffer.array = totalIndices;
        // 合并后顶点数量
        // const totalVertex = oldNumVertex + geometry.numVertex;
        // 合并属性数据
        for (const attributeName in attributes)
        {
            const attribute: AttributeBuffer = attributes[attributeName];
            const addAttribute: AttributeBuffer = addAttributes[attributeName];
            //
            const newData: AttributeBufferSourceTypes = new (attribute.array.constructor as any)(attribute.array.length + addAttribute.array.length);

            let array = attribute.array;
            for (let i = 0, len = array.length; i < len; i++)
            {
                newData[i] = array[i];
            }
            const offset = array.length;
            array = addAttribute.array;
            for (let i = 0, len = array.length; i < len; i++)
            {
                newData[offset + i] = array[i];
            }
            //
            attribute.array = newData;
        }
    }

    /**
     * 应用变换矩阵
     * @param transform 变换矩阵
     */
    applyTransformation(transform: Matrix4x4)
    {
        this.updateGrometry();

        const vertices = cloneArrayLike(this.attributes.a_position.array);
        const normals = cloneArrayLike(this.attributes.a_normal.array);
        const tangents = cloneArrayLike(this.attributes.a_tangent.array);

        geometryUtils.applyTransformation(transform, vertices, normals, tangents);

        this.attributes.a_position.array = vertices;
        this.attributes.a_normal.array = normals;
        this.attributes.a_tangent.array = tangents;
    }

    /**
     * 纹理U缩放，默认为1。
     */
    @SerializeProperty()
    @oav()
    scaleU = 1;

    /**
     * 纹理V缩放，默认为1。
     */
    @SerializeProperty()
    @oav()
    scaleV = 1;

    /**
     * 包围盒失效
     */
    invalidateBounds()
    {
        this._bounding = <any>null;
        this.emitter.emit('boundsInvalid', this);
    }

    get bounding()
    {
        this.updateGrometry();
        if (!this._bounding)
        {
            this._bounding = new Box3();
            const positions = this.attributes.a_position?.array;

            if (positions)
            {
                this._bounding.formPositions(positions);
            }
        }

        return this._bounding;
    }

    /**
     * 射线投影几何体
     * @param ray                           射线
     * @param shortestCollisionDistance     当前最短碰撞距离
     * @param cullFace                      裁剪面枚举
     */
    raycast(ray: Ray3, shortestCollisionDistance = Number.MAX_VALUE, cullFace: CullFace = 'NONE')
    {
        const indices = this.indexBuffer.array;
        const positions = this.attributes.a_position.array;
        const uvs = this.attributes.a_uv.array;

        const result = geometryUtils.raycast(ray, indices, positions, uvs, shortestCollisionDistance, cullFace);

        return result;
    }

    /**
     * 获取顶点列表
     *
     * @param result
     */
    getVertices(result: Vector3[] = [])
    {
        const positions = this.attributes.a_position.array;
        for (let i = 0, n = positions.length; i < n; i += 3)
        {
            result.push(new Vector3(positions[i], positions[i + 1], positions[i + 2]));
        }

        return result;
    }

    getFaces(result: number[][] = [])
    {
        const indices = this.indexBuffer.array;
        for (let i = 0, n = indices.length; i < n; i += 3)
        {
            result.push([indices[i], indices[i + 1], indices[i + 2]]);
        }

        return result;
    }

    /**
     * 克隆一个几何体
     */
    clone()
    {
        const Cls = this.constructor as Constructor<Geometry>;
        const geometry = new Cls();
        geometry.cloneFrom(this);

        return geometry;
    }

    /**
     * 从一个几何体中克隆数据
     */
    cloneFrom(geometry: Geometry)
    {
        geometry.updateGrometry();

        const indices = geometry.indexBuffer.array;

        this.indexBuffer = { array: cloneArrayLike(indices) };
        for (const attributeName in geometry.attributes)
        {
            const addAttribute: AttributeBuffer = geometry.attributes[attributeName];

            this.attributes[attributeName] = {
                array: cloneArrayLike(addAttribute.array),
                itemSize: addAttribute.itemSize,
                normalized: addAttribute.normalized,
                divisor: addAttribute.divisor,
                usage: addAttribute.usage,
                type: addAttribute.type,
            };
        }
    }

    beforeRender(renderAtomic: RenderAtomic)
    {
        this.updateGrometry();

        renderAtomic.index = this.indexBuffer;

        for (const key in this.attributes)
        {
            if (this.attributes.hasOwnProperty(key))
            {
                renderAtomic.attributes[key] = this.attributes[key];
            }
        }

        renderAtomic.shaderMacro.SCALEU = this.scaleU;
        renderAtomic.shaderMacro.SCALEV = this.scaleV;
    }

    /**
     * 顶点索引缓冲
     */
    indexBuffer: ElementBuffer;

    /**
     * 属性数据列表
     */
    attributes: { [key: string]: AttributeBuffer; } = {};

    /**
     * 清理数据
     */
    clear()
    {
        this.attributes = {};
    }

    private _geometryInvalid = true;

    private _bounding: Box3;

    /**
     * 构造几何体。
     *
     * @param geometry 几何体名称。
     * @param params 几何体参数。
     *
     * @returns 几何体实例。
     */
    static create<K extends keyof GeometryMap>(geometry: K, params?: gPartial<GeometryMap[K]>): GeometryMap[K]
    {
        const instance = getInstance(geometry, params as any);

        return instance;
    }

    /**
     * 设置默认几何体
     *
     * @param name 默认几何体名称
     * @param geometry 默认几何体
     */
    static setDefault<K extends keyof DefaultGeometryMap>(name: K, geometry: Lazy<DefaultGeometryMap[K]>)
    {
        AssetData.addDefaultAssetData(name, geometry as any);
    }

    /**
     * 获取默认几何体
     *
     * @param name 默认几何体名称
     */
    static getDefault<K extends keyof DefaultGeometryMap>(name: K): DefaultGeometryMap[K]
    {
        return AssetData.getDefaultAssetData(name);
    }
}

function cloneArrayLike<T extends AttributeBufferSourceTypes>(array: T)
{
    if (Array.isArray(array))
    {
        return array.concat();
    }

    return new (array.constructor as Constructor<T>)(array);
}
