namespace feng3d
{
    export class ParametricGeometry extends Geometry
    {
        /**
         * @author zz85 / https://github.com/zz85
         * Parametric Surfaces Geometry
         * based on the brilliant article by @prideout http://prideout.net/blog/?p=44
         *
         * new ParametricGeometry( parametricFunction, uSegments, ySegements );
         *
         */
        constructor(func: (u: number, v: number) => Vector3, slices = 8, stacks = 8)
        {
            super();

            var positions: number[] = [];
            var indices: number[] = [];
            var uvs: number[] = [];

            var sliceCount = slices + 1;

            for (var i = 0; i <= stacks; i++)
            {
                var v = i / stacks;

                for (var j = 0; j <= slices; j++)
                {
                    var u = j / slices;
                    //
                    uvs.push(u, v);
                    //
                    var p = func(u, v);
                    positions.push(p.x, p.y, p.z);
                    //
                    if (i < stacks && j < slices)
                    {
                        var a = i * sliceCount + j;
                        var b = i * sliceCount + j + 1;
                        var c = (i + 1) * sliceCount + j + 1;
                        var d = (i + 1) * sliceCount + j;
                        indices.push(a, b, d);
                        indices.push(b, c, d);
                    }
                }
            }
            this.indices = indices;
            this.positions = positions;
            this.uvs = uvs;

            this.invalidateGeometry();
        }

        /**
         * 构建几何体
         */
        protected buildGeometry()
        {
            this.normals = geometryUtils.createVertexNormals(this.indices, this.positions, true);
            this.tangents = geometryUtils.createVertexTangents(this.indices, this.positions, this.uvs, true)
        }
    }
}