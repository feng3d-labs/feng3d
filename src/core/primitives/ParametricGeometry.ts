import { Vector3 } from '../../math/geom/Vector3';
import { Serializable } from '../../serialization/Serializable';
import { Geometry } from '../geometry/Geometry';
import { geometryUtils } from '../geometry/GeometryUtils';

declare global
{
    export interface MixinsGeometryMap
    {
        ParametricGeometry: ParametricGeometry
    }
}

@Serializable('ParametricGeometry')
export class ParametricGeometry extends Geometry
{
    func: (u: number, v: number) => Vector3;
    slices: number;
    stacks: number;
    doubleside: boolean;

    /**
     * @author zz85 / https://github.com/zz85
     * Parametric Surfaces Geometry
     * based on the brilliant article by @prideout http://prideout.net/blog/?p=44
     *
     * new ParametricGeometry( parametricFunction, uSegments, ySegements );
     *
     */
    constructor(func: (u: number, v: number) => Vector3, slices = 8, stacks = 8, doubleside = false)
    {
        super();

        this.func = func;
        this.slices = slices;
        this.stacks = stacks;
        this.doubleside = doubleside;

        this.invalidateGeometry();
    }

    /**
     * 构建几何体
     */
    protected buildGeometry()
    {
        const { func, slices, stacks, doubleside } = this;

        let positions: number[] = [];
        const indices: number[] = [];
        let uvs: number[] = [];

        const sliceCount = slices + 1;

        for (let i = 0; i <= stacks; i++)
        {
            const v = i / stacks;

            for (let j = 0; j <= slices; j++)
            {
                const u = j / slices;
                //
                uvs.push(u, v);
                //
                const p = func(u, v);
                positions.push(p.x, p.y, p.z);
                //
                if (i < stacks && j < slices)
                {
                    const a = i * sliceCount + j;
                    const b = i * sliceCount + j + 1;
                    const c = (i + 1) * sliceCount + j + 1;
                    const d = (i + 1) * sliceCount + j;
                    indices.push(a, b, d);
                    indices.push(b, c, d);
                }
            }
        }
        // 反面
        if (doubleside)
        {
            positions = positions.concat(positions);
            uvs = uvs.concat(uvs);
            const start = (stacks + 1) * (slices + 1);
            for (let i = 0, n = indices.length; i < n; i += 3)
            {
                indices.push(start + indices[i], start + indices[i + 2], start + indices[i + 1]);
            }
        }

        for (let i = 0, half = positions.length / 2; i < half; i++)
        {
            positions[i + half] = positions[i];
        }

        const normals = geometryUtils.createVertexNormals(indices, positions, true);
        const tangents = geometryUtils.createVertexTangents(indices, positions, uvs, true);

        this.indexBuffer = { array: indices };
        this.attributes.a_position = { array: positions, itemSize: 3 };
        this.attributes.a_normal = { array: normals, itemSize: 3 };
        this.attributes.a_tangent = { array: tangents, itemSize: 3 };
        this.attributes.a_uv = { array: uvs, itemSize: 2 };
    }
}
