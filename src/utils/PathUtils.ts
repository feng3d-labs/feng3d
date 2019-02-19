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
         * 是否为HTTP地址
         * 
         * @param path 地址
         */
        isHttpURL(path: string): any
        {
            if (path.indexOf("http://") != -1 || path.indexOf("https://") != -1 || path.indexOf("file:///") != -1)
                return true;
            return false;
        }

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
            var extension = name.split(".").slice(1).join(".");
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
         * 获取子文件（非文件夹）路径
         * 
         * @param parentPath 父文件夹路径
         * @param childName 子文件名称
         */
        getChildFilePath(parentPath: string, childName: string)
        {
            if (parentPath.charAt(parentPath.length - 1) != "/") parentPath += "/";
            return parentPath + childName;
        }

        /**
         * 获取子文件夹路径
         * 
         * @param parentPath 父文件夹路径
         * @param childFolderName 子文件夹名称
         */
        getChildFolderPath(parentPath: string, childFolderName: string)
        {
            if (parentPath.charAt(parentPath.length - 1) != "/") parentPath += "/";
            if (childFolderName.charAt(childFolderName.length - 1) != "/") childFolderName += "/";

            return parentPath + childFolderName;
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