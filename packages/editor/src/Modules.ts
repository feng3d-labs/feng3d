/**
 * 模块
 *
 * 用于管理功能模块
 */
export class Modules
{
    message: any;

    /**
     * 获取模块视图
     */
    getModuleView(moduleName: string)
    {
        console.warn(`getModuleView(${moduleName}) 已废弃，请使用 Vue 组件`);
        return null;
    }

    /**
     * 回收模块界面
     */
    recycleModuleView(moduleView: any)
    {
        console.warn('recycleModuleView 已废弃，请使用 Vue 组件');
    }

    /**
     * 模块界面类定义
     */
    static moduleViewCls: { [name: string]: any } = {};
}

export const modules = new Modules();
