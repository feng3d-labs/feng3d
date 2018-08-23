namespace feng3d
{
    /**
     * 立方体纹理
     */
    export class TextureCube extends TextureInfo
    {
        @serialize
        @watch("urlChanged")
        @oav({ component: "OAVPick", componentParam: { accepttype: "image" } })
        positive_x_url: string;

        @serialize
        @watch("urlChanged")
        @oav({ component: "OAVPick", componentParam: { accepttype: "image" } })
        positive_y_url: string;

        @serialize
        @watch("urlChanged")
        @oav({ component: "OAVPick", componentParam: { accepttype: "image" } })
        positive_z_url: string;

        @serialize
        @watch("urlChanged")
        @oav({ component: "OAVPick", componentParam: { accepttype: "image" } })
        negative_x_url: string;

        @serialize
        @watch("urlChanged")
        @oav({ component: "OAVPick", componentParam: { accepttype: "image" } })
        negative_y_url: string;

        @serialize
        @watch("urlChanged")
        @oav({ component: "OAVPick", componentParam: { accepttype: "image" } })
        negative_z_url: string;

        noPixels = [ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white];

        protected _pixels = [null, null, null, null, null, null];

        protected _textureType = TextureType.TEXTURE_CUBE_MAP;

        private urlChanged(property: string, oldValue: string, newValue: string)
        {
            var index = ["positive_x_url", "positive_y_url", "positive_z_url", "negative_x_url", "negative_y_url", "negative_z_url"].indexOf(property);
            assert(index != -1);
            assets.readFileAsImage(newValue, (err, img) =>
            {
                if (err)
                {
                    // error(err);
                    this._pixels[index] = null;
                }
                else
                    this._pixels[index] = img;
                this.invalidate();
            });
        }
    }
}