namespace feng3d
{
    export interface TextureCubeEventMap
    {
        /**
		 * 加载完成
		 */
        loadCompleted: any;
    }

    export interface TextureCube
    {
        once<K extends keyof TextureCubeEventMap>(type: K, listener: (event: Event<TextureCubeEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof TextureCubeEventMap>(type: K, data?: TextureCubeEventMap[K], bubbles?: boolean): Event<TextureCubeEventMap[K]>;
        has<K extends keyof TextureCubeEventMap>(type: K): boolean;
        on<K extends keyof TextureCubeEventMap>(type: K, listener: (event: Event<TextureCubeEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof TextureCubeEventMap>(type?: K, listener?: (event: Event<TextureCubeEventMap[K]>) => any, thisObject?: any);
    }

    export type TextureCubeImageName = "positive_x_url" | "positive_y_url" | "positive_z_url" | "negative_x_url" | "negative_y_url" | "negative_z_url";

    /**
     * 立方体纹理
     */
    export class TextureCube extends TextureInfo
    {
        __class__: "feng3d.TextureCube" = "feng3d.TextureCube";

        assetType = AssetType.texturecube;

        static ImageNames: TextureCubeImageName[] = ["positive_x_url", "positive_y_url", "positive_z_url", "negative_x_url", "negative_y_url", "negative_z_url"];

        @oav({ component: "OAVCubeMap", priority: -1 })
        OAVCubeMap: string = "";

        /**
         * 原始数据
         */
        @serialize
        @watch("rawDataChanged")
        private rawData: { type: "texture", textures: Texture2D[] } | { type: "path", paths: string[] };

        noPixels = [ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white];

        protected _pixels = [null, null, null, null, null, null];

        protected _textureType = TextureType.TEXTURE_CUBE_MAP;

        /**
         * 是否正在加载
         */
        private _isloading = false;
        /**
         * 是否加载完成
         */
        get isLoaded() { return this._isLoaded; }
        private _isLoaded = false;

        setTexture2D(pos: TextureCubeImageName, texture: Texture2D)
        {
            if (this.rawData == null || this.rawData.type != "texture")
            {
                this.rawData = { type: "texture", textures: [] };
            }
            var index = TextureCube.ImageNames.indexOf(pos);
            this.rawData.textures[index] = texture;
            if (texture.isLoaded)
            {
                this.invalidate();
            } else 
            {
                this._isLoaded = false;
                this._isloading = true;
                texture.once("loadCompleted", () =>
                {
                    this.invalidate();
                });
            }
        }

        setTexture2DPath(pos: TextureCubeImageName, path: string)
        {
            if (this.rawData == null || this.rawData.type != "path")
            {
                this.rawData = { type: "path", paths: [] };
            }
            var index = TextureCube.ImageNames.indexOf(pos);
            this.rawData.paths[index] = path;
            this._isloading = true;
            this._isLoaded = false;
            fs.readImage(path, () =>
            {
                this.invalidate();
            });
        }

        getTextureImage(pos: TextureCubeImageName, callback: (img: HTMLImageElement) => void)
        {
            if (!this.rawData) { callback(null); return; }
            var index = TextureCube.ImageNames.indexOf(pos);
            if (this.rawData.type == "texture")
            {
                var texture = this.rawData.textures[index];
                if (!texture) callback(null);
                if (texture.isLoaded)
                {
                    callback(texture.image);
                } else
                {
                    texture.once("loadCompleted", () =>
                    {
                        callback(texture.image);
                    });
                }
            } else if (this.rawData.type == "path")
            {
                fs.readImage(this.rawData.paths[index], (err: Error, img: HTMLImageElement) =>
                {
                    callback(img);
                });
            }
        }

        private rawDataChanged()
        {
            if (!this.rawData) return;

            this._isloading = true;
            this._isLoaded = false;
            if (this.rawData.type == "texture")
            {
                this.rawData.textures.forEach(v =>
                {
                    if (!v.isLoaded)
                    {
                        v.once("loadCompleted", () =>
                        {
                            this.invalidate();
                        });
                    }
                });
                this.invalidate();
            } else if (this.rawData.type == "path")
            {
                this.rawData.paths.forEach(v =>
                {
                    fs.readImage(v, () =>
                    {
                        this.invalidate();
                    });
                });
            }
        }

        /**
         * 使纹理失效
         */
        invalidate()
        {
            super.invalidate();

            if (!this.rawData) return;

            var isLoaded = true;
            for (let i = 0; i < TextureCube.ImageNames.length; i++)
            {
                if (this.rawData.type == "texture")
                {
                    if (this.rawData.textures[i] != null && this.rawData.textures[i].image != null)
                    {
                        this._pixels[i] = this.rawData.textures[i].image;
                    } else
                    {
                        isLoaded = false;
                    }
                } else if (this.rawData.type == "path")
                {
                    if (this.rawData.paths[i] != null && fs.getImage(this.rawData.paths[i]))
                    {
                        this._pixels[i] = fs.getImage(this.rawData.paths[i]);
                    } else
                    {
                        isLoaded = false;
                    }
                }
            }
            if (this._isloading && isLoaded)
            {
                this._isloading = false;
                this._isLoaded = true;
                this.dispatch("loadCompleted");
            }
        }

        /**
         * 已加载完成或者加载完成时立即调用
         * @param callback 完成回调
         */
        onLoadCompleted(callback: () => void)
        {
            if (this._isLoaded)
            {
                callback();
                return;
            }
            this.once("loadCompleted", callback);
        }

        static default: TextureCube;
    }

    rs.setDefaultAssetData(TextureCube.default = Object.setValue(new TextureCube(), { name: "Default-TextureCube", assetId: "Default-TextureCube", hideFlags: HideFlags.NotEditable }));
}