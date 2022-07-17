namespace feng3d
{

    /**
     * 路径工具
     */
    export class PathUtils
    {
        /**
         * 标准化文件夹路径
         * @param path
         */
        normalizeDir(path: string): string
        {
            if (path[path.length - 1] === '/')
            {
                path = path.substr(0, path.length - 1);
            }

            return path;
        }
        /**
         * 是否为HTTP地址
         *
         * @param path 地址
         */
        isHttpURL(path: string): any
        {
            if (path.indexOf('http://') !== -1 || path.indexOf('https://') !== -1 || path.indexOf('file:///') !== -1)
            {
                return true;
            }

            return false;
        }

        /**
         * 获取不带后缀名称
         * @param path 路径
         */
        getName(path: string)
        {
            console.assert(path !== undefined);
            let name = this.basename(path);

            if (this.isDirectory(path))
            {
                return name;
            }
            name = name.split('.').shift();

            return name;
        }

        /**
         * 获取带后缀名称
         * @param path 路径
         */
        basename(path: string)
        {
            console.assert(path !== undefined);
            const paths = path.split('/');
            let name = paths.pop();

            if (name === '')
            {
                name = paths.pop();
            }

            return name;
        }

        /**
         * 获取后缀
         * @param path 路径
         */
        extname(path: string)
        {
            console.assert(path !== undefined);
            const name = this.basename(path);
            const index = name.indexOf('.');

            if (index === -1) return '';

            return name.substr(index);
        }

        /**
         * 父路径
         * @param path 路径
         */
        dirname(path: string)
        {
            console.assert(path !== undefined);
            const paths = path.split('/');

            if (this.isDirectory(path))
            {
                paths.pop();
            }
            paths.pop();

            return paths.join('/');
        }

        /**
         * 获取子文件（非文件夹）路径
         *
         * @param parentPath 父文件夹路径
         * @param childName 子文件名称
         */
        getChildFilePath(parentPath: string, childName: string)
        {
            console.assert(parentPath !== undefined);
            console.assert(childName !== undefined);

            if (parentPath.charAt(parentPath.length - 1) !== '/') parentPath += '/';

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
            if (parentPath.charAt(parentPath.length - 1) !== '/') parentPath += '/';
            if (childFolderName.charAt(childFolderName.length - 1) !== '/') childFolderName += '/';

            return parentPath + childFolderName;
        }

        /**
         * 是否文件夹
         * @param path 路径
         */
        isDirectory(path: string)
        {
            return path.split('/').pop() === '';
        }

        /**
         * 获取目录深度
         * @param path 路径
         */
        getDirDepth(path: string)
        {
            let length = path.split('/').length;

            if (this.isDirectory(path))
            {
                length--;
            }

            return length - 1;
        }
    }

    /**
     * 路径工具
     */
    export const pathUtils = new PathUtils();
}