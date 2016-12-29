module feng3d {

    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    export class TerrainMaterial extends Material {

        public diffuseTexture: Texture2D;

        public normalTexture: Texture2D;

        public splatTextures: Texture2D[];

        public blendTexture: Texture2D;

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(camera: Camera3D) {

            super.updateRenderData(camera);

            this.renderData.uniforms;

        }
    }
}