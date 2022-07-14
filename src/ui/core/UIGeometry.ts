namespace feng2d
{

    /**
     * UI几何体
     */
    export class UIGeometry extends feng3d.Geometry
    {
        __class__: "feng2d.UIGeometry";

        constructor()
        {
            super();

            this.positions = [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0];
            this.uvs = [0, 0, 1, 0, 1, 1, 0, 1];
            this.indices = [0, 1, 2, 0, 2, 3];

            this.normals = feng3d.geometryUtils.createVertexNormals(this.indices, this.positions, true);
            this.tangents = feng3d.geometryUtils.createVertexTangents(this.indices, this.positions, this.uvs, true)
        }
    }

    feng3d.Geometry.setDefault("Default-UIGeometry", new UIGeometry());
}

namespace feng3d
{
    export interface GeometryTypes { UIGeometry: feng2d.UIGeometry }

    export interface DefaultGeometry
    {
        "Default-UIGeometry": feng2d.UIGeometry;
    }
}