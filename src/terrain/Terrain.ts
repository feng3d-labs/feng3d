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

        geometry = Geometry.terrain;

        material = Material.terrain;
    }

    Feng3dAssets.setAssets(Material.terrain = new Material().value({ name: "Default-Terrain", assetsId: "Default-Terrain", shaderName: "terrain", hideFlags: HideFlags.NotEditable }));
}