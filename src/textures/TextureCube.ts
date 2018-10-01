namespace feng3d
{
    /**
     * 立方体纹理
     */
    export class TextureCube extends TextureInfo
    {
        assetType = AssetExtension.texturecube;

        @oav({ component: "OAVCubeMap" })
        @serialize
        @watch("urlChanged")
        positive_x_url: string;

        @serialize
        @watch("urlChanged")
        positive_y_url: string;

        @serialize
        @watch("urlChanged")
        positive_z_url: string;

        @serialize
        @watch("urlChanged")
        negative_x_url: string;

        @serialize
        @watch("urlChanged")
        negative_y_url: string;

        @serialize
        @watch("urlChanged")
        negative_z_url: string;

        @oav()
        name: string;

        noPixels = [ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white];

        protected _pixels = [null, null, null, null, null, null];

        protected _textureType = TextureType.TEXTURE_CUBE_MAP;

        private loadingNum = 0;

        private urlChanged(property: string, oldValue: string, newValue: string)
        {
            var index = ["positive_x_url", "positive_y_url", "positive_z_url", "negative_x_url", "negative_y_url", "negative_z_url"].indexOf(property);
            assert(index != -1);
            this.loadingNum++;
            assets.readImage(newValue, (err, img) =>
            {
                if (err)
                {
                    // error(err);
                    this._pixels[index] = null;
                }
                else
                    this._pixels[index] = img;
                this.loadingNum--;
                this.invalidate();
                if (this.loadingNum == 0)
                {
                    this.dispatch("loadCompleted");
                }
            });
        }

        /**
         * 已加载完成或者加载完成时立即调用
         * @param callback 完成回调
         */
        onLoadCompleted(callback: () => void)
        {
            if (this.loadingNum == 0) callback();
            else this.once("loadCompleted", callback);
        }
    }
}