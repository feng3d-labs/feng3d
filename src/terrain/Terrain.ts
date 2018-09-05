namespace feng3d
{

    export interface ComponentMap { Terrain: Terrain }

    /**
     * The Terrain component renders the terrain.
     */
    export class Terrain extends Model
    {
        __class__: "feng3d.Terrain" = "feng3d.Terrain";

        /**
         * 地形资源
         */
        assign: TerrainData;

        /**
         * 地形几何体数据
         */
        geometry = new TerrainGeometry();

        material = new Material().value({ shaderName: "terrain" });
    }
}