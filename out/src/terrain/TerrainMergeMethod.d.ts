declare namespace feng3d {
    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    class TerrainMergeMethod extends RenderDataHolder {
        splatMergeTexture: Texture2D;
        private _splatMergeTexture;
        blendTexture: Texture2D;
        private _blendTexture;
        splatRepeats: Vector3D;
        private _splatRepeats;
        /**
         * 构建材质
         */
        constructor(blendUrl?: string, splatMergeUrl?: string, splatRepeats?: Vector3D);
    }
}
