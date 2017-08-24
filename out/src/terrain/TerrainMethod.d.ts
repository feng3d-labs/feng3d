declare namespace feng3d {
    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    class TerrainMethod extends RenderDataHolder {
        splatTexture1: Texture2D;
        private _splatTexture1;
        splatTexture2: Texture2D;
        private _splatTexture2;
        splatTexture3: Texture2D;
        private _splatTexture3;
        blendTexture: Texture2D;
        private _blendTexture;
        splatRepeats: Vector3D;
        private _splatRepeats;
        /**
         * 构建材质
         */
        constructor(blendUrl?: string, splatUrls?: string[], splatRepeats?: Vector3D);
    }
}
