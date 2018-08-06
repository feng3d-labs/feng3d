namespace feng3d
{
    /**
     * The Terrain component renders the terrain.
     */
    export class Terrain extends Model
    {
        /**
         * 地形资源
         */
        assign: TerrainData;

        /**
         * 地形几何体数据
         */
        geometry = new TerrainGeometry();

        material = materialFactory.create("terrain");
    }
}