namespace feng3d
{

    export interface ComponentMap { Terrain: Terrain }

    /**
     * The Terrain component renders the terrain.
     */
    @ov({ component: "OVTerrain" })
    export class Terrain extends Model
    {
        __class__: "feng3d.Terrain" = "feng3d.Terrain";

        /**
         * 地形资源
         */
        assign: TerrainData;

        geometry = Geometry.terrain;

        material = Material.terrain;
    }
}