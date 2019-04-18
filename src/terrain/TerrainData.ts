namespace feng3d
{
    /**
     * The TerrainData class stores heightmaps, detail mesh positions, tree instances, and terrain texture alpha maps.
     * 
     * The Terrain component links to the terrain data and renders it.
     */
    export class TerrainData
    {
        /**
         * Width of the terrain in samples(Read Only).
         */
        get heightmapWidth()
        {
            return this.heightmapResolution;
        }

        /**
         * Height of the terrain in samples(Read Only).
         */
        get heightmapHeight()
        {
            return this.heightmapResolution;
        }

        /**
         * Resolution of the heightmap.
         */
        heightmapResolution = 513;

        /**
         * The size of each heightmap sample.
         */
        get heightmapScale()
        {
            return this.size.divideNumberTo(this.heightmapResolution);
        }

        /**
         * The total size in world units of the terrain.
         */
        size = new Vector3(500, 600, 500);

        // /**
        //  * Height of the alpha map.
        //  * 混合贴图高度
        //  * @see https://blog.csdn.net/qq_29523119/article/details/52776731
        //  */
        // alphamapHeight

        // /**
        //  * Number of alpha map layers.
        //  */
        // alphamapLayers

        // /**
        //  * Resolution of the alpha map.
        //  */
        // alphamapResolution

        // /**
        //  * Alpha map textures used by the Terrain. Used by Terrain Inspector for undo.
        //  */
        // alphamapTextures

        // /**
        //  * Width of the alpha map.
        //  */
        // alphamapWidth

        // /**
        //  * Resolution of the base map used for rendering far patches on the terrain.
        //  */
        // baseMapResolution

        // /**
        //  * Detail height of the TerrainData.
        //  */
        // detailHeight

        // /**
        //  * Contains the detail texture / meshes that the terrain has.
        //  */
        // detailPrototypes

        // /**
        //  * Detail Resolution of the TerrainData.
        //  */
        // detailResolution

        // /**
        //  * Detail width of the TerrainData.
        //  */
        // detailWidth

        // /**
        //  * Splat texture used by the terrain.
        //  */
        // splatPrototypes

        // /**
        //  * The thickness of the terrain used for collision detection.
        //  */
        // thickness

        // /**
        //  * Returns the number of tree instances.
        //  */
        // treeInstanceCount

        // /**
        //  * Contains the current trees placed in the terrain.
        //  */
        // treeInstances

        // /**
        //  * The list of tree prototypes this are the ones available in the inspector.
        //  */
        // treePrototypes

        // /**
        //  * Amount of waving grass in the terrain.
        //  */
        // wavingGrassAmount

        // /**
        //  * Speed of the waving grass.
        //  */
        // wavingGrassSpeed

        // /**
        //  * Strength of the waving grass in the terrain.
        //  */
        // wavingGrassStrength

        // /**
        //  * Color of the waving grass that the terrain has.
        //  */
        // wavingGrassTint
    }
}