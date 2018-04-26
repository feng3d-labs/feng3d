namespace feng3d
{
    /**
     * 文件系统类型
     */
    export enum FSType
    {
        http = "http",
        native = "native",
        indexedDB = "indexedDB"
    }

    export var assets: Assets;
    export var assetsmap = assetsmap || {};

    export interface IAssets
    {
        /**
         * 加载图片
         * @param url 图片路径
         * @param callback 加载完成回调
         */
        loadImage(url: string, callback: (img: HTMLImageElement) => void): void;
    }

    export class Assets implements IAssets
    {
        fstype = FSType.http;

        private getAssets(url: string)
        {
            if (url.indexOf("http://") != -1
                || url.indexOf("https://") != -1
            )
                return assetsmap[FSType.http];
            return assetsmap[this.fstype];
        }

        /**
         * 加载图片
         * @param url 图片路径
         * @param callback 加载完成回调
         */
        loadImage(url: string, callback: (img: HTMLImageElement) => void)
        {
            this.getAssets(url).loadImage(url, (img) =>
            {
                if (!img)
                {
                    console.warn(`无法加载资源：${url}`);
                }
                callback(img);
            });
        }
    }

    assets = new Assets();

    export type FileInfo = { path: string, birthtime: number, mtime: number, isDirectory: boolean, size: number };

    export interface FS
    {
        hasProject(projectname: string, callback: (has: boolean) => void): void;
        getProjectList(callback: (err: Error | null, projects: string[] | null) => void): void;
        initproject(projectname: string, callback: () => void): void;
        stat(path: string, callback: (err: Error | null, stats: FileInfo | null) => void): void;
        readdir(path: string, callback: (err: Error | null, files: string[] | null) => void): void;
        writeFile(path: string, data: ArrayBuffer, callback?: ((err: Error | null) => void) | undefined): void;
        /**
         * 读取文件为字符串
         */
        readFileAsString(path: string, callback: (err: Error | null, data: string | null) => void): void;
        /**
         * 读取文件为Buffer
         */
        readFile(path: string, callback: (err: Error | null, data: ArrayBuffer | undefined) => void): void;
        mkdir(path: string, callback: (err: Error | null) => void): void;
        rename(oldPath: string, newPath: string, callback: (err: Error | null) => void): void;
        move(src: string, dest: string, callback?: ((err: Error | null) => void) | undefined): void;
        remove(path: string, callback?: ((err: Error | null) => void) | undefined): void;
        /**
         * 获取文件绝对路径
         */
        getAbsolutePath(path: string, callback: (err: Error | null, absolutePath: string | null) => void): void;
        /**
         * 获取指定文件下所有文件路径列表
         */
        getAllfilepathInFolder(dirpath: string, callback: (err: Error | null, filepaths: string[] | null) => void): void;
    }
}