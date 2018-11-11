namespace feng3d
{
    export class Feng3dFile extends Feng3dAssets
    {
        /**
         * 文件名称
         */
        @serialize
        @watch("fileNameChanged")
        filename: string;

        /**
         * 文件路径
         */
        filePath: string;

        protected fileNameChanged()
        {
            this.filePath = `Library/${this.assetsId}/file/` + this.filename;
        }

        protected assetsIdChanged()
        {
            super.assetsIdChanged();
            this.filePath = `Library/${this.assetsId}/file/` + this.filename;
        }
    }
}