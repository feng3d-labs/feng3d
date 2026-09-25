const fs = require('fs-extra');

/**
 * Native文件系统
 */
const nativeFS = {

    /**
     * 文件是否存在
     * @param path 文件路径
     */
    async exists(path)
    {
        return await fs.pathExists(path);
    },

    /**
     * 读取文件夹中文件列表
     * @param path 路径
     */
    async readdir(path)
    {
        return await fs.readdir(path);
    },

    /**
     * 新建文件夹
     *
     * 如果父文件夹不存在则新建
     *
     * @param p 文件夹路径
     */
    async mkdir(p)
    {
        return await fs.mkdirp(p);
    },

    /**
     * 读取文件
     * @param path 路径
     */
    async readFile(path)
    {
        return await fs.readFile(path);
    },

    /**
     * 删除文件
     *
     * @param path 文件路径
     */
    async deleteFile(path)
    {
        return await fs.unlink(path);
    },

    /**
     * 删除文件夹
     *
     * @param path 文件夹路径
     */
    async rmdir(path)
    {
        return await fs.rmdir(path);
    },

    /**
     * 是否为文件夹
     *
     * @param path 文件路径
     */
    async isDirectory(path)
    {
        const stat = await fs.stat(path);

        return stat.isDirectory();
    },

    /**
     * 写ArrayBuffer(新建)文件
     *
     * 如果所在文件夹不存时新建文件夹
     *
     * @param filePath 文件路径
     * @param data 文件数据
     */
    async writeFile(filePath, data)
    {
        const buffer = Buffer.from(data);

        return await fs.writeFile(filePath, buffer, 'binary');
    }
};

exports.nativeFS = nativeFS;

