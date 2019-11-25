namespace feng3d
{
    export interface GeometryMap { QuadGeometry: QuadGeometry }

    /**
     * 四边形面皮几何体
     */
    export class QuadGeometry extends Geometry
    {
        __class__: "feng3d.QuadGeometry" = "feng3d.QuadGeometry";

        constructor()
        {
            super();
            var size = 0.5;

            this.positions = [-size, size, 0, size, size, 0, size, -size, 0, -size, -size, 0];
            this.uvs = [0, 0, 1, 0, 1, 1, 0, 1];
            this.indices = [0, 1, 2, 0, 2, 3];

            this.normals = geometryUtils.createVertexNormals(this.indices, this.positions, true);
            this.tangents = geometryUtils.createVertexTangents(this.indices, this.positions, this.uvs, true)
        }
    }

    AssetData.addAssetData("Quad", Geometry.quad = serialization.setValue(new QuadGeometry(), { name: "Quad", assetId: "Quad", hideFlags: HideFlags.NotEditable }));
}