/**
 * 文件系统类型
 */
export enum FSType
{
    http = 'http',
    native = 'native',
    /** 宿主（编辑器 Node 端）打开的项目目录——页面通过宿主方法访问它（#274） */
    host = 'host'
}
