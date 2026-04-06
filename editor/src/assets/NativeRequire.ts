/**
 * 是否支持本地API
 */
export const supportNative = false;

/**
 * 本地API
 */
export const nativeAPI: NativeAPI = null;

/**
 * 本地API
 */
export interface NativeAPI
{
    /**
     * 选择文件夹对话框
     */
    selectDirectoryDialog(): Promise<string>;

    /**
     * 在资源管理器中显示
     *
     * @param fullPath 完整路径
     */
    showFileInExplorer(fullPath: string): void;

    /**
     * 使用 VSCode 打开项目
     *
     * @param  projectPath 项目路径
     */
    openWithVSCode(projectPath: string): Promise<void>;

    /**
     * 打开开发者工具
     */
    openDevTools(): void;
}

/**
 * Native文件系统
 */
export interface NativeFSBase
{
    /**
     * 文件是否存在
     * @param path 文件路径
     */
    exists(path: string): Promise<boolean>;
    /**
     * 读取文件夹中文件列表
     * @param path 路径
     */
    readdir(path: string): Promise<string[]>;
    /**
     * 新建文件夹
     *
     * @param path 文件夹路径
     */
    mkdir(path: string): Promise<void>;
    /**
     * 读取文件
     * @param path 路径
     * @param callback 读取完成回调 当err不为null时表示读取失败
     */
    readFile(path: string): Promise<ArrayBuffer>;
    /**
     * 删除文件
     *
     * @param path 文件路径
     */
    deleteFile(path: string): Promise<void>;
    /**
     * 删除文件夹
     *
     * @param path 文件夹路径
     */
    rmdir(path: string): Promise<void>;
    /**
     * 是否为文件夹
     *
     * @param path 文件路径
     */
    isDirectory(path: string): Promise<boolean>;
    /**
     * 写ArrayBuffer(新建)文件
     *
     * @param path 文件路径
     * @param data 文件数据
     */
    writeFile(path: string, data: ArrayBuffer): Promise<void>;
}
