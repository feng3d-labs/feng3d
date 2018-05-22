namespace feng3d
{
    /**
     * 路径工具
     */
    export var pathUtils: PathUtils;
    /**
     * 路径工具
     */
    export class PathUtils
    {
        /**
         * 获取不带后缀名称
         * @param path 路径
         */
        getName(path: string)
        {
            var name = this.getNameWithExtension(path);
            if (this.isDirectory(path))
                return name;
            name = name.split(".").shift();
            return name;
        }

        /**
         * 获取带后缀名称
         * @param path 路径
         */
        getNameWithExtension(path: string)
        {
            var paths = path.split("/");
            var name = paths.pop();
            if (name == "")
                name = paths.pop();
            return name;
        }

        /**
         * 获取后缀
         * @param path 路径
         */
        getExtension(path: string)
        {
            var name = this.getNameWithExtension(path);
            var names = name.split(".");
            names.shift();
            var extension = names.join(".");
            return extension;
        }

        /**
         * 父路径
         * @param path 路径
         */
        getParentPath(path: string)
        {
            var paths = path.split("/");
            if (this.isDirectory(path))
                paths.pop();
            paths.pop();
            return paths.join("/") + "/";
        }

        /**
         * 是否文件夹
         * @param path 路径
         */
        isDirectory(path: string)
        {
            return path.split("/").pop() == "";
        }

        /**
         * 获取目录深度
         * @param path 路径
         */
        getDirDepth(path: string)
        {
            var length = path.split("/").length;
            if (this.isDirectory(path))
                length--;
            return length - 1;
        }
    }
    pathUtils = new PathUtils();
}