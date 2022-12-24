import { Vector2 } from '../../math/geom/Vector2';
import { Vector3 } from '../../math/geom/Vector3';
import { oav } from '../../objectview/ObjectView';
import { gPartial } from '../../polyfill/Types';
import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { Node3D } from '../core/Node3D';
import { Geometry } from '../geometry/Geometry';
import { geometryUtils } from '../geometry/GeometryUtils';

declare global
{
    export interface MixinsGeometryMap
    {
        CircleGeometry: CircleGeometry
    }

    export interface MixinsDefaultGeometry
    {
        Circle: CircleGeometry;
    }

    export interface MixinsPrimitiveNode3D
    {
        Circle: Node3D;
    }
}

export interface ICircleGeometry
{
    /**
     * 半径
     */
    radius: number;

    /**
     * 分段数量
     */
    segments: number;

    /**
     * 起始角度
     */
    thetaStart: number;

    /**
     * 终止角度
     */
    thetaLength: number;
}

/**
 * 圆片
 */
@Serializable()
export class CircleGeometry extends Geometry
{
    __class__: 'CircleGeometry' = 'CircleGeometry';
    /**
     * 半径
     */
    @SerializeProperty()
    @oav()
    radius = 1;

    /**
     * 分段数量
     */
    @SerializeProperty()
    @oav()
    segments = 8;

    /**
     * 起始弧度
     */
    @SerializeProperty()
    @oav()
    thetaStart = 0;

    /**
     * 弧长
     */
    @SerializeProperty()
    @oav()
    thetaLength = Math.PI * 2;

    constructor(param?: gPartial<CircleGeometry>)
    {
        super();
        Object.assign(this, param);
        watcher.watch(this as CircleGeometry, 'radius', this.invalidateGeometry, this);
        watcher.watch(this as CircleGeometry, 'segments', this.invalidateGeometry, this);
        watcher.watch(this as CircleGeometry, 'thetaStart', this.invalidateGeometry, this);
        watcher.watch(this as CircleGeometry, 'thetaLength', this.invalidateGeometry, this);
    }

    /**
     * 构建几何体数据
     */
    protected buildGeometry()
    {
        const { indices, positions, normals, uvs } = CircleGeometry.buildGeometry(this);

        const tangents = geometryUtils.createVertexTangents(indices, positions, uvs);

        this.indexBuffer = { array: indices };
        this.attributes.a_position = { array: positions, itemSize: 3 };
        this.attributes.a_normal = { array: normals, itemSize: 3 };
        this.attributes.a_tangent = { array: tangents, itemSize: 3 };
        this.attributes.a_uv = { array: uvs, itemSize: 2 };
    }

    /**
     * 构建几何体数据
     */
    static buildGeometry({ radius, segments, thetaStart, thetaLength }: ICircleGeometry)
    {
        segments = Math.max(3, segments);

        // buffers

        const indices = [];
        const positions = [];
        const normals = [];
        const uvs = [];

        // helper variables

        const vertex = new Vector3();
        const uv = new Vector2();

        // center point

        positions.push(0, 0, 0);
        normals.push(0, 0, 1);
        uvs.push(0.5, 0.5);

        for (let s = 0, i = 3; s <= segments; s++, i += 3)
        {
            const segment = thetaStart + s / segments * thetaLength;

            // vertex

            vertex.x = radius * Math.cos(segment);
            vertex.y = radius * Math.sin(segment);

            positions.push(vertex.x, vertex.y, vertex.z);

            // normal

            normals.push(0, 0, 1);

            // uvs

            uv.x = (positions[i] / radius + 1) / 2;
            uv.y = (positions[i + 1] / radius + 1) / 2;

            uvs.push(uv.x, uv.y);
        }

        // indices

        for (let i = 1; i <= segments; i++)
        {
            indices.push(i, i + 1, 0);
        }

        // build geometry
        return { indices, positions, normals, uvs };
    }
}
