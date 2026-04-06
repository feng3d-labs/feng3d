import { path as fengpath } from '@feng3d/path';

/**
 * 路径工具
 */
export class PathUtils
{
    /**
     * 获取不带后缀名称
     * @param path 路径
     */
    nameWithOutExt(path: string)
    {
        console.assert(path !== undefined);
        const name = fengpath.basename(path, fengpath.extname(path));

        return name;
    }
}

/**
 * 路径工具
 */
export const pathUtils = new PathUtils();
